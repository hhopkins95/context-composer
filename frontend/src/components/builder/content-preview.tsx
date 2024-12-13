import {
  type ContainerNode,
  type Node,
} from "@/contexts/builder-context/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePromptBuilderContext } from "@/contexts/builder-context/node-context";

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
  const { nodes, expandedNodeIds, toggleNodeCollapse, outputString } =
    usePromptBuilderContext();

  const renderNode = (node: Node, level: number = 0) => {
    const isCollapsed = !expandedNodeIds.has(node.id);
    const color = colors[level % colors.length];
    const isContainer = node.type === "container";

    return (
      <div key={node.id} className="flex flex-col">
        <div className="flex items-center gap-1">
          {isContainer && (
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
          <pre className={`${color} whitespace-pre-wrap`}>
            {node.type === "container"
              ? `${(node as ContainerNode).name}`
              : node.content}
          </pre>
        </div>
        {!isCollapsed && isContainer &&
          (node as ContainerNode).children.length > 0 && (
          <div className="ml-4">
            {(node as ContainerNode).children.map((child) =>
              renderNode(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        <div className="mb-4 p-2 bg-muted rounded">
          <pre className="whitespace-pre-wrap">{outputString}</pre>
        </div>
        {/* {nodes.map((node) => renderNode(node))} */}
      </div>
    </ScrollArea>
  );
}
