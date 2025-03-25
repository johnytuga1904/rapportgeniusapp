import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackToDashboardButton } from "@/components/BackToDashboardButton";

export function SettingsPage() {
  return (
    <div className="container mx-auto p-4">
      <BackToDashboardButton />

      <Card>
        <CardHeader>
          <CardTitle>Einstellungen</CardTitle>
          <CardDescription>Verwalten Sie Ihre Anwendungseinstellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Placeholder for future settings */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Anwendungseinstellungen</h3>
              <p className="text-sm text-muted-foreground">
                Hier können zukünftige Einstellungen hinzugefügt werden
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}