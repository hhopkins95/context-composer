import type { ContainerNode, ContentNode, Node } from "@/contexts/node-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type NodeEditorProps = {
  node: Node | null;
  onUpdate: (node: Node) => void;
  onDelete: (nodeId: string) => void;
};

export default function NodeEditor(
  { node, onUpdate, onDelete }: NodeEditorProps,
) {
  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a node to edit its properties</p>
      </div>
    );
  }

  const isContainer = node.type === "container";

  const handleContentNodeChange = (
    field: keyof ContentNode,
    value: string,
  ) => {
    if (node.type === "container") return;
    onUpdate({ ...node, [field]: value });
  };

  const handleContainerNodeChange = (
    field: keyof ContainerNode,
    value: string,
  ) => {
    if (node.type !== "container") return;
    onUpdate({ ...node, [field]: value });
  };

  const handleTypeChange = (newType: "text" | "file" | "container") => {
    if (newType === "container") {
      onUpdate({
        ...node,
        type: "container",
        format: "xml",
        name: "new-container",
        children: [],
      } as ContainerNode);
    } else {
      onUpdate({
        ...node,
        type: newType,
        content: "",
      } as ContentNode);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          value={node.type}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="file">File</SelectItem>
            <SelectItem value="container">Container</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isContainer
        ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={(node as ContainerNode).format}
                onValueChange={(value: ContainerNode["format"]) =>
                  handleContainerNodeChange("format", value)}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="numbered">Numbered List</SelectItem>
                  <SelectItem value="raw">Raw</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={(node as ContainerNode).name}
                onChange={(e) =>
                  handleContainerNodeChange("name", e.target.value)}
                placeholder="Enter name (tag name for XML, header for markdown)"
              />
            </div>
            {(node as ContainerNode).description !== undefined && (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={(node as ContainerNode).description || ""}
                  onChange={(e) =>
                    handleContainerNodeChange("description", e.target.value)}
                  placeholder="Enter description (optional)"
                />
              </div>
            )}
          </>
        )
        : (
          <>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={(node as ContentNode).content}
                onChange={(e) =>
                  handleContentNodeChange("content", e.target.value)}
                placeholder="Enter content"
                className="min-h-[100px]"
              />
            </div>
            {node.type === "file" && (
              <div className="space-y-2">
                <Label htmlFor="filePath">File Path</Label>
                <Input
                  id="filePath"
                  value={(node as ContentNode).fileRef?.path || ""}
                  onChange={(e) =>
                    handleContentNodeChange(
                      "fileRef",
                      JSON.stringify({
                        path: e.target.value,
                        type: (node as ContentNode).fileRef?.type || "text",
                      }),
                    )}
                  placeholder="Enter file path"
                />
              </div>
            )}
          </>
        )}

      <div className="pt-4 flex justify-end space-x-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}
