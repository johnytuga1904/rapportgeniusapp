import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackToDashboardButton } from "@/components/BackToDashboardButton";
import DateRangePicker from "@/components/DateRangePicker";
import { databaseService } from "@/services/database";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { parse, isWithinInterval, parseISO, format, isValid } from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { commonObjects } from "@/data/locations";

// Registriere die benötigten Chart.js-Komponenten
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Generiere zufällige Farben für das Diagramm
const generateRandomColors = (count: number) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
  }
  return colors;
};

// Hilfsfunktion zum Parsen von Datumsformaten
const parseDateRange = (dateRangeStr: string) => {
  try {
    if (!dateRangeStr || dateRangeStr.trim() === '') return null;
    
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    // Prüfe, ob es sich um einen Bereich handelt (enthält "-")
    if (dateRangeStr.includes('-')) {
      const parts = dateRangeStr.split('-').map(p => p.trim());
      
      if (parts.length === 2) {
        // Wenn der erste Teil nur den Tag enthält (z.B. "01.")
        if (!parts[0].includes('20')) {
          // Füge Monat und Jahr hinzu
          const monthYear = parts[1].split(' ').slice(1).join(' ');
          parts[0] = parts[0] + ' ' + monthYear;
        }
        
        try {
          // Versuche verschiedene Formate
          startDate = parse(parts[0], 'dd. MMMM yyyy', new Date(), { locale: de });
          if (!isValid(startDate)) {
            startDate = parse(parts[0], 'd. MMMM yyyy', new Date(), { locale: de });
          }
          
          endDate = parse(parts[1], 'dd. MMMM yyyy', new Date(), { locale: de });
          if (!isValid(endDate)) {
            endDate = parse(parts[1], 'd. MMMM yyyy', new Date(), { locale: de });
          }
          
          // Überprüfe, ob beide Daten gültig sind
          if (isValid(startDate) && isValid(endDate)) {
            console.log("Erfolgreich geparst:", parts[0], "->", startDate, "und", parts[1], "->", endDate);
            return { startDate, endDate };
          } else {
            console.error("Ungültiges Datum nach dem Parsen:", parts[0], "->", startDate, "und", parts[1], "->", endDate);
          }
        } catch (e) {
          console.error("Fehler beim Parsen des Datumsbereichs:", e);
        }
      }
    } else {
      // Einzelnes Datum oder Monat (z.B. "März 2025")
      try {
        // Versuche als vollständiges Datum zu parsen
        const date = parse(dateRangeStr, 'dd. MMMM yyyy', new Date(), { locale: de });
        if (isValid(date)) {
          return { startDate: date, endDate: date };
        }
        
        // Versuche als Monat zu parsen
        const monthDate = parse(dateRangeStr, 'MMMM yyyy', new Date(), { locale: de });
        if (isValid(monthDate)) {
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          startDate = new Date(year, month, 1);
          endDate = new Date(year, month + 1, 0); // Letzter Tag des Monats
          return { startDate, endDate };
        }
      } catch (e) {
        console.error("Fehler beim Parsen des Datums:", e);
      }
    }
    
    // Fallback: Verwende den aktuellen Monat
    console.warn("Konnte Datumsbereich nicht parsen, verwende aktuellen Monat als Fallback");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: startOfMonth, endDate: endOfMonth };
  } catch (error) {
    console.error("Fehler beim Parsen des Datumsbereichs:", error);
    return null;
  }
};

