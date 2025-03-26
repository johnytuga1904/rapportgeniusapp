export interface SavedReport {
  id: string;
  user_id: string;
  date: string;
  name: string;
  period: string;
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