import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DateRangePicker({
  value,
  onChange,
  placeholder = "Zeitraum auswählen",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  
  // Predefined date ranges for the 1st and 2nd half of the month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const firstHalfStart = new Date(currentYear, currentMonth, 1);
  const firstHalfEnd = new Date(currentYear, currentMonth, 15);
  const secondHalfStart = new Date(currentYear, currentMonth, 16);
  const secondHalfEnd = new Date(currentYear, currentMonth + 1, 0); // Last day of current month

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = format(start, "dd.");
    const endStr = format(end, "dd. MMMM yyyy", { locale: de });
    return `${startStr} - ${endStr}`;
  };

  const handleFirstHalf = () => {
    const formattedRange = formatDateRange(firstHalfStart, firstHalfEnd);
    onChange(formattedRange);
    setOpen(false);
    // Store the selected period in localStorage
    localStorage.setItem("selectedPeriod", "first");
    localStorage.setItem("periodStart", firstHalfStart.toISOString());
    localStorage.setItem("periodEnd", firstHalfEnd.toISOString());
  };

  const handleSecondHalf = () => {
    const formattedRange = formatDateRange(secondHalfStart, secondHalfEnd);
    onChange(formattedRange);
    setOpen(false);
    // Store the selected period in localStorage
    localStorage.setItem("selectedPeriod", "second");
    localStorage.setItem("periodStart", secondHalfStart.toISOString());
    localStorage.setItem("periodEnd", secondHalfEnd.toISOString());
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "dd. MMMM yyyy", { locale: de }));
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 sm:max-w-[425px]">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Zeitraum auswählen</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-2">
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleFirstHalf}
            >
              Rapport 1: 01. - 15. {format(firstHalfStart, "MMMM yyyy", { locale: de })}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSecondHalf}
            >
              Rapport 2: 16. - {format(secondHalfEnd, "dd. MMMM yyyy", { locale: de })}
            </Button>
          </div>
          <div className="mt-4">
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleSelectDate}
              initialFocus
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
