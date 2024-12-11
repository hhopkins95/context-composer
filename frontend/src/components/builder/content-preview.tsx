import { type Node, useNodes } from "@/contexts/node-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

const colors = [
  "text-red-500",
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-purple-500",
  "text-pink-500",
  "text-indigo-500",
  "text-orange-500",
];

export default function ContentPreview() {
  const { nodes, collapsedNodes, toggleNodeCollapse } = useNodes();

  const renderNode = (node: Node, level: number = 0) => {
    const isCollapsed = collapsedNodes.has(node.id);
    const color = colors[level % colors.length];

    return (
      <div key={node.id} className="flex flex-col">
        <div className="flex items-center gap-1">
          {node.children.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => toggleNodeCollapse(node.id)}
            >
              {isCollapsed
                ? <ChevronRight className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          <span className={color}>{node.content || "Empty Node"}</span>
        </div>
        {!isCollapsed && node.children.length > 0 && (
          <div className="ml-4">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {nodes.map((node) => renderNode(node))}
      </div>
    </ScrollArea>
  );
}
