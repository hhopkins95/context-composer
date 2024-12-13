/**
 * TYPES
 */
export interface ContentNode {
    id: string;
    type: "text";
    content: string;
    fileRef?: {
        path: string;
        type: string;
    };
}

export type ContainerFormat =
    | "xml"
    | "md"
    | "numbered-md"
    | "raw";

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
