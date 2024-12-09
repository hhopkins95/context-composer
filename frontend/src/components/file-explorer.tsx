'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FileExplorer() {
  const [activeTab, setActiveTab] = useState('files')

  return (
    <div className="h-full flex flex-col p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="files" className="flex-grow flex flex-col">
          <Input type="text" placeholder="Search files..." className="mb-2" />
          <ScrollArea className="flex-grow">
            {/* Placeholder for file tree */}
            <div className="space-y-2">
              <div>File 1</div>
              <div>File 2</div>
              <div>File 3</div>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="templates" className="flex-grow flex flex-col">
          <Input type="text" placeholder="Search templates..." className="mb-2" />
          <ScrollArea className="flex-grow">
            {/* Placeholder for template list */}
            <div className="space-y-2">
              <div>Template 1</div>
              <div>Template 2</div>
              <div>Template 3</div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

