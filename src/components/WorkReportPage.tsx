import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WorkReport from "@/components/WorkReport";
import ReportHistory from "@/components/ReportHistory";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SavedReport, isDatabaseReport, isLocalReport, LocalSavedReport, DatabaseSavedReport } from "@/types/reports";
import { Save, Download } from "lucide-react";

// Einfache Toast-Funktion ohne externe Abhängigkeiten
const showToast = {
  success: (message: string) => {
    console.log(`SUCCESS: ${message}`);
    alert(message);
  },
  error: (message: string) => {
    console.error(`ERROR: ${message}`);
    alert(`Fehler: ${message}`);
  }
};

// Definiere einen Typ für die Arbeitsdaten
interface WorkReportData {
  name: string;
  period: string;
  date?: string;
  entries: Array<{
    date: string | Date;
    orderNumber: string;
    object: string;
    location: string;
    hours: number;
    absences: number;
    overtime: number;
    expenses: string;
    expenseAmount: number;
    notes?: string;
  }>;
}

export default function WorkReportPage() {
  // State für den aktuellen Arbeitsrapport
  const [workReportData, setWorkReportData] = useState<WorkReportData>({
    name: "",
    period: "",
    entries: [],
  });

  // State für gespeicherte Berichte
  const [savedReports, setSavedReports] = useState<LocalSavedReport[]>([]);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
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

  const handleSendEmail = (report: LocalSavedReport | WorkReportData) => {
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
    const totalHours = calculateTotalHours(report.entries);

    body += `Gesamtstunden: ${totalHours.toFixed(2)}`;

    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // Close the dialog
    setEmailDialogOpen(false);

    // Ensure background color is maintained
    document.body.style.backgroundColor = "#ffffff";

    // Open email client
    window.location.href = mailtoLink;
  };

  const saveReport = () => {
    if (!workReportData) {
      alert("Es gibt keine Daten zum Speichern.");
      return;
    }

    const reportToSave: LocalSavedReport = {
      id: currentReportId || uuidv4(),
      name: workReportData.name || "Unbenannter Bericht",
      period: workReportData.period || "Kein Zeitraum",
      date: new Date().toISOString(),
      entries: workReportData.entries || [],
    };

    // Get existing reports
    const existingReportsStr = localStorage.getItem("savedReports");
    let existingReports: LocalSavedReport[] = [];

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

    showToast.success("Bericht wurde gespeichert!");
  };

  // Adapter-Funktion, um die verschiedenen SavedReport-Typen zu konvertieren
  const handleLoadReport = (report: SavedReport) => {
    if (isDatabaseReport(report)) {
      try {
        // Für Berichte aus der Datenbank
        const parsedContent = JSON.parse(report.content);
        setWorkReportData({
          name: report.name,
          period: report.period,
          date: report.date,
          entries: parsedContent.entries || []
        });
      } catch (error) {
        console.error("Fehler beim Parsen des Berichts:", error);
        showToast.error("Der Bericht konnte nicht geladen werden.");
      }
    } else {
      // Für lokale Berichte
      setWorkReportData({
        name: report.name,
        period: report.period,
        date: report.date,
        entries: report.entries
      });
    }
  };

  // Lade gespeicherte Berichte aus der Datenbank
  useEffect(() => {
    const fetchDatabaseReports = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return;
        }

        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Fehler beim Laden der Berichte:', error);
          return;
        }

        // Lokale Berichte aus den Datenbankberichten laden
        const localReports = data.map(report => {
          try {
            const content = JSON.parse(report.content);
            return {
              id: report.id,
              name: report.name,
              period: report.period,
              date: report.created_at,
              entries: content.entries || []
            };
          } catch (e) {
            console.error('Fehler beim Parsen des Berichtsinhalts:', e);
            return null;
          }
        }).filter(Boolean) as LocalSavedReport[];
        
        setSavedReports(prevReports => {
          // Kombiniere lokale und Datenbankberichte, entferne Duplikate
          const combinedReports = [...prevReports];
          localReports.forEach(report => {
            if (!combinedReports.some(r => r.id === report.id)) {
              combinedReports.push(report);
            }
          });
          return combinedReports;
        });
      } catch (error) {
        console.error('Fehler beim Laden der Berichte aus der Datenbank:', error);
      }
    };

    fetchDatabaseReports();
  }, []);

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

  // Add a CSS class to maintain background color after loading a report
  useEffect(() => {
    // Set the background color of the body element
    document.body.style.backgroundColor = "#ffffff";
    
    // Clean up function to reset when component unmounts
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Calculate total hours
  const calculateTotalHours = (entries: any[]) => {
    return entries.reduce(
      (total: number, entry: any) => {
        // Sicherstellen, dass wir eine Zahl haben, egal welchen Typ entry.hours hat
        const hours = typeof entry.hours === 'number' 
          ? entry.hours 
          : parseFloat(entry.hours || '0');
        return total + hours;
      },
      0
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">
            Arbeitsrapport-Generator
          </h1>
          <div className="flex flex-wrap justify-center sm:justify-end gap-3">
            <ReportHistory 
              onLoadReport={handleLoadReport} 
              iconOnly={true} 
            />
            <Button 
              variant="outline" 
              onClick={saveReport} 
              className="inline-flex items-center justify-center p-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors" 
              title="Speichern"
            >
              <Save className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToExcel} 
              className="inline-flex items-center justify-center p-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors" 
              title="Excel exportieren"
            >
              <Download className="h-5 w-5" />
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
              <DialogTitle className="text-xl text-gray-800">Bericht per E-Mail senden</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4 text-sm text-gray-600">
                Wählen Sie einen Bericht aus, den Sie per E-Mail senden möchten:
              </p>
              <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-md">
                {savedReports.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSendEmail(report)}
                      >
                        <div className="font-medium text-gray-800">{report.name}</div>
                        <div className="text-sm text-gray-600">
                          Zeitraum: {report.period}
                        </div>
                        <div className="text-xs text-gray-500">
                          Gespeichert am: {report.date}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Keine gespeicherten Berichte gefunden.
                  </div>
                )}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Oder senden Sie den aktuellen Bericht:
              </div>
              <Button
                onClick={() => workReportData && handleSendEmail(workReportData)}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                disabled={
                  !workReportData ||
                  !workReportData.entries ||
                  workReportData.entries.length === 0
                }
              >
                Aktuellen Bericht senden
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
