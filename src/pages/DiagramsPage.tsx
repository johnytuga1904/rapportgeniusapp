import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackToDashboardButton } from "@/components/BackToDashboardButton";

export function DiagramsPage() {
  return (
    <div className="container mx-auto p-4">
      <BackToDashboardButton />

      <Card>
        <CardHeader>
          <CardTitle>Diagramme</CardTitle>
          <CardDescription>Visualisieren Sie Ihre Daten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Datenvisualisierung</h3>
              <p className="text-sm text-muted-foreground">
                Erstellen und verwalten Sie Ihre Diagramme
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm">Hier können Sie Ihre Diagramme verwalten.</p>
              <p className="text-sm text-muted-foreground">
                Die Diagramm-Funktionalität wird in einer zukünftigen Version verfügbar sein.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 