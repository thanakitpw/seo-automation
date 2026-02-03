
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Plus } from "lucide-react"

export default async function ClientsPage() {
    const supabase = await createClient()
    const { data: clients } = await supabase.from("clients").select("*").order("created_at", { ascending: false })

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between py-4">
                <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
                <Link href="/clients/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Client
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients?.map((client) => (
                    <Card key={client.id} className="overflow-hidden" style={{ borderColor: client.primary_color || undefined }}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            {client.logo_url && (
                                <div className="h-12 w-12 relative rounded-md overflow-hidden bg-white p-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={client.logo_url} alt={client.name} className="h-full w-full object-contain" />
                                </div>
                            )}
                            <div className="grid gap-1">
                                <CardTitle>{client.name}</CardTitle>
                                <CardDescription className="truncate max-w-[200px]">{client.wp_url}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardFooter className="bg-muted/50 px-6 py-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Primary: <span className="inline-block w-3 h-3 rounded-full align-middle ml-1" style={{ backgroundColor: client.primary_color || '#000' }}></span>
                            </span>
                            <Link href={`/clients/${client.id}/edit`}>
                                <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}

                {(!clients || clients.length === 0) && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No clients found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    )
}
