"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import { Button } from "./ui/button";
import FileExplorer from "./file-explorer";
import ContextBuilder from "./builder/context-builder";

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">LLM Prompt Builder</h1>
        <div className="flex space-x-2">
          <Button variant="outline">New</Button>
          <Button variant="outline">Open</Button>
          <Button variant="outline">Save</Button>
          <Button variant="outline">Export</Button>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={25} minSize={20}>
          <FileExplorer />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={75} minSize={50}>
          <ContextBuilder />
        </ResizablePanel>
      </ResizablePanelGroup>

      <footer className="flex items-center justify-between p-2 border-t text-sm">
        <div>Files: 0 | Template: None</div>
        <div>Ready</div>
      </footer>
    </div>
  );
}
