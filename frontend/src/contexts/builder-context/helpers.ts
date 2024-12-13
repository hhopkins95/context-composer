import { cloneDeep } from "lodash";
import type {
    ContainerFormat,
    ContainerNode,
    ContentNode,
    InsertTarget,
    Node,
} from "./types";

// HELPERS
/**
 * Renders the final string from the nodes.
 * @param nodes The nodes to render.
 * @returns The final string.
 */
export function renderFinalString(
    nodes: Node[],
    baseContainerFormat: ContainerFormat = "raw",
): string {
    let str = "";

    const getTags = ({
        name,
        format,
        level,
    }: { name?: string; format: ContainerFormat; level: number[] }): [
        string,
        string,
    ] => {
        let x = "";
        switch (format) {
            case "xml":
                return [`\n <${name}> \n`, `\n </${name}> \n`];
            case "md":
                for (let i = 0; i < level.length; i++) {
                    x += "# ";
                }
                return [`\n ${x} ${name} \n`, "\n"];
            case "numbered-md":
                for (let i = 0; i < level.length; i++) {
                    x += "# ";
                }
                let y = "";
                level.forEach((l, i) => {
                    y += `${l}${i !== level.length - 1 ? ". " : " "}`;
                });
                return [`\n ${x} ${y} ${name} \n`, "\n"];
            case "raw":
                return ["\n", "\n"];
            default:
                return ["\n", "\n"];
        }
    };

    const renderNodeContainer = (
        container: ContainerNode,
        curContainerFormat: ContainerFormat,
        curLevel: number[] = [],
    ): string => {
        let str = "";
        let level = [...curLevel];
        const format = container.format === "inherit"
            ? curContainerFormat
            : container.format;
        if (format !== curContainerFormat) {
            level = [1];
        }

        const [startTag, endTag] = getTags({
            name: container.name,
            format,
            level: level,
        });
        str += startTag;

        let sublevel = 1;
        container.children.forEach((node) => {
            if (node.type === "container") {
                str += renderNodeContainer(node, format, [
                    ...level,
                    sublevel,
                ]);
                sublevel++;
            }
            if (node.type === "text") {
                // const indent = level.map(() => "   ").join("");
                // str += `${indent}`;
                str += node.content;
            }
        });

        str += endTag;

        return str;
    };

    let cur = 1;
    for (const node of nodes) {
        if (node.type === "text") {
            str += `\n` + node.content;
        }

        if (node.type === "container") {
            str += `\n` + renderNodeContainer(node, baseContainerFormat, [cur]);
            cur++;
        }
    }

    return str;
}

/**
 * Renders the JSON string from the nodes. Can be used to save the node tree as a template
 * @param nodes The nodes to render.
 * @returns The JSON string.
 */
export function renderJsonString(nodes: Node[]): string {
    return JSON.stringify(nodes, null, 2);
}

/**
 * Deletes a node from a list of nodes.
 * @param nodes The nodes to delete from.
 * @param nodeId The ID of the node to delete.
 * @returns The new list of nodes.
 */
export function deleteNode(nodes: Node[], nodeId: string): Node[] {
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
}

/**
 * Finds a node in a list of nodes.
 * @param nodes The nodes to search.
 * @param nodeId The ID of the node to find.
 * @returns The node if found, and a list of all parent nodes beginning with the root, null if not found.
 */
export function getNode(
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
export function getParentNode(
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
export function insertNode(
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
/**
 * Moves a node to a new position in the tree.
 *
 * @param node_id The ID of the node to move.
 * @param nodes The list of nodes in the tree.
 * @param target The target position for the node.
 * @returns The updated list of nodes.
 */
export function moveNode(
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

export function updateContainerNode(
    nodes: Node[],
    node_id: string,
    values: Partial<ContainerNode>,
) {
    const node = getNode(nodes, node_id);
    if (!node) throw new Error("Node not found");
    let { node: foundNode, parents } = node;
    if (foundNode.type !== "container") {
        throw new Error("Node is not a container");
    }
    Object.assign(foundNode, {
        ...values,
        id: node_id,
        children: foundNode.children,
    });
    return nodes;
}

export function updateContentNode(
    nodes: Node[],
    node_id: string,
    values: Partial<ContentNode>,
) {
    const node = getNode(nodes, node_id);
    if (!node) throw new Error("Node not found");
    let { node: foundNode, parents } = node;
    if (foundNode.type !== "text") {
        throw new Error("Node is not a text node");
    }
    Object.assign(foundNode, {
        ...values,
        id: node_id,
    });
    return nodes;
}
