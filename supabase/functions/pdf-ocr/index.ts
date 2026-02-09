import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Poll interval and max attempts for job completion
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60; // 2 minutes max

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, mimeType = "application/pdf", language = "en-IN" } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: "No file data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
    if (!SARVAM_API_KEY) {
      throw new Error("SARVAM_API_KEY is not configured");
    }

    // Step 1: Create a Document Intelligence job
    console.log("Creating Document Intelligence job...");
    const createJobResponse = await fetch("https://api.sarvam.ai/v1/document-intelligence/jobs", {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language_code: language,
        output_format: "md", // Markdown for cleaner text extraction
      }),
    });

    if (!createJobResponse.ok) {
      const errorText = await createJobResponse.text();
      console.error("Failed to create job:", createJobResponse.status, errorText);
      throw new Error(`Failed to create job: ${createJobResponse.status} - ${errorText}`);
    }

    const jobData = await createJobResponse.json();
    const jobId = jobData.job_id;
    const uploadUrl = jobData.upload_url;
    console.log("Job created:", jobId);

    if (!uploadUrl) {
      throw new Error("No upload URL returned from job creation");
    }

    // Step 2: Upload the file to the pre-signed URL
    console.log("Uploading file...");
    
    // Convert base64 to binary
    const binaryStr = atob(pdfBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Determine content type for upload
    let uploadContentType = mimeType;
    if (mimeType === "application/pdf") {
      uploadContentType = "application/pdf";
    } else if (mimeType.startsWith("image/")) {
      uploadContentType = mimeType;
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": uploadContentType,
      },
      body: bytes,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Failed to upload file:", uploadResponse.status, errorText);
      throw new Error(`Failed to upload file: ${uploadResponse.status}`);
    }
    console.log("File uploaded successfully");

    // Step 3: Start the job
    console.log("Starting job...");
    const startJobResponse = await fetch(`https://api.sarvam.ai/v1/document-intelligence/jobs/${jobId}/start`, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
      },
    });

    if (!startJobResponse.ok) {
      const errorText = await startJobResponse.text();
      console.error("Failed to start job:", startJobResponse.status, errorText);
      throw new Error(`Failed to start job: ${startJobResponse.status}`);
    }
    console.log("Job started");

    // Step 4: Poll for job completion
    console.log("Polling for job completion...");
    let jobStatus = "processing";
    let pollAttempts = 0;
    let statusData: { job_state?: string; download_url?: string } = {};

    while ((jobStatus === "processing" || jobStatus === "pending" || jobStatus === "started") && pollAttempts < MAX_POLL_ATTEMPTS) {
      await sleep(POLL_INTERVAL_MS);
      pollAttempts++;

      const statusResponse = await fetch(`https://api.sarvam.ai/v1/document-intelligence/jobs/${jobId}/status`, {
        method: "GET",
        headers: {
          "api-subscription-key": SARVAM_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Failed to get job status:", statusResponse.status, errorText);
        throw new Error(`Failed to get job status: ${statusResponse.status}`);
      }

      statusData = await statusResponse.json();
      jobStatus = statusData.job_state || "unknown";
      console.log(`Poll attempt ${pollAttempts}: status = ${jobStatus}`);

      if (jobStatus === "completed" || jobStatus === "succeeded") {
        break;
      } else if (jobStatus === "failed" || jobStatus === "error") {
        throw new Error("Document processing failed");
      }
    }

    if (jobStatus !== "completed" && jobStatus !== "succeeded") {
      throw new Error("Job timed out or failed to complete");
    }

    // Step 5: Download the result
    console.log("Downloading result...");
    const downloadUrl = statusData.download_url;
    if (!downloadUrl) {
      throw new Error("No download URL in completed job");
    }

    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.error("Failed to download result:", downloadResponse.status, errorText);
      throw new Error(`Failed to download result: ${downloadResponse.status}`);
    }

    // The result is a ZIP file containing markdown files
    const zipData = await downloadResponse.arrayBuffer();
    
    // Parse the ZIP file to extract markdown content
    const extractedText = await extractTextFromZip(new Uint8Array(zipData));

    if (!extractedText) {
      throw new Error("No text extracted from document");
    }

    console.log("Text extraction complete, length:", extractedText.length);
    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OCR error:", error);
    
    // Handle rate limiting
    if (error instanceof Error && error.message.includes("429")) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simple ZIP extraction for markdown files
// ZIP format: https://en.wikipedia.org/wiki/ZIP_(file_format)
async function extractTextFromZip(zipData: Uint8Array): Promise<string> {
  const textParts: string[] = [];
  const decoder = new TextDecoder("utf-8");
  
  let offset = 0;
  
  while (offset < zipData.length - 4) {
    // Check for local file header signature (0x04034b50)
    const signature = zipData[offset] | (zipData[offset + 1] << 8) | 
                      (zipData[offset + 2] << 16) | (zipData[offset + 3] << 24);
    
    if (signature !== 0x04034b50) {
      // Not a local file header, might be central directory
      break;
    }
    
    // Parse local file header
    const generalPurpose = zipData[offset + 6] | (zipData[offset + 7] << 8);
    const compressionMethod = zipData[offset + 8] | (zipData[offset + 9] << 8);
    const compressedSize = zipData[offset + 18] | (zipData[offset + 19] << 8) |
                          (zipData[offset + 20] << 16) | (zipData[offset + 21] << 24);
    const uncompressedSize = zipData[offset + 22] | (zipData[offset + 23] << 8) |
                            (zipData[offset + 24] << 16) | (zipData[offset + 25] << 24);
    const fileNameLength = zipData[offset + 26] | (zipData[offset + 27] << 8);
    const extraFieldLength = zipData[offset + 28] | (zipData[offset + 29] << 8);
    
    // Read filename
    const fileNameBytes = zipData.slice(offset + 30, offset + 30 + fileNameLength);
    const fileName = decoder.decode(fileNameBytes);
    
    // Calculate data offset
    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
    
    // Check if it's a markdown or text file and not compressed (method 0 = stored)
    if ((fileName.endsWith(".md") || fileName.endsWith(".txt") || fileName.endsWith(".html")) && compressionMethod === 0) {
      const fileData = zipData.slice(dataOffset, dataOffset + uncompressedSize);
      const text = decoder.decode(fileData);
      textParts.push(text);
    } else if ((fileName.endsWith(".md") || fileName.endsWith(".txt") || fileName.endsWith(".html")) && compressionMethod === 8) {
      // DEFLATE compression - we need to decompress
      // For now, try to read as-is and log that we found a compressed file
      console.log(`Found compressed file: ${fileName}, compression method: ${compressionMethod}`);
      // We'll handle this in a simple way - try to decompress using DecompressionStream
      try {
        const compressedData = zipData.slice(dataOffset, dataOffset + compressedSize);
        const decompressed = await decompressDeflate(compressedData);
        const text = decoder.decode(decompressed);
        textParts.push(text);
      } catch (e) {
        console.error("Failed to decompress file:", fileName, e);
      }
    }
    
    // Move to next file
    const dataSize = compressedSize > 0 ? compressedSize : uncompressedSize;
    offset = dataOffset + dataSize;
    
    // Handle data descriptor if present (bit 3 of general purpose flag)
    if (generalPurpose & 0x08) {
      // Skip data descriptor (12 or 16 bytes)
      offset += 12;
    }
  }
  
  // Combine all extracted text
  const combined = textParts.join("\n\n").trim();
  
  // If we got markdown, strip common markdown syntax for cleaner text
  return stripMarkdown(combined);
}

// Simple DEFLATE decompression using Web Streams API
async function decompressDeflate(data: Uint8Array): Promise<Uint8Array> {
  // Add zlib header for raw deflate (not ideal but worth trying)
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

// Strip basic markdown formatting for cleaner text
function stripMarkdown(text: string): string {
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Clean up extra whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
