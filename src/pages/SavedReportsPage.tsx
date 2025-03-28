import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, FileText, Download, Mail, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SavedReport {
  id: string;
  created_at: string;
  report_data: any;
  user_id: string;
}

export function SavedReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
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

      // Berichte für den aktuellen Benutzer abrufen
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReports(data || []);
    } catch (error) {
      console.error('Fehler beim Abrufen der Berichte:', error);
      setError(error instanceof Error ? error.message : 'Fehler beim Abrufen der Berichte');
      try {
        toast.error("Fehler beim Abrufen der Berichte: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      } catch (e) {
        alert("Fehler beim Abrufen der Berichte: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Bericht wirklich löschen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setReports(reports.filter(report => report.id !== id));
      try {
        toast.success("Bericht erfolgreich gelöscht!");
      } catch (e) {
        alert("Bericht erfolgreich gelöscht!");
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Berichts:', error);
      try {
        toast.error("Fehler beim Löschen: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      } catch (e) {
        alert("Fehler beim Löschen: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      }
    }
  };

  const handleViewReport = (report: SavedReport) => {
    // Speichern des Berichts im lokalen Speicher für die Detailansicht
    localStorage.setItem('currentReport', JSON.stringify(report.report_data));
    navigate(`/report-detail/${report.id}`);
  };

  const handleExportCSV = (report: SavedReport) => {
    if (!report.report_data || !report.report_data.entries || report.report_data.entries.length === 0) {
      try {
        toast.error("Keine Daten zum Exportieren vorhanden.");
      } catch (e) {
        alert("Keine Daten zum Exportieren vorhanden.");
      }
      return;
    }

    // CSV-Header erstellen
    let csvContent =
      "Datum,Auftrag Nr.,Objekt oder Strasse,Ort,Std.,Absenzen,Überstd.,Auslagen und Bemerkungen,Auslagen Fr.,Notizen\n";

    // CSV-Zeilen für jeden Eintrag erstellen
    report.report_data.entries.forEach((entry: any) => {
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
    const totalHours = report.report_data.entries.reduce(
      (sum: number, entry: any) => sum + (entry.hours || 0),
      0,
    );
    const totalAbsences = report.report_data.entries.reduce(
      (sum: number, entry: any) => sum + (entry.absences || 0),
      0,
    );
    const totalOvertime = report.report_data.entries.reduce(
      (sum: number, entry: any) => sum + (entry.overtime || 0),
      0,
    );
    const totalExpenses = report.report_data.entries.reduce(
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
      `Arbeitsrapport_${report.report_data.name.replace(/\s+/g, "_")}_${report.report_data.period.replace(/\s+/g, "_")}.csv`,
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

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Header */}
      <header className="w-full h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <Home className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Gespeicherte Arbeitsrapporte
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/work-report')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Neuer Bericht
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-4 pt-6">
        {loading ? (
          <div className="text-center py-8">
            <p>Berichte werden geladen...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <p>Keine gespeicherten Berichte gefunden.</p>
            <Button 
              onClick={() => navigate('/work-report')} 
              className="mt-4"
            >
              Ersten Bericht erstellen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">
                    {report.report_data?.name || 'Unbenannter Bericht'}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {report.report_data?.period || 'Kein Zeitraum angegeben'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Erstellt am: {format(new Date(report.created_at), 'dd.MM.yyyy HH:mm')}
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mt-2">
                    <p className="text-sm">
                      <strong>Einträge:</strong> {report.report_data?.entries?.length || 0}
                    </p>
                    {report.report_data?.entries?.length > 0 && (
                      <p className="text-sm">
                        <strong>Gesamtstunden:</strong> {report.report_data.entries.reduce(
                          (sum: number, entry: any) => sum + (entry.hours || 0),
                          0,
                        ).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV(report)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Anzeigen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Löschen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
