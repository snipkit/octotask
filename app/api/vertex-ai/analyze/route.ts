import { type NextRequest, NextResponse } from "next/server"

// Since we don't have direct Vertex AI integration, we'll use Groq as a fallback
export async function POST(request: NextRequest) {
  try {
    const { taskTitle, taskDescription } = await request.json()

    if (!taskTitle) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 })
    }

    const prompt = `
      Analyze this task: "${taskTitle}"
      ${taskDescription ? `Additional details: "${taskDescription}"` : ""}
      
      Provide:
      1. Priority level (High/Medium/Low)
      2. Estimated time to complete
      3. Suggested category
      4. Any potential blockers
      
      Format as JSON.
    `

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const text = data.choices[0].message.content

    try {
      const result = JSON.parse(text)
      return NextResponse.json(result)
    } catch (e) {
      console.error("Failed to parse AI response", e)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in Vertex AI analyze route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
