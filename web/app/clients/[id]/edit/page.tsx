
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function EditClientPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [formData, setFormData] = useState({
        name: "",
        logo_url: "",
        primary_color: "#000000",
        secondary_color: "#ffffff",
        wp_url: "",
        wp_username: "",
        wp_app_password: ""
    })

    // Fetch initial data
    useEffect(() => {
        async function fetchClient() {
            if (!params.id) return;
            const { data, error } = await supabase.from("clients").select("*").eq("id", params.id).single()

            if (error) {
                alert("Error fetching client: " + error.message)
                router.push("/clients")
            } else if (data) {
                setFormData({
                    name: data.name || "",
                    logo_url: data.logo_url || "",
                    primary_color: data.primary_color || "#000000",
                    secondary_color: data.secondary_color || "#ffffff",
                    wp_url: data.wp_url || "",
                    wp_username: data.wp_username || "",
                    wp_app_password: data.wp_app_password || ""
                })
            }
            setFetching(false)
        }
        fetchClient()
    }, [params.id, supabase, router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const { error } = await supabase.from("clients").update(formData).eq("id", params.id)

        if (error) {
            alert("Error updating client: " + error.message)
        } else {
            router.push("/clients")
            router.refresh()
        }
        setLoading(false)
    }

    if (fetching) {
        return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Edit Client</h1>
                <p className="text-muted-foreground">Update brand identity and WordPress connection.</p>
            </div>

            <form onSubmit={onSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Brand Identity</CardTitle>
                        <CardDescription>Enter the visual identity details for the client.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Client / Company Name</Label>
                            <Input id="name" name="name" placeholder="Acme Corp" required value={formData.name} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="logo_url">Logo URL</Label>
                            <Input id="logo_url" name="logo_url" placeholder="https://..." value={formData.logo_url} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="primary_color">Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input id="primary_color" name="primary_color" type="color" className="w-12 p-1" value={formData.primary_color} onChange={handleChange} />
                                    <Input
                                        name="primary_color_text"
                                        placeholder="#000000"
                                        className="flex-1"
                                        value={formData.primary_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="secondary_color">Secondary Color</Label>
                                <div className="flex gap-2">
                                    <Input id="secondary_color" name="secondary_color" type="color" className="w-12 p-1" value={formData.secondary_color} onChange={handleChange} />
                                    <Input
                                        name="secondary_color_text"
                                        placeholder="#ffffff"
                                        className="flex-1"
                                        value={formData.secondary_color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>WordPress Integration</CardTitle>
                        <CardDescription>Connect to the client&apos;s WordPress site for direct publishing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="wp_url">WordPress URL</Label>
                            <Input id="wp_url" name="wp_url" placeholder="https://client-site.com" value={formData.wp_url} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="wp_username">Target Username</Label>
                                <Input id="wp_username" name="wp_username" placeholder="editor" value={formData.wp_username} onChange={handleChange} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="wp_app_password">Application Password</Label>
                                <Input id="wp_app_password" name="wp_app_password" type="password" placeholder="xxxx xxxx xxxx xxxx" value={formData.wp_app_password} onChange={handleChange} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Client
                    </Button>
                </div>
            </form>
        </div>
    )
}
