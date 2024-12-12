/** Base properties shared by all nodes */
export interface BaseNode {
    id: string;
}

/** Node containing text or file content */
export interface ContentNode extends BaseNode {
    type: "text" | "file";
    content: string;
    fileRef?: {
        path: string;
        type: string;
    };
}

/** Node that can contain other nodes with specific formatting */
export interface ContainerNode extends BaseNode {
    type: "container";
    format: "xml" | "markdown" | "numbered" | "raw" | "inherit";
    name: string;
    description?: string;
    children: Node[];
}

export type Node = ContentNode | ContainerNode;

export type InsertPosition = "before" | "after" | "inside";

export interface InsertTarget {
    id: string;
    position: InsertPosition;
}
