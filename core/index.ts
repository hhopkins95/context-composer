export const foo = () => {
    console.log("Hello via Bun!");
};
import type { ContainerNode, ContentNode, InsertTarget, Node } from "./types";

export class NodeManager {
    rootContainer: ContainerNode;

    /**
     * Creates a new NodeManager with an optional initial root container
     * @param initialFormat - The format to use for the root container
     */
    constructor(initialFormat: ContainerNode["format"] = "markdown") {
        this.rootContainer = {
            id: this.generateId(),
            type: "container",
            format: initialFormat,
            name: "root",
            children: [],
        };
    }

    /**
     * Creates and inserts a new node at the specified target location
     * @param nodeType - The type of node to create
     * @param target - Where to insert the new node
     * @param initialContent - Optional initial content/properties for the node
     * @returns The newly created node
     * @throws If target location is invalid
     */
    createNode(
        nodeType: Node["type"],
        target: InsertTarget,
        initialContent?: Partial<ContentNode | ContainerNode>,
    ): Node {
        const baseNode = {
            id: this.generateId(),
            ...initialContent,
        };

        const newNode: Node = nodeType === "container"
            ? {
                ...baseNode,
                type: "container",
                format: (initialContent as Partial<ContainerNode>)?.format ||
                    "inherit",
                name: (initialContent as Partial<ContainerNode>)?.name ||
                    "new-container",
                children:
                    (initialContent as Partial<ContainerNode>)?.children || [],
            } as ContainerNode
            : {
                ...baseNode,
                type: nodeType,
                content: (initialContent as Partial<ContentNode>)?.content ||
                    "",
            } as ContentNode;

        this.insertNode(newNode, target);
        return newNode;
    }

    /**
     * Inserts an existing node at the specified target location
     * @param node - The node to insert
     * @param target - Where to insert the node
     * @throws If target location is invalid or would create a cycle
     */
    insertNode(node: Node, target: InsertTarget): void {
        if (!this.canInsertAt(node, target)) {
            throw new Error("Invalid insertion target");
        }

        const parentNode = target.position === "inside"
            ? this.getNode(target.id)
            : this.getParentNode(target.id);

        if (!parentNode || parentNode.type !== "container") {
            throw new Error("Invalid parent node");
        }

        if (target.position === "inside") {
            parentNode.children.push(node);
        } else {
            const siblings = parentNode.children;
            const targetIndex = siblings.findIndex((n) => n.id === target.id);
            if (targetIndex === -1) throw new Error("Target node not found");

            const insertIndex = target.position === "before"
                ? targetIndex
                : targetIndex + 1;
            siblings.splice(insertIndex, 0, node);
        }
    }

    /**
     * Updates an existing node with new properties
     * @param nodeId - ID of the node to update
     * @param updates - Partial updates to apply to the node
     * @throws If node doesn't exist or updates are invalid
     */
    updateNode(nodeId: string, updates: Partial<Node>): void {
        const node = this.getNode(nodeId);
        if (!node) throw new Error("Node not found");

        // Validate updates based on node type
        if (node.type !== (updates.type || node.type)) {
            throw new Error("Cannot change node type");
        }

        Object.assign(node, updates);
    }

    /**
     * Removes a node and its children from the tree
     * @param nodeId - ID of the node to remove
     * @throws If node doesn't exist
     */
    removeNode(nodeId: string): void {
        if (nodeId === this.rootContainer.id) {
            throw new Error("Cannot remove root container");
        }

        const parent = this.getParentNode(nodeId);
        if (!parent) throw new Error("Node not found");

        const index = parent.children.findIndex((n) => n.id === nodeId);
        if (index === -1) throw new Error("Node not found in parent");

        parent.children.splice(index, 1);
    }

    /**
     * Parses content string for templates and creates appropriate nodes
     * @param content - Content string to parse
     * @returns Array of nodes representing the parsed content
     */
    parseContent(content: string): Node[] {
        const nodes: Node[] = [];
        let currentText = "";
        let i = 0;

        while (i < content.length) {
            if (content[i] === "{" && content[i + 1] === "{") {
                // If we have accumulated text, add it as a node
                if (currentText) {
                    nodes.push({
                        id: this.generateId(),
                        type: "text",
                        content: currentText,
                    });
                    currentText = "";
                }

                // Find the closing brackets
                const start = i + 2;
                const end = content.indexOf("}}", start);
                if (end === -1) {
                    currentText += "{{";
                    i += 2;
                    continue;
                }

                // Create a container node for the template variable
                const variableName = content.slice(start, end).trim();
                nodes.push({
                    id: this.generateId(),
                    type: "container",
                    format: "inherit",
                    name: variableName,
                    children: [],
                });

                i = end + 2;
            } else {
                currentText += content[i];
                i++;
            }
        }

        // Add any remaining text
        if (currentText) {
            nodes.push({
                id: this.generateId(),
                type: "text",
                content: currentText,
            });
        }

        return nodes;
    }

