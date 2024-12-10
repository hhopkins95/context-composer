import type { Node } from "./context-builder";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDrag, useDrop } from "react-dnd";

type TreeViewProps = {
  nodes: Node[];
  onNodeSelect: (node: Node) => void;
  onAddChild: (parentId: string) => void;
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

const TreeNode = (
  {
    node,
    level,
    onNodeSelect,
    onAddChild,
    collapsedNodes,
    onToggleCollapse,
    onDeleteNode,
    onMoveNode,
  }: {
    node: Node;
    level: number;
    onNodeSelect: (node: Node) => void;
    onAddChild: (parentId: string) => void;
    collapsedNodes: Set<string>;
    onToggleCollapse: (nodeId: string) => void;
    onDeleteNode: (nodeId: string) => void;
    onMoveNode: (
      draggedId: string,
      targetId: string,
      position: "before" | "after" | "inside",
    ) => void;
  },
) => {
  const colorClass = colors[level % colors.length];
  const isCollapsed = collapsedNodes.has(node.id);

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
      if (!monitor.isOver({ shallow: true })) {
        return;
      }
      const draggedId = item.id;
      const targetId = node.id;

      if (draggedId === targetId) {
        return;
      }

      const clientOffset = monitor.getClientOffset();
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      if (!clientOffset || !hoverBoundingRect) {
        return;
      }

      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) /
        2;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (hoverClientY < hoverMiddleY / 2) {
        onMoveNode(draggedId, targetId, "before");
      } else if (hoverClientY > hoverMiddleY * 1.5) {
        onMoveNode(draggedId, targetId, "after");
      } else {
        onMoveNode(draggedId, targetId, "inside");
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
        {node.children.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="p-0 h-6 w-6"
            onClick={() => onToggleCollapse(node.id)}
          >
            {isCollapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />}
          </Button>
        )}
        <span onClick={() => onNodeSelect(node)}>
          {node.type === "text" ? "📄" : node.type === "file" ? "📁" : "📋"}
          {node.tagName}:{" "}
          {node.content.substring(0, 20) || `[Empty ${node.type}]`}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(node.id);
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNode(node.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      {!isCollapsed && node.children.length > 0 && (
        <div className="pl-4">
          {node.children.map((childNode) => (
            <TreeNode
              key={childNode.id}
              node={childNode}
              level={level + 1}
              onNodeSelect={onNodeSelect}
              onAddChild={onAddChild}
              collapsedNodes={collapsedNodes}
              onToggleCollapse={onToggleCollapse}
              onDeleteNode={onDeleteNode}
              onMoveNode={onMoveNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TreeView(
  {
    nodes,
    onNodeSelect,
    onAddChild,
    collapsedNodes,
    onToggleCollapse,
    onDeleteNode,
    onMoveNode,
  }: TreeViewProps,
) {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Node Structure</h3>
      <ScrollArea className="h-[calc(100vh-200px)] border rounded">
        <div className="p-2">
          {nodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              onNodeSelect={onNodeSelect}
              onAddChild={onAddChild}
              collapsedNodes={collapsedNodes}
              onToggleCollapse={onToggleCollapse}
              onDeleteNode={onDeleteNode}
              onMoveNode={onMoveNode}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
