import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [date, setDate] = useState<Date | undefined>(new Date());
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
    const endStr = format(end, "dd. MMMM yyyy");
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] sm:w-auto p-0" align="start">
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleFirstHalf}
          >
            Rapport 1: 01. - 15. {format(firstHalfStart, "MMMM yyyy")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSecondHalf}
          >
            Rapport 2: 16. - {format(secondHalfEnd, "dd. MMMM yyyy")}
          </Button>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            setDate(newDate);
            if (newDate) {
              onChange(format(newDate, "dd. MMMM yyyy"));
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
