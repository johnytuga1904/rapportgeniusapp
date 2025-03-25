import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { BackToDashboardButton } from "@/components/BackToDashboardButton";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="container mx-auto p-4">
      <BackToDashboardButton />

      <Card>
        <CardHeader>
          <CardTitle>Einstellungen</CardTitle>
          <CardDescription>Verwalten Sie Ihre Anwendungseinstellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Erscheinungsbild */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Erscheinungsbild</h3>
              <p className="text-sm text-muted-foreground">
                Wählen Sie zwischen hellem und dunklem Modus
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="w-full"
            >
              {theme === "light" ? (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  Dunklen Modus aktivieren
                </>
              ) : (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  Hellen Modus aktivieren
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 