import type { Node } from "./context-builder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

type ContentPreviewProps = {
  nodes: Node[];
  collapsedNodes: Set<string>;
  onToggleCollapse: (nodeId: string) => void;
};

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

export default function ContentPreview(
  { nodes, collapsedNodes, onToggleCollapse }: ContentPreviewProps,
) {
  const renderContent = (nodes: Node[], level: number = 0): JSX.Element[] => {
    return nodes.flatMap((node, index) => {
      const colorClass = colors[level % colors.length];
      const indent = "  ".repeat(level);
      const content = node.type === "file"
        ? `[File Content: ${node.content}]`
        : node.type === "template"
        ? `[Template: ${node.content}]`
        : node.content;
      const isCollapsed = collapsedNodes.has(node.id);

      return [
        <div
          key={`${node.id}-open`}
          className={`flex items-center ${colorClass}`}
        >
          {node.children.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="p-0 h-6 w-6 mr-1"
              onClick={() => onToggleCollapse(node.id)}
            >
              {isCollapsed
                ? <ChevronRight className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
          <span>
            {indent}
            <span className="text-gray-500">&lt;</span>
            {node.tagName}
            <span className="text-gray-500">&gt;</span>
            {content && <span className="text-gray-700">{content}</span>}
          </span>
        </div>,
        ...(!isCollapsed ? renderContent(node.children, level + 1) : []),
        <div key={`${node.id}-close`} className={colorClass}>
          {indent}
          <span className="text-gray-500">&lt;/</span>
          {node.tagName}
          <span className="text-gray-500">&gt;</span>
        </div>,
      ];
    });
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Content Preview</h3>
      <ScrollArea className="h-[calc(100vh-200px)] border rounded">
        <pre className="p-4 text-sm font-mono">
          {renderContent(nodes)}
        </pre>
      </ScrollArea>
    </div>
  );
}
