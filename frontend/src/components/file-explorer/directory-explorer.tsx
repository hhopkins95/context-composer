import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  File,
  Folder,
  Tree,
  type TreeViewElement,
} from "@/components/ui/file-tree";
import { useDirectoryContents } from "@/lib/hooks/useDirectory";
import type { DirectoryResponse } from "@/lib/hooks/useDirectory";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface DirectoryExplorerProps {
  className?: string;
}

/**
 * Transform a DirectoryResponse into a list of TreeViewElements for rendering.
 */
function transformToTree(
  contents: DirectoryResponse,
  directoryPath: string,
): TreeViewElement[] {
  const { files, dirs } = contents;

  const treeElements: TreeViewElement[] = [
    ...dirs.map((dir) => ({
      id: `${directoryPath}/${dir}`,
      name: dir.split("/").pop() || dir,
      isSelectable: true,
      children: [], // children are fetched on-demand when folder is opened
    })),
    ...files.map((file) => ({
      id: `${directoryPath}/${file}`,
      name: file.split("/").pop() || file,
      isSelectable: true,
    })),
  ];

  return treeElements;
}

/**
 * A folder component that fetches its own data on expansion.
 */
function FolderWithQuery({ path, name }: { path: string; name: string }) {
  const { data, isLoading, error, refetch } = useDirectoryContents(path);

  const handleToggle = () => {
    // Fetch the directory contents when expanding
    refetch();
  };

  const treeData = data ? transformToTree(data, path) : [];

  return (
    <Folder element={name} value={path} onClick={handleToggle}>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error loading directory</div>}
      {treeData.length > 0 && (
        <div>
          {treeData.map((element) => {
            if (element.children == undefined) {
              return (
                <File
                  key={element.id}
                  value={element.id}
                >
                  <p>{element.name}</p>
                </File>
              );
            }
            return (
              <FolderWithQuery
                path={element.id}
                name={element.name}
              />
            );
          })}
        </div>
      )}
    </Folder>
  );
}

export function DirectoryExplorer({ className }: DirectoryExplorerProps) {
  const [directoryPath, setDirectoryPath] = useState("");

  const { isLoading, error, refetch, data } = useDirectoryContents(
    directoryPath,
  );

  const handleSearch = () => {
    if (directoryPath.trim()) {
      refetch();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const treeData = data ? transformToTree(data, directoryPath) : [];

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex gap-2 mb-2">
        <Input
          type="text"
          placeholder="Enter directory path..."
          value={directoryPath}
          onChange={(e) => setDirectoryPath(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          variant="secondary"
          size="icon"
          onClick={handleSearch}
          disabled={isLoading || !directoryPath.trim()}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {error && <div>Error loading directory</div>}
        {treeData.length > 0 && (
          <Tree className="p-2 overflow-hidden rounded-md bg-background">
            {treeData.map((element) => {
              if (element.children == undefined) {
                return (
                  <File
                    key={element.id}
                    value={element.id}
                  >
                    <p>{element.name}</p>
                  </File>
                );
              }
              return (
                <FolderWithQuery
                  path={element.id}
                  name={element.name}
                />
              );
            })}
          </Tree>
        )}
      </ScrollArea>
    </div>
  );
}
