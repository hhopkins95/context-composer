import { createContext, useContext, useState } from "react";
import { cloneDeep } from "lodash";

/**
 * TYPES
 */
export interface ContentNode {
  id: string;
  type: "text" | "file";
  content: string;
  fileRef?: {
    path: string;
    type: string;
  };
}

export type ContainerFormat =
  | "xml"
  | "md"
  | "numbered-md";

export interface ContainerNode {
  id: string;
  type: "container";
  format: ContainerFormat | "inherit";
  name: string;
  description?: string;
  children: Node[];
}

export type Node = ContentNode | ContainerNode;

export interface InsertTarget {
  id?: string;
  position: "before" | "after" | "inside";
}

// HELPERS
/**
 * Renders the final string from the nodes.
 * @param nodes The nodes to render.
 * @returns The final string.
 */
function renderFinalString(nodes: Node[]): string {
  return "TODO"; // nodes.map((node) => node.content).join("");
}

/**
 * Renders the JSON string from the nodes. Can be used to save the node tree as a template
 * @param nodes The nodes to render.
 * @returns The JSON string.
 */
function renderJsonString(nodes: Node[]): string {
  return JSON.stringify(nodes, null, 2);
}

/**
 * Deletes a node from a list of nodes.
 * @param nodes The nodes to delete from.
 * @param nodeId The ID of the node to delete.
 * @returns The new list of nodes.
 */
function deleteNode(nodes: Node[], nodeId: string): Node[] {
  nodes.forEach((node, idx) => {
    if (node.id == nodeId) {
      nodes.splice(idx, 1);
      return;
    }

    if (node.type == "container") {
      deleteNode(node.children, nodeId);
    }
  });

  return nodes;
  // let newNodes: Node[] = [];
  // nodes.forEach((node) => {
  //   if (node.id !== nodeId) {
  //     if (node.type == "container") {
  //       let newChildren: Node[] = deleteNode(node.children, nodeId);
  //       newNodes.push({ ...node, children: newChildren });
  //     } else {
  //       newNodes.push(node);
  //     }
  //   }
  // });

  // return newNodes;
}

/**
 * Finds a node in a list of nodes.
 * @param nodes The nodes to search.
 * @param nodeId The ID of the node to find.
 * @returns The node if found, and a list of all parent nodes beginning with the root, null if not found.
 */
