"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import Link from "next/link"
import { Eye, FileEdit, Share, RefreshCw, User, CheckCircle, Trash2, Wrench } from "lucide-react"

export default function ArticlesPage() {
    const [articles, setArticles] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedClient, setSelectedClient] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")

    // Selection & Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isBulkPublishing, setIsBulkPublishing] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [isBulkFixing, setIsBulkFixing] = useState(false)
    const [publishingMap, setPublishingMap] = useState<Record<string, boolean>>({})

    // Publish Dialog State
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
    const [publishStatus, setPublishStatus] = useState<'draft' | 'publish'>('draft')
    const [targetPublishId, setTargetPublishId] = useState<string | null>(null) // null = bulk

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient()

            // Fetch Clients
            const { data: clientsData } = await supabase.from("clients").select("id, name")
            if (clientsData) setClients(clientsData)

            // Fetch Articles
            let query = supabase.from("articles").select(`
                *,
                clients (name)
            `).order('created_at', { ascending: false })

            if (selectedClient !== "all") {
                query = query.eq('client_id', selectedClient)
            }

            const { data: articlesData } = await query
            if (articlesData) setArticles(articlesData)

            setIsLoading(false)
        }
        fetchData()
    }, [selectedClient])

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredArticles.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredArticles.map(a => a.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const openPublishDialog = (id: string | null = null) => {
        setPublishStatus('draft') // Reset to default
        if (id) {
            setTargetPublishId(id)
        } else {
            // Bulk mode
            setTargetPublishId(null)
            if (selectedIds.length === 0) return alert("Select articles first!")
        }
        setIsPublishDialogOpen(true)
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return alert("Select articles first!")
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} article(s)? This action cannot be undone.`)) return

        setIsBulkDeleting(true)
        try {
            const { bulkDeleteArticles } = await import("@/app/actions/articles")
            const res = await bulkDeleteArticles(selectedIds)

            if (res.success) {
                // Remove deleted articles from the local state
                setArticles(prev => prev.filter(a => !selectedIds.includes(a.id)))
                setSelectedIds([])
                alert(`Successfully deleted ${res.deletedCount} article(s)!`)
            } else {
                alert(`Failed to delete: ${res.error}`)
            }
        } catch (e) {
            console.error(e)
            alert("Error during bulk delete")
        }
        setIsBulkDeleting(false)
    }

    async function handleBulkFixFormat() {
        if (selectedIds.length === 0) return alert("Select articles first!")
        if (!confirm(`Attempt to fix format for ${selectedIds.length} article(s)?`)) return

        setIsBulkFixing(true)
        try {
            const { bulkFixArticleFormat } = await import("@/app/actions/articles")
            const res = await bulkFixArticleFormat(selectedIds)

            setSelectedIds([])
            alert(`Fix Format Complete:\n✅ Fixed: ${res.fixedCount}\n⏭️ Skipped (OK): ${res.skippedCount}\n❌ Errors: ${res.errorCount}`)
            // Refresh to show updated articles
            window.location.reload()
        } catch (e) {
            console.error(e)
            alert("Error during bulk fix")
        }
        setIsBulkFixing(false)
    }

    async function executePublish() {
        const idsToPublish = targetPublishId ? [targetPublishId] : selectedIds
        const isBulk = !targetPublishId

        if (isBulk) setIsBulkPublishing(true)
        else setPublishingMap(prev => ({ ...prev, [targetPublishId!]: true }))

        setIsPublishDialogOpen(false)

        const { publishArticleToWordpress } = await import("@/app/actions/publish")

        let successCount = 0
        let failCount = 0

        for (const id of idsToPublish) {
            try {
                // Pass the selected status here
                const res = await publishArticleToWordpress(id, publishStatus)
                if (res.success) {
                    successCount++
                    setArticles(prev => prev.map(a => a.id === id ? { ...a, status: 'published' } : a))
                } else {
                    failCount++
                    console.error(`Failed to publish ${id}:`, res.error)
                }
            } catch (e) {
                failCount++
                console.error(e)
            }
        }

        if (isBulk) {
            setIsBulkPublishing(false)
            setSelectedIds([])
            alert(`Bulk Operation Complete (${publishStatus.toUpperCase()}):\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`)
        } else {
            setPublishingMap(prev => ({ ...prev, [targetPublishId!]: false }))
            if (successCount > 0) alert(`Successfully saved as ${publishStatus}!`)
            else alert("Failed to publish.")
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">All Articles</h1>
                    <p className="text-muted-foreground">Manage and review your generated content.</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <>
                            <Button onClick={handleBulkFixFormat} disabled={isBulkFixing || isBulkDeleting || isBulkPublishing} variant="secondary" className="animate-in fade-in zoom-in">
                                {isBulkFixing ? (
                                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Fixing...</>
                                ) : (
                                    <><Wrench className="w-4 h-4 mr-2" /> Fix ({selectedIds.length})</>
                                )}
                            </Button>
                            <Button onClick={handleBulkDelete} disabled={isBulkDeleting || isBulkPublishing || isBulkFixing} variant="destructive" className="animate-in fade-in zoom-in">
                                {isBulkDeleting ? (
                                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                                ) : (
                                    <><Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.length})</>
                                )}
                            </Button>
                            <Button onClick={() => openPublishDialog(null)} disabled={isBulkPublishing || isBulkDeleting} variant="default" className="animate-in fade-in zoom-in">
                                {isBulkPublishing ? (
                                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
                                ) : (
                                    <><Share className="w-4 h-4 mr-2" /> Publish ({selectedIds.length})</>
                                )}
                            </Button>
                        </>
                    )}
                    <Link href="/generate-bulk">
                        <Button>+ Generate New</Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 border-r pr-4 mr-2">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={filteredArticles.length > 0 && selectedIds.length === filteredArticles.length}
                            onChange={toggleSelectAll}
                        />
                        <span className="text-sm font-medium">Select All</span>
                    </div>
                    <div className="flex-1 w-full">
                        <Input
                            placeholder="Search by title or keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-[200px]">
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by Client" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Clients</SelectItem>
                                {clients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Publish Dialog */}
            <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Publish to WordPress</DialogTitle>
                        <DialogDescription>
                            Choose how you want to publish the selected article(s).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <RadioGroup value={publishStatus} onValueChange={(v) => setPublishStatus(v as 'draft' | 'publish')}>
                            <div className="flex items-center space-x-2 mb-4">
                                <RadioGroupItem value="draft" id="r-draft" />
                                <Label htmlFor="r-draft" className="font-normal cursor-pointer">
                                    <strong>Save as Draft</strong> (Recommended for review)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="publish" id="r-publish" />
                                <Label htmlFor="r-publish" className="font-normal cursor-pointer">
                                    <strong>Publish Immediately</strong> (Live on site)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>Cancel</Button>
                        <Button onClick={executePublish} disabled={isBulkPublishing || !!Object.values(publishingMap).some(Boolean)}>
                            {isBulkPublishing ? 'Processing...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Articles List */}
            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-center py-10">Loading articles...</div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 rounded-lg">No articles found.</div>
                ) : (
                    filteredArticles.map(article => (
                        <Card key={article.id} className={`transition-colors border-l-4 ${selectedIds.includes(article.id) ? 'bg-muted/30 border-l-primary' : 'border-l-transparent hover:bg-muted/20'}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={selectedIds.includes(article.id)}
                                    onChange={() => toggleSelect(article.id)}
                                />

                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate text-lg">
                                            <Link href={`/articles/${article.id}`} className="hover:underline opacity-90 hover:opacity-100">
                                                {article.title}
                                            </Link>
                                        </h3>
                                        <Badge variant={
                                            article.status === 'published' ? 'default' :
                                                article.status === 'ready' ? 'secondary' : 'outline'
                                        }>
                                            {article.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.clients?.name || "Unknown"}</span>
                                        <span>•</span>
                                        <span>{article.keyword}</span>
                                        <span>•</span>
                                        <span>{format(new Date(article.created_at), "d MMM, HH:mm")}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <Link href={`/articles/${article.id}/edit`}>
                                        <Button variant="ghost" size="sm" title="Edit Article">
                                            <FileEdit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                    </Link>

                                    <Link href={`/articles/${article.id}`}>
                                        <Button variant="ghost" size="sm" title="View Preview">
                                            <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                    </Link>

                                    <Button
                                        size="sm"
                                        variant={article.status === 'published' ? 'ghost' : 'outline'}
                                        onClick={() => openPublishDialog(article.id)}
                                        disabled={publishingMap[article.id] || article.status === 'published'}
                                        className={article.status === 'published' ? 'text-green-600' : ''}
                                    >
                                        {publishingMap[article.id] ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : article.status === 'published' ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <Share className="w-4 h-4" />
                                        )}
                                        {article.status !== 'published' && <span className="ml-2 hidden md:inline">Publish</span>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
