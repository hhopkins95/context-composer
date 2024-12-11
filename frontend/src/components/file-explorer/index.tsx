"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DirectoryExplorer } from "@/components/file-explorer/directory-explorer";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabPanel {
  id: string;
  label: string;
  content: React.ReactNode;
}

export default function FileExplorer() {
  const [activeTab, setActiveTab] = useState("panel1");
  const [panels, setPanels] = useState<TabPanel[]>([
    {
      id: "panel1",
      label: "Directory 1",
      content: <DirectoryExplorer />,
    },
    {
      id: "templates",
      label: "Templates",
      content: (
        <div className="h-full flex flex-col">
          <Input
            type="text"
            placeholder="Search templates..."
            className="mb-2"
          />
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              <div>Template 1</div>
              <div>Template 2</div>

              <div>Template 3</div>
            </div>
          </ScrollArea>
        </div>
      ),
    },
  ]);

  const addDirectoryPanel = () => {
    const newPanelId = `panel${panels.length + 1}`;
    const newPanel: TabPanel = {
      id: newPanelId,
      label: `Directory ${panels.length}`,
      content: <DirectoryExplorer />,
    };
    setPanels([...panels, newPanel]);
    setActiveTab(newPanelId);
  };

  const removePanel = (panelId: string) => {
    if (panels.length <= 1) return; // Prevent removing the last panel
    const newPanels = panels.filter((panel) => panel.id !== panelId);
    setPanels(newPanels);

    // If we're removing the active tab, switch to the first available tab
    if (activeTab === panelId) {
      setActiveTab(newPanels[0].id);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">File Explorer</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={addDirectoryPanel}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Directory
        </Button>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        <TabsList className="w-full justify-start mb-4">
          {panels.map((panel) => (
            <div key={panel.id} className="flex items-center">
              <TabsTrigger value={panel.id}>
                {panel.label}
              </TabsTrigger>
              {panels.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-7 p-0 ml-1",
                    activeTab === panel.id
                      ? "opacity-100"
                      : "opacity-0 hover:opacity-100",
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    removePanel(panel.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </TabsList>
        {panels.map((panel) => (
          <TabsContent
            key={panel.id}
            value={panel.id}
            className="flex-1 mt-0 h-full"
          >
            {panel.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
