import { Node } from './context-builder'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2 } from 'lucide-react'

type NodeEditorProps = {
  node: Node | null
  onUpdate: (node: Node) => void
  onDelete: (nodeId: string) => void
}

export default function NodeEditor({ node, onUpdate, onDelete }: NodeEditorProps) {
  if (!node) {
    return <div className="p-4">Select a node to edit</div>
  }

  const handleChange = (field: keyof Node, value: string) => {
    onUpdate({ ...node, [field]: value })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Node Editor</h3>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Node
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="node-type">Type</Label>
        <Select 
          value={node.type} 
          onValueChange={(value) => handleChange('type', value as 'text' | 'file' | 'template')}
        >
          <SelectTrigger id="node-type">
            <SelectValue placeholder="Select node type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="file">File</SelectItem>
            <SelectItem value="template">Template</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="node-tag-name">Tag Name</Label>
        <Input
          id="node-tag-name"
          value={node.tagName}
          onChange={(e) => handleChange('tagName', e.target.value)}
          placeholder="Enter tag name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="node-content">Content</Label>
        <Textarea
          id="node-content"
          value={node.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Enter node content"
          className="min-h-[100px]"
        />
      </div>
    </div>
  )
}

