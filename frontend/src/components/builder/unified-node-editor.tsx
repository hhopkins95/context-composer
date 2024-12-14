import { useEffect, useRef, useState } from "react";
import type {
    ContainerNode,
    ContentNode,
    InsertTarget,
    Node,
} from "../../contexts/builder-context/types";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { useDrag, useDrop } from "react-dnd";
import { usePromptBuilderContext } from "../../contexts/builder-context/node-context";
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Settings,
    Trash2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { api } from "../../lib/api";

// Types remain the same...
type NodeDragItem = {
    id: string;
    type: "NODE";
};

type FileDragItem = {
    type: "FILE";
    path: string;
    name: string;
    fileType: string;
};

type DragItem = NodeDragItem | FileDragItem;

const nodeStyles = {
    container: {
        xml: "bg-blue-50/50 border-blue-200 hover:bg-blue-100/50",
        md: "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50",
        "numbered-md":
            "bg-violet-50/50 border-violet-200 hover:bg-violet-100/50",
        raw: "bg-amber-50/50 border-amber-200 hover:bg-amber-100/50",
        inherit: "bg-gray-50/50 border-gray-200 hover:bg-gray-100/50",
    },
    content: "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50",
};

// Helper function to handle file drops
async function handleFileDrop(
    item: FileDragItem,
    target: InsertTarget,
    addContainer: (target: InsertTarget) => void,
    addTextNode: (
        target: InsertTarget,
        initialContent?: Partial<ContentNode>,
    ) => void,
    updateContainer: (nodeId: string, values: Partial<ContainerNode>) => void,
    findLastAddedNode: () => Node | undefined,
    selectedDirectory: string,
) {
    // Create a container node for the file
    const containerTarget = { ...target };
    addContainer(containerTarget);

    // Get the ID of the newly created container
    const newNode = findLastAddedNode();
    if (!newNode) {
        console.error("Failed to find newly created container node");
        return;
    }

    // Update the container's name to the relative path
    updateContainer(newNode.id, { name: item.path });

    try {
        // Get the file contents using the correct API endpoint with the full path
        const fullPath = `${selectedDirectory}/${item.path}`;
        const response = await (await api.api.file.$get({
            query: { path: fullPath },
        })).json();

        // Create a text node with the file contents as a child of the container
        addTextNode(
            { id: newNode.id, position: "inside" },
            {
                content: response.fileContent,
                fileRef: {
                    path: item.path, // Keep the relative path in the fileRef
                    type: item.fileType,
                },
            },
        );
    } catch (error) {
        console.error("Failed to read file:", error);
        // If file read fails, at least show the file name
        addTextNode(
            { id: newNode.id, position: "inside" },
            {
                content: `Failed to read file: ${item.name}`,
                fileRef: {
                    path: item.path,
                    type: item.fileType,
                },
            },
        );
    }
}

// Rest of the file remains unchanged...
interface NodeSettingsProps {
    node: ContainerNode;
    onClose: () => void;
}

