import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  MoonIcon,
  SunIcon,
  Download,
  Send,
  Save,
  PieChart as PieChartIcon,
} from "lucide-react";
import WorkReport from "./WorkReport";
import VoiceInput from "./VoiceInput";
import SettingsDialog from "./SettingsDialog";
import ReportHistory from "./ReportHistory";
import PieChart from "./PieChart";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

interface SavedReport {
  id: string;
  name: string;
  period: string;
  date: string;
  entries: any[];
}

export default function WorkReportPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [workReportData, setWorkReportData] = useState<any>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showChart, setShowChart] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

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
    const emailSettings = localStorage.getItem("emailSettings");
    if (!emailSettings) {
      alert("Bitte konfigurieren Sie zuerst die E-Mail-Einstellungen.");
      return;
    }

    if (
      !workReportData ||
      !workReportData.entries ||
      workReportData.entries.length === 0
    ) {
      alert("Es gibt keine Daten zum Senden.");
      return;
    }

    // Get saved reports for selection
    const existingReportsStr = localStorage.getItem("savedReports");
    let savedReports: SavedReport[] = [];

    if (existingReportsStr) {
      savedReports = JSON.parse(existingReportsStr);
    }

    // If no saved reports and current report is not saved, save it first
    if (savedReports.length === 0 && !currentReportId) {
      saveReport();
      // Refresh the saved reports list
      const updatedReportsStr = localStorage.getItem("savedReports");
      if (updatedReportsStr) {
        savedReports = JSON.parse(updatedReportsStr);
      }
    }

    // Create dialog for report selection
    const dialog = document.createElement("div");
    dialog.style.position = "fixed";
    dialog.style.top = "0";
    dialog.style.left = "0";
    dialog.style.width = "100%";
    dialog.style.height = "100%";
    dialog.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    dialog.style.display = "flex";
    dialog.style.justifyContent = "center";
    dialog.style.alignItems = "center";
    dialog.style.zIndex = "9999";

    const dialogContent = document.createElement("div");
    dialogContent.style.backgroundColor = darkMode ? "#1e1e1e" : "white";
    dialogContent.style.color = darkMode ? "white" : "black";
    dialogContent.style.padding = "20px";
    dialogContent.style.borderRadius = "8px";
    dialogContent.style.width = "500px";
    dialogContent.style.maxWidth = "90%";
    dialogContent.style.maxHeight = "80%";
    dialogContent.style.overflowY = "auto";

    const title = document.createElement("h2");
    title.textContent = "Bericht zum Senden auswählen";
    title.style.marginBottom = "20px";

    const reportsList = document.createElement("div");
    reportsList.style.marginBottom = "20px";

    // Add current report option if it exists
    if (workReportData) {
      const currentReportOption = document.createElement("div");
      currentReportOption.style.padding = "10px";
      currentReportOption.style.marginBottom = "5px";
      currentReportOption.style.border = "1px solid #ccc";
      currentReportOption.style.borderRadius = "4px";
      currentReportOption.style.cursor = "pointer";
      currentReportOption.style.backgroundColor = darkMode
        ? "#2d2d2d"
        : "#f0f0f0";

      currentReportOption.innerHTML = `<strong>Aktueller Bericht:</strong> ${workReportData.name} - ${workReportData.period}`;

      currentReportOption.addEventListener("click", () => {
        document.body.removeChild(dialog);
        prepareAndSendEmail(workReportData);
      });

      reportsList.appendChild(currentReportOption);
    }

    // Add saved reports
    savedReports.forEach((report) => {
      const reportOption = document.createElement("div");
      reportOption.style.padding = "10px";
      reportOption.style.marginBottom = "5px";
      reportOption.style.border = "1px solid #ccc";
      reportOption.style.borderRadius = "4px";
      reportOption.style.cursor = "pointer";
      reportOption.style.backgroundColor = darkMode ? "#2d2d2d" : "#f0f0f0";

      reportOption.innerHTML = `<strong>${report.name}</strong> - ${report.period} (${report.date})`;

      reportOption.addEventListener("click", () => {
        document.body.removeChild(dialog);
        const reportData = {
          name: report.name,
          period: report.period,
          entries: report.entries,
        };
        prepareAndSendEmail(reportData);
      });

      reportsList.appendChild(reportOption);
    });

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Abbrechen";
    cancelButton.style.padding = "8px 16px";
    cancelButton.style.backgroundColor = darkMode ? "#333" : "#e0e0e0";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.marginRight = "10px";

    cancelButton.addEventListener("click", () => {
      document.body.removeChild(dialog);
    });

    dialogContent.appendChild(title);
    dialogContent.appendChild(reportsList);
    dialogContent.appendChild(cancelButton);
    dialog.appendChild(dialogContent);

    document.body.appendChild(dialog);
  };

  const prepareAndSendEmail = (reportData: any) => {
    // Create CSV content
    let csvContent =
      "Datum,Auftrag Nr.,Objekt oder Strasse,Ort,Std.,Absenzen,Überstd.,Auslagen und Bemerkungen,Auslagen Fr.,Notizen\n";

    reportData.entries.forEach((entry: any) => {
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
    const totalHours = reportData.entries.reduce(
      (sum: number, entry: any) => sum + entry.hours,
      0,
    );
    const totalAbsences = reportData.entries.reduce(
      (sum: number, entry: any) => sum + entry.absences,
      0,
    );
    const totalOvertime = reportData.entries.reduce(
      (sum: number, entry: any) => sum + entry.overtime,
      0,
    );
    const totalExpenses = reportData.entries.reduce(
      (sum: number, entry: any) => sum + entry.expenseAmount,
      0,
    );
    const totalRequiredHours = totalHours + totalAbsences;

    // Add Total row
    csvContent += `Total,,,,${totalHours.toFixed(2)},${totalAbsences > 0 ? totalAbsences.toFixed(2) : ""},${totalOvertime > 0 ? totalOvertime.toFixed(2) : ""},,${totalExpenses.toFixed(2)}\n`;

    // Add Total Required Hours row
    csvContent += `Total Sollstunden,,,,${totalRequiredHours.toFixed(2)}\n`;

    // Create a blob for the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileName = `Arbeitsrapport_${reportData.name.replace(/\s+/g, "_")}_${reportData.period.replace(/\s+/g, "_")}.csv`;

    // Try to use mailto with the CSV as an attachment
    try {
      const emailSettings = localStorage.getItem("emailSettings");
      if (!emailSettings) {
        alert("Bitte konfigurieren Sie zuerst die E-Mail-Einstellungen.");
        return;
      }

      const settings = JSON.parse(emailSettings);
      const recipient = settings.recipient || "";
      const subject = `Arbeitsrapport: ${reportData.name} - ${reportData.period}`;
      const body = `Sehr geehrte Damen und Herren,\n\nAnbei finden Sie den Arbeitsrapport für ${reportData.name} im Zeitraum ${reportData.period}.\n\nMit freundlichen Grüßen,\n${reportData.name}`;

      // Create a temporary link to download the file
      const tempLink = document.createElement("a");
      tempLink.href = URL.createObjectURL(blob);
      tempLink.download = fileName;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);

      // Open email client with pre-filled fields
      const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      alert(
        "Bitte fügen Sie die heruntergeladene CSV-Datei als Anhang zu Ihrer E-Mail hinzu.",
      );
    } catch (error) {
      console.error("Fehler beim E-Mail-Versand:", error);
      alert(
        "Fehler beim Erstellen der E-Mail. Bitte überprüfen Sie Ihre E-Mail-Einstellungen.",
      );
    }
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

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="container mx-auto p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center sm:text-left">
            Arbeitsrapport-Generator
          </h1>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <VoiceInput
              onTranscript={(text) => {
                // Here you would implement logic to parse the voice input
                // and update the appropriate fields
                console.log("Voice input:", text);
              }}
            />
            <Button variant="outline" onClick={toggleTheme}>
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant={showChart ? "default" : "outline"}
              onClick={() => setShowChart(!showChart)}
            >
              <PieChartIcon className="h-5 w-5 mr-2" />
              {showChart ? "Zurück zum Rapport" : "Diagramm"}
            </Button>
            <SettingsDialog />
            <ReportHistory onLoadReport={handleLoadReport} />
            <Button variant="outline" onClick={saveReport}>
              <Save className="h-5 w-5 mr-2" />
              Speichern
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-5 w-5 mr-2" />
              Excel exportieren
            </Button>
            <Button onClick={sendEmail}>
              <Send className="h-5 w-5 mr-2" />
              Per E-Mail senden
            </Button>
          </div>
        </div>

        {showChart ? (
          <PieChart savedReports={savedReports} />
        ) : (
          <WorkReport
            initialData={workReportData}
            onDataChange={(data) => setWorkReportData(data)}
          />
        )}
      </div>
    </div>
  );
}
