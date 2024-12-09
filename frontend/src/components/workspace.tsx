import { ScrollArea } from "@/components/ui/scroll-area"

export default function Workspace() {
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-semibold mb-2">Workspace</h2>
      <ScrollArea className="flex-grow border rounded-md p-4">
        <div className="min-h-[200px]">
          {/* Placeholder for visual composer and XML tree builder */}
          <p>Drag and drop files here to start composing</p>
        </div>
      </ScrollArea>
    </div>
  )
}

