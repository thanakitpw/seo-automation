
"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function NewClientPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const data = {
            name: formData.get("name") as string,
            logo_url: formData.get("logo_url") as string,
            primary_color: formData.get("primary_color") as string,
            secondary_color: formData.get("secondary_color") as string,
            wp_url: formData.get("wp_url") as string,
            wp_username: formData.get("wp_username") as string,
            wp_app_password: formData.get("wp_app_password") as string, // Note: In prod, encrypt this!
        }

        const { error } = await supabase.from("clients").insert(data)

        if (error) {
            alert("Error adding client: " + error.message)
        } else {
            router.push("/clients")
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Add New Client</h1>
                <p className="text-muted-foreground">Configure brand identity and WordPress connection.</p>
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
                            <Input id="name" name="name" placeholder="Acme Corp" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="logo_url">Logo URL</Label>
                            <Input id="logo_url" name="logo_url" placeholder="https://..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="primary_color">Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input id="primary_color" name="primary_color" type="color" className="w-12 p-1" defaultValue="#000000" />
                                    <Input name="primary_color_text" placeholder="#000000" className="flex-1" onChange={(e) => {
                                        const val = e.target.value;
                                        (document.getElementById('primary_color') as HTMLInputElement).value = val;
                                    }} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="secondary_color">Secondary Color</Label>
                                <div className="flex gap-2">
                                    <Input id="secondary_color" name="secondary_color" type="color" className="w-12 p-1" defaultValue="#ffffff" />
                                    <Input name="secondary_color_text" placeholder="#ffffff" className="flex-1" onChange={(e) => {
                                        const val = e.target.value;
                                        (document.getElementById('secondary_color') as HTMLInputElement).value = val;
                                    }} />
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
                            <Input id="wp_url" name="wp_url" placeholder="https://client-site.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="wp_username">Target Username</Label>
                                <Input id="wp_username" name="wp_username" placeholder="editor" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="wp_app_password">Application Password</Label>
                                <Input id="wp_app_password" name="wp_app_password" type="password" placeholder="xxxx xxxx xxxx xxxx" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Client
                    </Button>
                </div>
            </form>
        </div>
    )
}
