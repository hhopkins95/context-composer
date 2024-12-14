import React, { useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { File, Folder, Tree, type TreeViewElement } from "../ui/file-tree";
import { useDirectoryContents } from "../../lib/hooks/useDirectory";
import type { DirectoryResponse } from "../../lib/hooks/useDirectory";
import { Button } from "../ui/button";
import {
  ChevronUp,
  Folder as FolderIcon,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { useDrag } from "react-dnd";
import { api } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface DirectoryExplorerProps {
  className?: string;
}

interface DirectoryPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
}

function DirectoryPickerDialog(
  { open, onOpenChange, onSelect }: DirectoryPickerDialogProps,
) {
  // Let the server determine the starting path (home directory)
  const [currentPath, setCurrentPath] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["directory", "parent", currentPath],
    queryFn: async () => {
      try {
        const response = await api.api.directory.parent.$get({
          query: currentPath ? { path: currentPath } : {},
        });
        if (!response.ok) {
          throw new Error("Failed to access directory");
        }
        setError(null);
        return response.json();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to access directory",
        );
        // Return null to indicate error state
        return null;
      }
    },
    enabled: open,
    // Prevent automatic retries on error
    retry: false,
  });

  const handleSelect = () => {
    if (!error && data?.currentPath) {
      onSelect(data.currentPath);
      onOpenChange(false);
    }
  };

  const handleParentClick = () => {
    if (data?.parentPath) {
      setCurrentPath(data.parentPath);
      setError(null);
    }
  };

  // If we have an error but previous data exists, use it
  const displayData = error ? null : data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Directory</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 p-2 bg-muted rounded-md text-sm truncate">
            {displayData?.currentPath ?? ""}
          </div>
          {displayData?.parentPath && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleParentClick}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="border rounded-md">
          <ScrollArea className="h-[300px] w-full">
            <div className="p-4">
              {isLoading
                ? (
                  <div className="flex items-center justify-center h-full">
                    Loading...
                  </div>
                )
                : error
                ? (
                  <div className="space-y-4">
                    <div className="text-destructive text-sm">{error}</div>
                    {displayData?.parentPath && (
                      <Button
                        variant="outline"
                        onClick={handleParentClick}
                        className="w-full"
                      >
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Go Up
                      </Button>
                    )}
                  </div>
                )
                : (
                  <div className="space-y-2">
                    {displayData?.dirs.map((dir) => (
                      <button
                        key={dir.path}
                        className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md text-left"
                        onClick={() => setCurrentPath(dir.path)}
                        onDoubleClick={handleSelect}
                      >
                        <FolderIcon className="h-4 w-4" />
                        <span>{dir.name}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!!error}>
            Select Directory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
 * A draggable file component that wraps the base File component
 */
function DraggableFile(
  { value, children }: { value: string; children: React.ReactNode },
) {
  // Get the relative path by removing the base directory path
  const getRelativePath = (fullPath: string) => {
    const basePath = value.split("/").slice(0, -1).join("/");
    return fullPath.replace(basePath + "/", "");
  };

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "FILE",
    item: {
      type: "FILE",
      path: getRelativePath(value),
      name: value.split("/").pop() || value,
      fileType: value.split(".").pop() || "txt",
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [value]);

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <File value={value}>
        {children}
      </File>
    </div>
  );
}

/**
 * A folder component that fetches its own data on expansion.
 */
function FolderWithQuery({ path, name }: { path: string; name: string }) {
  const { data, isLoading, error } = useDirectoryContents(path);

  const treeData = data ? transformToTree(data, path) : [];

  return (
    <Folder element={name} value={path}>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error loading directory</div>}
      {treeData.length > 0 && (
        <div>
          {treeData.map((element) => {
            if (element.children == undefined) {
              return (
                <DraggableFile
                  key={element.id}
                  value={element.id}
                >
                  <p>{element.name}</p>
                </DraggableFile>
              );
            }
            return (
              <FolderWithQuery
                key={element.id}
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
  const [directories, setDirectories] = useState<string[]>(() => {
    const saved = localStorage.getItem("explorer-directories");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDirectory, setSelectedDirectory] = useState<string>(() => {
    const saved = localStorage.getItem("explorer-selected-directory");
    return saved || "";
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Get initial directory contents
  const { data, isLoading, error } = useDirectoryContents(selectedDirectory);

  // Save directories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("explorer-directories", JSON.stringify(directories));
  }, [directories]);

  // Save selected directory to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("explorer-selected-directory", selectedDirectory);
  }, [selectedDirectory]);

  const handleDirectorySelect = (path: string) => {
    if (!directories.includes(path)) {
      setDirectories([...directories, path]);
    }
    setSelectedDirectory(path);
  };

  const handleRemoveDirectory = (path: string) => {
    const newDirectories = directories.filter((d) => d !== path);
    setDirectories(newDirectories);
    if (selectedDirectory === path) {
      setSelectedDirectory(newDirectories[0] || "");
    }
  };

  const treeData = data ? transformToTree(data, selectedDirectory) : [];

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex gap-2 mb-2">
        <Select value={selectedDirectory} onValueChange={setSelectedDirectory}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a directory" />
          </SelectTrigger>
          <SelectContent>
            {directories.map((dir) => (
              <div key={dir} className="flex items-center justify-between px-2">
                <SelectItem value={dir}>
                  {dir.split("/").pop() || dir}
                </SelectItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveDirectory(dir);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsPickerOpen(true)}
          title="Add Directory"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {isLoading && <div>Loading...</div>}
        {error && <div>Error loading directory</div>}
        {treeData.length > 0 && (
          <Tree className="p-2 overflow-hidden rounded-md bg-background">
            {treeData.map((element) => {
              if (element.children == undefined) {
                return (
                  <DraggableFile
                    key={element.id}
                    value={element.id}
                  >
                    <p>{element.name}</p>
                  </DraggableFile>
                );
              }
              return (
                <FolderWithQuery
                  key={element.id}
                  path={element.id}
                  name={element.name}
                />
              );
            })}
          </Tree>
        )}
      </ScrollArea>

      <DirectoryPickerDialog
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onSelect={handleDirectorySelect}
      />
    </div>
  );
}
