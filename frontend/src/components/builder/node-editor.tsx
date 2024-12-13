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
import { FileText, Layout, Trash2 } from "lucide-react";
import { usePromptBuilderContext } from "@/contexts/builder-context/node-context";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <p>Select a node to edit its properties</p>
        <div className="flex gap-4 text-muted">
          <div className="flex flex-col items-center gap-2">
            <Layout className="w-8 h-8" />
            <span className="text-sm">Container Node</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-8 h-8" />
            <span className="text-sm">Text Node</span>
          </div>
        </div>
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
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b">
          {isContainer
            ? <Layout className="w-5 h-5 text-muted-foreground" />
            : <FileText className="w-5 h-5 text-muted-foreground" />}
          <span className="font-medium">
            {isContainer ? "Container Node" : "Text Node"}
          </span>
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
                    <SelectItem value="md">Markdown</SelectItem>
                    <SelectItem value="numbered-md">
                      Numbered Markdown
                    </SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose how the content will be formatted
                </p>
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
                <p className="text-sm text-muted-foreground">
                  {(node as ContainerNode).format === "xml"
                    ? "The XML tag name for this container"
                    : "The header text for this section"}
                </p>
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
                  <p className="text-sm text-muted-foreground">
                    Optional description to provide more context
                  </p>
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
                placeholder="Enter your text content here..."
                className="min-h-[200px] resize-y"
              />
              <p className="text-sm text-muted-foreground">
                The text content that will be included in the final output
              </p>
            </div>
          )}

        <div className="pt-4 flex justify-end">
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
    </ScrollArea>
  );
}
