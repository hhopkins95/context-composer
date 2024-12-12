import { NodeManager } from "./index";
import { beforeEach, describe, expect, test } from "bun:test";
// Example strings we'll use throughout tests
const examples = {
    codeReview: `
<system>
You are a code reviewer with expertise in {{language}}.
Review the following code according to these criteria:
{{review_criteria}}

CODE TO REVIEW:
{{code_content}}
</system>`,

    documentationWriter: `
# Documentation Task

## Current Documentation
{{current_docs}}

## Required Changes
{{changes}}

## Guidelines
Please update the documentation following these style rules:
{{style_rules}}
`,

    bugReport: `
<issue>
<title>{{bug_title}}</title>
<description>
{{bug_description}}
</description>
<steps>
1. {{step1}}
2. {{step2}}
3. {{step3}}
</steps>
</issue>
`,

    sampleCode: `
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
`,

    reviewCriteria: `
- Performance optimization
- Code readability
- Error handling
- Best practices
`,
};

describe("NodeManager", () => {
    let manager: NodeManager;

    beforeEach(() => {
        manager = new NodeManager();
    });

    describe("Basic Node Operations", () => {
        test("creates and inserts a simple text node", () => {
            const node = manager.createNode("text", {
                id: manager.rootContainer.id,
                position: "inside",
            }, {
                content: "Hello World",
            });

            expect(manager.toString()).toContain("Hello World");
        });

        test("creates nested container nodes", () => {
            const container = manager.createNode("container", {
                id: manager.rootContainer.id,
                position: "inside",
            }, {
                format: "xml",
                name: "test",
            });

            const textNode = manager.createNode("text", {
                id: container.id,
                position: "inside",
            }, {
                content: "Test content",
            });

            expect(manager.toString()).toContain("<test>Test content</test>");
        });
    });

    describe("Template Parsing", () => {
        test("parses simple template variables", () => {
            const nodes = manager.parseContent("Hello {{name}}!");
            expect(nodes).toHaveLength(3);
            expect(nodes[1]).toMatchObject({
                type: "container",
                format: "inherit",
                name: "name",
            });
        });

        test("parses complex code review template", () => {
            const nodes = manager.parseContent(examples.codeReview);
            const container = manager.createNode("container", {
                id: manager.rootContainer.id,
                position: "inside",
            }, {
                format: "xml",
                name: "system",
            });

            nodes.forEach((node) => {
                manager.insertNode(node, {
                    id: container.id,
                    position: "inside",
                });
            });

            const output = manager.toString();
            expect(output).toContain("<system>");
            expect(output).toContain("{{language}}");
            expect(output).toContain("{{review_criteria}}");
        });
    });

    describe("Format Inheritance", () => {
        test("inherits format from parent", () => {
            const container = manager.createNode("container", {
                id: manager.rootContainer.id,
                position: "inside",
            }, {
                format: "markdown",
                name: "Section 1",
            });

            const child = manager.createNode("container", {
                id: container.id,
                position: "inside",
            }, {
                format: "inherit",
                name: "Subsection",
            });

            expect(manager.getEffectiveFormat(child.id)).toBe("markdown");
        });

        test("overrides parent format", () => {
            const mdContainer = manager.createNode("container", {
                id: manager.rootContainer.id,
                position: "inside",
            }, {
                format: "markdown",
                name: "Section 1",
            });

            const xmlContainer = manager.createNode("container", {
                id: mdContainer.id,
                position: "inside",
            }, {
                format: "xml",
                name: "code",
            });

            const output = manager.toString();
            expect(output).toContain("# Section 1");
            expect(output).toContain("<code></code>");
        });
    });

    describe("Real World Scenarios", () => {
        test("builds a complete code review prompt", () => {
            // Create the main structure
            const container = manager.createNode("container", {
                id: manager.rootContainer.id,
                position: "inside",
            }, {
                format: "xml",
                name: "system",
            });

            // Parse and insert the template content
            const nodes = manager.parseContent(examples.codeReview);
            nodes.forEach((node) => {
                manager.insertNode(node, {
                    id: container.id,
                    position: "inside",
                });
            });

            // Add concrete content for some variables
            const codeContainerNode = manager.getNode(container.id)!;

            if (!codeContainerNode || codeContainerNode.type !== "container") {
                throw new Error("codeContainer not found");
            }

            const codeContainer = codeContainerNode.children
                .find((n) =>
                    n.type === "container" && n.name === "code_content"
                )!;

            manager.updateNode(codeContainer.id, {
                type: "container",
                format: "raw",
                children: [{
                    id: manager.generateId(),
                    type: "text",
                    content: examples.sampleCode,
                }],
            });

            const output = manager.toString();
            expect(output).toContain("code reviewer with expertise");
            expect(output).toContain("function calculateTotal");
        });

        test("creates hierarchical documentation structure", () => {
            // Parse the documentation template
            const nodes = manager.parseContent(examples.documentationWriter);
            nodes.forEach((node) => {
                manager.insertNode(node, {
                    id: manager.rootContainer.id,
                    position: "inside",
                });
            });

            const output = manager.toString();
            expect(output).toContain("# Documentation Task");
            expect(output).toContain("## Current Documentation");
            expect(output).toContain("## Required Changes");
        });
    });

    describe("Error Handling", () => {
        test("prevents circular references", () => {
            const container1 = manager.createNode("container", {
                id: manager.rootContainer.id,
                position: "inside",
            }, {
                format: "xml",
                name: "parent",
            });

            const container2 = manager.createNode("container", {
                id: container1.id,
                position: "inside",
            }, {
                format: "xml",
                name: "child",
            });

            expect(() =>
                manager.insertNode(container1, {
                    id: container2.id,
                    position: "inside",
                })
            ).toThrow();
        });

        test("validates node insertion targets", () => {
            const textNode = manager.createNode("text", {
                id: manager.rootContainer.id,
                position: "inside",
            }, {
                content: "Test",
            });

            expect(() =>
                manager.createNode("text", {
                    id: textNode.id,
                    position: "inside",
                }, {
                    content: "Invalid",
                })
            ).toThrow();
        });
    });
});
