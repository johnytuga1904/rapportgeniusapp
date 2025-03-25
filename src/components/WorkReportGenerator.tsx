import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface WorkEntry {
  id: string;
  date: Date;
  orderNumber: string;
  location: string;
  objects: string;
  regularHours: number;
  overtimeHours: number;
  absenceHours: number;
  notes: string;
}

export default function WorkReportGenerator() {
  const [entries, setEntries] = useState<WorkEntry[]>([
    {
      id: "1",
      date: new Date(),
      orderNumber: "",
      location: "",
      objects: "",
      regularHours: 0,
      overtimeHours: 0,
      absenceHours: 0,
      notes: "",
    },
  ]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex">
                    <Input
                      value={format(entries[0].date, "dd.MM.yyyy")}
                      readOnly
                      className="pr-10 cursor-pointer"
                      placeholder="Datum auswählen"
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
                    selected={entries[0].date}
                    onSelect={(date) => {
                      if (date) {
                        const newEntries = [...entries];
                        newEntries[0] = { ...newEntries[0], date };
                        setEntries(newEntries);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Input
              placeholder="Auftrag Nr."
              value={entries[0].orderNumber}
              onChange={(e) => {
                const newEntries = [...entries];
                newEntries[0] = { ...newEntries[0], orderNumber: e.target.value };
                setEntries(newEntries);
              }}
            />
          </div>
          {/* Rest of your form fields */}
        </div>
      </CardContent>
    </Card>
  );
} 