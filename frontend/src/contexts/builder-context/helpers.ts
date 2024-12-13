import { cloneDeep } from "lodash";
import type {
    ContainerFormat,
    ContainerNode,
    ContentNode,
    InsertTarget,
    Node,
} from "./types";

export function renderFinalString(
    nodes: Node[],
    baseContainerFormat: ContainerFormat = "raw",
): string {
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
                return [`\n<${name}>\n`, `\n</${name}>\n`];
            case "md":
                for (let i = 0; i < level.length; i++) {
                    x += "# ";
                }
                return [`\n${x}${name}\n`, "\n"];
            case "numbered-md":
                for (let i = 0; i < level.length; i++) {
                    x += "# ";
                }
                let y = "";
                level.forEach((l, i) => {
                    y += `${l}${i !== level.length - 1 ? "." : ""} `;
                });
                return [`\n${x}${y}${name}\n`, "\n"];
            case "raw":
                return [`\n[${name}]\n`, "\n[/${name}]\n"];
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
                str += node.content;
            }
        });

        str += endTag;

        return str;
    };

    let cur = 1;
    let result = "";
    for (const node of nodes) {
        if (node.type === "text") {
            result += `\n${node.content}`;
        }

        if (node.type === "container") {
            result += renderNodeContainer(node, baseContainerFormat, [cur]);
            cur++;
        }
    }

    return result;
}

export function renderJsonString(nodes: Node[]): string {
    return JSON.stringify(nodes, null, 2);
}

export function deleteNode(nodes: Node[], nodeId: string): Node[] {
    return nodes.reduce<Node[]>((acc, node) => {
        if (node.id === nodeId) {
            return acc;
        }

        if (node.type === "container") {
            return [...acc, {
                ...node,
                children: deleteNode(node.children, nodeId),
            }];
        }

        return [...acc, node];
    }, []);
}

export function getNode(
    nodes: Node[],
    nodeId: string,
    existingParents: Node[] = [],
): { node: Node; parents: Node[] } | null {
    for (const node of nodes) {
        const parents = [...existingParents];
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

export function insertNode(
    nodes: Node[],
    target: InsertTarget,
    newNode: Node,
): Node[] {
    const { id: targetId, position } = target;

    // Handle root-level insertion
    if (!targetId) {
        if (position === "before") {
            return [newNode, ...nodes];
        }
        return [...nodes, newNode];
    }

    // Handle nested insertion
    return nodes.map((node): Node | Node[] => {
        if (node.id === targetId) {
            if (position === "inside" && node.type === "container") {
                return {
                    ...node,
                    children: [...node.children, newNode],
                };
            }
            if (position === "before") {
                return [newNode, node];
            }
            if (position === "after") {
                return [node, newNode];
            }
            throw new Error("Invalid insert position");
        }

        if (node.type === "container") {
            const newChildren = insertNode(node.children, target, newNode);
            return {
                ...node,
                children: newChildren.flat(),
            };
        }

        return node;
    }).flat();
}

export function moveNode(
    nodeId: string,
    nodes: Node[],
    target: InsertTarget,
): Node[] {
    const nodeCopy = cloneDeep(getNode(nodes, nodeId));
    if (!nodeCopy) throw new Error("Node not found");

    // Check if target is a child of the node being moved
    if (target.id) {
        const targetNode = getNode(nodes, target.id);
        if (targetNode) {
            const isChild = targetNode.parents.some((parent) =>
                parent.id === nodeId
            );
            if (isChild) {
                throw new Error("Cannot move a node into its own child");
            }
        }
    }

    const newNodes = deleteNode(nodes, nodeId);
    return insertNode(newNodes, target, nodeCopy.node);
}

export function updateContainerNode(
    nodes: Node[],
    nodeId: string,
    values: Partial<ContainerNode>,
): Node[] {
    return nodes.map((node) => {
        if (node.id === nodeId) {
            if (node.type !== "container") {
                throw new Error("Node is not a container");
            }
            return {
                ...node,
                ...values,
                type: "container",
                children: node.children,
            };
        }

        if (node.type === "container") {
            return {
                ...node,
                children: updateContainerNode(node.children, nodeId, values),
            };
        }

        return node;
    });
}

export function updateContentNode(
    nodes: Node[],
    nodeId: string,
    values: Partial<ContentNode>,
): Node[] {
    return nodes.map((node) => {
        if (node.id === nodeId) {
            if (node.type !== "text") {
                throw new Error("Node is not a text node");
            }
            return {
                ...node,
                ...values,
                type: "text",
            };
        }

        if (node.type === "container") {
            return {
                ...node,
                children: updateContentNode(node.children, nodeId, values),
            };
        }

        return node;
    });
}
