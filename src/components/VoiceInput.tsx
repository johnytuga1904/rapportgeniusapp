import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      // @ts-ignore - TypeScript doesn't know about webkitSpeechRecognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "de-DE"; // Set to German

      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        onTranscript(transcriptText);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      setTranscript("");
      recognition.start();
    }

    setIsListening(!isListening);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant={isListening ? "destructive" : "default"}
        onClick={toggleListening}
        disabled={!recognition}
        className="flex items-center gap-2"
      >
        {isListening ? (
          <>
            <MicOff className="h-5 w-5" />
            Aufnahme stoppen
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" />
            Sprachsteuerung
          </>
        )}
      </Button>
      {!recognition && (
        <p className="text-sm text-muted-foreground">
          Spracherkennung wird in diesem Browser nicht unterstützt.
        </p>
      )}
      {isListening && (
        <div className="text-sm text-muted-foreground mt-2">
          Spricht jetzt...
        </div>
      )}
    </div>
  );
}
