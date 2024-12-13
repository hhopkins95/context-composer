import { createContext, useContext, useState } from "react";
import type {
  ContainerFormat,
  ContainerNode,
  ContentNode,
  InsertTarget,
  Node,
} from "./types";
import {
  deleteNode,
  getNode,
  getParentNode,
  insertNode,
  moveNode,
  renderFinalString,
  renderJsonString,
  updateContainerNode,
  updateContentNode,
} from "./helpers";

/**
 * LOGIC
 */
const useNodeSelections = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleNodeCollapse = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const selectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  return {
    expandedNodeIds,
    toggleNodeCollapse,
    selectNode,
    selectedNodeId,
  };
};

function usePromptBuilderContextLogic() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [defaultContainerFormat, setDefaultContainerFormat] = useState<
    ContainerFormat
  >("raw");
  const selections = useNodeSelections();

  // Node Management
  const addContainer = (target: InsertTarget) => {
    const newNode: ContainerNode = {
      id: crypto.randomUUID(),
      type: "container",
      format: "inherit",
      name: "New Container",
      children: [],
    };
    setNodes((prev) => insertNode(prev, target, newNode));
  };

  const addTextNode = (
    target: InsertTarget,
    initialContent?: Partial<ContentNode>,
  ) => {
    const newNode: ContentNode = {
      id: crypto.randomUUID(),
      type: "text",
      content: "",
      ...initialContent,
    };
    setNodes((prev) => insertNode(prev, target, newNode));
  };

  const deleteSelectedNode = (nodeId: string) => {
    setNodes((prev) => deleteNode(prev, nodeId));
    if (selections.selectedNodeId === nodeId) {
      selections.selectNode(null);
    }
  };

  const moveNodeTo = (nodeId: string, target: InsertTarget) => {
    console.log("Attempting to move node in context:", { nodeId, target });

    // Validate source and target nodes before attempting move
    try {
      // First check if the source node exists
      const sourceNode = getNode(nodes, nodeId);
      if (!sourceNode) {
        console.error("Source node not found:", nodeId);
        console.log("Current nodes:", nodes);
        return;
      }

      // Then check target node if specified
      if (target.id) {
        const targetNode = getNode(nodes, target.id);
        if (!targetNode) {
          console.error("Target node not found:", target.id);
          return;
        }

        // Check if target is a child of the source (prevent invalid moves)
        const isChild = targetNode.parents.some((parent) =>
          parent.id === nodeId
        );
        if (isChild) {
          console.error("Cannot move a node into its own child");
          return;
        }

        // Log the node hierarchy for debugging
        console.log("Valid move operation hierarchy:", {
          source: {
            id: nodeId,
            type: sourceNode.node.type,
            parents: sourceNode.parents.map((p) => ({
              id: p.id,
              type: p.type,
            })),
          },
          target: {
            id: target.id,
            type: targetNode.node.type,
            parents: targetNode.parents.map((p) => ({
              id: p.id,
              type: p.type,
            })),
          },
        });
      }

      // If all validation passes, perform the move
      console.log("Starting node move operation");
      setNodes((prev) => {
        try {
          const result = moveNode(nodeId, prev, target);
          console.log("Node move completed successfully");
          return result;
        } catch (error) {
          console.error("Move operation failed:", error);
          return prev; // Keep previous state on error
        }
      });
    } catch (error) {
      console.error("Failed to validate move operation:", error);
      if (error instanceof Error) {
        console.error({
          message: error.message,
          stack: error.stack,
          nodeId,
          target,
        });
      }
    }
  };

  // Node Updates
  const updateContainer = (nodeId: string, values: Partial<ContainerNode>) => {
    setNodes((prev) => updateContainerNode(prev, nodeId, values));
  };

  const updateContent = (nodeId: string, values: Partial<ContentNode>) => {
    setNodes((prev) => updateContentNode(prev, nodeId, values));
  };

  // Node Queries
  const findNode = (nodeId: string) => {
    return getNode(nodes, nodeId);
  };

  const findParentNode = (nodeId: string) => {
    return getParentNode(nodes, nodeId);
  };

  // Format Management
  const setFormat = (format: ContainerFormat) => {
    setDefaultContainerFormat(format);
  };

  // Import/Export
  const importFromJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString) as Node[];
      setNodes(parsed);
    } catch (error) {
      console.error("Failed to import JSON:", error);
    }
  };

  return {
    // State
    nodes,
    defaultContainerFormat,
    ...selections,

    // Node Management
    addContainer,
    addTextNode,
    deleteNode: deleteSelectedNode,
    moveNode: moveNodeTo,

    // Node Updates
    updateContainer,
    updateContent,

    // Node Queries
    findNode,
    findParentNode,

    // String Rendering
    outputString: renderFinalString(nodes, defaultContainerFormat),
    jsonString: renderJsonString(nodes),

    // Format Management
    setFormat,

    // Import/Export
    importFromJson,
  };
}

// PROVIDER / EXPORTS

type PromptBuilderContext = ReturnType<typeof usePromptBuilderContextLogic>;

const PromptBuilderContext = createContext<PromptBuilderContext | null>(null);

export const PromptBuilderProvider = (
  { children }: { children: React.ReactNode },
) => {
  const values = usePromptBuilderContextLogic();
  return (
    <PromptBuilderContext.Provider value={values}>
      {children}
    </PromptBuilderContext.Provider>
  );
};

export function usePromptBuilderContext() {
  const context = useContext(PromptBuilderContext);
  if (!context) {
    throw new Error(
      "usePromptBuilderContext must be used within a PromptBuilderProvider",
    );
  }
  return context;
}
