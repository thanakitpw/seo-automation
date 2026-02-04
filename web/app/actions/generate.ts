
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

        // More explicit and stricter prompt for consistent output
        const prompt = `You are an expert SEO Content Writer. Create a high-quality article for "${clientName}".

REQUIREMENTS:
- Keyword: "${keyword}"
- Language: ${fullLanguage}
- Tone: ${tone}
${customTitle ? `- Title: Use exactly "${customTitle}"` : '- Title: Create a catchy, SEO-friendly title'}

ARTICLE STRUCTURE (in Markdown):
1. Start with H1 title using #
2. Write an engaging introduction (2-3 paragraphs)
3. Use H2 (##) for main sections
4. Use H3 (###) for subsections if needed
5. Include bullet points or numbered lists where appropriate
6. End with a conclusion section

LENGTH: 1000-1500 words
IMPORTANT: Complete the entire article. Do not cut off mid-sentence.

OUTPUT FORMAT: Return ONLY a valid JSON object with NO additional text before or after:
{
  "title": "Your H1 Title Here",
  "seo_title": "SEO Optimized Title | ${clientName}",
  "slug": "url-friendly-slug",
  "meta_description": "Compelling 150-160 character summary",
  "content": "# Title\\n\\nIntroduction...\\n\\n## Section 1\\n\\nContent...\\n\\n## Conclusion\\n\\nFinal thoughts..."
}

CRITICAL: Return ONLY the JSON object. No markdown code blocks, no explanations.`

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 8192,
            temperature: 0.5, // Lower temperature for more consistent output
            system: "You are a professional SEO content writer. You ALWAYS return valid JSON only, with no additional text or markdown code blocks. Your articles are always complete and well-structured.",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        })

        // Extract text from the response safely
        const rawContent = message.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n")
            .trim()

        console.log("--- Raw AI Response (first 500 chars) ---")
        console.log(rawContent.substring(0, 500))
        console.log("-------------------------------------------")

        // Robust JSON extraction
        let jsonString = rawContent

        // Remove markdown code blocks if present
        if (jsonString.includes('```json')) {
            jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '')
        } else if (jsonString.includes('```')) {
            jsonString = jsonString.replace(/```\s*/g, '')
        }

        // Find the JSON object boundaries
        const firstBrace = jsonString.indexOf('{')
        const lastBrace = jsonString.lastIndexOf('}')

        if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
            console.error("No valid JSON structure found in response")
            // Create a basic article from raw content as fallback
            return {
                success: true,
                keyword,
                content: `# ${customTitle || keyword}\n\n${rawContent}`,
                title: customTitle || keyword,
                seo_title: `${customTitle || keyword} | ${clientName}`,
                slug: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                meta_description: rawContent.substring(0, 155)
            }
        }

        jsonString = jsonString.substring(firstBrace, lastBrace + 1)

        try {
            const data = JSON.parse(jsonString)

            // Validate that content doesn't contain the JSON structure itself
            if (data.content && (data.content.includes('"title":') || data.content.includes('"seo_title":'))) {
                console.error("Content appears to contain JSON - attempting to clean")
                // Try to extract just the content field value from nested JSON
                const contentMatch = data.content.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|\"\s*})/);
                if (contentMatch) {
                    data.content = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
                }
            }

            // Validate required fields
            if (!data.content || data.content.length < 100) {
                console.error("Content is missing or too short")
                return {
                    success: true,
                    keyword,
                    content: `# ${customTitle || keyword}\n\n${rawContent}`,
                    title: customTitle || keyword,
                    seo_title: `${customTitle || keyword} | ${clientName}`,
                    slug: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    meta_description: rawContent.substring(0, 155)
                }
            }

            console.log("--- Parsed Successfully ---")
            console.log("Title:", data.title)
            console.log("Slug:", data.slug)
            console.log("Content Length:", data.content?.length)
            console.log("--------------------------")

            return {
                success: true,
                keyword,
                content: data.content,
                title: data.title || customTitle || keyword,
                seo_title: data.seo_title || `${data.title || keyword} | ${clientName}`,
                slug: data.slug || keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                meta_description: data.meta_description || ""
            }
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError)
            console.log("Failed JSON String:", jsonString.substring(0, 500))

            // Return a structured fallback
            return {
                success: true,
                keyword,
                content: `# ${customTitle || keyword}\n\n${rawContent}`,
                title: customTitle || keyword,
                seo_title: `${customTitle || keyword} | ${clientName}`,
                slug: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                meta_description: rawContent.substring(0, 155)
            }
        }
    } catch (error) {
        console.error("Error generating article:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        return { success: false, error: errorMessage }
    }
}
