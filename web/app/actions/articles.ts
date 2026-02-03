
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
