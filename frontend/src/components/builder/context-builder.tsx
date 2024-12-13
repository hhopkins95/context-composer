import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TreeView from "./tree-view";
import NodeEditor from "./node-editor";
import ContentPreview from "./content-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { usePromptBuilderContext } from "@/contexts/builder-context/node-context";

export default function ContextBuilder() {
  const {
    nodes,
    selectedNode,
    collapsedNodes,
    addNode,
    updateNode,
    deleteNode,
    moveNode,
    setSelectedNode,
    toggleNodeCollapse,
  } = usePromptBuilderContext();

  const [activeTab, setActiveTab] = useState("editor");

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="h-full p-4 bg-background">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full"
            >
              <TabsList className="w-full justify-start border-b">
                <TabsTrigger value="editor">Node Editor</TabsTrigger>
                <TabsTrigger value="tree">Tree View</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="h-[calc(100%-40px)]">
                <DndProvider backend={HTML5Backend}>
                  <div className="flex flex-col h-full">
                    <Button
                      onClick={() => addNode(null, "container")}
                      className="mb-4"
                    >
                      Add Node
                    </Button>
                    <div className="flex gap-4 h-full">
                      <div className="w-1/2 border rounded-lg shadow-sm bg-card">
                        <div className="p-4 border-b bg-muted/50">
                          <h2 className="font-semibold">Node Tree</h2>
                        </div>
                        <div className="p-4">
                          <TreeView
                            nodes={nodes}
                            onNodeSelect={setSelectedNode}
                            onAddChild={addNode}
                            collapsedNodes={collapsedNodes}
                            onToggleCollapse={toggleNodeCollapse}
                            onDeleteNode={deleteNode}
                            onMoveNode={moveNode}
                          />
                        </div>
                      </div>
                      <div className="w-1/2 border rounded-lg shadow-sm bg-card">
                        <div className="p-4 border-b bg-muted/50">
                          <h2 className="font-semibold">Node Properties</h2>
                        </div>
                        <div className="p-4">
                          <NodeEditor
                            node={selectedNode}
                            onUpdate={updateNode}
                            onDelete={deleteNode}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </DndProvider>
              </TabsContent>
              <TabsContent value="tree" className="h-[calc(100%-40px)]">
                <DndProvider backend={HTML5Backend}>
                  <div className="border rounded-lg shadow-sm bg-card">
                    <div className="p-4 border-b bg-muted/50">
                      <h2 className="font-semibold">Node Tree</h2>
                    </div>
                    <div className="p-4">
                      <TreeView
                        nodes={nodes}
                        onNodeSelect={setSelectedNode}
                        onAddChild={addNode}
                        collapsedNodes={collapsedNodes}
                        onToggleCollapse={toggleNodeCollapse}
                        onDeleteNode={deleteNode}
                        onMoveNode={moveNode}
                      />
                    </div>
                  </div>
                </DndProvider>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="h-full p-4 bg-background">
            <div className="h-full border rounded-lg shadow-sm bg-card">
              <div className="p-4 border-b bg-muted/50">
                <h2 className="font-semibold">Content Preview</h2>
              </div>
              <div className="p-4">
                <ContentPreview />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
