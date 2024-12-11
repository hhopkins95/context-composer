import {
  type ContainerNode,
  type Node,
  useNodes,
} from "@/contexts/node-context";
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

const renderNodeContent = (node: Node): string => {
  if (node.type === "container") {
    const containerNode = node as ContainerNode;
    switch (containerNode.format) {
      case "xml":
        return `<${containerNode.name}>${
          containerNode.children
            .map(renderNodeContent)
            .join("")
        }</${containerNode.name}>`;
      case "markdown":
        return `# ${containerNode.name}\n${
          containerNode.children
            .map(renderNodeContent)
            .join("\n")
        }`;
      case "numbered":
        return containerNode.children
          .map((child, index) => `${index + 1}. ${renderNodeContent(child)}`)
          .join("\n");
      case "raw":
        return containerNode.children.map(renderNodeContent).join("");
      default:
        return "";
    }
  }
  return node.content || "";
};

export default function ContentPreview() {
  const { nodes, collapsedNodes, toggleNodeCollapse } = useNodes();

  const renderNode = (node: Node, level: number = 0) => {
    const isCollapsed = collapsedNodes.has(node.id);
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
            {renderNodeContent(node)}
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
        {nodes.map((node) => renderNode(node))}
      </div>
    </ScrollArea>
  );
}
