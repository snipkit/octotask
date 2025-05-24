"use client"

import { useState, useEffect } from "react"
import { Check, X, GitCommit, GitBranch } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface GitConfirmationProps {
  action: "save" | "update" | "delete"
  itemName: string
  onConfirm: (message: string) => Promise<void>
  onCancel: () => void
}

export default function GitConfirmation({ action, itemName, onConfirm, onCancel }: GitConfirmationProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Auto-generate a commit message based on action and item
    let defaultMessage = ""

    switch (action) {
      case "save":
        defaultMessage = `add: new task "${itemName}"`
        break
      case "update":
        defaultMessage = `update: task "${itemName}"`
        break
      case "delete":
        defaultMessage = `remove: task "${itemName}"`
        break
    }

    setMessage(defaultMessage)
  }, [action, itemName])

  const handleConfirm = async () => {
    if (!message.trim()) {
      toast({
        title: "Commit message required",
        description: "Please enter a commit message before confirming",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await onConfirm(message)
      toast({
        title: "Changes committed",
        description: `Successfully ${action === "save" ? "created" : action === "update" ? "updated" : "deleted"} "${itemName}"`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} "${itemName}"`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md glass-card border-0 shadow-xl">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCommit className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-medium text-white">Commit Changes</h3>
        </div>

        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <GitBranch className="h-4 w-4" />
          <span>main</span>
          {action === "update" && (
            <Badge variant="outline" className="ml-2 bg-blue-900/30 text-blue-300 border-blue-800">
              modified
            </Badge>
          )}
          {action === "save" && (
            <Badge variant="outline" className="ml-2 bg-green-900/30 text-green-300 border-green-800">
              new
            </Badge>
          )}
          {action === "delete" && (
            <Badge variant="outline" className="ml-2 bg-red-900/30 text-red-300 border-red-800">
              deleted
            </Badge>
          )}
        </div>

        <div className="my-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Commit message"
            className="glass-card border-gray-700 focus:border-blue-500 bg-black/20 min-h-[80px]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel} className="glass-card border-gray-700">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !message.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
          >
            {isSubmitting ? (
              <>Loading...</>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Commit Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
