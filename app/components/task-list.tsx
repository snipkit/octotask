"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Clock, Trash } from "lucide-react"
import { format } from "date-fns"

interface Task {
  id: string
  title: string
  completed: boolean
  dueDate: Date
}

interface TaskListProps {
  tasks: Task[]
}

export default function TaskList({ tasks }: TaskListProps) {
  const [taskList, setTaskList] = useState<Task[]>(tasks)

  const toggleTaskStatus = (id: string) => {
    setTaskList(taskList.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id: string) => {
    setTaskList(taskList.filter((task) => task.id !== id))
  }

  return (
    <div className="space-y-4">
      {taskList.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No tasks found</p>
      ) : (
        taskList.map((task) => (
          <div
            key={task.id}
            className={`task-item flex items-center justify-between p-4 rounded-lg ${
              task.completed ? "bg-opacity-10 bg-green-900 border border-green-800/30" : "glass-card glow-effect"
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTaskStatus(task.id)}
                id={`task-${task.id}`}
                className={task.completed ? "border-green-500" : "border-blue-500"}
              />
              <label
                htmlFor={`task-${task.id}`}
                className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-white"}`}
              >
                {task.title}
              </label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-xs text-muted-foreground bg-black/20 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3 mr-1" />
                {format(task.dueDate, "MMM d")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask(task.id)}
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-900/20"
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete task</span>
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
