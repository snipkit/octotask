"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileIcon, FolderIcon, UploadIcon, XIcon, FileTextIcon, CodeIcon, ImageIcon } from "lucide-react"
import { uploadTaskAttachment, deleteTaskAttachment } from "@/lib/blob-utils"
import { toast } from "@/components/ui/use-toast"

interface Document {
  id: string
  url: string
  fileName: string
  contentType: string
  size: number
  uploadedAt: string
  category: "ui-design" | "code-reference" | "documentation" | "other"
}

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [category, setCategory] = useState<Document["category"]>("documentation")
  const [showPreview, setShowPreview] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const result = await uploadTaskAttachment(file, "knowledge-base")

        if (result.success && result.url) {
          const newDoc: Document = {
            id: `doc-${Date.now()}-${i}`,
            url: result.url,
            fileName: result.fileName || file.name,
            contentType: result.contentType || file.type,
            size: result.size || file.size,
            uploadedAt: new Date().toISOString(),
            category,
          }

          setDocuments((prev) => [...prev, newDoc])

          toast({
            title: "Document uploaded",
            description: `Successfully uploaded ${file.name}`,
          })
        } else {
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload error",
        description: "An error occurred while uploading files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDelete = async (doc: Document) => {
    try {
      const result = await deleteTaskAttachment(doc.url)

      if (result.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
        toast({
          title: "Document deleted",
          description: `Successfully deleted ${doc.fileName}`,
        })
      } else {
        toast({
          title: "Delete failed",
          description: `Failed to delete ${doc.fileName}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Delete error",
        description: "An error occurred while deleting the document",
        variant: "destructive",
      })
    }
  }

  const getIconForFile = (contentType: string) => {
    if (contentType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-purple-400" />
    if (contentType.includes("pdf")) return <FileTextIcon className="h-5 w-5 text-red-400" />
    if (contentType.includes("json") || contentType.includes("javascript") || contentType.includes("typescript")) {
      return <CodeIcon className="h-5 w-5 text-yellow-400" />
    }
    return <FileIcon className="h-5 w-5 text-blue-400" />
  }

  const openPreview = (doc: Document) => {
    setPreviewDoc(doc)
    setShowPreview(true)
  }

  const filteredDocuments = (category: Document["category"]) => {
    return documents.filter((doc) => doc.category === category)
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-blue-400" />
            Knowledge Base
          </CardTitle>
          <CardDescription>Upload and manage reference documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Document["category"])}
                  className="glass-card border-gray-700 focus:border-blue-500 bg-black/20 rounded-md p-2 w-full"
                >
                  <option value="ui-design">UI Design Templates</option>
                  <option value="code-reference">Code Reference</option>
                  <option value="documentation">Documentation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  id="document-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  {isUploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="ui-design" className="w-full">
              <TabsList className="grid w-full grid-cols-4 p-1 glass-card rounded-xl">
                <TabsTrigger
                  value="ui-design"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
                >
                  UI Design
                </TabsTrigger>
                <TabsTrigger
                  value="code-reference"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
                >
                  Code Reference
                </TabsTrigger>
                <TabsTrigger
                  value="documentation"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
                >
                  Documentation
                </TabsTrigger>
                <TabsTrigger
                  value="other"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
                >
                  Other
                </TabsTrigger>
              </TabsList>

              {["ui-design", "code-reference", "documentation", "other"].map((cat) => (
                <TabsContent key={cat} value={cat}>
                  <div className="grid gap-2 mt-4">
                    {filteredDocuments(cat as Document["category"]).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No documents in this category. Upload some documents to get started.
                      </p>
                    ) : (
                      filteredDocuments(cat as Document["category"]).map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg glass-card hover:bg-white/5 cursor-pointer"
                          onClick={() => openPreview(doc)}
                        >
                          <div className="flex items-center gap-3">
                            {getIconForFile(doc.contentType)}
                            <div>
                              <p className="font-medium text-white">{doc.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.uploadedAt).toLocaleDateString()} · {(doc.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(doc)
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-900/20"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="glass-card border-0 shadow-xl max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              {previewDoc && getIconForFile(previewDoc.contentType)}
              {previewDoc?.fileName}
            </DialogTitle>
            <DialogDescription>
              {previewDoc && new Date(previewDoc.uploadedAt).toLocaleString()} ·{" "}
              {previewDoc && (previewDoc.size / 1024).toFixed(0)} KB
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex-1 overflow-auto">
            {previewDoc?.contentType.startsWith("image/") ? (
              <img
                src={previewDoc.url || "/placeholder.svg"}
                alt={previewDoc.fileName}
                className="max-w-full mx-auto rounded-lg"
              />
            ) : (
              <iframe src={previewDoc?.url} className="w-full h-[calc(80vh-150px)] rounded-lg bg-black/50" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
