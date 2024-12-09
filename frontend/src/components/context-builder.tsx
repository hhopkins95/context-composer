'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import TreeView from './tree-view'
import NodeEditor from './node-editor'
import ContentPreview from './content-preview'

export type Node = {
  id: string
  type: 'text' | 'file' | 'template'
  content: string
  children: Node[]
  tagName: string
}

export default function ContextBuilder() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [activeTab, setActiveTab] = useState('editor')
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())

  const addNode = (parentId: string | null = null) => {
    const newNode: Node = {
      id: Date.now().toString(),
      type: 'text',
      content: '',
      children: [],
      tagName: 'node'
    }

    if (parentId === null) {
      setNodes([...nodes, newNode])
    } else {
      const updateNodeRecursive = (nodes: Node[]): Node[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return { ...node, children: [...node.children, newNode] }
          }
          if (node.children.length > 0) {
            return { ...node, children: updateNodeRecursive(node.children) }
          }
          return node
        })
      }
      setNodes(updateNodeRecursive(nodes))
    }
  }

  const updateNode = (updatedNode: Node) => {
    const updateNodeRecursive = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        if (node.id === updatedNode.id) {
          return updatedNode
        }
        if (node.children.length > 0) {
          return { ...node, children: updateNodeRecursive(node.children) }
        }
        return node
      })
    }

    setNodes(updateNodeRecursive(nodes))
    setSelectedNode(updatedNode)
  }

  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodes(prevCollapsed => {
      const newCollapsed = new Set(prevCollapsed)
      if (newCollapsed.has(nodeId)) {
        newCollapsed.delete(nodeId)
      } else {
        newCollapsed.add(nodeId)
      }
      return newCollapsed
    })
  }

  const deleteNode = (nodeId: string) => {
    const deleteNodeRecursive = (nodes: Node[]): Node[] => {
      return nodes.filter(node => {
        if (node.id === nodeId) {
          return false
        }
        if (node.children.length > 0) {
          node.children = deleteNodeRecursive(node.children)
        }
        return true
      })
    }

    const newNodes = deleteNodeRecursive(nodes)
    setNodes(newNodes)

    if (selectedNode && (selectedNode.id === nodeId || !newNodes.some(node => node.id === selectedNode.id))) {
      setSelectedNode(null)
    }
  }

  const moveNode = (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    let draggedNode: Node | null = null
    let newNodes: Node[] = []

    const removeNode = (nodes: Node[]): Node[] => {
      return nodes.filter(node => {
        if (node.id === draggedId) {
          draggedNode = node
          return false
        }
        if (node.children.length > 0) {
          node.children = removeNode(node.children)
        }
        return true
      })
    }

    newNodes = removeNode([...nodes])

    if (!draggedNode) return

    const insertNode = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        if (node.id === targetId) {
          if (position === 'inside') {
            return { ...node, children: [...node.children, draggedNode!] }
          }
          return node
        }
        if (node.children.length > 0) {
          node.children = insertNode(node.children)
        }
        return node
      })
    }

    newNodes = insertNode(newNodes)

    if (position === 'before' || position === 'after') {
      newNodes = newNodes.reduce((acc: Node[], node) => {
        if (node.id === targetId) {
          if (position === 'before') {
            acc.push(draggedNode!)
            acc.push(node)
          } else {
            acc.push(node)
            acc.push(draggedNode!)
          }
        } else {
          acc.push(node)
        }
        return acc
      }, [])
    }

    setNodes(newNodes)
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Context Builder</h2>
        <Button onClick={() => addNode()}>Add Root Node</Button>
      </div>
      <div className="flex-grow flex space-x-4">
        <div className="w-1/3">
          <DndProvider backend={HTML5Backend}>
            <TreeView 
              nodes={nodes} 
              onNodeSelect={setSelectedNode} 
              onAddChild={(parentId) => addNode(parentId)}
              collapsedNodes={collapsedNodes}
              onToggleCollapse={toggleNodeCollapse}
              onDeleteNode={deleteNode}
              onMoveNode={moveNode}
            />
          </DndProvider>
        </div>
        <div className="w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-grow">
              <NodeEditor node={selectedNode} onUpdate={updateNode} onDelete={deleteNode} />
            </TabsContent>
            <TabsContent value="preview" className="flex-grow">
              <ContentPreview 
                nodes={nodes} 
                collapsedNodes={collapsedNodes}
                onToggleCollapse={toggleNodeCollapse}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

