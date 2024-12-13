import { usePromptBuilderContext } from "../../contexts/builder-context/node-context";
import { ScrollArea } from "../../components/ui/scroll-area";

export default function ContentPreview() {
  const { outputString } = usePromptBuilderContext();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm">
          <pre className="whitespace-pre-wrap">{outputString}</pre>
        </div>
      </div>
    </ScrollArea>
  );
}
