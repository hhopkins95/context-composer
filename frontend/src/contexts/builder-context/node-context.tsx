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

  const selectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  return {
    expandedNodeIds,
    toggleNodeCollapse,
    selectNode,
  };
};

function usePromptBuilderContextLogic() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [defaultContainerFormat, setDefaultContainerFormat] = useState<
    ContainerFormat
  >("raw");
  const selections = useNodeSelections();

  const insert = (target: InsertTarget, node: Node) => {
    setNodes((prev) => insertNode(prev, target, node));
  };

  return {
    nodes,
    // nodes: rootContainer.children,
    // selectedNode,
    // collapsedNodes,
    // addNode,
    // updateNode,
    // deleteNode,
    // moveNode,
    // setSelectedNode,
    // toggleNodeCollapse: (nodeId: string) => {
    //   setCollapsedNodes((prev) => {
    //     const next = new Set(prev);
    //     if (next.has(nodeId)) {
    //       next.delete(nodeId);
    //     } else {
    //       next.add(nodeId);
    //     }
    //     return next;
    //   });
    // },
    // getNode,
    // getParentNode,
    // parseContent,
    // toString,
  };
}

// PROVIDER / EXPORTS

type PromptBuilderContext = ReturnType<typeof usePromptBuilderContextLogic>;

const PromptBuilderContext = createContext<PromptBuilderContext | null>(null!);

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
