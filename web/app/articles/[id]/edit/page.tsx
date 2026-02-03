
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { updateArticle } from "@/app/actions/articles"

export default function EditArticlePage() {
    const params = useParams()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        seo_title: "",
        slug: "",
        meta_description: ""
    })

    useEffect(() => {
        async function fetchArticle() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("articles")
                .select("*")
                .eq("id", params.id)
                .single()

            if (data) {
                setFormData({
                    title: data.title || "",
                    content: data.content_html || "", // We store MD in content_html
                    seo_title: data.seo_title || "",
                    slug: data.slug || "",
                    meta_description: data.meta_description || ""
                })
            } else {
                console.error("Error fetching article:", error)
            }
            setIsLoading(false)
        }
        if (params.id) fetchArticle()
    }, [params.id])

    async function handleSave() {
        setIsSaving(true)
        try {
            const res = await updateArticle(params.id as string, formData)
            if (res.success) {
                alert("Saved successfully! ✅")
                router.push(`/articles/${params.id}`)
                router.refresh()
            } else {
                alert(`Error saving: ${res.error}`)
            }
        } catch (e) {
            console.error(e)
            alert("Unexpected error")
        }
        setIsSaving(false)
    }

    if (isLoading) return <div className="p-8 text-center">Loading...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <Link href={`/articles/${params.id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Edit Article</h1>
                <div className="ml-auto">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Content Editor</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Article Title (H1)</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content (Markdown)</Label>
                            <Textarea
                                className="min-h-[500px] font-mono text-sm leading-relaxed"
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Supports Markdown formatting.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>SEO Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>SEO Title (Title Tag)</Label>
                            <Input
                                value={formData.seo_title}
                                onChange={e => setFormData({ ...formData, seo_title: e.target.value })}
                                maxLength={60}
                            />
                            <p className="text-xs text-muted-foreground text-right">{formData.seo_title.length}/60</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Slug (URL)</Label>
                            <Input
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Meta Description</Label>
                            <Textarea
                                value={formData.meta_description}
                                onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                                maxLength={160}
                            />
                            <p className="text-xs text-muted-foreground text-right">{formData.meta_description.length}/160</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
