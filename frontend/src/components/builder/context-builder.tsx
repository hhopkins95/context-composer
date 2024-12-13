import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TreeView from "./tree-view";
import NodeEditor from "./node-editor";
import ContentPreview from "./content-preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PromptBuilderProvider,
  usePromptBuilderContext,
} from "@/contexts/builder-context/node-context";

function ContextBuilderContent() {
  const { addContainer, addTextNode, jsonString } = usePromptBuilderContext();
  const [activeTab, setActiveTab] = useState("work");

  return (
    <div className="h-full">
      <div className="h-full p-4 bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="w-full justify-start border-b">
            <TabsTrigger value="work">Work</TabsTrigger>
            <TabsTrigger value="rendered">Rendered Output</TabsTrigger>
            <TabsTrigger value="json">JSON Output</TabsTrigger>
          </TabsList>

          <TabsContent value="work" className="h-[calc(100%-40px)]">
            <DndProvider backend={HTML5Backend}>
              <div className="flex flex-col h-full">
                <div className="flex gap-2 mb-4">
                  <Button onClick={() => addContainer({ position: "inside" })}>
                    Add Container Node
                  </Button>
                  <Button onClick={() => addTextNode({ position: "inside" })}>
                    Add Text Node
                  </Button>
                </div>
                <div className="flex gap-4 h-full">
                  <div className="w-1/2 border rounded-lg shadow-sm bg-card flex flex-col">
                    <div className="p-4 border-b bg-muted/50">
                      <h2 className="font-semibold">Node Tree</h2>
                    </div>
                    <div className="p-4 flex-1 overflow-auto">
                      <TreeView />
                    </div>
                  </div>
                  <div className="w-1/2 border rounded-lg shadow-sm bg-card flex flex-col">
                    <div className="p-4 border-b bg-muted/50">
                      <h2 className="font-semibold">Node Properties</h2>
                    </div>
                    <div className="p-4 flex-1 overflow-auto">
                      <NodeEditor />
                    </div>
                  </div>
                </div>
              </div>
            </DndProvider>
          </TabsContent>

          <TabsContent value="rendered" className="h-[calc(100%-40px)]">
            <div className="h-full border rounded-lg shadow-sm bg-card flex flex-col">
              <div className="p-4 border-b bg-muted/50">
                <h2 className="font-semibold">Rendered Output</h2>
              </div>
              <div className="p-4 flex-1 overflow-auto">
                <ContentPreview />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="json" className="h-[calc(100%-40px)]">
            <div className="h-full border rounded-lg shadow-sm bg-card flex flex-col">
              <div className="p-4 border-b bg-muted/50">
                <h2 className="font-semibold">JSON Output</h2>
              </div>
              <div className="p-4 flex-1 overflow-auto">
                <ScrollArea className="h-full">
                  <pre className="whitespace-pre-wrap">{jsonString}</pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ContextBuilder() {
  return (
    <PromptBuilderProvider>
      <ContextBuilderContent />
    </PromptBuilderProvider>
  );
}
