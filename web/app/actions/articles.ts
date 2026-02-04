
"use server"

import { createClient } from "@/utils/supabase/server"


export async function updateArticle(articleId: string, data: {
    title: string
    content: string
    seo_title?: string
    slug?: string
    meta_description?: string
}) {
    try {
        const supabase = await createClient()

        // Validate basic data
        if (!data.title || !data.content) {
            return { success: false, error: "Title and Content are required" }
        }

        const { error } = await supabase
            .from("articles")
            .update({
                title: data.title,
                content_html: data.content, // We map content to content_html as we store markdown there
                seo_title: data.seo_title,
                slug: data.slug,
                meta_description: data.meta_description,
                updated_at: new Date().toISOString()
            })
            .eq("id", articleId)

        if (error) {
            console.error("Supabase update error:", error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error("Update Article Error:", error)
        return { success: false, error: "Internal Server Error" }
    }
}

export async function deleteArticle(articleId: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from("articles")
            .delete()
            .eq("id", articleId)

        if (error) {
            console.error("Supabase delete error:", error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error("Delete Article Error:", error)
        return { success: false, error: "Internal Server Error" }
    }
}

export async function bulkDeleteArticles(articleIds: string[]) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from("articles")
            .delete()
            .in("id", articleIds)

        if (error) {
            console.error("Supabase bulk delete error:", error)
            return { success: false, error: error.message, deletedCount: 0 }
        }

        return { success: true, deletedCount: articleIds.length }
    } catch (error) {
        console.error("Bulk Delete Articles Error:", error)
        return { success: false, error: "Internal Server Error", deletedCount: 0 }
    }
}

/**
 * Fix article format - parses JSON stored as content and extracts proper fields
 */
export async function fixArticleFormat(articleId: string) {
    try {
        const supabase = await createClient()

        // Fetch the current article
        const { data: article, error: fetchError } = await supabase
            .from("articles")
            .select("*")
            .eq("id", articleId)
            .single()

        if (fetchError || !article) {
            return { success: false, error: "Article not found" }
        }

        const content = article.content_html || ""

        // Check if content looks like JSON - either starts with { or contains markdown json block
        const looksLikeJson = (
            content.includes('"content"') &&
            (content.trim().startsWith('{') || content.includes('```json'))
        )

        if (!looksLikeJson) {
            return { success: false, error: "Article is not in JSON format, no fix needed" }
        }

        try {
            // Clean up markdown code blocks if present
            let jsonString = content
            if (jsonString.includes('```json')) {
                jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '')
            }

            // Find JSON boundaries
            const firstBrace = jsonString.indexOf('{')
            const lastBrace = jsonString.lastIndexOf('}')

            if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
                return { success: false, error: "Could not find valid JSON structure" }
            }

            jsonString = jsonString.substring(firstBrace, lastBrace + 1)

            // Try to parse the JSON content
            const parsed = JSON.parse(jsonString)

            // Extract the actual content field
            const extractedContent = parsed.content || content
            const extractedTitle = parsed.title || article.title
            const extractedSeoTitle = parsed.seo_title || article.seo_title
            const extractedSlug = parsed.slug || article.slug
            const extractedMetaDesc = parsed.meta_description || article.meta_description

            // Update the article with extracted data
            const { error: updateError } = await supabase
                .from("articles")
                .update({
                    content_html: extractedContent,
                    title: extractedTitle,
                    seo_title: extractedSeoTitle,
                    slug: extractedSlug,
                    meta_description: extractedMetaDesc,
                    updated_at: new Date().toISOString()
                })
                .eq("id", articleId)

            if (updateError) {
                return { success: false, error: updateError.message }
            }

            return {
                success: true,
                message: "Article format fixed successfully",
                updatedFields: {
                    title: extractedTitle,
                    seo_title: extractedSeoTitle,
                    slug: extractedSlug
                }
            }
        } catch (parseError) {
            return { success: false, error: "Failed to parse JSON content" }
        }
    } catch (error) {
        console.error("Fix Article Format Error:", error)
        return { success: false, error: "Internal Server Error" }
    }
}

/**
 * Bulk fix format for multiple articles
 */
export async function bulkFixArticleFormat(articleIds: string[]) {
    let fixedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const id of articleIds) {
        const result = await fixArticleFormat(id)
        if (result.success) {
            fixedCount++
        } else if (result.error?.includes("no fix needed")) {
            skippedCount++
        } else {
            errorCount++
        }
    }

    return {
        success: true,
        fixedCount,
        skippedCount,
        errorCount,
        total: articleIds.length
    }
}
