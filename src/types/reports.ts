// Gemeinsame Typdefinitionen für Reports

// Basistyp für gespeicherte Berichte
export interface BaseSavedReport {
  id: string;
  name: string;
  period: string;
  date: string;
}

// Typ für Berichte aus der Datenbank (ReportHistory)
export interface DatabaseSavedReport extends BaseSavedReport {
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  ordernumber?: string;
  objects?: string;
  location?: string;
  workhours?: number;
  absencehours?: number;
  overtimehours?: number;
  expenses?: number;
  files?: any;
}

// Typ für lokal gespeicherte Berichte (WorkReportPage)
export interface LocalSavedReport extends BaseSavedReport {
  entries: any[];
}

// Vereinigungstyp für beide Report-Typen
export type SavedReport = DatabaseSavedReport | LocalSavedReport;

// Hilfsfunktion zur Typprüfung
export function isDatabaseReport(report: SavedReport): report is DatabaseSavedReport {
  return 'content' in report && typeof report.content === 'string';
}

export function isLocalReport(report: SavedReport): report is LocalSavedReport {
  return 'entries' in report && Array.isArray(report.entries);
}