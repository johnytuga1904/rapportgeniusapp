import React from "react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Mail, Save, Printer, Download } from "lucide-react";

interface ExportOptionsProps {
  onEmailReport?: () => void;
  onSaveReport?: () => void;
  onPrintReport?: () => void;
  onDownloadReport?: () => void;
  className?: string;
}

const ExportOptions = ({
  onEmailReport = () => console.log("Email report"),
  onSaveReport = () => console.log("Save report"),
  onPrintReport = () => console.log("Print report"),
  onDownloadReport = () => console.log("Download report"),
  className = "",
}: ExportOptionsProps) => {
  return (
    <div
      className={`flex flex-wrap gap-3 p-4 bg-background rounded-lg shadow-sm ${className}`}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onEmailReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail size={18} />
              <span>Email Report</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send report via email</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onSaveReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save size={18} />
              <span>Save Report</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save report locally</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onPrintReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer size={18} />
              <span>Print Report</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Print the current report</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onDownloadReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download size={18} />
              <span>Download Excel</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download as Excel file</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ExportOptions;
