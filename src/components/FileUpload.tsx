import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export default function FileUpload({
  onFileUpload = () => {},
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);

      // Create preview URLs for the files
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

      // Notify parent component
      newFiles.forEach((file) => onFileUpload(file));
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(
        "Kamera konnte nicht geöffnet werden. Bitte überprüfen Sie die Berechtigungen.",
      );
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
  };

  const takePhoto = () => {
    const video = document.getElementById("camera-preview") as HTMLVideoElement;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to file
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            setFiles((prev) => [...prev, file]);

            // Create preview URL
            const previewUrl = URL.createObjectURL(blob);
            setPreviewUrls((prev) => [...prev, previewUrl]);

            // Notify parent component
            onFileUpload(file);

            // Close camera
            stopCamera();
            setCameraOpen(false);
          }
        },
        "image/jpeg",
        0.8,
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="file-upload">Dateien hochladen</Label>
          <div className="flex gap-2">
            <Input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full"
            />
            <Dialog
              open={cameraOpen}
              onOpenChange={(open) => {
                setCameraOpen(open);
                if (open) {
                  startCamera();
                } else {
                  stopCamera();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Camera className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Foto aufnehmen</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4">
                  {videoStream && (
                    <video
                      id="camera-preview"
                      autoPlay
                      playsInline
                      ref={(videoElement) => {
                        if (videoElement && videoStream) {
                          videoElement.srcObject = videoStream;
                        }
                      }}
                      className="w-full rounded-md border"
                    />
                  )}
                  <Button onClick={takePhoto} disabled={!videoStream}>
                    Foto aufnehmen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {previewUrls.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Hochgeladene Dateien:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                className="relative border rounded-md overflow-hidden"
              >
                {files[index].type.startsWith("image/") ? (
                  <img
                    src={url}
                    alt={`Preview ${index}`}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs ml-2 text-muted-foreground">
                      {files[index].name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
