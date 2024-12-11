import { createContext, useContext, useState } from "react";

export type Node = {
  id: string;
  type: "text" | "file" | "template";
  content: string;
  children: Node[];
  tagName: string;
};

interface NodeContextType {
  nodes: Node[];
  selectedNode: Node | null;
  collapsedNodes: Set<string>;
  addNode: (parentId: string | null) => void;
  updateNode: (updatedNode: Node) => void;
  deleteNode: (nodeId: string) => void;
  moveNode: (
    draggedId: string,
    targetId: string,
    position: "before" | "after" | "inside",
  ) => void;
  setSelectedNode: (node: Node | null) => void;
  toggleNodeCollapse: (nodeId: string) => void;
}

const NodeContext = createContext<NodeContextType | null>(null);

export function NodeProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const addNode = (parentId: string | null = null) => {
    console.log("Add node within parent : ", parentId);

    const newNode: Node = {
      id: Date.now().toString(),
      type: "text",
      content: "",
      children: [],
      tagName: "node",
    };

    if (parentId === null) {
      setNodes([...nodes, newNode]);
    } else {
      const updateNodeRecursive = (nodes: Node[]): Node[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            return { ...node, children: [...node.children, newNode] };
          }
          if (node.children.length > 0) {
            return { ...node, children: updateNodeRecursive(node.children) };
          }
          return node;
        });
      };
      setNodes(updateNodeRecursive(nodes));
    }
  };

  const updateNode = (updatedNode: Node) => {
    console.log("Update node : ", { values: updatedNode });

    const updateNodeRecursive = (nodes: Node[]): Node[] => {
      return nodes.map((node) => {
        if (node.id === updatedNode.id) {
          return updatedNode;
        }
        if (node.children.length > 0) {
          return { ...node, children: updateNodeRecursive(node.children) };
        }
        return node;
      });
    };
    setNodes(updateNodeRecursive(nodes));
  };

  const deleteNode = (nodeId: string) => {
    console.log("Deleting node : ", nodeId);

    const deleteNodeRecursive = (nodes: Node[]): Node[] => {
      return nodes.filter((node) => {
        if (node.id === nodeId) {
          return false;
        }
        if (node.children.length > 0) {
          return { ...node, children: deleteNodeRecursive(node.children) };
        }
        return true;
      });
    };
    setNodes(deleteNodeRecursive(nodes));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const moveNode = (
    draggedId: string,
    targetId: string,
    position: "before" | "after" | "inside",
  ) => {
    let draggedNode: Node | null = null;
    let newNodes = [...nodes];

    // Find and remove dragged node
    const removeNode = (nodes: Node[]): Node[] => {
      return nodes.filter((node) => {
        if (node.id === draggedId) {
          draggedNode = node;
          return false;
        }
        if (node.children.length > 0) {
          node.children = removeNode(node.children);
        }
        return true;
      });
    };

    newNodes = removeNode(newNodes);

    if (!draggedNode) return;

    // Insert node at new position
    const insertNode = (nodes: Node[]): Node[] => {
      return nodes.map((node) => {
        if (node.id === targetId) {
          if (position === "inside") {
            return { ...node, children: [...node.children, draggedNode!] };
          }
          const nodeIndex = nodes.findIndex((n) => n.id === targetId);
          const insertIndex = position === "before" ? nodeIndex : nodeIndex + 1;
          nodes.splice(insertIndex, 0, draggedNode!);
          return node;
        }
        if (node.children.length > 0) {
          return { ...node, children: insertNode(node.children) };
        }
        return node;
      });
    };

    newNodes = insertNode(newNodes);
    setNodes(newNodes);
  };

  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  return (
    <NodeContext.Provider
      value={{
        nodes,
        selectedNode,
        collapsedNodes,
        addNode,
        updateNode,
        deleteNode,
        moveNode,
        setSelectedNode,
        toggleNodeCollapse,
      }}
    >
      {children}
    </NodeContext.Provider>
  );
}

export function useNodes() {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error("useNodes must be used within a NodeProvider");
  }
  return context;
}
