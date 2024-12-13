import type {
  ContainerNode,
  ContentNode,
  Node,
} from "@/contexts/builder-context/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDrag, useDrop } from "react-dnd";
import { usePromptBuilderContext } from "@/contexts/builder-context/node-context";
import { useRef } from "react";

type DragItem = {
  id: string;
  type: string;
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

const getNodeIcon = (node: Node) => {
  if (node.type === "container") {
    switch (node.format) {
      case "xml":
        return "🔳";
      case "md":
        return "📑";
      case "numbered-md":
        return "📝";
      case "raw":
        return "📄";
      default:
        return "📦";
    }
  }
  return "📄";
};

const getNodePreview = (node: Node) => {
  if (node.type === "container") {
    return `${node.format}: ${node.name}`;
  }
  return node.content.substring(0, 20) || `[Empty ${node.type}]`;
};

const NodeTree = ({
  node,
  level,
}: {
  node: Node;
  level: number;
}) => {
  const {
    expandedNodeIds,
    toggleNodeCollapse,
    selectNode,
    addContainer,
    addTextNode,
    deleteNode,
    moveNode,
  } = usePromptBuilderContext();

  const colorClass = colors[level % colors.length];
  const isCollapsed = !expandedNodeIds.has(node.id);
  const isContainer = node.type === "container";
  const nodeRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "NODE",
    item: { id: node.id, type: "NODE" },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [{ isOver, isOverCurrent }, drop] = useDrop(() => ({
    accept: "NODE",
    drop: (item: DragItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;

      const draggedId = item.id;
      const targetId = node.id;

      if (draggedId === targetId) return;

      const clientOffset = monitor.getClientOffset();
      const hoverBoundingRect = nodeRef.current?.getBoundingClientRect();

      if (!clientOffset || !hoverBoundingRect) return;

      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) /
        2;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (hoverClientY < hoverMiddleY / 2) {
        moveNode(draggedId, { id: targetId, position: "before" });
      } else if (hoverClientY > hoverMiddleY * 1.5) {
        moveNode(draggedId, { id: targetId, position: "after" });
      } else if (isContainer) {
        moveNode(draggedId, { id: targetId, position: "inside" });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      isOverCurrent: !!monitor.isOver({ shallow: true }),
    }),
  }));

  // Combine drag and drop refs
  drag(drop(nodeRef));

  return (
    <div
      ref={nodeRef}
      className={`pl-4 ${isDragging ? "opacity-50" : ""} ${
        isOverCurrent ? "bg-muted/50" : ""
      }`}
    >
      <div
        className={`flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded group ${colorClass}`}
      >
        {isContainer && (
          <Button
            size="sm"
            variant="ghost"
            className="p-0 h-6 w-6"
            onClick={() => toggleNodeCollapse(node.id)}
          >
            {isCollapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />}
          </Button>
        )}
        <span
          onClick={() => selectNode(node.id)}
          className="flex-grow hover:text-foreground/80"
        >
          {getNodeIcon(node)} {getNodePreview(node)}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isContainer && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  addContainer({ id: node.id, position: "inside" });
                }}
                title="Add Container Node"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  addTextNode({ id: node.id, position: "inside" });
                }}
                title="Add Text Node"
              >
                <Plus className="w-4 h-4 text-blue-500" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(node.id);
            }}
            title="Delete Node"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
      {isContainer && !isCollapsed &&
        (node as ContainerNode).children.length > 0 && (
        <div className="pl-4">
          {(node as ContainerNode).children.map((childNode) => (
            <NodeTree key={childNode.id} node={childNode} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TreeView() {
  const { nodes } = usePromptBuilderContext();

  return (
    <ScrollArea className="h-full">
      {nodes.length === 0
        ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No nodes created yet</p>
          </div>
        )
        : (
          <div className="space-y-2">
            {nodes.map((node) => (
              <NodeTree key={node.id} node={node} level={0} />
            ))}
          </div>
        )}
    </ScrollArea>
  );
}
