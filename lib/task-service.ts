import redis from "./redis"
import { v4 as uuidv4 } from "uuid"

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate: string
  priority?: "low" | "medium" | "high"
  labels?: string[]
  attachments?: {
    url: string
    fileName: string
    contentType: string
    size: number
  }[]
  createdAt: string
  updatedAt: string
  userId: string
}

const TASK_PREFIX = "task:"
const USER_TASKS_PREFIX = "user:tasks:"

// Create a new task
export async function createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
  const id = uuidv4()
  const now = new Date().toISOString()

  const newTask: Task = {
    ...task,
    id,
    createdAt: now,
    updatedAt: now,
  }

  // Store task data
  await redis.set(`${TASK_PREFIX}${id}`, JSON.stringify(newTask))

  // Add to user's task list
  await redis.sadd(`${USER_TASKS_PREFIX}${task.userId}`, id)

  return newTask
}

// Get a task by ID
export async function getTask(id: string): Promise<Task | null> {
  const taskData = await redis.get(`${TASK_PREFIX}${id}`)
  return taskData ? JSON.parse(taskData) : null
}

// Get all tasks for a user
export async function getUserTasks(userId: string): Promise<Task[]> {
  // Get all task IDs for this user
  const taskIds = await redis.smembers(`${USER_TASKS_PREFIX}${userId}`)

  // If no tasks, return empty array
  if (!taskIds.length) return []

  // Get all tasks in parallel
  const taskPromises = taskIds.map((id) => redis.get(`${TASK_PREFIX}${id}`))
  const taskData = await Promise.all(taskPromises)

  // Parse and filter out any null values
  return taskData
    .filter(Boolean)
    .map((data) => JSON.parse(data as string))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

// Update a task
export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>,
): Promise<Task | null> {
  const task = await getTask(id)
  if (!task) return null

  const updatedTask: Task = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  await redis.set(`${TASK_PREFIX}${id}`, JSON.stringify(updatedTask))
  return updatedTask
}

// Delete a task
export async function deleteTask(id: string, userId: string): Promise<boolean> {
  const task = await getTask(id)
  if (!task || task.userId !== userId) return false

  // Remove from Redis
  await redis.del(`${TASK_PREFIX}${id}`)

  // Remove from user's task list
  await redis.srem(`${USER_TASKS_PREFIX}${userId}`, id)

  return true
}

// Get tasks by label
export async function getTasksByLabel(userId: string, label: string): Promise<Task[]> {
  const allTasks = await getUserTasks(userId)
  return allTasks.filter((task) => task.labels?.includes(label))
}

// Get tasks by status (completed or not)
export async function getTasksByStatus(userId: string, completed: boolean): Promise<Task[]> {
  const allTasks = await getUserTasks(userId)
  return allTasks.filter((task) => task.completed === completed)
}
