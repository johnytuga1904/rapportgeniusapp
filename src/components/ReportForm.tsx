import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, ClipboardList, Save, Mic } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import LocationAutocomplete from "./LocationAutocomplete";
import ObjectAutocomplete from "./ObjectAutocomplete";
import HoursCalculator from "./HoursCalculator";
import VoiceInput from "./VoiceInput";

export interface ReportFormProps {
  onSubmit?: (formData: ReportFormData) => void;
  initialData?: Partial<ReportFormData>;
  onReportGenerated: (report: any) => void;
}

export interface ReportFormData {
  name: string;
  date: Date;
  orderNumber: string;
  location: string;
  objects: string;
  notes: string;
  regularHours: number;
  overtimeHours: number;
  absenceHours: number;
}

const defaultFormData: ReportFormData = {
  name: "",
  date: new Date(),
  orderNumber: "",
  location: "",
  objects: "",
  notes: "",
  regularHours: 0,
  overtimeHours: 0,
  absenceHours: 0,
};

const ReportForm: React.FC<ReportFormProps> = ({
  onSubmit,
  initialData = {},
  onReportGenerated,
}) => {
  const [formData, setFormData] = useState<ReportFormData>({
    ...defaultFormData,
    ...initialData,
  });

  const [voiceField, setVoiceField] = useState<keyof ReportFormData | null>(null);

  const handleInputChange = (field: keyof ReportFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVoiceTranscript = (text: string) => {
    if (voiceField && typeof text === "string") {
      handleInputChange(voiceField, text);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const handleHoursCalculation = (
    regularHours: number,
    overtimeHours: number,
    absenceHours: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      regularHours,
      overtimeHours,
      absenceHours,
    }));
  };

  const activateVoiceFor = (field: keyof ReportFormData) => {
    setVoiceField(field);
  };

  return (
    <Card className="w-full bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
          Arbeitsrapport Eingabe
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Vollständiger Name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => activateVoiceFor("name")}
                  className={cn(voiceField === "name" ? "ring-2 ring-primary" : "")}
                >
                  Sprache
                </Button>
              </div>
            </div>

            {/* Date Field */}
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex">
                        <Input
                          id="date"
                          value={format(formData.date, "dd.MM.yyyy")}
                          readOnly
                          className="flex-1 cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="absolute right-0 px-3"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => handleInputChange("date", date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Order Number Field */}
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Auftragsnummer</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={formData.orderNumber}
                  onChange={(e) => handleInputChange("orderNumber", e.target.value)}
                  placeholder="Auftrag Nr."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => activateVoiceFor("orderNumber")}
                  className="h-8 w-8"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Location Field with Autocomplete */}
            <div className="space-y-2">
              <Label htmlFor="location">Ort</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <LocationAutocomplete
                    value={formData.location}
                    onChange={(value) => handleInputChange("location", value)}
                    placeholder="Ort eingeben"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => activateVoiceFor("location")}
                  className={cn(voiceField === "location" ? "ring-2 ring-primary" : "")}
                >
                  Sprache
                </Button>
              </div>
            </div>

            {/* Objects Field with Autocomplete */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="objects">Objekte</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <ObjectAutocomplete
                    value={formData.objects}
                    onChange={(value) => handleInputChange("objects", value)}
                    placeholder="Objekte eingeben"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => activateVoiceFor("objects")}
                  className={cn(voiceField === "objects" ? "ring-2 ring-primary" : "")}
                >
                  Sprache
                </Button>
              </div>
            </div>

            {/* Notes Field */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notizen</Label>
              <div className="flex gap-2">
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Zusätzliche Informationen"
                  className="flex-1 min-h-[100px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => activateVoiceFor("notes")}
                  className={cn(voiceField === "notes" ? "ring-2 ring-primary" : "")}
                >
                  Sprache
                </Button>
              </div>
            </div>
          </div>

          {/* Voice Input Component */}
          <div className="flex justify-center my-4 sm:my-6">
            <VoiceInput onTranscript={handleVoiceTranscript} />
          </div>

          {/* Hours Calculator Component */}
          <div className="mt-8">
            <HoursCalculator onCalculate={handleHoursCalculation} />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Eintrag speichern
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportForm;