function getNode(
  nodes: Node[],
  nodeId: string,
  existingParents: Node[] = [],
): { node: Node; parents: Node[] } | null {
  for (const node of nodes) {
    let parents: Node[] = [...existingParents];
    if (node.id === nodeId) {
      return { node, parents };
    }
    if (node.type === "container") {
      parents.push(node);
      const found = getNode(node.children, nodeId, parents);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Finds the parent node of a node in a list of nodes.
 * @param nodes The nodes to search.
 * @param nodeId The ID of the node to find the parent of.
 * @returns The parent node if found, and a list of all parent nodes beginning with the root, null if not found.
 */
function getParentNode(
  nodes: Node[],
  nodeId: string,
): { node: Node; parents: Node[] } | null {
  const found = getNode(nodes, nodeId);
  if (found) {
    if (found.parents.length === 0) return null;
    return {
      node: found.parents[found.parents.length - 1],
      parents: found.parents.slice(0, found.parents.length - 1),
    };
  }
  return null;
}

/**
 * @param nodes
 * @param target
 * @param newNode
 * @returns
 */
function insertNode(
  nodes: Node[],
  target: InsertTarget,
  newNode: Node,
): Node[] {
  const { id: target_id, position } = target;
  if (!target_id) { // entered at the root
    if (position === "before") {
      nodes.unshift(newNode);
    } else {
      nodes.push(newNode);
    }
    return nodes;
  }

  const target_node = getNode(nodes, target_id);
  if (!target_node) throw new Error("Target node not found");
  const { node, parents } = target_node;

  // Handle insertion inside
  if (position == "inside") {
    if (node.type !== "container") {
      throw new Error("Cannot insert inside non-container node");
    }
    node.children.push(newNode);
    return nodes;
  }

  // Handle insertion before/after the root
  if (parents.length === 0) { // Target node is a root node
    const idx = nodes.indexOf(node);
    if (position === "before") {
      nodes.splice(idx, 0, newNode);
    } else {
      nodes.splice(idx + 1, 0, newNode);
    }
    return nodes;
  }

  // Handle insertion before/after a non-root node
  const parent = parents[parents.length - 1];
  if (parent.type !== "container") {
    throw new Error("Something went wrong -- should never happen");
  }
  const idx = parent.children.indexOf(node);
  if (position === "before") {
    parent.children.splice(idx, 0, newNode);
  } else {
    parent.children.splice(idx + 1, 0, newNode);
  }
  return nodes;
}

function moveNode(
  node_id: string,
  nodes: Node[],
  target: InsertTarget,
): Node[] {
  const nodeCopy = cloneDeep(getNode(nodes, node_id));
  if (!nodeCopy) throw new Error("Node not found");

  // Make sure the target is not a child of the node
  if (target.id) {
    const targetNode = getNode(nodes, target.id);
    if (targetNode?.parents) {
      for (const parent of targetNode.parents) {
        if (parent.id === node_id) {
          throw new Error("Cannot move a node into its own child");
        }
      }
    }
  }

  nodeCopy.node.id = crypto.randomUUID(); // temp id

  try {
    insertNode(nodes, target, nodeCopy.node); // insert the copy at the correct place
    deleteNode(nodes, node_id); // delete the original from the list
    nodeCopy.node.id = node_id; // change the id back
    return nodes;
  } catch (e) {
    throw e;
  }
}

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
  >("xml");
  const selections = useNodeSelections();

  // // Helper function to generate unique IDs
  // function generateId(): string {
  //   return Date.now().toString(36) + Math.random().toString(36).substring(2);
  // }

  // // Helper function to find a node by ID
  // function getNode(nodeId: string): Node | null {
  //   if (rootContainer.id === nodeId) return rootContainer;

  //   function findNode(nodes: Node[]): Node | null {
  //     for (const node of nodes) {
  //       if (node.id === nodeId) return node;
  //       if (node.type === "container") {
  //         const found = findNode(node.children);
  //         if (found) return found;
  //       }
  //     }
  //     return null;
  //   }

  //   return findNode(rootContainer.children);
  // }

  // // Helper function to find a node's parent
  // function getParentNode(nodeId: string): ContainerNode | null {
  //   function findParent(
  //     nodes: Node[],
  //     parent: ContainerNode,
  //   ): ContainerNode | null {
  //     for (const node of nodes) {
  //       if (node.id === nodeId) return parent;
  //       if (node.type === "container") {
  //         const found = findParent(node.children, node as ContainerNode);
  //         if (found) return found;
  //       }
  //     }
  //     return null;
  //   }

  //   return findParent(rootContainer.children, rootContainer);
  // }

  // // Helper function to check if a node can be inserted at a target
  // function canInsertAt(node: Node, target: InsertTarget): boolean {
  //   if (target.id === node.id) return false;

  //   function isDescendant(parent: Node, child: Node): boolean {
  //     if (parent.type !== "container") return false;
  //     return parent.children.some((n) =>
  //       n.id === child.id || (n.type === "container" && isDescendant(n, child))
  //     );
  //   }

  //   const targetNode = getNode(target.id);
  //   return targetNode !== null && !isDescendant(node, targetNode);
  // }

  // function addNode(parentId: string | null, nodeType: Node["type"]) {
  //   const newNode: Node = nodeType === "container"
  //     ? {
  //       id: generateId(),
  //       type: "container",
  //       format: "inherit",
  //       name: "new-container",
  //       children: [],
  //     }
  //     : {
  //       id: generateId(),
  //       type: nodeType,
  //       content: "",
  //     };

  //   const target: InsertTarget = {
  //     id: parentId || rootContainer.id,
  //     position: "inside",
  //   };

  //   if (!canInsertAt(newNode, target)) {
  //     console.error("Invalid insertion target");
  //     return;
  //   }

  //   setRootContainer((prev) => {
  //     const updated = { ...prev };
  //     const parent = target.id === rootContainer.id
  //       ? updated
  //       : getNode(target.id);

  //     if (!parent || parent.type !== "container") {
  //       console.error("Invalid parent node");
  //       return prev;
  //     }

  //     parent.children.push(newNode);
  //     return updated;
  //   });
  // }

  // function updateNode(updatedNode: Node) {
  //   const node = getNode(updatedNode.id);
  //   if (!node) {
  //     console.error("Node not found");
  //     return;
  //   }

  //   if (node.type !== updatedNode.type) {
  //     console.error("Cannot change node type");
  //     return;
  //   }

  //   setRootContainer((prev) => {
  //     const updated = { ...prev };
  //     const nodeToUpdate = getNode(updatedNode.id);
  //     if (nodeToUpdate) {
  //       Object.assign(nodeToUpdate, updatedNode);
  //     }
  //     return updated;
  //   });
  // }

  // function deleteNode(nodeId: string) {
  //   if (nodeId === rootContainer.id) {
  //     console.error("Cannot remove root container");
  //     return;
  //   }

  //   setRootContainer((prev) => {
  //     const updated = { ...prev };
  //     const parent = getParentNode(nodeId);

  //     if (!parent) {
  //       console.error("Node not found");
  //       return prev;
  //     }

  //     const index = parent.children.findIndex((n) => n.id === nodeId);
  //     if (index !== -1) {
  //       parent.children.splice(index, 1);
  //     }

  //     return updated;
  //   });

  //   if (selectedNode?.id === nodeId) {
  //     setSelectedNode(null);
  //   }
  // }

  // function moveNode(
  //   draggedId: string,
  //   targetId: string,
  //   position: InsertPosition,
  // ) {
  //   const draggedNode = getNode(draggedId);
  //   if (!draggedNode) {
  //     console.error("Dragged node not found");
  //     return;
  //   }

  //   const target: InsertTarget = { id: targetId, position };
  //   if (!canInsertAt(draggedNode, target)) {
  //     console.error("Invalid move target");
  //     return;
  //   }

  //   setRootContainer((prev) => {
  //     const updated = { ...prev };

  //     // Remove node from current position
  //     const sourceParent = getParentNode(draggedId);
  //     if (sourceParent) {
  //       const index = sourceParent.children.findIndex((n) =>
  //         n.id === draggedId
  //       );
  //       if (index !== -1) {
  //         sourceParent.children.splice(index, 1);
  //       }
  //     }

  //     // Insert at new position
  //     const targetParent = position === "inside"
  //       ? getNode(targetId)
  //       : getParentNode(targetId);

  //     if (!targetParent || targetParent.type !== "container") {
  //       console.error("Invalid target parent");
  //       return prev;
  //     }

  //     if (position === "inside") {
  //       targetParent.children.push(draggedNode);
  //     } else {
  //       const targetIndex = targetParent.children.findIndex((n) =>
  //         n.id === targetId
  //       );
  //       const insertIndex = position === "before"
  //         ? targetIndex
  //         : targetIndex + 1;
  //       targetParent.children.splice(insertIndex, 0, draggedNode);
  //     }

  //     return updated;
  //   });
  // }

  // function parseContent(content: string): Node[] {
  //   const nodes: Node[] = [];
  //   let currentText = "";
  //   let i = 0;

  //   while (i < content.length) {
  //     if (content[i] === "{" && content[i + 1] === "{") {
  //       if (currentText) {
  //         nodes.push({
  //           id: generateId(),
  //           type: "text",
  //           content: currentText,
  //         });
  //         currentText = "";
  //       }

  //       const start = i + 2;
  //       const end = content.indexOf("}}", start);
  //       if (end === -1) {
  //         currentText += "{{";
  //         i += 2;
  //         continue;
  //       }

  //       const variableName = content.slice(start, end).trim();
  //       nodes.push({
  //         id: generateId(),
  //         type: "container",
  //         format: "inherit",
  //         name: variableName,
  //         children: [],
  //       });

  //       i = end + 2;
  //     } else {
  //       currentText += content[i];
  //       i++;
  //     }
  //   }

  //   if (currentText) {
  //     nodes.push({
  //       id: generateId(),
  //       type: "text",
  //       content: currentText,
  //     });
  //   }

  //   return nodes;
  // }

  // function toString(
  //   nodeId?: string,
  //   formatContext?: ContainerNode["format"],
  // ): string {
  //   const node = nodeId ? getNode(nodeId) : rootContainer;
  //   if (!node) throw new Error("Node not found");

  //   function nodeToString(node: Node, format: ContainerNode["format"]): string {
  //     if (node.type !== "container") {
  //       return node.content;
  //     }

  //     const nodeFormat = node.format === "inherit" ? format : node.format;
  //     const childStrings = node.children.map((child) =>
  //       nodeToString(child, nodeFormat)
  //     );

  //     switch (nodeFormat) {
  //       case "xml":
  //         return `<${node.name}>${childStrings.join("")}</${node.name}>`;
  //       case "markdown":
  //         return `${node.name}\n${childStrings.join("\n")}`;
  //       case "numbered":
  //         return childStrings.map((str, i) => `${i + 1}. ${str}`).join("\n");
  //       case "raw":
  //       default:
  //         return childStrings.join("");
  //     }
  //   }

  //   return nodeToString(node, formatContext || "raw");
  // }

  const value = {
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

  return { ...value };
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

const base: ContainerNode = {
  id: "1",
  type: "container",
  format: "md",
  name: "one",
  children: [
    {
      id: "1-1",
      type: "container",
      format: "inherit",
      name: "two",
      children: [
        {
          id: "1-1-1",
          type: "text",
          content: "four",
        },
      ],
    },
    {
      id: "1-2",
      type: "text",
      content: "three",
    },
    {
      id: "1-3",
      type: "container",
      format: "inherit",
      name: "two",
      children: [],
    },
  ],
};
const base2: ContainerNode = {
  id: "2",
  type: "container",
  format: "md",
  name: "one",
  children: [],
};

const getRandomNode = () => {
  return {
    id: crypto.randomUUID(),
    type: "text",
    content: "four",
  } as Node;
};

const nodes = [base, base2];
const copy = cloneDeep(nodes); // JSON.parse(JSON.stringify(nodes));

moveNode("1", copy, { position: "after", id: "2" });

console.log("____________ Original");
console.log(JSON.stringify(nodes, null, 2));
console.log("____________ Copy");
console.log(JSON.stringify(copy, null, 2));
