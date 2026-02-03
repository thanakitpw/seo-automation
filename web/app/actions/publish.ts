"use server"

import { createClient } from "@/utils/supabase/server"

import showdown from "showdown"

export async function publishArticleToWordpress(articleId: string, status: 'publish' | 'draft' = 'publish') {
    const supabase = await createClient()

    // 1. Get Article and Client Credentials
    const { data: article, error: articleError } = await supabase
        .from("articles")
        .select(`
            *,
            clients (
                wp_url,
                wp_username,
                wp_app_password
            )
        `)
        .eq("id", articleId)
        .single()

    if (articleError || !article) {
        return { success: false, error: "Article not found" }
    }

    const client = article.clients
    if (!client || !client.wp_url || !client.wp_username || !client.wp_app_password) {
        return { success: false, error: "Client WordPress settings not configured" }
    }

    // 2. Prepare Data for WordPress API
    // Check if URL ends with slash or not
    const wpApiUrl = `${client.wp_url.replace(/\/$/, "")}/wp-json/wp/v2/posts`

    // Clean password: remove spaces if copied directly from WP
    const cleanAppPassword = client.wp_app_password.replace(/\s/g, "")
    const authHeader = 'Basic ' + Buffer.from(`${client.wp_username}:${cleanAppPassword}`).toString('base64')

    const payload = {
        title: article.title,
        status: status,
        content: ''
    }

    // Use Showdown for full Markdown support (Images, Tables, Lists, etc.)
    const converter = new showdown.Converter({
        tables: true,
        simplifiedAutoLink: true,
        strikethrough: true,
        tasklists: true
    })

    // WordPress expects HTML. 
    // If the article has custom image (e.g. from user input in MD), Showdown handles it: ![alt](url) -> <img src="url" ...>
    const finalHtml = converter.makeHtml(article.content_html)

    payload.content = finalHtml

    try {
        console.log(`🚀 Publishing to: ${wpApiUrl} [Status: ${status}]`)
        const res = await fetch(wpApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader
            },
            body: JSON.stringify(payload)
        })

        if (!res.ok) {
            const errorData = await res.json()
            console.error("❌ WP Publish Error:", errorData)
            return {
                success: false,
                error: `WP Error (${res.status}): ${errorData.message || JSON.stringify(errorData)}`
            }
        }

        const data = await res.json()

        // 3. Update Status in Supabase
        await supabase.from("articles").update({ status: status === 'draft' ? 'ready' : 'published' }).eq("id", articleId)

        return { success: true, wpPostId: data.id, link: data.link }

    } catch (error: any) {
        console.error("❌ Network/Server Error:", error)
        return { success: false, error: error.message }
    }
}
