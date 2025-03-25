import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BackToDashboardButton() {
  const navigate = useNavigate();

  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/home')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Dashboard
      </Button>
    </div>
  );
} 