import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Split text into chunks of max 500 characters, breaking at sentence/word boundaries
function chunkText(text: string, maxLength = 480): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find a good break point (sentence end, then word boundary)
    let breakPoint = maxLength;
    const sentenceEnd = remaining.lastIndexOf('. ', maxLength);
    const questionEnd = remaining.lastIndexOf('? ', maxLength);
    const exclamEnd = remaining.lastIndexOf('! ', maxLength);
    const bestSentenceEnd = Math.max(sentenceEnd, questionEnd, exclamEnd);

    if (bestSentenceEnd > maxLength * 0.5) {
      breakPoint = bestSentenceEnd + 1;
    } else {
      const spacePos = remaining.lastIndexOf(' ', maxLength);
      if (spacePos > maxLength * 0.5) {
        breakPoint = spacePos;
      }
    }

    chunks.push(remaining.substring(0, breakPoint).trim());
    remaining = remaining.substring(breakPoint).trim();
  }

  return chunks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "anushka", language = "en-IN" } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
    if (!SARVAM_API_KEY) {
      throw new Error("SARVAM_API_KEY is not configured");
    }

    // Chunk text to respect 500-char limit
    const textChunks = chunkText(text);
    const audioChunks: string[] = [];

    for (const chunk of textChunks) {
      const response = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "api-subscription-key": SARVAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: [chunk],
          target_language_code: language,
          speaker: voice,
          pitch: 0,
          pace: 1.0,
          loudness: 1.5,
          speech_sample_rate: 22050,
          enable_preprocessing: true,
          model: "bulbul:v2",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Sarvam API error:", response.status, errorText);
        throw new Error(`Sarvam API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const audioBase64 = data.audios?.[0];
      
      if (!audioBase64) {
        throw new Error("No audio generated from Sarvam");
      }
      
      audioChunks.push(audioBase64);
    }

    // Concatenate audio chunks (all are base64 WAV)
    // For simplicity, return the first chunk if single, or concatenate binary for multiple
    let finalAudioBase64: string;
    
    if (audioChunks.length === 1) {
      finalAudioBase64 = audioChunks[0];
    } else {
      // Decode all chunks and concatenate PCM data
      const allPcmData: Uint8Array[] = [];
      let headerBytes: Uint8Array | null = null;
      
      for (let i = 0; i < audioChunks.length; i++) {
        const binaryStr = atob(audioChunks[i]);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) {
          bytes[j] = binaryStr.charCodeAt(j);
        }
        
        if (i === 0) {
          // Keep header from first chunk (44 bytes for standard WAV)
          headerBytes = bytes.slice(0, 44);
          allPcmData.push(bytes.slice(44));
        } else {
          // Skip headers from subsequent chunks
          allPcmData.push(bytes.slice(44));
        }
      }
      
      // Calculate total PCM length
      const totalPcmLength = allPcmData.reduce((sum, arr) => sum + arr.length, 0);
      
      // Create new WAV with updated header
      const finalWav = new Uint8Array(44 + totalPcmLength);
      if (headerBytes) {
        finalWav.set(headerBytes, 0);
        // Update file size in header (bytes 4-7)
        const fileSize = 36 + totalPcmLength;
        finalWav[4] = fileSize & 0xff;
        finalWav[5] = (fileSize >> 8) & 0xff;
        finalWav[6] = (fileSize >> 16) & 0xff;
        finalWav[7] = (fileSize >> 24) & 0xff;
        // Update data chunk size (bytes 40-43)
        finalWav[40] = totalPcmLength & 0xff;
        finalWav[41] = (totalPcmLength >> 8) & 0xff;
        finalWav[42] = (totalPcmLength >> 16) & 0xff;
        finalWav[43] = (totalPcmLength >> 24) & 0xff;
      }
      
      // Copy all PCM data
      let offset = 44;
      for (const pcm of allPcmData) {
        finalWav.set(pcm, offset);
        offset += pcm.length;
      }
      
      // Encode back to base64
      let binary = '';
      for (let i = 0; i < finalWav.length; i++) {
        binary += String.fromCharCode(finalWav[i]);
      }
      finalAudioBase64 = btoa(binary);
    }

    return new Response(
      JSON.stringify({ audioBase64: finalAudioBase64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
