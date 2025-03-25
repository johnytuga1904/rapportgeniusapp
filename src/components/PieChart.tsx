import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, subMonths, subYears, isAfter } from "date-fns";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ChartData {
  object: string;
  hours: number;
  color: string;
}

interface PieChartProps {
  savedReports: Array<{
    id: string;
    name: string;
    period: string;
    date: string;
    entries: Array<{
      date: string;
      object: string;
      hours: number;
      [key: string]: any;
    }>;
  }>;
}

const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8AC926",
  "#1982C4",
  "#6A4C93",
  "#F94144",
];

export default function PieChart({ savedReports }: PieChartProps) {
  const [timeSpan, setTimeSpan] = useState<"week" | "month" | "year">("month");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [allObjects, setAllObjects] = useState<string[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  // Debug current state
  useEffect(() => {
    console.log("Current state:", { allObjects, selectedObjects });
  }, [allObjects, selectedObjects]);

  useEffect(() => {
    console.log("Processing saved reports:", savedReports?.length || 0);
    if (!savedReports || savedReports.length === 0) {
      setChartData([]);
      setTotalHours(0);
      setAllObjects([]);
      return;
    }

    // Calculate the date threshold based on the selected time span
    const now = new Date();
    let dateThreshold;

    switch (timeSpan) {
      case "week":
        dateThreshold = subDays(now, 7);
        break;
      case "month":
        dateThreshold = subMonths(now, 1);
        break;
      case "year":
        dateThreshold = subYears(now, 1);
        break;
      default:
        dateThreshold = subMonths(now, 1);
    }

    // Aggregate hours by object within the selected time span
    const objectHours: Record<string, number> = {};
    let total = 0;

    savedReports.forEach((report) => {
      // Try to parse the report date
      let reportDate;
      try {
        // Assuming date format is dd.MM.yyyy HH:mm or similar
        const [datePart] = report.date.split(" ");
        const [day, month, year] = datePart.split(".").map(Number);
        reportDate = new Date(year, month - 1, day);
      } catch (error) {
        // If date parsing fails, skip time filtering for this report
        reportDate = null;
      }

      // Skip reports outside the time span if we could parse the date
      if (reportDate && !isAfter(reportDate, dateThreshold)) {
        return;
      }

      report.entries.forEach((entry) => {
        if (entry.object && entry.hours) {
          if (!objectHours[entry.object]) {
            objectHours[entry.object] = 0;
          }
          objectHours[entry.object] += entry.hours;
          total += entry.hours;
        }
      });
    });

    // Get all unique objects
    const objects = Object.keys(objectHours);

    // Log objects for debugging
    console.log("Available objects:", objects);

    // Force update the list of all objects
    setAllObjects([...objects]);

    // If no objects are selected yet or if the objects have changed, select all of them
    if (
      selectedObjects.length === 0 ||
      !selectedObjects.every((obj) => objects.includes(obj)) ||
      objects.length !== selectedObjects.length
    ) {
      setSelectedObjects([...objects]);
    }

    // Filter data based on selected objects
    const filteredObjectHours = Object.entries(objectHours)
      .filter(
        ([object]) =>
          selectedObjects.length === 0 || selectedObjects.includes(object),
      )
      .reduce(
        (acc, [object, hours]) => {
          acc[object] = hours;
          return acc;
        },
        {} as Record<string, number>,
      );

    // Recalculate total for filtered objects
    const filteredTotal = Object.values(filteredObjectHours).reduce(
      (sum, hours) => sum + hours,
      0,
    );

    // Convert to chart data format
    const data = Object.entries(filteredObjectHours)
      .map(([object, hours], index) => ({
        object,
        hours,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.hours - a.hours); // Sort by hours descending

    setChartData(data);
    setTotalHours(filteredTotal);
  }, [savedReports, timeSpan, selectedObjects]);

  // Calculate the SVG parameters for the pie chart
  const radius = 100;
  const centerX = 150;
  const centerY = 150;
  const chartSize = 300;

  // Calculate the pie slices
  let currentAngle = 0;
  const slices = chartData.map((item, index) => {
    const percentage = totalHours > 0 ? item.hours / totalHours : 0;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    const endAngle = currentAngle;

    // Calculate the SVG arc path
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    return {
      path: pathData,
      color: item.color,
      item,
    };
  });

  return (
    <Card className="w-full bg-background">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-bold text-foreground text-center">
          Arbeitsstunden nach Objekt
        </CardTitle>
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <Tabs
            defaultValue="month"
            value={timeSpan}
            onValueChange={(value) =>
              setTimeSpan(value as "week" | "month" | "year")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Woche</TabsTrigger>
              <TabsTrigger value="month">Monat</TabsTrigger>
              <TabsTrigger value="year">Jahr</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedObjects.length > 0
                    ? `${selectedObjects.length} Objekte ausgewählt`
                    : "Objekte auswählen"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full p-0 bg-background border border-border z-50"
                align="start"
                side="bottom"
              >
                <Command className="bg-background rounded-md">
                  <CommandInput
                    placeholder="Objekt suchen..."
                    className="border-none"
                  />
                  <CommandEmpty className="text-foreground">
                    Keine Objekte gefunden.
                  </CommandEmpty>
                  <CommandGroup className="text-foreground bg-background">
                    {allObjects.length === 0 && (
                      <div className="px-2 py-3 text-sm text-center text-muted-foreground">
                        Keine Objekte verfügbar. Bitte erstellen Sie zuerst
                        Arbeitsrapporte.
                      </div>
                    )}
                    {allObjects.length > 0 && (
                      <CommandItem
                        className="hover:bg-accent hover:text-accent-foreground"
                        onSelect={() => {
                          setSelectedObjects(
                            selectedObjects.length === allObjects.length
                              ? []
                              : [...allObjects],
                          );
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedObjects.length === allObjects.length
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span>Alle auswählen</span>
                      </CommandItem>
                    )}
                    {allObjects.map((object) => (
                      <CommandItem
                        key={object}
                        className="hover:bg-accent hover:text-accent-foreground"
                        onSelect={() => {
                          setSelectedObjects(
                            selectedObjects.includes(object)
                              ? selectedObjects.filter(
                                  (item) => item !== object,
                                )
                              : [...selectedObjects, object],
                          );
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedObjects.includes(object)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {object}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <div className="p-1 border-t border-border">
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-xs text-muted-foreground"
                      onClick={() => setOpen(false)}
                    >
                      Schließen
                    </Button>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8">
          <div className="relative w-[250px] h-[250px] sm:w-[300px] sm:h-[300px]">
            {chartData.length > 0 ? (
              <svg
                width={chartSize}
                height={chartSize}
                viewBox={`0 0 ${chartSize} ${chartSize}`}
              >
                {slices.map((slice, index) => (
                  <path
                    key={`slice-${index}`}
                    d={slice.path}
                    fill={slice.color}
                    stroke="#fff"
                    strokeWidth="1"
                  />
                ))}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Keine Daten verfügbar
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {chartData.map((item, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">
                  {item.object}: {item.hours.toFixed(2)} Std. (
                  {totalHours > 0
                    ? ((item.hours / totalHours) * 100).toFixed(1)
                    : 0}
                  %)
                </span>
              </div>
            ))}
            {chartData.length > 0 && (
              <div className="mt-4 pt-2 border-t border-border">
                <span className="font-bold">
                  Total: {totalHours.toFixed(2)} Std.
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
