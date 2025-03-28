import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import { SavedReport, DatabaseSavedReport } from "@/types/reports";

interface ReportHistoryProps {
  onLoadReport: (report: SavedReport) => void;
  iconOnly?: boolean;
}

export default function ReportHistory({ onLoadReport, iconOnly = false }: ReportHistoryProps) {
  const [open, setOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<DatabaseSavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt');

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedReports(data || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      setError(error.message || 'Fehler beim Laden der Berichte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReports();
    }
  }, [open]);

  const handleLoadReport = (report: SavedReport) => {
    try {
      const reportData = JSON.parse(report.content);
      onLoadReport(reportData);
      setOpen(false);
    } catch (error) {
      console.error('Fehler beim Laden des Berichts:', error);
      setError('Fehler beim Laden des Berichts');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Möchten Sie diesen Bericht wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedReports(savedReports.filter(report => report.id !== id));
      alert('Bericht erfolgreich gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen des Berichts:', error);
      alert('Fehler beim Löschen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size={iconOnly ? "icon" : "default"}>
          <History className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">Berichte</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gespeicherte Berichte</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div>Lade Berichte...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Zeitraum</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.period}</TableCell>
                  <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleLoadReport(report)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
