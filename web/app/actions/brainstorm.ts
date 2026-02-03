
"use server"

import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateTitles(keyword: string, language: string = "Thai", tone: string = "Professional") {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("Missing Anthropic API Key")
    }

    try {
        const languageMap: Record<string, string> = {
            "th": "Thai (ภาษาไทย)",
            "en": "English"
        }
        const fullLanguage = languageMap[language] || language

        const prompt = `
You are an expert Content Strategist / SEO Specialist.
Your task is to brainstorm 10 catchy, high-CTR article titles for the keyword: "${keyword}".

Language: ${fullLanguage}
Tone: ${tone}

Requirements:
- Titles must be engaging and clickable (Clickbait but honest).
- Optimized for SEO (include the keyword naturally if possible, or related terms).
- Varied styles (How-to, Listicle, Question, Deep Dive, etc.).
- Return strictly a JSON array of strings.

Example Output:
["7 วิธีทำการตลาดออนไลน์ให้ยอดขายพุ่ง", "การตลาดออนไลน์คืออะไร? คู่มือฉบับสมบูรณ์ 2024", ...]

Output:
`

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 1000,
            temperature: 0.8, // Slightly higher creativity for brainstorming
            system: "You are a creative content strategist.",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        })

        const content = message.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n")

        try {
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim()
            const titles = JSON.parse(cleanJson)

            if (Array.isArray(titles)) {
                return { success: true, titles }
            } else {
                return { success: false, error: "AI returned invalid format" }
            }
        } catch (e) {
            console.error("JSON Parse Error:", e)
            // Fallback: split by newlines if JSON fails
            const fallbackTitles = content.split("\n").filter(t => t.trim().length > 5).map(t => t.replace(/^\d+\.\s*/, '').replace(/["']/g, ''))
            return { success: true, titles: fallbackTitles }
        }

    } catch (error) {
        console.error("Error generating titles:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}
