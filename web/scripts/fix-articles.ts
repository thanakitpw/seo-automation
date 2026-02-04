/**
 * Script to fix articles with JSON format issues
 * Run with: npx tsx scripts/fix-articles.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixArticles() {
    console.log('🔍 Finding articles with JSON format issues...\n')

    // Get all articles with potential JSON format issues
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, content_html, seo_title, slug, meta_description')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching articles:', error)
        return
    }

    let fixedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const article of articles) {
        const content = article.content_html || ''

        // Check if content contains JSON structure
        const hasJsonMarkers = content.includes('"content"') &&
            (content.trim().startsWith('{') || content.includes('```json'))

        if (!hasJsonMarkers) {
            skippedCount++
            continue
        }

        console.log(`📝 Processing: ${article.title}`)

        try {
            // Remove markdown code blocks
            let jsonString = content
            if (jsonString.includes('```json')) {
                jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '')
            }

            // Find JSON boundaries
            const firstBrace = jsonString.indexOf('{')
            const lastBrace = jsonString.lastIndexOf('}')

            if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
                console.log(`   ⚠️ Could not find valid JSON structure`)
                errorCount++
                continue
            }

            jsonString = jsonString.substring(firstBrace, lastBrace + 1)

            // Parse JSON
            const parsed = JSON.parse(jsonString)

            // Extract fields
            const extractedContent = parsed.content || content
            const extractedTitle = parsed.title || article.title
            const extractedSeoTitle = parsed.seo_title || article.seo_title
            const extractedSlug = parsed.slug || article.slug
            const extractedMetaDesc = parsed.meta_description || article.meta_description

            // Update the article
            const { error: updateError } = await supabase
                .from('articles')
                .update({
                    content_html: extractedContent,
                    title: extractedTitle,
                    seo_title: extractedSeoTitle,
                    slug: extractedSlug,
                    meta_description: extractedMetaDesc,
                    updated_at: new Date().toISOString()
                })
                .eq('id', article.id)

            if (updateError) {
                console.log(`   ❌ Error updating: ${updateError.message}`)
                errorCount++
            } else {
                console.log(`   ✅ Fixed successfully!`)
                fixedCount++
            }
        } catch (parseError) {
            console.log(`   ❌ JSON parse error: ${parseError}`)
            errorCount++
        }
    }

    console.log('\n📊 Summary:')
    console.log(`   ✅ Fixed: ${fixedCount}`)
    console.log(`   ⏭️ Skipped (OK): ${skippedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📦 Total: ${articles.length}`)
}

fixArticles().then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
}).catch(err => {
    console.error('Script error:', err)
    process.exit(1)
})
