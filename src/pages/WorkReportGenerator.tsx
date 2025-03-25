import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportHeader from "@/components/ReportHeader";
import ReportForm from "@/components/ReportForm";
import ReportTable from "@/components/ReportTable";
import ExportOptions from "@/components/ExportOptions";
import { v4 as uuidv4 } from "uuid";

interface WorkEntry {
  id: string;
  date: string;
  name: string;
  orderNumber: string;
  location: string;
  objects: string;
  regularHours: number;
  overtimeHours: number;
  absenceHours: number;
}

// Define the form data interface here instead of importing it
interface ReportFormData {
  date: Date;
  name: string;
  orderNumber: string;
  location: string;
  objects: string;
  regularHours: number;
  overtimeHours: number;
  absenceHours: number;
}

const WorkReportGenerator = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [entries, setEntries] = useState<WorkEntry[]>([
    {
      id: "1",
      date: "2023-06-15",
      name: "Max Mustermann",
      orderNumber: "ZH-2023-001",
      location: "Zürich",
      objects: "Hauptgebäude, Garage",
      regularHours: 8,
      overtimeHours: 1.5,
      absenceHours: 0,
    },
    {
      id: "2",
      date: "2023-06-16",
      name: "Max Mustermann",
      orderNumber: "ZH-2023-001",
      location: "Winterthur",
      objects: "Lagerhaus",
      regularHours: 7.5,
      overtimeHours: 0,
      absenceHours: 0.5,
    },
  ]);

  const handleFormSubmit = (formData: ReportFormData) => {
    const newEntry: WorkEntry = {
      id: uuidv4(),
      date: formData.date.toISOString().split("T")[0],
      name: formData.name,
      orderNumber: formData.orderNumber,
      location: formData.location,
      objects: formData.objects,
      regularHours: formData.regularHours,
      overtimeHours: formData.overtimeHours,
      absenceHours: formData.absenceHours,
    };

    setEntries([...entries, newEntry]);
    setActiveTab("table"); // Switch to table view after adding an entry
  };

  const handleEditEntry = (updatedEntry: WorkEntry) => {
    setEntries(
      entries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry,
      ),
    );
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const handleExport = (type: "email" | "save" | "print") => {
    // In a real implementation, this would handle the export functionality
    console.log(`Exporting report via ${type}`);

    switch (type) {
      case "email":
        alert("Preparing to send report via email...");
        break;
      case "save":
        alert("Saving report locally...");
        break;
      case "print":
        alert("Preparing report for printing...");
        break;
      default:
        break;
    }
  };

  const handleExportOptions = (action: string) => {
    console.log(`Export action: ${action}`);
    alert(`Export action: ${action}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ReportHeader onExport={handleExport} />

      <main className="container mx-auto py-6 px-4 space-y-6">
        <Tabs
          defaultValue="form"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="form">Neuer Eintrag</TabsTrigger>
              <TabsTrigger value="table">Arbeitsrapport</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="form" className="space-y-6">
            <ReportForm onSubmit={handleFormSubmit} />
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <ReportTable
              entries={entries}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />

            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="pt-6">
                <ExportOptions
                  onEmailReport={() => handleExportOptions("email")}
                  onSaveReport={() => handleExportOptions("save")}
                  onPrintReport={() => handleExportOptions("print")}
                  onDownloadReport={() => handleExportOptions("download")}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WorkReportGenerator;
