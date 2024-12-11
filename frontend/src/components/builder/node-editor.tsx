import type { Node } from "@/contexts/node-context";
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

  const handleChange = (field: keyof Node, value: string) => {
    onUpdate({ ...node, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          value={node.type}
          onValueChange={(value: "text" | "file" | "template") =>
            handleChange("type", value)
          }
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="file">File</SelectItem>
            <SelectItem value="template">Template</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagName">Tag Name</Label>
        <Input
          id="tagName"
          value={node.tagName}
          onChange={(e) => handleChange("tagName", e.target.value)}
          placeholder="Enter tag name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={node.content}
          onChange={(e) => handleChange("content", e.target.value)}
          placeholder="Enter content"
          className="min-h-[100px]"
        />
      </div>

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
