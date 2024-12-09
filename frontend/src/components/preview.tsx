import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

export default function Preview() {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Preview</h2>
        <Button variant="outline">Copy</Button>
      </div>
      <ScrollArea className="flex-grow border rounded-md p-4">
        {/* Placeholder for formatted output preview */}
        <pre className="whitespace-pre-wrap">
          {`<prompt>
  <context>
    This is a sample preview of the formatted output.
  </context>
  <instruction>
    Replace this with your actual generated content.
  </instruction>
</prompt>`}
        </pre>
      </ScrollArea>
    </div>
  )
}

