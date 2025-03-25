import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  iconOnly?: boolean;
}

// Define types for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

// Define the global SpeechRecognition constructor
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// Augment the Window interface
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function VoiceInput({ onTranscript, iconOnly = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "de-DE"; // Set to German

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          setTranscript(transcriptText);
          onTranscript(transcriptText);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
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
        className={`inline-flex items-center justify-center ${iconOnly ? 'p-2' : ''}`}
        title={isListening ? "Aufnahme stoppen" : "Spracheingabe"}
      >
        {isListening ? (
          <>
            <MicOff className="h-5 w-5" />
            {!iconOnly && <span className="ml-2">Aufnahme stoppen</span>}
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" />
            {!iconOnly && <span className="ml-2">Spracheingabe</span>}
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
