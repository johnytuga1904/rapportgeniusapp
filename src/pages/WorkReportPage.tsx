import { useState, useEffect } from 'react';
import ReportForm, { ReportFormProps } from '@/components/ReportForm';
import WorkReport, { WorkReportProps } from '@/components/WorkReport';
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { BackToDashboardButton } from "@/components/BackToDashboardButton";
import { Download, Mail, Save, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { emailService } from '@/services/emailService';

interface SavedReport {
  id: string;
  name: string;
  period: string;
  content: any;
  created_at: string;
}

export function WorkReportPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReportChange = (updatedReport: any) => {
    setReport(prev => ({
      ...prev,
      ...updatedReport
    }));
  };

  const handleSave = async () => {
    if (!report) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt');

      const reportToSave = {
        user_id: user.id,
        name: report.name || 'Unbenannter Bericht',
        period: report.period || '',
        content: JSON.stringify(report),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('reports')
        .insert([reportToSave]);

      if (error) throw error;
      
      // Lade die gespeicherten Berichte neu
      const { data: savedReports, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Aktualisiere den lokalen Speicher
      localStorage.setItem('savedReports', JSON.stringify(savedReports));
      
      setSuccess(true);
      alert('Bericht erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setError(error instanceof Error ? error.message : 'Fehler beim Speichern');
      alert('Fehler beim Speichern: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    // Excel-Export-Logik hier
    console.log('Exportiere nach Excel:', report);
  };

  const convertToXLSX = (report: any) => {
    const wb = XLSX.utils.book_new();
    
    // Erstelle Arbeitsblatt für die Einträge
    const entriesData = report.entries.map((entry: any) => ({
      Datum: entry.date,
      Projekt: entry.project,
      Beschreibung: entry.description,
      Stunden: entry.hours
    }));
    const ws = XLSX.utils.json_to_sheet(entriesData);
    XLSX.utils.book_append_sheet(wb, ws, 'Einträge');

    // Erstelle Arbeitsblatt für die Zusammenfassung
    const summaryData = [{
      'Bericht': report.name,
      'Zeitraum': report.period,
      'Gesamtstunden': report.entries.reduce((sum: number, entry: any) => sum + entry.hours, 0),
      'Notizen': report.notes || ''
    }];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Zusammenfassung');

    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  };

  const handleEmail = () => {
    if (!report) return;
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedReport) {
      toast.error('Bitte wählen Sie einen Bericht aus');
      return;
    }

    if (!recipientEmail) {
      toast.error('Bitte geben Sie eine E-Mail-Adresse ein');
      return;
    }

    setSendingEmail(true);
    try {
      const xlsxBuffer = convertToXLSX(selectedReport.content);
      await emailService.sendReportWithAttachment(
        recipientEmail,
        selectedReport.content,
        xlsxBuffer,
        `${selectedReport.name}_${selectedReport.period}.xlsx`
      );
      toast.success('Bericht erfolgreich per E-Mail gesendet');
      setEmailDialogOpen(false);
      setRecipientEmail('');
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', error);
      toast.error('Fehler beim Senden der E-Mail');
    } finally {
      setSendingEmail(false);
    }
  };

  // Lade gespeicherte Berichte
  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedReports(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der gespeicherten Berichte:', error);
      toast.error('Fehler beim Laden der gespeicherten Berichte');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <BackToDashboardButton />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <ReportForm onReportGenerated={setReport} />
        </div>
        <div>
          <WorkReport report={report} onDataChange={handleReportChange} />
        </div>
      </div>

      {report && (
        <div className="mt-4 flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Excel exportieren
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

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/saved-reports')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Gespeicherte Berichte
            </Button>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Speichern
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Arbeitsbericht</h1>
        <div className="space-x-2">
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Bericht per E-Mail senden
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bericht per E-Mail senden</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Bericht auswählen</Label>
                  <Select
                    value={selectedReport?.id}
                    onValueChange={(value) => {
                      const report = savedReports.find(r => r.id === value);
                      setSelectedReport(report || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie einen Bericht" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedReports.map((report) => (
                        <SelectItem key={report.id} value={report.id}>
                          {report.name} - {report.period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">E-Mail-Adresse des Empfängers</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="empfaenger@beispiel.de"
                    required
                  />
                </div>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={sendingEmail || !selectedReport || !recipientEmail}
                  className="w-full"
                >
                  {sendingEmail ? 'Wird gesendet...' : 'Bericht senden'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          Bericht erfolgreich gespeichert!
        </div>
      )}
    </div>
  );
} 