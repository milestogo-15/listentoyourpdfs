import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus, ProcessingStep } from "@/components/ProcessingStatus";
import { TextPreview } from "@/components/TextPreview";
import { AudioPlayer } from "@/components/AudioPlayer";
import { VoiceSelector, VoiceOption, LanguageOption, voices, languages } from "@/components/VoiceSelector";
import { Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [extractedText, setExtractedText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(voices[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(languages[0]);
  const [error, setError] = useState("");

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setProcessingStep("idle");
    setExtractedText("");
    setAudioUrl("");
    setError("");
  };

  const handleClear = () => {
    setSelectedFile(null);
    setProcessingStep("idle");
    setExtractedText("");
    setAudioUrl("");
    setError("");
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    try {
      // Step 1: Extract text from PDF
      setProcessingStep("extracting");
      
      const base64 = await fileToBase64(selectedFile);
      
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke("pdf-ocr", {
        body: { pdfBase64: base64 },
      });

      if (ocrError) throw new Error(ocrError.message || "Failed to extract text");
      if (!ocrData?.text) throw new Error("No text extracted from PDF");

      setExtractedText(ocrData.text);

      // Step 2: Generate speech
      setProcessingStep("generating");
      
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke("text-to-speech", {
        body: { 
          text: ocrData.text, 
          voice: selectedVoice.id,
          language: selectedLanguage.code
        },
      });

      if (ttsError) throw new Error(ttsError.message || "Failed to generate speech");
      if (!ttsData?.audioBase64) throw new Error("No audio generated");

      // Create audio URL from base64
      const audioBlob = base64ToBlob(ttsData.audioBase64, "audio/wav");
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      setProcessingStep("complete");
    } catch (err) {
      console.error("Conversion error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setProcessingStep("error");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const isProcessing = processingStep === "extracting" || processingStep === "generating";
  const canConvert = selectedFile && !isProcessing;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Volume2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-foreground">VoiceReader</h1>
            <p className="text-sm text-muted-foreground">PDF to Speech, powered by AI</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">
              Listen to your PDFs
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Upload any PDF and convert it to natural speech in Hindi, Tamil, Bengali, and 8 more Indian languages.
            </p>
          </div>

          {/* File Upload */}
          <FileUpload
            onFileSelect={handleFileSelect}
            isProcessing={isProcessing}
            selectedFile={selectedFile}
            onClear={handleClear}
          />

          {/* Voice & Language Selection */}
          {selectedFile && processingStep === "idle" && (
            <div className="animate-fade-in">
              <VoiceSelector
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Convert Button */}
          {canConvert && processingStep === "idle" && (
            <button
              onClick={handleConvert}
              className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow hover:scale-[1.02] transition-transform animate-fade-in"
            >
              Convert to Speech
            </button>
          )}

          {/* Processing Status */}
          <ProcessingStatus step={processingStep} error={error} />

          {/* Text Preview */}
          {extractedText && <TextPreview text={extractedText} />}

          {/* Audio Player */}
          {audioUrl && processingStep === "complete" && (
            <AudioPlayer audioUrl={audioUrl} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Powered by Gemini AI for text extraction and Sarvam Bulbul V3 for voice synthesis
        </div>
      </footer>
    </div>
  );
};

export default Index;
