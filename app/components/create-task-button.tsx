"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Paperclip, Tag, Clock, BrainCircuit, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import GitConfirmation from "@/components/git-confirmation"
import { analyzeTaskWithGroq } from "@/lib/ai-utils"
import { analyzeTaskWithVertexAI } from "@/lib/vertex-ai"
import { uploadTaskAttachment } from "@/lib/blob-utils"
import { toast } from "@/components/ui/use-toast"
import { createTask } from "@/lib/task-service"

interface Attachment {
  url: string
  fileName: string
  contentType: string
  size: number
}

export default function CreateTaskButton() {
  const [open, setOpen] = useState(false)
  const [dueDate, setDueDate] = useState<Date>()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<string>("medium")
  const [labels, setLabels] = useState<string[]>([])
  const [newLabel, setNewLabel] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showGitConfirmation, setShowGitConfirmation] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState<any>(null)
  const [analyzeModel, setAnalyzeModel] = useState<"groq" | "vertex">("groq")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setDueDate(undefined)
    setPriority("medium")
    setLabels([])
    setNewLabel("")
    setAttachments([])
    setAnalyzeResult(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowGitConfirmation(true)
  }

  const handleConfirmSave = async (commitMessage: string) => {
    try {
      // Get current user ID (in a real app, this would come from auth)
      const userId = "user123"

      // Create the task using our Redis service
      await createTask({
        title,
        description,
        completed: false,
        dueDate: dueDate?.toISOString() || new Date().toISOString(),
        priority: priority as "low" | "medium" | "high",
        labels,
        attachments,
        userId,
      })

      // Close dialogs and reset form
      setShowGitConfirmation(false)
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error saving task",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        // Upload to Blob storage
        const result = await uploadTaskAttachment(file, "task-attachments")

        if (result.success && result.url) {
          setAttachments((prev) => [
            ...prev,
            {
              url: result.url!,
              fileName: result.fileName!,
              contentType: result.contentType!,
              size: result.size!,
            },
          ])
        } else {
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error uploading file:", error)
        toast({
          title: "Upload error",
          description: "An error occurred while uploading the file",
          variant: "destructive",
        })
      }
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url))
  }

  const addLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels((prev) => [...prev, newLabel.trim()])
      setNewLabel("")
    }
  }

  const removeLabel = (label: string) => {
    setLabels((prev) => prev.filter((l) => l !== label))
  }

  const analyzeTask = async () => {
    if (!title) {
      toast({
        title: "Missing information",
        description: "Please enter a task title to analyze",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      let result

      if (analyzeModel === "groq") {
        result = await analyzeTaskWithGroq(title, description)
      } else {
        result = await analyzeTaskWithVertexAI(title, description)
      }

      if (result) {
        setAnalyzeResult(result)

        // Apply the suggestions if they exist
        if (result.priority) {
          setPriority(result.priority.toLowerCase())
        }

        if (result.category) {
          if (!labels.includes(result.category)) {
            setLabels((prev) => [...prev, result.category])
          }
        }

        toast({
          title: "Analysis complete",
          description: "Task analyzed successfully",
        })
      } else {
        toast({
          title: "Analysis failed",
          description: "Could not analyze the task",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error analyzing task:", error)
      toast({
        title: "Analysis error",
        description: "An error occurred during analysis",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <Dialog
        open={open && !showGitConfirmation}
        onOpenChange={(value) => {
          if (!value) {
            resetForm()
          }
          setOpen(value)
        }}
      >
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px] glass-card border-0 shadow-xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Create New Task</DialogTitle>
              <DialogDescription>Add a new task to your list. Click save when you're done.</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-3 p-1 glass-card rounded-xl">
                <TabsTrigger
                  value="details"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
                >
                  Attachments
                </TabsTrigger>
                <TabsTrigger
                  value="ai-analysis"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
                >
                  AI Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="pt-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-white">
                      Task Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter task title"
                      required
                      className="glass-card border-gray-700 focus:border-blue-500 bg-black/20"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-white">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter task description"
                      className="glass-card border-gray-700 focus:border-blue-500 bg-black/20 min-h-[80px]"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dueDate" className="text-white">
                      Due Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="dueDate"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal glass-card border-gray-700",
                            !dueDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass-card border-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                          className="bg-transparent"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority" className="text-white">
                      Priority
                    </Label>
                    <div className="flex gap-4">
                      {["low", "medium", "high"].map((p) => (
                        <Button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={cn(
                            "flex-1",
                            priority === p
                              ? p === "low"
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : p === "medium"
                                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                                  : "bg-red-600 hover:bg-red-700 text-white"
                              : "glass-card border-gray-700 text-white",
                          )}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="labels" className="text-white">
                      Labels
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="newLabel"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Add a label"
                        className="glass-card border-gray-700 focus:border-blue-500 bg-black/20"
                      />
                      <Button type="button" onClick={addLabel} className="glass-card border-gray-700">
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {labels.map((label) => (
                        <Badge
                          key={label}
                          variant="outline"
                          className="px-3 py-1 bg-blue-900/30 text-blue-300 border-blue-800"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={() => removeLabel(label)}
                            className="ml-2 text-muted-foreground hover:text-white"
                          >
                            &times;
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="pt-4">
                <div className="glass-card border-dashed border-2 border-gray-700 rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                    id="task-attachments"
                  />
                  <Paperclip className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Add Attachments</h3>
                  <p className="text-sm text-muted-foreground mb-4">Drag and drop files here or click to browse</p>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    Browse Files
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-white">Attached Files ({attachments.length})</Label>
                    {attachments.map((attachment) => (
                      <div key={attachment.url} className="flex items-center justify-between p-3 rounded-lg glass-card">
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4 w-4 text-blue-400" />
                          <div>
                            <p className="font-medium text-white">{attachment.fileName}</p>
                            <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttachment(attachment.url)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-900/20"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ai-analysis" className="pt-4">
                <div className="grid gap-4">
                  <div className="glass-card bg-blue-900/10 border border-blue-800/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-medium text-white">AI Task Analysis</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={analyzeModel}
                          onChange={(e) => setAnalyzeModel(e.target.value as "groq" | "vertex")}
                          className="glass-card border-gray-700 focus:border-blue-500 bg-black/20 rounded-md p-1 text-sm"
                        >
                          <option value="groq">Groq LLM</option>
                          <option value="vertex">Vertex AI</option>
                        </select>
                        <Button
                          type="button"
                          onClick={analyzeTask}
                          disabled={isAnalyzing || !title}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            "Analyze Task"
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      Let AI analyze your task to suggest priority, time estimates, and potential blockers.
                    </div>

                    {analyzeResult ? (
                      <div className="space-y-3 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="glass-card border-gray-700 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">Priority</div>
                            <div className="font-medium text-white">
                              {analyzeResult.priority === "High" ? (
                                <span className="text-red-400">{analyzeResult.priority}</span>
                              ) : analyzeResult.priority === "Medium" ? (
                                <span className="text-yellow-400">{analyzeResult.priority}</span>
                              ) : (
                                <span className="text-green-400">{analyzeResult.priority}</span>
                              )}
                            </div>
                          </div>
                          <div className="glass-card border-gray-700 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">Estimated Time</div>
                            <div className="font-medium text-white flex items-center">
                              <Clock className="mr-1 h-3 w-3 text-blue-400" />
                              {analyzeResult.estimatedTime}
                            </div>
                          </div>
                        </div>

                        {analyzeResult.category && (
                          <div className="glass-card border-gray-700 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">Suggested Category</div>
                            <div className="font-medium text-white">
                              <Badge className="bg-blue-900/30 text-blue-300 border-blue-800">
                                {analyzeResult.category}
                              </Badge>
                            </div>
                          </div>
                        )}

                        {analyzeResult.potentialBlockers && (
                          <div className="glass-card border-gray-700 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground mb-1">Potential Blockers</div>
                            <div className="font-medium text-white">{analyzeResult.potentialBlockers}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="glass-card border-dashed border-2 border-gray-700 rounded-lg p-6 text-center mt-4">
                        <p className="text-muted-foreground">
                          {isAnalyzing ? (
                            <span className="flex items-center justify-center">
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Analyzing your task...
                            </span>
                          ) : (
                            "Enter task details and click 'Analyze Task' to get AI insights"
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="submit"
                disabled={!title || !dueDate}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                Save Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Git-like Confirmation Dialog */}
      {showGitConfirmation && (
        <Dialog open={showGitConfirmation} onOpenChange={setShowGitConfirmation}>
          <DialogContent className="p-0 border-0 max-w-md">
            <GitConfirmation
              action="save"
              itemName={title}
              onConfirm={handleConfirmSave}
              onCancel={() => setShowGitConfirmation(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
