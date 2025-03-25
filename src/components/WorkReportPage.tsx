import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Send,
  Save,
} from "lucide-react";
import WorkReport from "./WorkReport";
import VoiceInput from "./VoiceInput";
import ReportHistory from "./ReportHistory";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SavedReport {
  id: string;
  name: string;
  period: string;
  date: string;
  entries: any[];
}

export default function WorkReportPage() {
  const [workReportData, setWorkReportData] = useState<any>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const exportToExcel = () => {
    if (
      !workReportData ||
      !workReportData.entries ||
      workReportData.entries.length === 0
    ) {
      alert("Es gibt keine Daten zum Exportieren.");
      return;
    }

    // Create a CSV string
    let csvContent =
      "Datum,Auftrag Nr.,Objekt oder Strasse,Ort,Std.,Absenzen,Überstd.,Auslagen und Bemerkungen,Auslagen Fr.,Notizen\n";

    workReportData.entries.forEach((entry) => {
      const row = [
        entry.date,
        entry.orderNumber,
        entry.object,
        entry.location,
        entry.hours.toFixed(2),
        entry.absences > 0 ? entry.absences.toFixed(2) : "",
        entry.overtime > 0 ? entry.overtime.toFixed(2) : "",
        entry.expenses,
        entry.expenseAmount > 0 ? entry.expenseAmount.toFixed(2) : "",
        entry.notes || "",
      ];

      // Escape commas in fields
      const escapedRow = row.map((field) => {
        if (field && typeof field === "string" && field.includes(",")) {
          return `"${field}"`;
        }
        return field;
      });

      csvContent += escapedRow.join(",") + "\n";
    });

    // Add summary rows
    const totalHours = workReportData.entries.reduce(
      (sum, entry) => sum + entry.hours,
      0,
    );
    const totalAbsences = workReportData.entries.reduce(
      (sum, entry) => sum + entry.absences,
      0,
    );
    const totalOvertime = workReportData.entries.reduce(
      (sum, entry) => sum + entry.overtime,
      0,
    );
    const totalExpenses = workReportData.entries.reduce(
      (sum, entry) => sum + entry.expenseAmount,
      0,
    );
    const totalRequiredHours = totalHours + totalAbsences;

    // Add Total row
    csvContent += `Total,,,,${totalHours.toFixed(2)},${totalAbsences > 0 ? totalAbsences.toFixed(2) : ""},${totalOvertime > 0 ? totalOvertime.toFixed(2) : ""},,${totalExpenses.toFixed(2)}\n`;

    // Add Total Required Hours row
    csvContent += `Total Sollstunden,,,,${totalRequiredHours.toFixed(2)}\n`;

    // Create a download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Arbeitsrapport_${workReportData.name.replace(/\s+/g, "_")}_${workReportData.period.replace(/\s+/g, "_")}.csv`,
    );
    document.body.appendChild(link);

    // Trigger download and clean up
    link.click();
    document.body.removeChild(link);
  };

  const sendEmail = () => {
    // Load saved reports
    const reports = localStorage.getItem("savedReports");
    if (reports) {
      try {
        const savedReportsList = JSON.parse(reports);
        setSavedReports(savedReportsList);
      } catch (error) {
        console.error("Error parsing saved reports:", error);
      }
    }
    
    // Open the dialog
    setEmailDialogOpen(true);
  };

  const handleSendEmail = (report: any) => {
    if (!report || !report.name || !report.period || !report.entries || report.entries.length === 0) {
      alert("Bitte füllen Sie zuerst den Arbeitsrapport aus.");
      return;
    }

    // Format the email body with the report data
    const subject = `Arbeitsrapport: ${report.name} - ${report.period}`;
    let body = `Arbeitsrapport für ${report.name}\nZeitraum: ${report.period}\n\n`;
    
    // Add entries
    body += "Einträge:\n";
    report.entries.forEach((entry: any, index: number) => {
      body += `${index + 1}. Datum: ${entry.date}\n`;
      body += `   Tätigkeit: ${entry.activity}\n`;
      body += `   Stunden: ${entry.hours}\n`;
      if (entry.notes) {
        body += `   Notizen: ${entry.notes}\n`;
      }
      body += "\n";
    });

    // Calculate total hours
    const totalHours = report.entries.reduce(
      (total: number, entry: any) => total + parseFloat(entry.hours || 0),
      0
    );
    body += `Gesamtstunden: ${totalHours.toFixed(2)}`;

    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // Close the dialog
    setEmailDialogOpen(false);

    // Ensure background color is maintained
    document.body.style.backgroundColor = "#f3f4f6";

    // Open email client
    window.location.href = mailtoLink;
  };

  const saveReport = () => {
    if (!workReportData) {
      alert("Es gibt keine Daten zum Speichern.");
      return;
    }

    const reportToSave: SavedReport = {
      id: currentReportId || uuidv4(),
      name: workReportData.name || "Unbenannter Bericht",
      period: workReportData.period || "Kein Zeitraum",
      date: format(new Date(), "dd.MM.yyyy HH:mm"),
      entries: workReportData.entries || [],
    };

    // Get existing reports
    const existingReportsStr = localStorage.getItem("savedReports");
    let existingReports: SavedReport[] = [];

    if (existingReportsStr) {
      existingReports = JSON.parse(existingReportsStr);

      // If editing an existing report, remove the old version
      if (currentReportId) {
        existingReports = existingReports.filter(
          (r) => r.id !== currentReportId,
        );
      }
    }

    // Add the new/updated report
    existingReports.push(reportToSave);

    // Save back to localStorage
    localStorage.setItem("savedReports", JSON.stringify(existingReports));

    // Update current report ID
    setCurrentReportId(reportToSave.id);

    alert("Bericht wurde gespeichert!");
  };

  const handleLoadReport = (report: SavedReport) => {
    setWorkReportData({
      name: report.name,
      period: report.period,
      entries: report.entries,
    });
    setCurrentReportId(report.id);
  };

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
  }, []);

  // Update saved reports when a new report is saved
  useEffect(() => {
    const reports = localStorage.getItem("savedReports");
    if (reports) {
      try {
        setSavedReports(JSON.parse(reports));
      } catch (error) {
        console.error("Error parsing saved reports:", error);
      }
    }
  }, [currentReportId]);

  // Add a CSS class to maintain background color after loading a report
  useEffect(() => {
    // Set the background color of the body element
    document.body.style.backgroundColor = "#f3f4f6";
    
    // Clean up function to reset when component unmounts
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="container mx-auto p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-black text-center sm:text-left">
            Arbeitsrapport-Generator
          </h1>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <VoiceInput
              onTranscript={(text) => {
                // Here you would implement logic to parse the voice input
                // and update the appropriate fields
                console.log("Voice input:", text);
              }}
              iconOnly={true}
            />
            <ReportHistory onLoadReport={handleLoadReport} iconOnly={true} />
            <Button variant="outline" onClick={saveReport} className="inline-flex items-center justify-center p-2" title="Speichern">
              <Save className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={exportToExcel} className="inline-flex items-center justify-center p-2" title="Excel exportieren">
              <Download className="h-5 w-5" />
            </Button>
            <Button onClick={sendEmail} className="inline-flex items-center justify-center p-2" title="Per E-Mail senden">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <WorkReport
          report={workReportData || {}}
          initialData={workReportData}
          onDataChange={(data) => setWorkReportData(data)}
        />
        
        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white">
            <DialogHeader>
              <DialogTitle>Bericht per E-Mail senden</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4 text-sm text-gray-600">
                Wählen Sie einen gespeicherten Bericht aus, den Sie per E-Mail senden möchten:
              </p>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {/* Current report option */}
                {workReportData && workReportData.name && workReportData.period && (
                  <div 
                    className="p-3 border rounded-md cursor-pointer hover:bg-gray-100 bg-gray-50"
                    onClick={() => handleSendEmail(workReportData)}
                  >
                    <span className="font-semibold">Aktueller Bericht:</span> {workReportData.name} - {workReportData.period}
                  </div>
                )}
                
                {/* Saved reports */}
                {savedReports.map((report) => (
                  <div 
                    key={report.id}
                    className="p-3 border rounded-md cursor-pointer hover:bg-gray-100 bg-gray-50"
                    onClick={() => handleSendEmail(report)}
                  >
                    <span className="font-semibold">{report.name}</span> - {report.period} ({report.date})
                  </div>
                ))}
                
                {savedReports.length === 0 && !workReportData && (
                  <p className="text-center text-gray-500 italic">Keine Berichte verfügbar</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