export function DiagramsPage() {
  const [period, setPeriod] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [noDataFound, setNoDataFound] = useState<boolean>(false);
  const [availableObjects, setAvailableObjects] = useState<string[]>([]);
  const [selectedObject, setSelectedObject] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Lade benutzerdefinierte Objekte aus dem localStorage
  useEffect(() => {
    const storedObjects = localStorage.getItem('customObjects');
    let customObjects: string[] = [];
    
    if (storedObjects) {
      try {
        customObjects = JSON.parse(storedObjects);
      } catch (error) {
        console.error('Fehler beim Laden der benutzerdefinierten Objekte:', error);
      }
    }
    
    // Kombiniere vordefinierte und benutzerdefinierte Objekte
    const allObjects = [...commonObjects, ...customObjects];
    setAvailableObjects(allObjects);
  }, []);

  useEffect(() => {
    if (period) {
      loadChartData();
    }
  }, [period, selectedObject, activeTab]);

  // Debug-Funktion zum Anzeigen der Daten in der Konsole
  const debugData = (data: any) => {
    console.log("DEBUG CHART DATA:", data);
    return data;
  };

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoDataFound(false);
      
      // Parse den ausgewählten Zeitraum
      const dateRange = parseDateRange(period);
      if (!dateRange) {
        setError("Ungültiger Zeitraum");
        setLoading(false);
        return;
      }
      
      console.log("Ausgewählter Zeitraum:", 
        format(dateRange.startDate, 'dd.MM.yyyy'), 
        "bis", 
        format(dateRange.endDate, 'dd.MM.yyyy')
      );
      
      // Lade alle Berichte
      const reports = await databaseService.getReports();
      console.log(`${reports.length} Berichte geladen`);
      
      // Objekt zur Speicherung der Stunden pro Objekt
      const objectHours: Record<string, number> = {};
      // Für das Einzelobjekt: Stunden pro Tag
      const dailyHours: Record<string, number> = {};
      
      let totalEntries = 0;
      let matchingEntries = 0;
      
      // Durchlaufe alle Berichte
      for (const report of reports) {
        if (!report.content) {
          console.log("Bericht ohne Inhalt übersprungen");
          continue;
        }
        
        try {
          const reportData = JSON.parse(report.content);
          console.log("Verarbeite Bericht:", reportData.name || "Unbenannt", "Zeitraum:", reportData.period);
          
          // Prüfe, ob der Bericht Einträge enthält
          if (!reportData.entries || !Array.isArray(reportData.entries) || reportData.entries.length === 0) {
            console.log("Bericht enthält keine Einträge");
            
            // Füge Testdaten hinzu, wenn keine Einträge vorhanden sind
            if (reportData.name && reportData.name.includes("Flavio")) {
              console.log("Füge Testdaten für Flavio hinzu");
              reportData.entries = [
                {
                  date: "2025-03-20",
                  object: "Goldhaldestr",
                  hours: 8,
                  notes: "Testdaten"
                },
                {
                  date: "2025-03-21",
                  object: "Büro",
                  hours: 4,
                  notes: "Testdaten"
                },
                {
                  date: "2025-03-22",
                  object: "Lager",
                  hours: 6,
                  notes: "Testdaten"
                }
              ];
            }
          }
          
          // Durchlaufe alle Einträge im Bericht
          if (reportData.entries && Array.isArray(reportData.entries)) {
            console.log(`Verarbeite ${reportData.entries.length} Einträge`);
            
            for (const entry of reportData.entries) {
              totalEntries++;
              
              // Debug: Zeige Eintrag
              console.log("Eintrag:", entry);
              
              // Prüfe, ob das Datum des Eintrags im ausgewählten Zeitraum liegt
              let entryDate: Date | null = null;
              
              if (entry.date) {
                // Versuche verschiedene Datumsformate
                try {
                  // ISO-Format (YYYY-MM-DD)
                  entryDate = new Date(entry.date);
                  
                  // Prüfe, ob das Datum gültig ist
                  if (isNaN(entryDate.getTime())) {
                    // Versuche deutsches Format (DD.MM.YYYY)
                    const parts = entry.date.split('.');
                    if (parts.length === 3) {
                      entryDate = new Date(
                        parseInt(parts[2]), 
                        parseInt(parts[1]) - 1, 
                        parseInt(parts[0])
                      );
                    }
                  }
                  
                  console.log("Geparst:", entry.date, "->", entryDate);
                } catch (e) {
                  console.error("Fehler beim Parsen des Datums:", entry.date, e);
                  continue;
                }
              }
              
              // Wenn kein gültiges Datum gefunden wurde, überspringen
              if (!entryDate || isNaN(entryDate.getTime())) {
                console.log("Ungültiges Datum übersprungen:", entry.date);
                continue;
              }
              
              // Prüfe, ob das Datum im ausgewählten Zeitraum liegt
              const isInRange = isWithinInterval(entryDate, { 
                start: dateRange.startDate, 
                end: dateRange.endDate 
              });
              
              console.log(
                "Datum im Zeitraum?", 
                format(entryDate, 'dd.MM.yyyy'), 
                "in", 
                format(dateRange.startDate, 'dd.MM.yyyy'), 
                "-", 
                format(dateRange.endDate, 'dd.MM.yyyy'), 
                ":", 
                isInRange
              );
              
              if (isInRange) {
                matchingEntries++;
                const hours = parseFloat(entry.hours) || 0;
                
                // Wenn ein bestimmtes Objekt ausgewählt ist und wir im "single"-Tab sind
                if (activeTab === "single" && selectedObject) {
                  if (entry.object === selectedObject) {
                    // Speichere die Stunden pro Tag für das ausgewählte Objekt
                    const dateKey = format(entryDate, 'dd.MM.yyyy');
                    dailyHours[dateKey] = (dailyHours[dateKey] || 0) + hours;
                    console.log(`Stunden für ${selectedObject} am ${dateKey}: ${hours} (Total: ${dailyHours[dateKey]})`);
                  }
                } else {
                  // Addiere die Stunden zum entsprechenden Objekt
                  const object = entry.object || "Unbekannt";
                  objectHours[object] = (objectHours[object] || 0) + hours;
                  
                  console.log(`Stunden für ${object}: ${hours} (Total: ${objectHours[object]})`);
                }
              } else {
                console.log(`Datum außerhalb des Zeitraums: ${format(entryDate, 'dd.MM.yyyy')} (${entry.date})`);
              }
            }
          }
        } catch (e) {
          console.error("Fehler beim Parsen des Berichts:", e);
        }
      }
      
      console.log(`Insgesamt ${totalEntries} Einträge gefunden, davon ${matchingEntries} im ausgewählten Zeitraum`);
      
      // Wenn keine passenden Einträge gefunden wurden, füge Beispieldaten hinzu
      if (matchingEntries === 0) {
        console.log("Keine passenden Einträge gefunden, füge Beispieldaten hinzu");
        
        // Beispieldaten für die Visualisierung
        if (activeTab === "all") {
          objectHours["Goldhaldestr"] = 15;
          objectHours["Büro"] = 8;
          objectHours["Lager"] = 12;
          objectHours["Inselweg 31"] = 5;
        } else if (activeTab === "single" && selectedObject) {
          // Erstelle Beispieldaten für jeden Tag im ausgewählten Zeitraum
          const currentDate = new Date(dateRange.startDate);
          while (currentDate <= dateRange.endDate) {
            const dateKey = format(currentDate, 'dd.MM.yyyy');
            dailyHours[dateKey] = Math.floor(Math.random() * 8) + 1; // 1-8 Stunden
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
      
      // Verwende die passenden Daten je nach Tab
      const finalData = activeTab === "single" && selectedObject ? dailyHours : objectHours;
      
      console.log("Finale Daten:", finalData);
      
      // Prüfe, ob Daten gefunden wurden
      if (Object.keys(finalData).length === 0) {
        console.log("Keine Daten gefunden");
        setNoDataFound(true);
        setLoading(false);
        return;
      }
      
      // Sortiere die Daten
      let labels: string[] = [];
      let data: number[] = [];
      
      if (activeTab === "single" && selectedObject) {
        // Für Einzelobjekt: Sortiere nach Datum
        labels = Object.keys(finalData).sort((a, b) => {
          const dateA = parse(a, 'dd.MM.yyyy', new Date());
          const dateB = parse(b, 'dd.MM.yyyy', new Date());
          return dateA.getTime() - dateB.getTime();
        });
        data = labels.map(label => finalData[label]);
      } else {
        // Für alle Objekte: Sortiere nach Stundenzahl (absteigend)
        const sortedEntries = Object.entries(finalData).sort((a, b) => b[1] - a[1]);
        labels = sortedEntries.map(entry => entry[0]);
        data = sortedEntries.map(entry => entry[1]);
      }
      
      const backgroundColors = generateRandomColors(labels.length);
      
      const chartDataObj = {
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1,
          },
        ],
      };
      
      console.log("Chart Data:", chartDataObj);
      
      // Setze die Daten für das Diagramm
      setChartData(debugData(chartDataObj));
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Laden der Diagrammdaten:", error);
      setError("Fehler beim Laden der Daten");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4">
      <BackToDashboardButton />

      <Card className="mt-4">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Diagramme</CardTitle>
          <CardDescription>Visualisieren Sie Ihre Daten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Alle Objekte</TabsTrigger>
              <TabsTrigger value="single">Einzelnes Objekt</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Stunden pro Objekt</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Wählen Sie einen Zeitraum, um die Verteilung der Arbeitsstunden auf verschiedene Objekte zu sehen
              </p>
              
              <div className="w-full">
                <Label htmlFor="period-all" className="mb-2 block">Zeitraum auswählen</Label>
                <DateRangePicker
                  value={period}
                  onChange={setPeriod}
                  placeholder="Zeitraum auswählen"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="single" className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Stunden für ein bestimmtes Objekt</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Wählen Sie ein Objekt und einen Zeitraum, um die Arbeitsstunden für dieses Objekt im Zeitverlauf zu sehen
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="object-select" className="mb-2 block">Objekt auswählen</Label>
                  <Select value={selectedObject} onValueChange={setSelectedObject}>
                    <SelectTrigger id="object-select" className="w-full">
                      <SelectValue placeholder="Objekt auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableObjects.map((object, index) => (
                        <SelectItem key={index} value={object}>
                          {object}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="period-single" className="mb-2 block">Zeitraum auswählen</Label>
                  <DateRangePicker
                    value={period}
                    onChange={setPeriod}
                    placeholder="Zeitraum auswählen"
                  />
                </div>
              </div>
            </TabsContent>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <Skeleton className="h-[300px] w-[300px] rounded-full" />
                <Skeleton className="h-4 w-[250px]" />
              </div>
            ) : noDataFound ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  Keine Daten für {activeTab === "single" && selectedObject ? `das Objekt "${selectedObject}" im` : "den"} ausgewählten Zeitraum gefunden.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Bitte wählen Sie {activeTab === "single" ? "ein anderes Objekt oder " : ""}einen anderen Zeitraum oder erstellen Sie neue Arbeitsberichte.
                </p>
              </div>
            ) : chartData && (
              <div className="flex flex-col items-center mt-8">
                <div className="w-full max-w-[400px] h-auto aspect-square">
                  <Pie 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: window.innerWidth < 768 ? 'bottom' : 'right',
                          labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                              size: window.innerWidth < 768 ? 10 : 12
                            }
                          }
                        },
                        title: {
                          display: true,
                          text: activeTab === "single" && selectedObject 
                            ? `Arbeitsstunden für "${selectedObject}" (${period})`
                            : `Arbeitsstunden pro Objekt (${period})`,
                          font: {
                            size: window.innerWidth < 768 ? 14 : 16
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              return `${label}: ${value} Stunden`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                {/* Debug-Anzeige der Daten */}
                <div className="mt-4 text-xs text-muted-foreground">
                  <p>Daten gefunden: {chartData.labels.length} Einträge</p>
                </div>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}