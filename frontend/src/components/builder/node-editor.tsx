import type {
  ContainerNode,
  ContentNode,
  Node,
} from "@/contexts/builder-context/types";
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
import { usePromptBuilderContext } from "@/contexts/builder-context/node-context";

export default function NodeEditor() {
  const {
    selectedNodeId,
    findNode,
    updateContainer,
    updateContent,
    deleteNode,
  } = usePromptBuilderContext();

  const nodeInfo = selectedNodeId ? findNode(selectedNodeId) : null;
  const node = nodeInfo?.node ?? null;

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a node to edit its properties</p>
      </div>
    );
  }

  const isContainer = node.type === "container";

  const handleContentNodeChange = (field: keyof ContentNode, value: string) => {
    if (node.type === "container") return;
    updateContent(node.id, { [field]: value });
  };

  const handleContainerNodeChange = (
    field: keyof ContainerNode,
    value: string,
  ) => {
    if (node.type !== "container") return;
    updateContainer(node.id, { [field]: value });
  };

  return (
    <div className="space-y-4">
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
                  <SelectItem value="md">Markdown</SelectItem>
                  <SelectItem value="numbered-md">Numbered Markdown</SelectItem>
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
        )}

      <div className="pt-4 flex justify-end space-x-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteNode(node.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}
