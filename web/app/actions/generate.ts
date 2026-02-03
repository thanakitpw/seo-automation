
"use server"

import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateArticle(keyword: string, clientName: string, language: string = "Thai", tone: string = "Professional", customTitle?: string) {
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
You are an expert SEO Content Writer. Create a high-quality, engaging article for the client "${clientName}".
Topic/Keyword: "${keyword}"
${customTitle ? `Strict Title: "${customTitle}" (Use this exact title)` : 'Title: Create a catchy, SEO-friendly title.'}
Language: ${fullLanguage}
Tone: ${tone}

Guidelines:
- Write in a natural, human-like tone corresponding to the requested "${tone}" style.
- ${customTitle ? `Use "${customTitle}" as the main H1 title.` : 'Create a compelling H1 title.'}
- Structure the content with clear H1, H2, H3 headers.
- Integrate the keyword naturally throughout the text.
- Include a catchy title.
- Integrate the keyword naturally throughout the text.
- Focus on providing value to the reader (E-E-A-T).
- Length: Approx 1000-1500 words.
- IMPORTANT: You MUST complete the article. Do not cut off.
- Format: Return strictly a Valid JSON object.

JSON Structure:
{
  "title": "A catchy, SEO-friendly H1 title",
  "seo_title": "Optimized title for search engines",
  "slug": "url-friendly-slug-example",
  "meta_description": "Compelling summary (150-160 chars)",
  "content": "# [Title] \n\n[Full Markdown Content...]\n\n## Conclusion\n[Final thoughts]"
}
`

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 8192,
            temperature: 0.7,
            system: "You are a professional SEO content writer. You always finish your articles completely.",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        })

        // Extract text from the response safely
        const content = message.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n")

        // Parse JSON if possible (Sonnet might wrap in text)
        // Note: In previous step we updated prompt to return JSON.
        // We need to correctly parse it here.
        try {
            // Remove markdown code blocks if present
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim()
            const data = JSON.parse(cleanJson)
            return {
                success: true,
                keyword,
                content: data.content,
                title: data.title,
                seo_title: data.seo_title,
                slug: data.slug,
                meta_description: data.meta_description
            }
        } catch (e) {
            // Fallback if not JSON
            return { success: true, keyword, content, title: undefined, slug: undefined, seo_title: undefined, meta_description: undefined }
        }
    } catch (error) {
        console.error("Error generating article:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        return { success: false, error: errorMessage }
    }
}
