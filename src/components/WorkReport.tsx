import { useState, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DateRangePicker from "./DateRangePicker";
import ObjectAutocomplete from "./ObjectAutocomplete";
import LocationAutocomplete from "./LocationAutocomplete";
import { Edit, Trash2, CalendarIcon, MessageSquare, FileText, Mail, Download } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { emailService } from "@/services/emailService";
import { toast } from "sonner";

interface WorkEntry {
  date: Date;
  orderNumber: string;
  location: string;
  object: string;
  hours: number;
  absences: number;
  overtime: number;
  expenses: string;
  expenseAmount: number;
  notes?: string;
}

export interface WorkReportProps {
  report: any;
  onDataChange?: (data: any) => void;
  initialData?: any;
}

// Memoized table row component to prevent unnecessary re-renders
const EntryRow = memo(
  ({
    entry,
    index,
    onEdit,
    onDelete,
  }: {
    entry: WorkEntry;
    index: number;
    onEdit: (index: number, entry: WorkEntry) => void;
    onDelete: (index: number) => void;
  }) => {
    const [notesDialogOpen, setNotesDialogOpen] = useState(false);
    const [tempNotes, setTempNotes] = useState(entry.notes || "");
    const [expensesDialogOpen, setExpensesDialogOpen] = useState(false);
    const [tempExpenses, setTempExpenses] = useState(entry.expenses || "");
    
    const handleSaveNotes = () => {
      onEdit(index, { ...entry, notes: tempNotes });
      setNotesDialogOpen(false);
    };
    
    const handleSaveExpenses = () => {
      onEdit(index, { ...entry, expenses: tempExpenses });
      setExpensesDialogOpen(false);
    };
    
    return (
      <TableRow>
        <TableCell className="border text-foreground">
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex">
                  <Input
                    value={format(entry.date, "dd.MM.yyyy")}
                    readOnly
                    className="pr-10 cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-0 px-3 h-full"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={entry.date}
                  onSelect={(date) => {
                    onEdit(index, { ...entry, date: date || new Date() });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </TableCell>
        <TableCell className="border text-foreground">
          {entry.orderNumber}
        </TableCell>
        <TableCell className="border text-foreground w-64">{entry.object}</TableCell>
        <TableCell className="border text-foreground">{entry.location}</TableCell>
        <TableCell className="border text-foreground w-14 text-center">
          {entry.hours.toFixed(2)}
        </TableCell>
        <TableCell className="border text-foreground w-14 text-center">
          {entry.absences > 0 ? entry.absences.toFixed(2) : ""}
        </TableCell>
        <TableCell className="border text-foreground w-14 text-center">
          {entry.overtime > 0 ? entry.overtime.toFixed(2) : ""}
        </TableCell>
        <TableCell className="border text-foreground">
          <div className="flex items-center gap-1">
            <span className="truncate max-w-[150px] cursor-pointer" onClick={() => {
                setTempExpenses(entry.expenses || "");
                setExpensesDialogOpen(true);
              }}>
              {entry.expenses || ""}
            </span>
            
            <Dialog open={expensesDialogOpen} onOpenChange={setExpensesDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Auslagen und Bemerkungen bearbeiten</DialogTitle>
                </DialogHeader>
                <Textarea 
                  value={tempExpenses} 
                  onChange={(e) => setTempExpenses(e.target.value)}
                  className="min-h-[150px]"
                  placeholder="Auslagen und Bemerkungen hier eingeben..."
                />
                <DialogFooter>
                  <Button type="submit" onClick={handleSaveExpenses}>Speichern</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TableCell>
        <TableCell className="border text-foreground w-16 text-center">
          {entry.expenseAmount > 0 ? entry.expenseAmount.toFixed(2) : ""}
        </TableCell>
        <TableCell className="border text-foreground w-32">
          <div className="flex items-center gap-1">
            <span className="truncate max-w-[100px] cursor-pointer" onClick={() => {
                setTempNotes(entry.notes || "");
                setNotesDialogOpen(true);
              }}>
              {entry.notes || ""}
            </span>
            
            <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Notizen bearbeiten</DialogTitle>
                </DialogHeader>
                <Textarea 
                  value={tempNotes} 
                  onChange={(e) => setTempNotes(e.target.value)}
                  className="min-h-[150px]"
                  placeholder="Notizen hier eingeben..."
                />
                <DialogFooter>
                  <Button type="submit" onClick={handleSaveNotes}>Speichern</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TableCell>
        <TableCell className="border">
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                onEdit(index, entry);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onDelete(index)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  },
);

EntryRow.displayName = "EntryRow";

// Default empty entry
const emptyEntry: WorkEntry = {
  date: new Date(),
  orderNumber: "",
  location: "",
  object: "",
  hours: 0,
  absences: 0,
  overtime: 0,
  expenses: "",
  expenseAmount: 0,
  notes: "",
};

const WorkReport: React.FC<WorkReportProps> = ({ report, onDataChange, initialData }) => {
  const [name, setName] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [newEntry, setNewEntry] = useState<WorkEntry>({ ...emptyEntry });
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [tempNotes, setTempNotes] = useState("");
  const [expensesDialogOpen, setExpensesDialogOpen] = useState(false);
  const [tempExpenses, setTempExpenses] = useState("");
  
  // Update state when report changes
  useEffect(() => {
    if (report) {
      setName(report.name || "");
      setPeriod(report.period || "");
      setEntries(report.entries || []);
    }
  }, [report]);

  // Calculate totals - memoize calculations to prevent recalculations on every render
  const totals = useCallback(() => {
    const hours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    const absences = entries.reduce((sum, entry) => sum + entry.absences, 0);
    const overtime = entries.reduce((sum, entry) => sum + entry.overtime, 0);
    const expenses = entries.reduce(
      (sum, entry) => sum + entry.expenseAmount,
      0,
    );
    const requiredHours = hours + absences;

    return { hours, absences, overtime, expenses, requiredHours };
  }, [entries]);

  const {
    hours: totalHours,
    absences: totalAbsences,
    overtime: totalOvertime,
    expenses: totalExpenses,
    requiredHours: totalRequiredHours,
  } = totals();

  // Update parent component when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDataChange) {
        onDataChange({
          name,
          period,
          entries,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [name, period, entries, onDataChange]);

  // Memoize handlers to prevent recreating functions on each render
  const handleAddEntry = useCallback(() => {
    if (
      newEntry.date ||
      newEntry.orderNumber ||
      newEntry.location ||
      newEntry.object ||
      newEntry.hours > 0 ||
      newEntry.absences > 0 ||
      newEntry.overtime > 0 ||
      newEntry.expenses ||
      newEntry.expenseAmount > 0 ||
      newEntry.notes
    ) {
      setEntries((prev) => [...prev, { ...newEntry }]);
      setNewEntry({ ...emptyEntry });
    }
  }, [newEntry]);

  const handleEditEntry = useCallback(
    (index: number, entryToEdit: WorkEntry) => {
      setNewEntry({ ...entryToEdit });
      setEntries((prev) => prev.filter((_, i) => i !== index));
    },
    [],
  );

  const handleDeleteEntry = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle input changes for the new entry
  const handleNewEntryChange = useCallback(
    (field: keyof WorkEntry, value: any) => {
      setNewEntry((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  // Handle date input with special formatting
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let dateValue = e.target.value;

      // If user enters just a day number (1-31)
      if (/^\d{1,2}$/.test(dateValue)) {
        const day = parseInt(dateValue, 10);
        if (day >= 1 && day <= 31) {
          // Get the selected period from localStorage
          const periodStart = localStorage.getItem("periodStart")
            ? new Date(localStorage.getItem("periodStart") || "")
            : null;

          if (periodStart) {
            const month = format(periodStart, "MMMM");
            const year = format(periodStart, "yyyy");

            // Format the day with leading zero if needed
            const formattedDay = day.toString().padStart(2, "0");
            dateValue = `${formattedDay}. ${month} ${year}`;
          }
        }
      }

      handleNewEntryChange("date", dateValue);
    },
    [handleNewEntryChange],
  );

  const handleSaveNotes = () => {
    handleNewEntryChange("notes", tempNotes);
    setNotesDialogOpen(false);
  };

  const handleSaveExpenses = () => {
    handleNewEntryChange("expenses", tempExpenses);
    setExpensesDialogOpen(false);
  };

  // CSV-Export-Funktion
  const exportToCSV = () => {
    try {
      // CSV-Header
      let csvContent = "Datum,Auftrag Nr.,Objekt oder Strasse,Ort,Std.,Absenzen,Überstd.,Auslagen und Bemerkungen,Auslagen Fr.,Notizen\n";
      
      // CSV-Daten aus Einträgen
      entries.forEach(entry => {
        const formattedDate = format(entry.date, "dd.MM.yyyy");
        const row = [
          formattedDate,
          entry.orderNumber,
          entry.object,
          entry.location,
          entry.hours.toString().replace('.', ','),
          entry.absences.toString().replace('.', ','),
          entry.overtime.toString().replace('.', ','),
          `"${entry.expenses.replace(/"/g, '""')}"`,
          entry.expenseAmount.toString().replace('.', ','),
          `"${entry.notes ? entry.notes.replace(/"/g, '""') : ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      
      // Zusammenfassung hinzufügen
      csvContent += `\nTotal,,,,${totalHours.toString().replace('.', ',')},${totalAbsences.toString().replace('.', ',')},${totalOvertime.toString().replace('.', ',')},,,${totalExpenses.toString().replace('.', ',')}\n`;
      csvContent += `Total Sollstunden,,,,${totalRequiredHours.toString().replace('.', ',')}\n`;
      
      // CSV-Datei erstellen und herunterladen
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Arbeitsrapport_${name.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV-Datei wurde erfolgreich exportiert");
    } catch (error) {
      console.error("Fehler beim CSV-Export:", error);
      toast.error("Fehler beim Exportieren der CSV-Datei");
    }
  };

  // E-Mail-Versand-Funktion
  const sendReportByEmail = async () => {
    try {
      // E-Mail-Dialog öffnen
      const email = prompt("Bitte geben Sie die E-Mail-Adresse ein:");
      if (!email) return;
      
      // Daten für den E-Mail-Versand vorbereiten
      const reportData = {
        name,
        period,
        entries: entries.map(entry => ({
          ...entry,
          date: format(entry.date, "dd.MM.yyyy")
        })),
        totalHours,
        totalAbsences,
        totalOvertime,
        totalExpenses,
        totalRequiredHours
      };
      
      // E-Mail senden
      await emailService.sendReport(email, reportData);
      toast.success("Bericht wurde per E-Mail gesendet");
    } catch (error) {
      console.error("Fehler beim E-Mail-Versand:", error);
      toast.error("Fehler beim Senden der E-Mail");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-md">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Arbeitsrapport</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-6">
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div>
              <Label htmlFor="report-name" className="mb-2 block">
                Name
              </Label>
              <Input
                id="report-name"
                placeholder="Name des Berichts"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="report-period" className="mb-2 block">
                Zeitraum
              </Label>
              <DateRangePicker
                value={period}
                onChange={setPeriod}
                placeholder="Zeitraum auswählen"
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="border text-foreground font-bold whitespace-nowrap">
                      Datum
                    </TableHead>
                    <TableHead className="border text-foreground font-bold whitespace-nowrap">
                      Auftrag Nr.
                    </TableHead>
                    <TableHead className="border text-foreground font-bold w-64 whitespace-nowrap">
                      Objekt oder Strasse
                    </TableHead>
                    <TableHead className="border text-foreground font-bold whitespace-nowrap">
                      Ort
                    </TableHead>
                    <TableHead className="border text-foreground font-bold w-14 text-center whitespace-nowrap">
                      Std.
                    </TableHead>
                    <TableHead className="border text-foreground font-bold w-14 text-center whitespace-nowrap">
                      Absenzen
                    </TableHead>
                    <TableHead className="border text-foreground font-bold w-14 text-center whitespace-nowrap">
                      Überstd.
                    </TableHead>
                    <TableHead className="border text-foreground font-bold whitespace-nowrap">
                      Auslagen und Bemerkungen
                    </TableHead>
                    <TableHead className="border text-foreground font-bold w-16 text-center whitespace-nowrap">
                      Auslagen Fr.
                    </TableHead>
                    <TableHead className="border text-foreground font-bold w-32 whitespace-nowrap">
                      Notizen
                    </TableHead>
                    <TableHead className="border text-foreground font-bold whitespace-nowrap">
                      Aktionen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <EntryRow
                      key={`entry-${index}`}
                      entry={entry}
                      index={index}
                      onEdit={handleEditEntry}
                      onDelete={handleDeleteEntry}
                    />
                  ))}
                  {/* Input row for new entries */}
                  <TableRow>
                    <TableCell className="border">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newEntry.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(newEntry.date, "dd.MM.yyyy")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newEntry.date}
                            onSelect={(date) => handleNewEntryChange("date", date || new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="border">
                      <Input
                        type="text"
                        value={newEntry.orderNumber}
                        onChange={(e) =>
                          handleNewEntryChange("orderNumber", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell className="border">
                      <ObjectAutocomplete
                        value={newEntry.object}
                        onChange={(value) =>
                          handleNewEntryChange("object", value)
                        }
                        placeholder="Inselweg 31"
                      />
                    </TableCell>
                    <TableCell className="border">
                      <LocationAutocomplete
                        value={newEntry.location}
                        onChange={(value) =>
                          handleNewEntryChange("location", value)
                        }
                        placeholder="Hurden"
                      />
                    </TableCell>
                    <TableCell className="border w-14 text-center">
                      <Input
                        type="number"
                        value={newEntry.hours || ""}
                        onChange={(e) =>
                          handleNewEntryChange(
                            "hours",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="5.00"
                      />
                    </TableCell>
                    <TableCell className="border w-14 text-center">
                      <Input
                        type="number"
                        value={newEntry.absences || ""}
                        onChange={(e) =>
                          handleNewEntryChange(
                            "absences",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="border w-14 text-center">
                      <Input
                        type="number"
                        value={newEntry.overtime || ""}
                        onChange={(e) =>
                          handleNewEntryChange(
                            "overtime",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="border">
                      <div className="flex items-center gap-1">
                        <Input
                          type="text"
                          value={newEntry.expenses || ""}
                          className="cursor-pointer"
                          readOnly
                          onClick={() => {
                            setTempExpenses(newEntry.expenses || "");
                            setExpensesDialogOpen(true);
                          }}
                          placeholder="Auslagen und Bemerkungen"
                        />
                        
                        <Dialog open={expensesDialogOpen} onOpenChange={setExpensesDialogOpen}>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Auslagen und Bemerkungen eingeben</DialogTitle>
                            </DialogHeader>
                            <Textarea 
                              value={tempExpenses} 
                              onChange={(e) => setTempExpenses(e.target.value)}
                              className="min-h-[150px]"
                              placeholder="Auslagen und Bemerkungen hier eingeben..."
                            />
                            <DialogFooter>
                              <Button 
                                type="submit" 
                                onClick={() => {
                                  handleNewEntryChange("expenses", tempExpenses);
                                  setExpensesDialogOpen(false);
                                }}
                              >
                                Speichern
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                    <TableCell className="border w-16 text-center">
                      <Input
                        type="number"
                        value={newEntry.expenseAmount || ""}
                        onChange={(e) =>
                          handleNewEntryChange(
                            "expenseAmount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="border">
                      <div className="flex items-center gap-1">
                        <Input
                          type="text"
                          value={newEntry.notes || ""}
                          className="cursor-pointer"
                          readOnly
                          onClick={() => {
                            setTempNotes(newEntry.notes || "");
                            setNotesDialogOpen(true);
                          }}
                          placeholder="Notizen"
                        />
                        
                        <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Notizen eingeben</DialogTitle>
                            </DialogHeader>
                            <Textarea 
                              value={tempNotes} 
                              onChange={(e) => setTempNotes(e.target.value)}
                              className="min-h-[150px]"
                              placeholder="Notizen hier eingeben..."
                            />
                            <DialogFooter>
                              <Button 
                                type="submit" 
                                onClick={handleSaveNotes}
                              >
                                Speichern
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                    <TableCell className="border"></TableCell>
                  </TableRow>
                  {/* Summary rows */}
                  <TableRow>
                    <TableCell colSpan={3} className="border"></TableCell>
                    <TableCell className="border font-bold text-foreground">
                      Total
                    </TableCell>
                    <TableCell className="border font-bold text-foreground w-14 text-center">
                      {totalHours.toFixed(2)}
                    </TableCell>
                    <TableCell className="border font-bold text-foreground w-14 text-center">
                      {totalAbsences > 0 ? totalAbsences.toFixed(2) : ""}
                    </TableCell>
                    <TableCell className="border font-bold text-foreground w-14 text-center">
                      {totalOvertime > 0 ? totalOvertime.toFixed(2) : ""}
                    </TableCell>
                    <TableCell className="border"></TableCell>
                    <TableCell className="border font-bold text-foreground w-16 text-center">
                      Total {totalExpenses.toFixed(2)}
                    </TableCell>
                    <TableCell className="border"></TableCell>
                    <TableCell className="border"></TableCell>
                    <TableCell className="border"></TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={3} className="border"></TableCell>
                    <TableCell className="border font-bold text-foreground">
                      Total Sollstunden
                    </TableCell>
                    <TableCell className="border font-bold text-foreground w-14 text-center">
                      {totalRequiredHours.toFixed(2)}
                    </TableCell>
                    <TableCell colSpan={7} className="border"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <Button onClick={handleAddEntry} className="flex items-center gap-1">
              <FileText className="h-4 w-4 mr-1" />
              Eintrag hinzufügen
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-1">
              <Download className="h-4 w-4 mr-1" />
              Als CSV exportieren
            </Button>
            <Button onClick={sendReportByEmail} variant="outline" className="flex items-center gap-1">
              <Mail className="h-4 w-4 mr-1" />
              Per E-Mail senden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkReport;
