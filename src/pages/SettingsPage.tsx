import React from 'react';
import { SMTPConfig } from '../components/SMTPConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BackToDashboardButton } from "@/components/BackToDashboardButton";

export function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <BackToDashboardButton />

      <h1 className="text-2xl font-bold mb-6">Einstellungen</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>E-Mail-Einstellungen</CardTitle>
            <CardDescription>
              Konfigurieren Sie Ihre E-Mail-Einstellungen für den Versand von Arbeitsberichten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SMTPConfig />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}