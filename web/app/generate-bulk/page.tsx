
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Component, Loader2, Sparkles, Lightbulb, Plus } from "lucide-react"
import { generateArticle } from "@/app/actions/generate"
import { generateTitles } from "@/app/actions/brainstorm"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { useEffect } from "react"
import { useGeneration } from "@/context/GenerationContext"

export default function BulkGeneratorPage() {
    const { addToQueue, queue } = useGeneration()
    const [keywords, setKeywords] = useState("")
    // Brainstorming State
    const [brainstormKeyword, setBrainstormKeyword] = useState("")
    const [brainstorming, setBrainstorming] = useState(false)
    const [generatedTitles, setGeneratedTitles] = useState<string[]>([])

    // ... rest of state
    const [isLoading, setIsLoading] = useState(false) // Local loading state for initial checks? OR remove if using context entirely?
    // Actually we keep local state for the "Start Generation" button to feed the context

    const [clients, setClients] = useState<any[]>([])
    const [selectedClientId, setSelectedClientId] = useState("")
    const [language, setLanguage] = useState("th")
    const [tone, setTone] = useState("Professional")

    useEffect(() => {
        async function fetchClients() {
            const supabase = createClient()
            const { data } = await supabase.from("clients").select("id, name")
            if (data) setClients(data)
        }
        fetchClients()
    }, [])

    async function handleBrainstorm() {
        if (!brainstormKeyword.trim()) return
        setBrainstorming(true)
        setGeneratedTitles([])

        try {
            const res = await generateTitles(brainstormKeyword, language, tone)
            if (res.success && res.titles) {
                setGeneratedTitles(res.titles)
            }
        } catch (e) {
            console.error(e)
        }
        setBrainstorming(false)
    }

    function addTitleToQueue(title: string) {
        // Add to the textarea
        const newLine = `${brainstormKeyword} | ${title}\n`
        setKeywords(prev => prev + newLine)
        // Ideally we also remove it from the list or mark as added?
        setGeneratedTitles(prev => prev.filter(t => t !== title))
    }

    async function handleGenerate() {
        if (!keywords.trim() || !selectedClientId) return

        const lines = keywords.split("\n").filter((k) => k.trim())
        const clientName = clients.find(c => c.id === selectedClientId)?.name || "General"

        // Prepare tasks
        const tasks = lines.map(line => {
            const parts = line.split("|")
            const keyword = parts[0].trim()
            const customTitle = parts.length > 1 ? parts[1].trim() : undefined
            return {
                keyword,
                customTitle,
                clientName,
                clientId: selectedClientId,
                language,
                tone
            }
        })

        addToQueue(tasks)

        // Clear input after adding to queue?
        setKeywords("")
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Bulk AI Generator</h1>
                    <p className="text-muted-foreground">Generate SEO-optimized articles and images in bulk.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Target keywords and client settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Client</Label>
                            <Select onValueChange={setSelectedClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Language</Label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="th">Thai (ภาษาไทย)</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tone</Label>
                                <Select value={tone} onValueChange={setTone}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Professional">Professional (ทางการ)</SelectItem>
                                        <SelectItem value="Casual">Casual (เป็นกันเอง)</SelectItem>
                                        <SelectItem value="Persuasive">Persuasive (โน้มน้าวใจ/ขายของ)</SelectItem>
                                        <SelectItem value="Educational">Educational (ให้ความรู้)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Brainstorming Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500" />
                                <Label>Title Generator (Optional)</Label>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Textarea
                                        placeholder="Enter a keyword to get ideas..."
                                        className="min-h-[40px] h-[40px] resize-none"
                                        value={brainstormKeyword}
                                        onChange={(e) => setBrainstormKeyword(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleBrainstorm()
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={handleBrainstorm}
                                    disabled={brainstorming || !brainstormKeyword.trim()}
                                >
                                    {brainstorming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Brainstorm"}
                                </Button>
                            </div>

                            {generatedTitles.length > 0 && (
                                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border max-h-[200px] overflow-y-auto">
                                    <p className="text-xs text-muted-foreground font-medium mb-2">Click to add to list:</p>
                                    {generatedTitles.map((title, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 p-2 bg-background border rounded-md cursor-pointer hover:border-primary transition-colors text-sm group"
                                            onClick={() => addTitleToQueue(title)}
                                        >
                                            <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                                            <span>{title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Keywords & Titles (One per line)</Label>
                            <p className="text-xs text-muted-foreground">Format: <code>Keyword</code> OR <code>Keyword | Custom Title</code></p>
                            <Textarea
                                placeholder={"Digital Marketing 2026\nSEO Tips | 10 เทคนิค SEO สำหรับมือใหม่"}
                                className="min-h-[200px] font-mono"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleGenerate}
                            disabled={isLoading || !keywords.trim() || !selectedClientId}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" /> Start Generation
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Generation Queue</CardTitle>
                        <CardDescription>Real-time status of your content generation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {queue.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                Waiting for input...
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {[...queue].reverse().map((task, idx) => (
                                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-md bg-background/50">
                                        <div className="flex flex-col">
                                            <span className="font-medium truncate max-w-[200px]">{task.keyword}</span>
                                            {task.status === 'error' && task.error && (
                                                <span className="text-[10px] text-red-500 max-w-[200px] truncate">{task.error}</span>
                                            )}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.status === 'success' ? 'bg-green-500/10 text-green-500' :
                                            task.status === 'error' ? 'bg-red-500/10 text-red-500' :
                                                task.status === 'generating' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                                                    'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {task.status.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
