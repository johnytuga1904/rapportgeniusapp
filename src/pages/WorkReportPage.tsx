import { useState } from 'react';
import ReportForm, { ReportFormProps } from '@/components/ReportForm';
import WorkReport, { WorkReportProps } from '@/components/WorkReport';
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { BackToDashboardButton } from "@/components/BackToDashboardButton";
import { Download, Mail, Save, FileText } from "lucide-react";

export function WorkReportPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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

      const { error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          report_data: report,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setError(error instanceof Error ? error.message : 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    // Excel-Export-Logik hier
    console.log('Exportiere nach Excel:', report);
  };

  const handleEmail = () => {
    if (!report) return;
    // E-Mail-Versand-Logik hier
    console.log('Sende per E-Mail:', report);
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