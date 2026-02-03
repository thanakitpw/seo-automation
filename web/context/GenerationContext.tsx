
"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { generateArticle } from "@/app/actions/generate"
import { createClient } from "@/utils/supabase/client"

interface GenerationTask {
    id: string
    keyword: string
    customTitle?: string
    clientName: string
    clientId: string
    language: string
    tone: string
    status: "pending" | "generating" | "success" | "error"
    error?: string
}

interface GenerationContextType {
    queue: GenerationTask[]
    addToQueue: (tasks: Omit<GenerationTask, "status" | "id">[]) => void
    isGenerating: boolean
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined)

export function GenerationProvider({ children }: { children: React.ReactNode }) {
    const [queue, setQueue] = useState<GenerationTask[]>([])
    const [isGenerating, setIsGenerating] = useState(false)

    // Helper to generate a unique ID
    const generateId = () => Math.random().toString(36).substr(2, 9)

    function addToQueue(tasks: Omit<GenerationTask, "status" | "id">[]) {
        const newTasks = tasks.map(t => ({
            ...t,
            id: generateId(),
            status: "pending" as const
        }))
        setQueue(prev => [...prev, ...newTasks])
    }

    // Process Queue
    useEffect(() => {
        if (isGenerating) return // Already running
        if (queue.every(t => t.status !== "pending")) return // Nothing pending

        const processQueue = async () => {
            setIsGenerating(true)

            // Find next pending task
            // We use a completely new reference from functional update to ensure we have latest state
            // But here we need to loop. 
            // Better approach: Loop while there are pending tasks.

            // To avoid complex state loops, we process one task, update state, and let useEffect trigger again?
            // Or we process one by one in a loop here?
            // A loop with state updates in React can be tricky.
            // Let's implement a "Worker" style effect that watches the queue.

            const nextTaskIndex = queue.findIndex(t => t.status === "pending")
            if (nextTaskIndex === -1) {
                setIsGenerating(false)
                return
            }

            const task = queue[nextTaskIndex]

            // Update to generating
            setQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: "generating" } : t))

            try {
                // Call Server Action
                const res = await generateArticle(task.keyword, task.clientName, task.language, task.tone, task.customTitle)

                if (res.success) {
                    // Save to DB
                    const supabase = createClient()
                    const { error: saveError } = await supabase.from("articles").insert({
                        client_id: task.clientId || null,
                        keyword: task.keyword,
                        title: res.title || task.customTitle || task.keyword,
                        content_html: res.content,
                        status: 'ready',
                        language: task.language,
                        brand_tone: task.tone,
                        slug: res.slug,
                        seo_title: res.seo_title,
                        meta_description: res.meta_description
                    })

                    if (saveError) {
                        setQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: "error", error: saveError.message } : t))
                    } else {
                        setQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: "success" } : t))
                    }
                } else {
                    setQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: "error", error: res.error } : t))
                }
            } catch (error: any) {
                setQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: "error", error: error.message || "Unknown error" } : t))
            } finally {
                // Trigger next processing
                // We just finish this one. The state update will trigger re-render.
                // We need to signal that we are ready for next?
                // Actually, since we updated state, the 'queue' dependency changes? 
                // Wait, if we set isGenerating to false here, the effect will run again.
                setIsGenerating(false)
            }
        }

        processQueue()

    }, [queue, isGenerating])

    return (
        <GenerationContext.Provider value={{ queue, addToQueue, isGenerating }}>
            {children}
        </GenerationContext.Provider>
    )
}

export function useGeneration() {
    const context = useContext(GenerationContext)
    if (context === undefined) {
        throw new Error("useGeneration must be used within a GenerationProvider")
    }
    return context
}
