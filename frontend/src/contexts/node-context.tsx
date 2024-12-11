import { createContext, useContext, useState } from "react";

export interface ContentNode {
  id: string;
  type: "text" | "file";
  content: string;
  fileRef?: {
    path: string;
    type: string;
  };
}

export interface ContainerNode {
  id: string;
  type: "container";
  format: "xml" | "markdown" | "numbered" | "raw";
  name: string;
  description?: string;
  children: Node[];
}

export type Node = ContentNode | ContainerNode;

interface NodeContextType {
  nodes: Node[];
  selectedNode: Node | null;
  collapsedNodes: Set<string>;
  addNode: (parentId: string | null, nodeType: Node["type"]) => void;
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

  const addNode = (parentId: string | null = null, nodeType: Node["type"]) => {
    console.log("aaAdd node within parent:", parentId);

    const newNode: Node = nodeType === "container"
      ? {
        id: Date.now().toString(),
        type: "container",
        format: "xml", // default format
        name: "new-container",
        children: [],
      }
      : {
        id: Date.now().toString(),
        type: nodeType,
        content: "",
      };

    if (parentId === null) {
      setNodes([...nodes, newNode]);
    } else {
      const updateNodeRecursive = (nodes: Node[]): Node[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            if (node.type !== "container") {
              console.error("Cannot add children to non-container node");
              return node;
            }
            return { ...node, children: [...node.children, newNode] };
          }
          if (node.type === "container" && node.children.length > 0) {
            return { ...node, children: updateNodeRecursive(node.children) };
          }
          return node;
        });
      };
      setNodes(updateNodeRecursive(nodes));
    }
  };

  const updateNode = (updatedNode: Node) => {
    console.log("Update node:", { values: updatedNode });

    const updateNodeRecursive = (nodes: Node[]): Node[] => {
      return nodes.map((node) => {
        if (node.id === updatedNode.id) {
          return updatedNode;
        }
        if (node.type === "container" && node.children.length > 0) {
          return { ...node, children: updateNodeRecursive(node.children) };
        }
        return node;
      });
    };
    setNodes(updateNodeRecursive(nodes));
  };

  const deleteNode = (nodeId: string) => {
    console.log("Deleting node:", nodeId);

    const deleteNodeRecursive = (nodes: Node[]): Node[] => {
      return nodes.filter((node) => {
        if (node.id === nodeId) {
          return false;
        }
        if (node.type === "container" && node.children.length > 0) {
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
        if (node.type === "container" && node.children.length > 0) {
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
            if (node.type !== "container") {
              console.error("Cannot insert inside non-container node");
              return node;
            }
            return { ...node, children: [...node.children, draggedNode!] };
          }
          const nodeIndex = nodes.findIndex((n) => n.id === targetId);
          const insertIndex = position === "before" ? nodeIndex : nodeIndex + 1;
          nodes.splice(insertIndex, 0, draggedNode!);
          return node;
        }
        if (node.type === "container" && node.children.length > 0) {
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
