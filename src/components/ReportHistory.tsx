import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SavedReport {
  id: string;
  name: string;
  period: string;
  date: string;
  entries: any[];
}

interface ReportHistoryProps {
  onLoadReport: (report: SavedReport) => void;
  iconOnly?: boolean;
}

export default function ReportHistory({ onLoadReport, iconOnly = false }: ReportHistoryProps) {
  const [open, setOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // Load saved reports from localStorage when component mounts
  useEffect(() => {
    const reports = localStorage.getItem("savedReports");
    if (reports) {
      try {
        setSavedReports(JSON.parse(reports));
      } catch (error) {
        console.error("Error parsing saved reports:", error);
      }
    }
  }, [open]); // Reload when dialog opens

  const handleLoadReport = (report: SavedReport) => {
    onLoadReport(report);
    setOpen(false);
  };

  const handleDeleteReport = (id: string) => {
    const updatedReports = savedReports.filter((report) => report.id !== id);
    setSavedReports(updatedReports);
    localStorage.setItem("savedReports", JSON.stringify(updatedReports));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`inline-flex items-center justify-center ${iconOnly ? 'p-2' : ''}`} title="Gespeicherte Berichte">
          <History className="h-5 w-5" />
          {!iconOnly && <span className="ml-2">Gespeicherte Berichte</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Gespeicherte Arbeitsrapporte</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {savedReports.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Keine gespeicherten Berichte gefunden.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Gespeichert am</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.name}</TableCell>
                    <TableCell>{report.period}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleLoadReport(report)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
