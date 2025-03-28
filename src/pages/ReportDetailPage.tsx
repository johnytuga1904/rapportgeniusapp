import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, FileText, Download, Mail, Save, ArrowLeft } from 'lucide-react';
import WorkReport from '@/components/WorkReport';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchReport(id);
    } else {
      // Versuche, den Bericht aus dem lokalen Speicher zu laden
      const storedReport = localStorage.getItem('currentReport');
      if (storedReport) {
        try {
          setReport(JSON.parse(storedReport));
          setLoading(false);
        } catch (e) {
          setError('Fehler beim Laden des gespeicherten Berichts');
          setLoading(false);
        }
      } else {
        setError('Kein Bericht gefunden');
        setLoading(false);
      }
    }
  }, [id]);

  const fetchReport = async (reportId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Benutzer abrufen
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        navigate('/login');
        return;
      }

      // Bericht abrufen
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Bericht nicht gefunden');
      
      setReport(data.report_data);
    } catch (error) {
      console.error('Fehler beim Abrufen des Berichts:', error);
      setError(error instanceof Error ? error.message : 'Fehler beim Abrufen des Berichts');
      try {
        toast.error("Fehler beim Abrufen des Berichts: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      } catch (e) {
        alert("Fehler beim Abrufen des Berichts: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReportChange = (updatedReport: any) => {
    setReport(prev => ({
      ...prev,
      ...updatedReport
    }));
  };

  const handleSave = async () => {
    if (!report || !id) {
      try {
        toast.error("Es gibt keine Daten zum Speichern oder keine Berichts-ID.");
      } catch (e) {
        alert("Es gibt keine Daten zum Speichern oder keine Berichts-ID.");
      }
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt');

      const { error } = await supabase
        .from('reports')
        .update({
          report_data: report,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setSuccess(true);
      try {
        toast.success("Bericht erfolgreich aktualisiert!");
      } catch (e) {
        alert("Bericht erfolgreich aktualisiert!");
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setError(error instanceof Error ? error.message : 'Fehler beim Speichern');
      try {
        toast.error("Fehler beim Speichern: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      } catch (e) {
        alert("Fehler beim Speichern: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!report || !report.entries || report.entries.length === 0) {
      try {
        toast.error("Es gibt keine Daten zum Exportieren.");
      } catch (e) {
        alert("Es gibt keine Daten zum Exportieren.");
      }
      return;
    }

    // CSV-Header erstellen
    let csvContent =
      "Datum,Auftrag Nr.,Objekt oder Strasse,Ort,Std.,Absenzen,Überstd.,Auslagen und Bemerkungen,Auslagen Fr.,Notizen\n";

    // CSV-Zeilen für jeden Eintrag erstellen
    report.entries.forEach((entry: any) => {
      const row = [
        entry.date,
        entry.orderNumber || "",
        entry.object || "",
        entry.location || "",
        entry.hours ? entry.hours.toFixed(2) : "0.00",
        entry.absences > 0 ? entry.absences.toFixed(2) : "",
        entry.overtime > 0 ? entry.overtime.toFixed(2) : "",
        entry.expenses || "",
        entry.expenseAmount > 0 ? entry.expenseAmount.toFixed(2) : "",
        entry.notes || "",
      ];

      // Kommas in Feldern escapen
      const escapedRow = row.map((field) => {
        if (field && typeof field === "string" && field.includes(",")) {
          return `"${field}"`;
        }
        return field;
      });

      csvContent += escapedRow.join(",") + "\n";
    });

    // Zusammenfassungszeilen hinzufügen
    const totalHours = report.entries.reduce(
      (sum: number, entry: any) => sum + (entry.hours || 0),
      0,
    );
    const totalAbsences = report.entries.reduce(
      (sum: number, entry: any) => sum + (entry.absences || 0),
      0,
    );
    const totalOvertime = report.entries.reduce(
      (sum: number, entry: any) => sum + (entry.overtime || 0),
      0,
    );
    const totalExpenses = report.entries.reduce(
      (sum: number, entry: any) => sum + (entry.expenseAmount || 0),
      0,
    );
    const totalRequiredHours = totalHours + totalAbsences;

    // Gesamtzeile hinzufügen
    csvContent += `Total,,,,${totalHours.toFixed(2)},${totalAbsences > 0 ? totalAbsences.toFixed(2) : ""},${totalOvertime > 0 ? totalOvertime.toFixed(2) : ""},,${totalExpenses.toFixed(2)}\n`;

    // Sollstunden-Zeile hinzufügen
    csvContent += `Total Sollstunden,,,,${totalRequiredHours.toFixed(2)}\n`;

    // Download-Link erstellen
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Arbeitsrapport_${report.name.replace(/\s+/g, "_")}_${report.period.replace(/\s+/g, "_")}.csv`,
    );
    document.body.appendChild(link);

    // Download auslösen und aufräumen
    link.click();
    document.body.removeChild(link);
    
    try {
      toast.success("CSV-Datei wurde exportiert!");
    } catch (e) {
      alert("CSV-Datei wurde exportiert!");
    }
  };

  const handleEmail = () => {
    if (!report) {
      try {
        toast.error("Es gibt keine Daten zum Versenden.");
      } catch (e) {
        alert("Es gibt keine Daten zum Versenden.");
      }
      return;
    }
    
    setEmailDialogOpen(true);
  };
  
  const sendEmailWithAttachment = async () => {
    if (!emailAddress || !report) {
      try {
        toast.error("Bitte geben Sie eine E-Mail-Adresse ein.");
      } catch (e) {
        alert("Bitte geben Sie eine E-Mail-Adresse ein.");
      }
      return;
    }
    
    setLoading(true);
    
    try {
      // CSV-Inhalt erstellen
      let csvContent =
        "Datum,Auftrag Nr.,Objekt oder Strasse,Ort,Std.,Absenzen,Überstd.,Auslagen und Bemerkungen,Auslagen Fr.,Notizen\n";

      report.entries.forEach((entry: any) => {
        const row = [
          entry.date,
          entry.orderNumber || "",
          entry.object || "",
          entry.location || "",
          entry.hours ? entry.hours.toFixed(2) : "0.00",
          entry.absences > 0 ? entry.absences.toFixed(2) : "",
          entry.overtime > 0 ? entry.overtime.toFixed(2) : "",
          entry.expenses || "",
          entry.expenseAmount > 0 ? entry.expenseAmount.toFixed(2) : "",
          entry.notes || "",
        ];

        // Kommas in Feldern escapen
        const escapedRow = row.map((field) => {
          if (field && typeof field === "string" && field.includes(",")) {
            return `"${field}"`;
          }
          return field;
        });

        csvContent += escapedRow.join(",") + "\n";
      });

      // Zusammenfassungszeilen hinzufügen
      const totalHours = report.entries.reduce(
        (sum: number, entry: any) => sum + (entry.hours || 0),
        0,
      );
      const totalAbsences = report.entries.reduce(
        (sum: number, entry: any) => sum + (entry.absences || 0),
        0,
      );
      const totalOvertime = report.entries.reduce(
        (sum: number, entry: any) => sum + (entry.overtime || 0),
        0,
      );
      const totalExpenses = report.entries.reduce(
        (sum: number, entry: any) => sum + (entry.expenseAmount || 0),
        0,
      );
      const totalRequiredHours = totalHours + totalAbsences;

      // Gesamtzeile hinzufügen
      csvContent += `Total,,,,${totalHours.toFixed(2)},${totalAbsences > 0 ? totalAbsences.toFixed(2) : ""},${totalOvertime > 0 ? totalOvertime.toFixed(2) : ""},,${totalExpenses.toFixed(2)}\n`;

      // Sollstunden-Zeile hinzufügen
      csvContent += `Total Sollstunden,,,,${totalRequiredHours.toFixed(2)}\n`;
      
      // E-Mail-Betreff
      const subject = `Arbeitsrapport: ${report.name} - ${report.period}`;
      
      // E-Mail-Text
      const html = `
        <h2>Arbeitsrapport für ${report.name}</h2>
        <p><strong>Zeitraum:</strong> ${report.period}</p>
        
        <h3>Einträge:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Datum</th>
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Auftrag</th>
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Ort</th>
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">Stunden</th>
            </tr>
          </thead>
          <tbody>
            ${report.entries.map((entry: any) => `
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb;">${entry.date}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb;">${entry.orderNumber || '-'}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb;">${entry.location || '-'}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${entry.hours?.toFixed(2) || '0.00'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f3f4f6;">
              <td colspan="3" style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;"><strong>Gesamtstunden:</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">
                <strong>${totalHours.toFixed(2)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
        
        <p>Im Anhang finden Sie den vollständigen Arbeitsrapport als CSV-Datei.</p>
        
        ${report.notes ? `<p><strong>Notizen:</strong><br>${report.notes}</p>` : ''}
      `;
      
      // E-Mail direkt aus dem Browser senden (mailto-Link)
      const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Siehe Anhang für den Arbeitsrapport.')}`;
      window.open(mailtoLink, '_blank');
      
      // CSV-Datei zum manuellen Anhängen herunterladen
      const filename = `Arbeitsrapport_${report.name.replace(/\s+/g, "_")}_${report.period.replace(/\s+/g, "_")}.csv`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setEmailDialogOpen(false);
      try {
        toast.success("E-Mail-Client wurde geöffnet. Bitte fügen Sie die heruntergeladene CSV-Datei als Anhang hinzu.");
      } catch (e) {
        alert("E-Mail-Client wurde geöffnet. Bitte fügen Sie die heruntergeladene CSV-Datei als Anhang hinzu.");
      }
    } catch (error) {
      console.error('Fehler beim E-Mail-Versand:', error);
      try {
        toast.error("Fehler beim E-Mail-Versand: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      } catch (e) {
        alert("Fehler beim E-Mail-Versand: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Header */}
      <header className="w-full h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/saved-reports')}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {report ? `Arbeitsrapport: ${report.name}` : 'Berichtsdetails'}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEmail}
                  aria-label="Per E-Mail senden"
                  disabled={!report}
                >
                  <Mail className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Per E-Mail senden</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExportCSV}
                  aria-label="CSV exportieren"
                  disabled={!report}
                >
                  <Download className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>CSV exportieren</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSave}
                  aria-label="Bericht speichern"
                  disabled={loading || !report || !id}
                >
                  <Save className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Änderungen speichern</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      <div className="container mx-auto p-4 pt-6">
        {loading ? (
          <div className="text-center py-8">
            <p>Bericht wird geladen...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        ) : !report ? (
          <div className="text-center py-8">
            <p>Kein Bericht gefunden</p>
            <Button 
              onClick={() => navigate('/work-report')} 
              className="mt-4"
            >
              Neuen Bericht erstellen
            </Button>
          </div>
        ) : (
          <div>
            <Card className="mb-4">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Berichtsdetails</h3>
                    <p><strong>Name:</strong> {report.name}</p>
                    <p><strong>Zeitraum:</strong> {report.period}</p>
                    <p><strong>Einträge:</strong> {report.entries?.length || 0}</p>
                    {report.entries?.length > 0 && (
                      <>
                        <p><strong>Gesamtstunden:</strong> {report.entries.reduce(
                          (sum: number, entry: any) => sum + (entry.hours || 0),
                          0,
                        ).toFixed(2)}</p>
                        <p><strong>Absenzen:</strong> {report.entries.reduce(
                          (sum: number, entry: any) => sum + (entry.absences || 0),
                          0,
                        ).toFixed(2)}</p>
                        <p><strong>Überstunden:</strong> {report.entries.reduce(
                          (sum: number, entry: any) => sum + (entry.overtime || 0),
                          0,
                        ).toFixed(2)}</p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="flex gap-2 mt-4 justify-end">
                      <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        CSV exportieren
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleEmail}
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Per E-Mail senden
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <WorkReport report={report} onDataChange={handleReportChange} />

            {id && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Änderungen speichern
                </Button>
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
                Bericht erfolgreich gespeichert!
              </div>
            )}
          </div>
        )}
        
        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Bericht per E-Mail senden</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  E-Mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="col-span-3"
                  placeholder="empfaenger@beispiel.de"
                />
              </div>
              <div className="col-span-4 text-sm text-gray-500">
                <p>Die CSV-Datei wird heruntergeladen und Ihr E-Mail-Client wird geöffnet. 
                Bitte fügen Sie die heruntergeladene Datei als Anhang hinzu.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={sendEmailWithAttachment} disabled={loading}>
                {loading ? "Wird vorbereitet..." : "E-Mail vorbereiten"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
