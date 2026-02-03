"use client"

import { useState, useEffect } from "react"
// import { exportToDocx } from "@/utils/export-docx"
import { createClient } from "@/utils/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar, User, Globe, MessageSquare, ExternalLink, RefreshCw } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import { format } from "date-fns"
import { publishArticleToWordpress } from "@/app/actions/publish"

export default function ArticleDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [article, setArticle] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isPublishing, setIsPublishing] = useState(false)

    useEffect(() => {
        async function fetchArticle() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("articles")
                .select("*, clients(name)")
                .eq("id", params.id)
                .single()

            if (data) {
                setArticle(data)
            } else {
                console.error("Error fetching article:", error)
            }
            setIsLoading(false)
        }
        if (params.id) fetchArticle()
    }, [params.id])

    async function handlePublish() {
        if (!confirm("Confirm publish to WordPress? This will post the article to the configured site.")) return

        setIsPublishing(true)
        try {
            const res = await publishArticleToWordpress(article.id)
            if (res.success) {
                alert("Published successfully! ✅")
                // Refresh data
                setArticle((prev: any) => ({ ...prev, status: 'published' }))
            } else {
                alert(`Failed to publish: ${res.error}`)
            }
        } catch (e) {
            alert("Unexpected error during publishing")
            console.error(e)
        }
        setIsPublishing(false)
    }

    if (isLoading) return <div className="p-8 text-center">Loading...</div>
    if (!article) return <div className="p-8 text-center">Article not found</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <Link href="/articles">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold line-clamp-1">{article.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.clients?.name}</span>
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {article.language}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {article.brand_tone}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <Link href={`/articles/${article.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                    </Link>
                    <Badge className="capitalize" variant={article.status === 'published' ? 'default' : article.status === 'ready' ? 'secondary' : 'outline'}>
                        {article.status}
                    </Badge>
                </div>
            </div>

            {/* Content Preview (Styled) */}
            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <Card className="overflow-hidden border-2 shadow-sm">
                        <div className="bg-muted px-4 py-2 border-b flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                            </div>
                            <div className="mx-auto bg-background/50 px-3 py-0.5 rounded text-xs text-muted-foreground font-mono flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {article.slug ? `example.com/${article.slug}` : 'example.com/preview'}
                            </div>
                        </div>
                        <div className="p-8 md:p-12 bg-background">
                            <article className="min-h-[500px]">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 text-foreground/90 scroll-m-20" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-10 mb-4 text-foreground/90 scroll-m-20 border-b pb-2 first:mt-0" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-xl md:text-2xl font-semibold tracking-tight mt-8 mb-4 text-foreground/90 scroll-m-20" {...props} />,
                                        p: ({ node, ...props }) => <p className="leading-7 [&:not(:first-child)]:mt-6 text-muted-foreground/90 text-lg" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-muted-foreground/90" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2 text-muted-foreground/90" {...props} />,
                                        li: ({ node, ...props }) => <li className="leading-7" {...props} />,
                                        blockquote: ({ node, ...props }) => <blockquote className="mt-6 border-l-4 border-primary pl-6 italic text-foreground/80 py-2 bg-muted/30 rounded-r" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
                                        a: ({ node, ...props }) => <a className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors" {...props} />,
                                        code: ({ node, ...props }) => <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground" {...props} />,
                                    }}
                                >
                                    {article.content_html}
                                </ReactMarkdown>
                            </article>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-4">
                    <Card className="p-4 space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Meta Info</h3>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Keyword</label>
                            <p className="font-medium">{article.keyword}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">SEO Title</label>
                            <p className="text-sm border p-2 rounded bg-muted/20">{article.seo_title || "-"}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Slug</label>
                            <p className="text-sm font-mono text-muted-foreground">{article.slug || "-"}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Meta Description</label>
                            <p className="text-sm text-muted-foreground">{article.meta_description || "-"}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Created Date</label>
                            <p className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {format(new Date(article.created_at), "PPP p")}
                            </p>
                        </div>
                    </Card>

                    {/* <Button className="w-full" variant="outline" onClick={() => exportToDocx(article)}>
                        <ExternalLink className="w-4 h-4 mr-2" /> Export to Word (.docx)
                    </Button> */}

                    <Button
                        className="w-full"
                        disabled={article.status === 'published' || isPublishing}
                        onClick={handlePublish}
                    >
                        {isPublishing ? (
                            <>Publishing...</>
                        ) : (
                            <>{article.status === 'published' ? 'Published' : 'Publish to WordPress'}</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
