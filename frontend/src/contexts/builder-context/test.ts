import type { ContainerNode } from "./types";
import {
    deleteNode,
    getNode,
    insertNode,
    moveNode,
    renderFinalString,
    updateContainerNode,
    updateContentNode,
} from "./helpers";

/**
 * tests
 */
const base: ContainerNode = {
    id: "1",
    type: "container",
    format: "inherit",
    name: "one",
    children: [
        {
            id: "1-1",
            type: "container",
            format: "inherit",
            name: "1-1 container",
            children: [
                {
                    id: "1-1-1",
                    type: "text",
                    content: "{1-1 content}",
                },
                {
                    id: "1-1-2",
                    type: "container",
                    format: "inherit",
                    name: "1-1-2 container",
                    children: [
                        {
                            id: "1-1-2-1",
                            type: "text",
                            content: "{1-1-2 content}",
                        },
                    ],
                },
            ],
        },
        {
            id: "1-2",
            type: "container",
            format: "inherit",
            name: "1-2 container",
            children: [
                {
                    id: "1-1dsfa-1",
                    type: "text",
                    content: "{1-2 content}",
                },
            ],
        },
        {
            id: "1-3",
            type: "container",
            format: "inherit",
            name: "1-3 Container",
            children: [],
        },
    ],
};
const base2: ContainerNode = {
    id: "2",
    type: "container",
    format: "inherit",
    name: "two",
    children: [],
};
const nodes = [base, base2];

const nodes2 = updateContainerNode(nodes, "1-1", {
    name: "New Name",
});

updateContentNode(nodes, "1-1-1", {
    content: "New Content",
});

console.log(renderFinalString(nodes2, "xml"));
// console.log(renderJsonString(nodes));

// const copy = cloneDeep(nodes); // JSON.parse(JSON.stringify(nodes));

// moveNode("1", copy, { position: "after", id: "2" });

// console.log("____________ Original");
// console.log(JSON.stringify(nodes, null, 2));
// console.log("____________ Copy");
// console.log(JSON.stringify(copy, null, 2));
