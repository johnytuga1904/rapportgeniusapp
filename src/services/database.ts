import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { SavedReport } from '@/types/reports';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportInsert = Database['public']['Tables']['reports']['Insert'];
type ReportUpdate = Database['public']['Tables']['reports']['Update'];

type Object = Database['public']['Tables']['objects']['Row'];
type ObjectInsert = Database['public']['Tables']['objects']['Insert'];
type ObjectUpdate = Database['public']['Tables']['objects']['Update'];

// Interface for CSV files
interface CSVFile {
  id: string;
  filename: string;
  content?: string;
  reportId?: string;
  createdAt: string;
  userId: string;
}

interface CSVFileInsert {
  filename: string;
  content: string;
  reportId?: string;
}

class DatabaseService {
  async createReport(reportData: any): Promise<SavedReport> {
    try {
      console.log('DatabaseService: Starte createReport mit Daten:', reportData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nicht eingeloggt');
      }

      const currentDate = new Date().toISOString();
      const reportToInsert = {
        user_id: user.id,
        date: reportData.date || currentDate.split('T')[0],
        name: reportData.name || 'Unbenannter Bericht',
        period: reportData.period || 'Kein Zeitraum',
        content: JSON.stringify(reportData),
        created_at: currentDate,
        updated_at: currentDate
      };

      console.log('DatabaseService: Speichere Report mit Daten:', reportToInsert);

      const { data, error } = await supabase
        .from('reports')
        .insert([reportToInsert])
        .select()
        .single();

      if (error) {
        console.error('DatabaseService: Fehler beim Erstellen des Reports:', error);
        throw error;
      }

      console.log('DatabaseService: Report erfolgreich erstellt:', data);
      return data;
    } catch (error) {
      console.error('DatabaseService: Fehler in createReport:', error);
      throw error;
    }
  }

  async getReports(): Promise<SavedReport[]> {
    try {
      console.log('DatabaseService: Starte getReports...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nicht eingeloggt');
      }

      console.log('DatabaseService: Suche Reports für Benutzer:', user.id);

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('DatabaseService: Fehler beim Abrufen der Reports:', error);
        throw error;
      }

      console.log('DatabaseService: Reports erfolgreich abgerufen:', data);
      return data || [];
    } catch (error) {
      console.error('DatabaseService: Fehler in getReports:', error);
      throw error;
    }
  }

  async updateReport(id: string, reportData: any): Promise<SavedReport> {
    try {
      console.log('DatabaseService: Starte updateReport für ID:', id);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nicht eingeloggt');
      }

      const { data, error } = await supabase
        .from('reports')
        .update({
          content: JSON.stringify(reportData),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('DatabaseService: Fehler beim Aktualisieren des Reports:', error);
        throw error;
      }

      console.log('DatabaseService: Report erfolgreich aktualisiert:', data);
      return data;
    } catch (error) {
      console.error('DatabaseService: Fehler in updateReport:', error);
      throw error;
    }
  }

  async deleteReport(id: string): Promise<void> {
    try {
      console.log('DatabaseService: Starte deleteReport für ID:', id);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nicht eingeloggt');
      }

      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('DatabaseService: Fehler beim Löschen des Reports:', error);
        throw error;
      }

      console.log('DatabaseService: Report erfolgreich gelöscht');
    } catch (error) {
      console.error('DatabaseService: Fehler in deleteReport:', error);
      throw error;
    }
  }

  // Object Operationen
  async createObject(object: Omit<ObjectInsert, 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Nicht eingeloggt');

    const { data, error } = await supabase
      .from('objects')
      .insert({
        ...object,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getObjects() {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async updateObject(id: string, updates: ObjectUpdate) {
    const { data, error } = await supabase
      .from('objects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteObject(id: string) {
    const { error } = await supabase
      .from('objects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // CSV File Operations
  async createCSVFile(csvFile: CSVFileInsert): Promise<CSVFile> {
    try {
      console.log('DatabaseService: Starte createCSVFile mit Daten:', csvFile.filename);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nicht eingeloggt');
      }

      const currentDate = new Date().toISOString();
      const fileToInsert = {
        user_id: user.id,
        filename: csvFile.filename,
        content: csvFile.content,
        report_id: csvFile.reportId,
        created_at: currentDate
      };

      console.log('DatabaseService: Speichere CSV-Datei:', fileToInsert.filename);

      const { data, error } = await supabase
        .from('csv_files')
        .insert([fileToInsert])
        .select()
        .single();

      if (error) {
        console.error('DatabaseService: Fehler beim Erstellen der CSV-Datei:', error);
        throw error;
      }

      console.log('DatabaseService: CSV-Datei erfolgreich erstellt:', data.id);
      return {
        id: data.id,
        filename: data.filename,
        reportId: data.report_id,
        createdAt: data.created_at,
        userId: data.user_id
      };
    } catch (error) {
      console.error('DatabaseService: Fehler in createCSVFile:', error);
      throw error;
    }
  }

  async getCSVFiles(): Promise<{id: string, filename: string, reportId: string, createdAt: string}[]> {
    try {
      console.log('DatabaseService: Starte getCSVFiles...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nicht eingeloggt');
      }

      console.log('DatabaseService: Suche CSV-Dateien für Benutzer:', user.id);

      const { data, error } = await supabase
        .from('csv_files')
        .select('id, filename, report_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('DatabaseService: Fehler beim Abrufen der CSV-Dateien:', error);
        throw error;
      }

      console.log('DatabaseService: CSV-Dateien erfolgreich abgerufen:', data?.length || 0);
      return data?.map(file => ({
        id: file.id,
        filename: file.filename,
        reportId: file.report_id,
        createdAt: file.created_at
      })) || [];
    } catch (error) {
      console.error('DatabaseService: Fehler in getCSVFiles:', error);
      throw error;
    }
  }

  async getCSVFileContent(id: string): Promise<{content: string}> {
    try {
      console.log('DatabaseService: Starte getCSVFileContent für ID:', id);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nicht eingeloggt');
      }

      const { data, error } = await supabase
        .from('csv_files')
        .select('content')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('DatabaseService: Fehler beim Abrufen des CSV-Inhalts:', error);
        throw error;
      }

      if (!data || !data.content) {
        throw new Error('CSV-Datei nicht gefunden oder kein Inhalt vorhanden');
      }

      return { content: data.content };
    } catch (error) {
      console.error('DatabaseService: Fehler in getCSVFileContent:', error);
      throw error;
    }
  }

  async deleteCSVFile(id: string): Promise<void> {
    try {
      console.log('DatabaseService: Starte deleteCSVFile für ID:', id);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nicht eingeloggt');
      }

      const { error } = await supabase
        .from('csv_files')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('DatabaseService: Fehler beim Löschen der CSV-Datei:', error);
        throw error;
      }

      console.log('DatabaseService: CSV-Datei erfolgreich gelöscht');
    } catch (error) {
      console.error('DatabaseService: Fehler in deleteCSVFile:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();