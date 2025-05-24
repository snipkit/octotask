"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap, BrainCircuit, History, Send } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Define model info type locally to avoid import issues
interface ModelInfo {
  id: string
  provider: string
  name: string
  capabilities: string[]
  costPer1kTokens: number
  contextWindow: number
  isAvailable: boolean
}

// Define preferences type locally
interface ModelPreferences {
  capability: string
  maxCostPer1kTokens?: number
  minContextWindow?: number
  preferredProviders?: string[]
  fallbackStrategy?: "cost" | "context" | "availability"
}

export default function AIHubPanel() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [history, setHistory] = useState<{ prompt: string; response: string; modelUsed: string }[]>([])

  // Preferences
  const [preferences, setPreferences] = useState<ModelPreferences>({
    capability: "text-generation",
    maxCostPer1kTokens: 0.01,
    minContextWindow: 4000,
    preferredProviders: ["groq", "xai"],
    fallbackStrategy: "cost",
  })

  const [useCache, setUseCache] = useState(true)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    setLoading(true)
    try {
      // Use a simpler approach to avoid API issues
      // This is a mock implementation that doesn't rely on the API
      const mockModels: ModelInfo[] = [
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

      // Filter models based on capability
      const filteredModels = preferences.capability
        ? mockModels.filter((model) => model.capabilities.includes(preferences.capability))
        : mockModels

      setModels(filteredModels)
    } catch (error) {
      console.error("Error fetching models:", error)
      toast({
        title: "Error",
        description: "Failed to fetch available models",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateText = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to generate text",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    setResponse("")

    try {
      // Use a direct approach to generate text
      let result

      // Try to use the API if available
      try {
        const response = await fetch("/api/ai-hub", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            preferences,
            useCache,
            cacheKey: useCache ? `prompt:${prompt}` : undefined,
          }),
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        result = await response.json()
      } catch (apiError) {
        console.error("API error, using fallback:", apiError)

        // Fallback to mock response if API fails
        result = {
          text: `This is a mock response for: "${prompt}"\n\nThe AI Hub API is currently unavailable. This is a fallback response to demonstrate the UI functionality.`,
          modelUsed: "mock/fallback",
          fromCache: false,
        }
      }

      setResponse(result.text)
      setHistory((prev) => [
        { prompt, response: result.text, modelUsed: result.modelUsed },
        ...prev.slice(0, 9), // Keep only the last 10 items
      ])

      toast({
        title: "Generation complete",
        description: `Generated using ${result.fromCache ? "cache" : result.modelUsed}`,
      })
    } catch (error) {
      console.error("Error generating text:", error)
      toast({
        title: "Generation failed",
        description: (error as Error).message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleProviderToggle = (provider: string) => {
    setPreferences((prev) => {
      const currentProviders = prev.preferredProviders || []
      const newProviders = currentProviders.includes(provider)
        ? currentProviders.filter((p) => p !== provider)
        : [...currentProviders, provider]

      return {
        ...prev,
        preferredProviders: newProviders,
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-blue-400" />
            AI Hub
          </CardTitle>
          <CardDescription>Unified API for multiple AI models with automatic fallbacks</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3 p-1 glass-card rounded-xl mb-6">
              <TabsTrigger
                value="generate"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
              >
                Generate
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
              >
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
              >
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-white mb-2 block">
                    Prompt
                  </Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    className="glass-card border-gray-700 focus:border-blue-500 bg-black/20 min-h-[120px]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="use-cache"
                      checked={useCache}
                      onCheckedChange={setUseCache}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <Label htmlFor="use-cache" className="text-sm text-muted-foreground">
                      Use cache
                    </Label>
                  </div>

                  <Button
                    onClick={generateText}
                    disabled={generating || !prompt.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>

                {response && (
                  <div className="mt-6">
                    <Label className="text-white mb-2 block">Response</Label>
                    <div className="glass-card border-gray-700 bg-black/20 rounded-lg p-4 whitespace-pre-wrap">
                      {response}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <div>
                  <Label className="text-white mb-2 block">Capability</Label>
                  <select
                    value={preferences.capability}
                    onChange={(e) => {
                      setPreferences({ ...preferences, capability: e.target.value })
                      fetchModels()
                    }}
                    className="glass-card border-gray-700 focus:border-blue-500 bg-black/20 rounded-md p-2 w-full"
                  >
                    <option value="text-generation">Text Generation</option>
                    <option value="chat">Chat</option>
                    <option value="code">Code</option>
                    <option value="embeddings">Embeddings</option>
                    <option value="vision">Vision</option>
                  </select>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Max Cost (per 1k tokens)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[preferences.maxCostPer1kTokens || 0.01]}
                      min={0.0001}
                      max={0.02}
                      step={0.0001}
                      onValueChange={(value) => setPreferences({ ...preferences, maxCostPer1kTokens: value[0] })}
                      className="flex-1"
                    />
                    <span className="text-white min-w-[60px] text-right">
                      ${preferences.maxCostPer1kTokens?.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Min Context Window</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[preferences.minContextWindow || 4000]}
                      min={1000}
                      max={200000}
                      step={1000}
                      onValueChange={(value) => setPreferences({ ...preferences, minContextWindow: value[0] })}
                      className="flex-1"
                    />
                    <span className="text-white min-w-[60px] text-right">
                      {preferences.minContextWindow?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Fallback Strategy</Label>
                  <div className="flex gap-2">
                    {["cost", "context", "availability"].map((strategy) => (
                      <Button
                        key={strategy}
                        type="button"
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            fallbackStrategy: strategy as "cost" | "context" | "availability",
                          })
                        }
                        className={
                          preferences.fallbackStrategy === strategy
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                            : "glass-card border-gray-700 text-white"
                        }
                      >
                        {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Preferred Providers</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["groq", "xai", "openai", "anthropic", "mistral", "cohere", "vertex"].map((provider) => (
                      <div
                        key={provider}
                        className={`glass-card border-gray-700 p-3 rounded-lg cursor-pointer ${
                          preferences.preferredProviders?.includes(provider) ? "bg-blue-900/30 border-blue-700" : ""
                        }`}
                        onClick={() => handleProviderToggle(provider)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white capitalize">{provider}</span>
                          <Switch
                            checked={preferences.preferredProviders?.includes(provider) || false}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Available Models</Label>
                  <div className="glass-card border-gray-700 bg-black/20 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                      </div>
                    ) : models.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No models available</p>
                    ) : (
                      <div className="space-y-2">
                        {models.map((model) => (
                          <div
                            key={model.id}
                            className="flex items-center justify-between p-2 rounded-lg glass-card hover:bg-white/5"
                          >
                            <div>
                              <div className="font-medium text-white">{model.name}</div>
                              <div className="text-xs text-muted-foreground">{model.id}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`${
                                  model.isAvailable
                                    ? "bg-green-900/30 text-green-300 border-green-800"
                                    : "bg-red-900/30 text-red-300 border-red-800"
                                }`}
                              >
                                {model.isAvailable ? "Available" : "Unavailable"}
                              </Badge>
                              <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-800">
                                ${model.costPer1kTokens.toFixed(4)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={fetchModels}
                    className="mt-2 glass-card border-gray-700 text-white hover:bg-white/10"
                    size="sm"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Refresh Models
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                {history.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No generation history yet</p>
                ) : (
                  history.map((item, index) => (
                    <div key={index} className="glass-card border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-800">
                          {item.modelUsed}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPrompt(item.prompt)
                            setResponse(item.response)
                          }}
                          className="h-8 text-xs text-muted-foreground hover:text-white"
                        >
                          <History className="mr-1 h-3 w-3" />
                          Reuse
                        </Button>
                      </div>
                      <div className="text-sm text-white font-medium mb-1">Prompt:</div>
                      <div className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.prompt}</div>
                      <div className="text-sm text-white font-medium mb-1">Response:</div>
                      <div className="text-sm text-muted-foreground line-clamp-3">{item.response}</div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
