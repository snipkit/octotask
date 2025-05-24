import { groq } from "@ai-sdk/groq"
import { xai } from "@ai-sdk/xai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { mistral } from "@ai-sdk/mistral"
import { cohere } from "@ai-sdk/cohere"
import redis from "../redis"

// Define model providers and their models
export type ModelProvider = "groq" | "xai" | "openai" | "anthropic" | "mistral" | "cohere" | "vertex"

export interface ModelInfo {
  id: string
  provider: ModelProvider
  name: string
  capabilities: string[]
  costPer1kTokens: number
  contextWindow: number
  isAvailable: boolean
}

// Model registry
export const models: Record<string, ModelInfo> = {
  "groq/llama3-70b": {
    id: "groq/llama3-70b",
    provider: "groq",
    name: "Llama 3 70B",
    capabilities: ["text-generation", "chat", "embeddings"],
    costPer1kTokens: 0.0007,
    contextWindow: 8192,
    isAvailable: true,
  },
  "groq/llama3-8b": {
    id: "groq/llama3-8b",
    provider: "groq",
    name: "Llama 3 8B",
    capabilities: ["text-generation", "chat", "embeddings"],
    costPer1kTokens: 0.0002,
    contextWindow: 8192,
    isAvailable: true,
  },
  "xai/grok-1": {
    id: "xai/grok-1",
    provider: "xai",
    name: "Grok-1",
    capabilities: ["text-generation", "chat", "code"],
    costPer1kTokens: 0.0005,
    contextWindow: 8192,
    isAvailable: true,
  },
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    provider: "openai",
    name: "GPT-4o",
    capabilities: ["text-generation", "chat", "vision", "code"],
    costPer1kTokens: 0.005,
    contextWindow: 128000,
    isAvailable: false,
  },
  "anthropic/claude-3-opus": {
    id: "anthropic/claude-3-opus",
    provider: "anthropic",
    name: "Claude 3 Opus",
    capabilities: ["text-generation", "chat", "vision"],
    costPer1kTokens: 0.015,
    contextWindow: 200000,
    isAvailable: false,
  },
  "mistral/mistral-large": {
    id: "mistral/mistral-large",
    provider: "mistral",
    name: "Mistral Large",
    capabilities: ["text-generation", "chat", "code"],
    costPer1kTokens: 0.002,
    contextWindow: 32768,
    isAvailable: false,
  },
  "cohere/command-r": {
    id: "cohere/command-r",
    provider: "cohere",
    name: "Command R",
    capabilities: ["text-generation", "chat"],
    costPer1kTokens: 0.001,
    contextWindow: 128000,
    isAvailable: false,
  },
}

// User preferences for model selection
export interface ModelPreferences {
  capability: string
  maxCostPer1kTokens?: number
  minContextWindow?: number
  preferredProviders?: ModelProvider[]
  fallbackStrategy?: "cost" | "context" | "availability"
}

// Cache model responses
const CACHE_PREFIX = "ai-hub:cache:"
const CACHE_TTL = 60 * 60 * 24 // 24 hours

// Get the appropriate model based on user preferences
export function selectModel(preferences: ModelPreferences): ModelInfo {
  const {
    capability,
    maxCostPer1kTokens,
    minContextWindow,
    preferredProviders,
    fallbackStrategy = "cost",
  } = preferences

  // Filter models by capability
  let availableModels = Object.values(models).filter((model) => model.capabilities.includes(capability))

  // Filter by preferred providers if specified
  if (preferredProviders && preferredProviders.length > 0) {
    const preferredModels = availableModels.filter((model) => preferredProviders.includes(model.provider))
    if (preferredModels.length > 0) {
      availableModels = preferredModels
    }
  }

  // Filter by cost if specified
  if (maxCostPer1kTokens) {
    const affordableModels = availableModels.filter((model) => model.costPer1kTokens <= maxCostPer1kTokens)
    if (affordableModels.length > 0) {
      availableModels = affordableModels
    }
  }

  // Filter by context window if specified
  if (minContextWindow) {
    const contextModels = availableModels.filter((model) => model.contextWindow >= minContextWindow)
    if (contextModels.length > 0) {
      availableModels = contextModels
    }
  }

  // Filter by availability
  const availableAndReadyModels = availableModels.filter((model) => model.isAvailable)
  if (availableAndReadyModels.length > 0) {
    availableModels = availableAndReadyModels
  }

  // Sort based on fallback strategy
  if (fallbackStrategy === "cost") {
    availableModels.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens)
  } else if (fallbackStrategy === "context") {
    availableModels.sort((a, b) => b.contextWindow - a.contextWindow)
  }

  // Return the best model or default to groq/llama3-8b if none available
  return availableModels[0] || models["groq/llama3-8b"]
}

// Get the AI SDK model instance
function getModelInstance(modelInfo: ModelInfo) {
  const modelId = modelInfo.id.split("/")[1]

  switch (modelInfo.provider) {
    case "groq":
      return groq(modelId)
    case "xai":
      return xai(modelId)
    case "openai":
      return openai(modelId)
    case "anthropic":
      return anthropic(modelId)
    case "mistral":
      return mistral(modelId)
    case "cohere":
      return cohere(modelId)
    default:
      return groq("llama3-8b") // Default fallback
  }
}

// Generate text with caching and fallbacks
export async function generateTextWithHub({
  prompt,
  system,
  preferences,
  cacheKey,
  useCache = true,
}: {
  prompt: string
  system?: string
  preferences: ModelPreferences
  cacheKey?: string
  useCache?: boolean
}) {
  // Check cache if enabled and key provided
  if (useCache && cacheKey) {
    const cachedResponse = await redis.get(`${CACHE_PREFIX}${cacheKey}`)
    if (cachedResponse) {
      return { text: cachedResponse as string, modelUsed: "cached", fromCache: true }
    }
  }

  // Select the best model based on preferences
  const selectedModel = selectModel(preferences)
  const modelInstance = getModelInstance(selectedModel)

  try {
    // Use fetch to directly call the model API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const text = data.choices[0].message.content

    // Cache the response if caching is enabled
    if (useCache && cacheKey && text) {
      await redis.set(`${CACHE_PREFIX}${cacheKey}`, text, { ex: CACHE_TTL })
    }

    return { text, modelUsed: selectedModel.id, fromCache: false }
  } catch (error) {
    console.error(`Error with model ${selectedModel.id}:`, error)

    // Try fallback model if the primary fails
    try {
      // Use XAI as fallback
      const response = await fetch("https://api.xai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "grok-1",
          messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
        }),
      })

      if (!response.ok) {
        throw new Error(`Fallback API request failed with status ${response.status}`)
      }

      const data = await response.json()
      const text = data.choices[0].message.content

      return { text, modelUsed: "xai/grok-1", fromCache: false, usedFallback: true }
    } catch (fallbackError) {
      console.error("Fallback model also failed:", fallbackError)
      throw new Error("All available models failed to generate text")
    }
  }
}

// Get available models filtered by capability
export function getAvailableModels(capability?: string) {
  if (capability) {
    return Object.values(models).filter((model) => model.capabilities.includes(capability))
  }
  return Object.values(models)
}

// Update model availability
export async function updateModelAvailability(modelId: string, isAvailable: boolean) {
  if (models[modelId]) {
    models[modelId].isAvailable = isAvailable
    return true
  }
  return false
}
