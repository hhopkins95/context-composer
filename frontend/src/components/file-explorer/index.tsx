"use client";

import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { DirectoryExplorer } from "./directory-explorer";
import { cn } from "../../lib/utils";

export default function FileExplorer() {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">File Explorer</h2>
      </div>
      <div className="flex-1 h-full">
        <DirectoryExplorer />
      </div>
    </div>
  );
}
