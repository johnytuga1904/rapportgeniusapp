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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LocationAutocomplete from "./LocationAutocomplete";
import ObjectAutocomplete from "./ObjectAutocomplete";
import DateRangePicker from "./DateRangePicker";
import FileUpload from "./FileUpload";
import { Edit, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
  files?: File[];
  notes?: string;
}

export interface WorkReportProps {
  report: any;
  onDataChange?: (data: any) => void;
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
        <TableCell className="border text-foreground">{entry.object}</TableCell>
        <TableCell className="border text-foreground">
          {entry.location}
        </TableCell>
        <TableCell className="border text-foreground">
          {entry.hours.toFixed(2)}
        </TableCell>
        <TableCell className="border text-foreground">
          {entry.absences > 0 ? entry.absences.toFixed(2) : ""}
        </TableCell>
        <TableCell className="border text-foreground">
          {entry.overtime > 0 ? entry.overtime.toFixed(2) : ""}
        </TableCell>
        <TableCell className="border text-foreground">
          {entry.expenses}
        </TableCell>
        <TableCell className="border text-foreground">
          {entry.expenseAmount > 0 ? entry.expenseAmount.toFixed(2) : ""}
        </TableCell>
        <TableCell className="border text-foreground">
          {entry.files && entry.files.length > 0 && (
            <span className="text-xs">{entry.files.length} Datei(en)</span>
          )}
        </TableCell>
        <TableCell className="border text-foreground">{entry.notes}</TableCell>
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
  files: [],
  notes: "",
};

const WorkReport: React.FC<WorkReportProps> = ({ report, onDataChange }) => {
  const [name, setName] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [newEntry, setNewEntry] = useState<WorkEntry>({ ...emptyEntry });

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

  const handleFileUpload = useCallback((file: File) => {
    setNewEntry((prev) => ({
      ...prev,
      files: [...(prev.files || []), file],
    }));
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

  return (
    <div className="container mx-auto p-2 sm:p-4 bg-background">
      <Card className="w-full">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
            MONTAGE RAPPORT
          </CardTitle>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
            <div className="flex items-center">
              <Label htmlFor="period" className="mr-2">
                Zeitraum:
              </Label>
              <div className="w-64">
                <DateRangePicker
                  value={period}
                  onChange={setPeriod}
                  placeholder="Zeitraum auswählen"
                />
              </div>
            </div>
            <div className="flex items-center">
              <Label htmlFor="name" className="mr-2">
                Name:
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Flavio Santos de Almeida"
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border text-foreground font-bold">
                    Datum
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Auftrag Nr.
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Objekt oder Strasse
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Ort
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Std.
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Absenzen
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Überstd.
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Auslagen und Bemerkungen
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Auslagen Fr.
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Dateien
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
                    Notizen
                  </TableHead>
                  <TableHead className="border text-foreground font-bold">
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
                  <TableCell className="border">
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
                  <TableCell className="border">
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
                  <TableCell className="border">
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
                    <Input
                      type="text"
                      value={newEntry.expenses}
                      onChange={(e) =>
                        handleNewEntryChange("expenses", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="border">
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
                  <TableCell className="border"></TableCell>
                  <TableCell className="border">
                    <Input
                      type="text"
                      value={newEntry.notes || ""}
                      onChange={(e) =>
                        handleNewEntryChange("notes", e.target.value)
                      }
                      placeholder="Notizen"
                    />
                  </TableCell>
                  <TableCell className="border"></TableCell>
                </TableRow>
                {/* Summary rows */}
                <TableRow>
                  <TableCell colSpan={3} className="border"></TableCell>
                  <TableCell className="border font-bold text-foreground">
                    Total
                  </TableCell>
                  <TableCell className="border font-bold text-foreground">
                    {totalHours.toFixed(2)}
                  </TableCell>
                  <TableCell className="border font-bold text-foreground">
                    {totalAbsences > 0 ? totalAbsences.toFixed(2) : ""}
                  </TableCell>
                  <TableCell className="border font-bold text-foreground">
                    {totalOvertime > 0 ? totalOvertime.toFixed(2) : ""}
                  </TableCell>
                  <TableCell className="border"></TableCell>
                  <TableCell className="border font-bold text-foreground">
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
                  <TableCell className="border font-bold text-foreground">
                    {totalRequiredHours.toFixed(2)}
                  </TableCell>
                  <TableCell colSpan={7} className="border"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="p-4 space-y-4">
            <FileUpload onFileUpload={handleFileUpload} />
            <div className="flex justify-end">
              <Button onClick={handleAddEntry}>Eintrag hinzufügen</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkReport;