const NodeSettings = ({ node, onClose }: NodeSettingsProps) => {
    const { updateContainer } = usePromptBuilderContext();

    return (
        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md p-4 min-w-[200px]">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Format</label>
                    <Select
                        value={node.format}
                        onValueChange={(value: ContainerNode["format"]) =>
                            updateContainer(node.id, { format: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="xml">XML</SelectItem>
                            <SelectItem value="md">Markdown</SelectItem>
                            <SelectItem value="numbered-md">
                                Numbered Markdown
                            </SelectItem>
                            <SelectItem value="raw">Raw</SelectItem>
                            <SelectItem value="inherit">Inherit</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Description</label>
                    <input
                        type="text"
                        className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
                        value={node.description || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateContainer(node.id, {
                                description: e.target.value,
                            })}
                        placeholder="Optional description"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
};

const NodeItem = ({
    node,
    level,
    draggedNodeId,
}: {
    node: Node;
    level: number;
    draggedNodeId: string | null;
}) => {
    const {
        expandedNodeIds,
        toggleNodeCollapse,
        updateContainer,
        updateContent,
        addContainer,
        addTextNode,
        deleteNode,
        moveNode,
        nodes: allNodes,
    } = usePromptBuilderContext();

    const [isEditing, setIsEditing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [dropPosition, setDropPosition] = useState<
        "before" | "after" | "inside" | null
    >(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);

    const isCollapsed = !expandedNodeIds.has(node.id);
    const isContainer = node.type === "container";
    const nodeRef = useRef<HTMLDivElement>(null);

    // Clean up drop position when component unmounts or node changes
    useEffect(() => {
        return () => setDropPosition(null);
    }, [node.id]);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: "NODE",
        item: () => {
            console.log("Starting drag for node:", {
                id: node.id,
                type: "NODE",
                exists: !!allNodes.find((n) => n.id === node.id),
            });
            return { id: node.id, type: "NODE" };
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
        end: () => {
            setDropPosition(null);
        },
    }), [node.id, allNodes]);

    // Skip drop handling if this is the node being dragged
    const [{ isOver, isOverCurrent }, drop] = useDrop(() => ({
        accept: ["NODE", "FILE"],
        canDrop: (item: DragItem) => {
            if (item.type === "NODE") {
                return item.id !== node.id;
            }
            return true;
        },
        hover: (item: DragItem, monitor) => {
            if (!monitor.isOver({ shallow: true })) {
                return;
            }
            if (item.type === "NODE" && item.id === node.id) {
                return;
            }

            const clientOffset = monitor.getClientOffset();
            const hoverBoundingRect = nodeRef.current?.getBoundingClientRect();

            if (!clientOffset || !hoverBoundingRect) return;

            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            const hoverHeight = hoverBoundingRect.bottom -
                hoverBoundingRect.top;

            let newPosition: "before" | "after" | "inside" | null = null;

            // Increased zones for before/after (40% each, leaving 20% for inside)
            if (hoverClientY < hoverHeight * 0.4) {
                newPosition = "before";
            } else if (hoverClientY > hoverHeight * 0.6) {
                newPosition = "after";
            } else if (isContainer) {
                newPosition = "inside";
            }

            if (newPosition !== dropPosition) {
                setDropPosition(newPosition);
            }
        },
        drop: async (item: DragItem, monitor) => {
            if (!monitor.isOver({ shallow: true })) {
                return;
            }
            if (item.type === "NODE") {
                if (item.id === node.id) return;
                moveNode(item.id, {
                    id: node.id,
                    position: dropPosition || "after",
                });
            } else if (item.type === "FILE") {
                await handleFileDrop(
                    item,
                    {
                        id: node.id,
                        position: dropPosition || "after",
                    },
                    addContainer,
                    addTextNode,
                    updateContainer,
                    () => allNodes[allNodes.length - 1],
                    localStorage.getItem("explorer-selected-directory") || "",
                );
            }

            setDropPosition(null);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            isOverCurrent: !!monitor.isOver({ shallow: true }),
        }),
    }), [node.id, dropPosition, allNodes]);

    // Rest of NodeItem component remains exactly the same...
    drag(drop(nodeRef));

    const handleDoubleClick = () => {
        setIsEditing(true);
        setTimeout(() => {
            if (isContainer) {
                editInputRef.current?.focus();
            } else {
                editTextareaRef.current?.focus();
            }
        }, 50);
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            setIsEditing(false);
        }
        if (e.key === "Escape") {
            setIsEditing(false);
        }
    };

    const nodeStyle = isContainer
        ? nodeStyles.container[(node as ContainerNode).format]
        : nodeStyles.content;

    return (
        <div
            ref={nodeRef}
            className={`pl-4 relative ${
                isDragging ? "opacity-50 scale-95 transition-transform" : ""
            }`}
            onMouseLeave={() => {
                setDropPosition(null);
            }}
        >
            {isOverCurrent && dropPosition === "before" && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 -translate-y-[2px] z-10" />
            )}
            {isOverCurrent && dropPosition === "after" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 translate-y-[2px] z-10" />
            )}
            <div
                className={`flex items-center gap-3 p-3 rounded-md border group relative transition-all duration-200
                    ${nodeStyle}
                    ${
                    isOverCurrent && dropPosition === "inside"
                        ? "ring-2 ring-blue-500"
                        : ""
                }
                    ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            >
                {isContainer && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="p-0 h-6 w-6 hover:bg-transparent"
                        onClick={() => toggleNodeCollapse(node.id)}
                    >
                        {isCollapsed
                            ? <ChevronRight className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                    </Button>
                )}
                <span
                    onDoubleClick={handleDoubleClick}
                    className="flex-grow hover:text-foreground/80 min-h-[24px] transition-colors duration-200"
                >
                    {isEditing
                        ? (
                            isContainer
                                ? (
                                    <input
                                        ref={editInputRef}
                                        type="text"
                                        className="bg-background border rounded px-2 py-1 w-[calc(100%-24px)]"
                                        value={(node as ContainerNode).name}
                                        onChange={(
                                            e: React.ChangeEvent<
                                                HTMLInputElement
                                            >,
                                        ) => updateContainer(node.id, {
                                            name: e.target.value,
                                        })}
                                        onBlur={handleBlur}
                                        onKeyDown={handleKeyDown}
                                    />
                                )
                                : (
                                    <Textarea
                                        ref={editTextareaRef}
                                        className="w-full mt-1"
                                        value={(node as ContentNode).content}
                                        onChange={(
                                            e: React.ChangeEvent<
                                                HTMLTextAreaElement
                                            >,
                                        ) => updateContent(node.id, {
                                            content: e.target.value,
                                        })}
                                        onBlur={handleBlur}
                                        onKeyDown={handleKeyDown}
                                    />
                                )
                        )
                        : isContainer
                        ? (
                            (node as ContainerNode).name
                        )
                        : (
                            (node as ContentNode).content.substring(0, 50) +
                            ((node as ContentNode).content.length > 50
                                ? "..."
                                : "")
                        )}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {isContainer && (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 hover:bg-background/80"
                                onClick={() => setShowSettings(!showSettings)}
                                title="Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 hover:bg-background/80"
                                onClick={() =>
                                    addContainer({
                                        id: node.id,
                                        position: "inside",
                                    })}
                                title="Add Container Node"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 hover:bg-background/80"
                                onClick={() =>
                                    addTextNode({
                                        id: node.id,
                                        position: "inside",
                                    })}
                                title="Add Text Node"
                            >
                                <Plus className="w-4 h-4 text-blue-500" />
                            </Button>
                        </>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-background/80"
                        onClick={() => deleteNode(node.id)}
                        title="Delete Node"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
                {showSettings && isContainer && (
                    <NodeSettings
                        node={node as ContainerNode}
                        onClose={() => setShowSettings(false)}
                    />
                )}
            </div>
            {isContainer && !isCollapsed &&
                (node as ContainerNode).children.length > 0 && (
                <div className="pl-4">
                    {(node as ContainerNode).children.map((childNode) => (
                        <NodeItem
                            key={childNode.id}
                            node={childNode}
                            level={level + 1}
                            draggedNodeId={draggedNodeId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function UnifiedNodeEditor() {
    const { nodes, addContainer, addTextNode, moveNode, updateContainer } =
        usePromptBuilderContext();
    const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(
        null,
    );
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    // Handle drops at the root level
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ["NODE", "FILE"],
        hover: (item: DragItem, monitor) => {
            if (!rootRef.current) return;

            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;

            const containerRect = rootRef.current.getBoundingClientRect();
            const containerHeight = containerRect.bottom - containerRect.top;
            const hoverY = clientOffset.y - containerRect.top;

            // If hovering in the top 20% of the container, show "before" indicator
            // If hovering in the bottom 20% of the container, show "after" indicator
            let newPosition: "before" | "after" | null = null;
            if (hoverY < containerHeight * 0.2) {
                newPosition = "before";
            } else if (hoverY > containerHeight * 0.8) {
                newPosition = "after";
            }

            setDropPosition(newPosition);
        },
        drop: async (item: DragItem, monitor) => {
            if (!dropPosition) return;

            if (item.type === "NODE") {
                // Move to root level (no target id)
                moveNode(item.id, { position: dropPosition });
            } else if (item.type === "FILE") {
                await handleFileDrop(
                    item,
                    { position: dropPosition },
                    addContainer,
                    addTextNode,
                    updateContainer,
                    () => nodes[nodes.length - 1],
                    localStorage.getItem("explorer-selected-directory") || "",
                );
            }
            setDropPosition(null);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }), [dropPosition, nodes]);

    drop(rootRef);

    return (
        <ScrollArea className="h-full">
            <div
                ref={rootRef}
                className="min-h-[200px] relative"
            >
                {isOver && dropPosition === "before" && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 z-10" />
                )}
                {nodes.length === 0
                    ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>No nodes created yet</p>
                        </div>
                    )
                    : (
                        <div className="space-y-2">
                            {nodes.map((node) => (
                                <NodeItem
                                    key={node.id}
                                    node={node}
                                    level={0}
                                    draggedNodeId={draggedNodeId}
                                />
                            ))}
                        </div>
                    )}
                {isOver && dropPosition === "after" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 z-10" />
                )}
            </div>
        </ScrollArea>
    );
}
