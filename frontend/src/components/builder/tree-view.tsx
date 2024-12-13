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

type TreeViewProps = {
  nodes: Node[];
  onNodeSelect: (node: Node) => void;
  onAddChild: (parentId: string, nodeType: Node["type"]) => void;
  collapsedNodes: Set<string>;
  onToggleCollapse: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onMoveNode: (
    draggedId: string,
    targetId: string,
    position: "before" | "after" | "inside",
  ) => void;
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

type DragItem = {
  id: string;
  type: string;
};

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
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

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

  const ref = (element: HTMLDivElement | null) => {
    drag(element);
    drop(element);
  };

  return (
    <div
      ref={ref}
      className={`pl-4 ${isDragging ? "opacity-50" : ""} ${
        isOverCurrent ? "bg-gray-100" : ""
      }`}
    >
      <div
        className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded ${colorClass}`}
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
        <span onClick={() => selectNode(node.id)}>
          {getNodeIcon(node)} {getNodePreview(node)}
        </span>
        {isContainer && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              addTextNode({ id: node.id, position: "inside" });
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(node.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      {isContainer && !isCollapsed &&
        (node as ContainerNode).children.length > 0 && (
        <div className="pl-4">
          {(node as ContainerNode).children.map((childNode) => (
            <NodeTree
              key={childNode.id}
              node={childNode}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TreeView() {
  const { nodes } = usePromptBuilderContext();

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Node Structure</h3>
      <ScrollArea className="h-full pr-4">
        {nodes.length === 0
          ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No nodes created yet</p>
            </div>
          )
          : (
            <div className="space-y-2">
              {nodes.map((node) => (
                <NodeTree
                  key={node.id}
                  node={node}
                  level={0}
                />
              ))}
            </div>
          )}
      </ScrollArea>
    </div>
  );
}
