// Function to analyze a task using Groq
export async function analyzeTaskWithGroq(taskTitle: string, taskDescription?: string) {
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

  try {
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
      return JSON.parse(text)
    } catch (e) {
      console.error("Failed to parse AI response", e)
      return null
    }
  } catch (error) {
    console.error("Error analyzing task with Groq:", error)
    return null
  }
}

// Function to generate task suggestions using Grok
export async function generateTaskSuggestions(existingTasks: string[]) {
  const tasksText = existingTasks.join("\n- ")

  const prompt = `
    Based on these existing tasks:
    - ${tasksText}
    
    Suggest 3 additional tasks that might be relevant. Format as a JSON array of task objects with "title" and "priority" fields.
  `

  try {
    const response = await fetch("https://api.xai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-1",
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const text = data.choices[0].message.content

    try {
      return JSON.parse(text)
    } catch (e) {
      console.error("Failed to parse AI response", e)
      return []
    }
  } catch (error) {
    console.error("Error generating task suggestions:", error)
    return []
  }
}