    /**
     * Generates a string representation of the node tree or a specific node
     * @param nodeId - Optional ID of node to stringify (defaults to root)
     * @param formatContext - Optional format to use for inherit nodes
     * @returns Formatted string representation
     */
    toString(nodeId?: string, formatContext?: ContainerNode["format"]): string {
        const node = nodeId ? this.getNode(nodeId) : this.rootContainer;
        if (!node) throw new Error("Node not found");

        return this.nodeToString(
            node,
            formatContext || this.rootContainer.format,
        );
    }

    private nodeToString(
        node: Node,
        formatContext: ContainerNode["format"],
    ): string {
        if (node.type !== "container") {
            return node.content;
        }

        const format = node.format === "inherit" ? formatContext : node.format;
        const childContent = node.children
            .map((child) => this.nodeToString(child, format))
            .join("\n");

        switch (format) {
            case "xml":
                return `<${node.name}>${childContent}</${node.name}>`;
            case "markdown":
                return `# ${node.name}\n${childContent}`;
            case "numbered":
                return node.children
                    .map((child, index) =>
                        `${index + 1}. ${this.nodeToString(child, format)}`
                    )
                    .join("\n");
            case "raw":
            default:
                return childContent;
        }
    }

    /**
     * Finds a node by ID
     * @param nodeId - ID of node to find
     * @returns The found node or null
     */
    getNode(nodeId: string): Node | null {
        return this.findNode(this.rootContainer, nodeId);
    }
    private findNode(current: Node, id: string): Node | null {
        if (current.id === id) return current;
        if (current.type !== "container") return null;

        for (const child of current.children) {
            const found = this.findNode(child, id);
            if (found) return found;
        }

        return null;
    }

    /**
     * Gets the parent node of a given node
     * @param nodeId - ID of node to find parent for
     * @returns The parent node or null if node is root or doesn't exist
     */
    getParentNode(nodeId: string): ContainerNode | null {
        return this.findParentNode(this.rootContainer, nodeId);
    }

    private findParentNode(
        current: ContainerNode,
        childId: string,
    ): ContainerNode | null {
        for (const child of current.children) {
            if (child.id === childId) return current;
            if (child.type === "container") {
                const found = this.findParentNode(child, childId);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Validates if a node can be inserted at a target location
     * @param node - Node to validate
     * @param target - Target location
     * @returns True if insertion would be valid
     */
    canInsertAt(node: Node, target: InsertTarget): boolean {
        // Can't insert if target doesn't exist
        const targetNode = this.getNode(target.id);
        if (!targetNode) return false;

        // Can only insert 'inside' container nodes
        if (target.position === "inside" && targetNode.type !== "container") {
            return false;
        }

        // Check for cycles
        if (node.type === "container") {
            let current = targetNode;
            while (current) {
                if (current.id === node.id) return false;
                const new_current = this.getParentNode(current.id);
                if (!new_current) break;
                current = new_current;
            }
        }

        return true;
    }

    /**
     * Gets the effective format for a container node considering inheritance
     * @param nodeId - ID of container node
     * @returns The effective format to use
     * @throws If node doesn't exist or isn't a container
     */
    getEffectiveFormat(
        nodeId: string,
    ): ContainerNode["format"] {
        const node = this.getNode(nodeId);
        if (!node || node.type !== "container") {
            throw new Error("Node not found or not a container");
        }

        let current: ContainerNode | null = node as ContainerNode;
        while (current) {
            if (current.format !== "inherit") {
                return current.format;
            }
            current = this.getParentNode(current.id);
        }

        return this.rootContainer.format;
    }

    /**
     * Serializes the node tree to JSON
     * @returns JSON string representation of the tree
     */
    serialize(): string {
        return JSON.stringify(this.rootContainer);
    }

    /**
     * Restores node tree from serialized JSON
     * @param json - Serialized JSON string
     * @throws If JSON is invalid
     */
    deserialize(json: string): void {
        try {
            const parsed = JSON.parse(json);
            // Basic validation
            if (parsed.type !== "container") {
                throw new Error("Root must be a container node");
            }
            this.rootContainer = parsed;
        } catch (e) {
            throw new Error("Invalid JSON format");
        }
    }

    /**
     * Generates a unique ID for a new node
     * @private
     */
    generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
}
