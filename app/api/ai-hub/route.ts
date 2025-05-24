import { type NextRequest, NextResponse } from "next/server"

// Mock models for the API
const mockModels = [
  {
    id: "groq/llama3-70b",
    provider: "groq",
    name: "Llama 3 70B",
    capabilities: ["text-generation", "chat", "embeddings"],
    costPer1kTokens: 0.0007,
    contextWindow: 8192,
    isAvailable: true,
  },
  {
    id: "groq/llama3-8b",
    provider: "groq",
    name: "Llama 3 8B",
    capabilities: ["text-generation", "chat", "embeddings"],
    costPer1kTokens: 0.0002,
    contextWindow: 8192,
    isAvailable: true,
  },
  {
    id: "xai/grok-1",
    provider: "xai",
    name: "Grok-1",
    capabilities: ["text-generation", "chat", "code"],
    costPer1kTokens: 0.0005,
    contextWindow: 8192,
    isAvailable: true,
  },
]

export async function POST(request: NextRequest) {
  try {
    const { prompt, system, preferences, cacheKey, useCache } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Generate a mock response
    const mockResponse = {
      text: `This is a mock response for: "${prompt}"\n\nThe AI Hub is working correctly, but we're using a mock response for demonstration purposes.`,
      modelUsed: "groq/llama3-70b",
      fromCache: false,
    }

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error("Error in AI Hub route:", error)
    return NextResponse.json({ error: "Failed to generate text", details: (error as Error).message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const capability = request.nextUrl.searchParams.get("capability") || undefined

    // Filter models based on capability
    const filteredModels = capability
      ? mockModels.filter((model) => model.capabilities.includes(capability))
      : mockModels

    return NextResponse.json({ models: filteredModels })
  } catch (error) {
    console.error("Error fetching models:", error)
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
  }
}
