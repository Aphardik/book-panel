"use client"

import { useState, useEffect } from "react"
import { logsApi } from "@/agt-panel/lib/api-client"
import { Card, CardHeader, CardTitle, CardContent } from "@/agt-panel/components/ui/card"
import { Button } from "@/agt-panel/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/agt-panel/components/ui/select"
import { Textarea } from "@/agt-panel/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/agt-panel/components/ui/dialog"
import { Label } from "@/agt-panel/components/ui/label"
import { History, Loader2, MessageSquare, Clock, Send, Phone, FileText, Plus, Activity, RefreshCw, StickyNote, CheckCircle, Info } from "lucide-react"
import { cn } from "@/agt-panel/lib/utils"
import { useToast } from "@/agt-panel/components/ui/use-toast"

interface ActivityLogSectionProps {
    entityId: string | number
    entityType: 'order' | 'reader'
    readerId?: string | number // Optional reader ID to associate log with reader + order
    className?: string
}

export function ActivityLogSection({ entityId, entityType, readerId, className }: ActivityLogSectionProps) {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [action, setAction] = useState<string>("NOTE")
    const [note, setNote] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (entityId) {
            fetchLogs()
        }
    }, [entityId, entityType])

    async function fetchLogs() {
        try {
            setLoading(true)
            // Fetch logs. Passing search param might help filter on backend if implemented,
            // otherwise we fetch recent logs and filter client side.
            const logsData = await logsApi.getAll({
                search: String(entityId),
                limit: 100 // Fetch decent amount to ensure we find relevant ones
            })
            const logsList = Array.isArray(logsData) ? logsData : (logsData.logs || [])

            let filteredLogs = logsList

            // Client-side filtering to be safe
            if (entityType === 'order') {
                filteredLogs = logsList.filter((log: any) =>
                    String(log.orderId) === String(entityId) ||
                    (log.description && log.description.includes(`#${entityId}`))
                )
            } else if (entityType === 'reader') {
                filteredLogs = logsList.filter((log: any) =>
                    String(log.readerId) === String(entityId)
                )
            }

            // Sort by createdAt desc just in case
            filteredLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

            setLogs(filteredLogs)
        } catch (error) {
            console.error("Error fetching logs:", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit() {
        if (!note.trim()) return

        try {
            setSubmitting(true)

            // Format description: [ACTION] Note
            const description = `[${action}] ${note}`

            const payload: any = {
                description,
            }

            if (entityType === 'order') {
                payload.orderId = entityId
                if (readerId) {
                    payload.readerId = readerId
                }
            } else if (entityType === 'reader') {
                payload.readerId = entityId
            }

            await logsApi.create(payload)

            toast({ title: "Success", description: "Log added successfully" })
            setNote("")
            setAction("NOTE")
            setIsCreateDialogOpen(false)
            fetchLogs() // Refresh logs
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Failed to add log", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }


    const getLogColor = (description: string) => {
        const lower = description.toLowerCase()
        if (lower.includes('status') || lower.includes('update')) return "bg-blue-100 text-blue-600 border-blue-200"
        if (lower.includes('[call]')) return "bg-purple-100 text-purple-600 border-purple-200"
        if (lower.includes('[note]')) return "bg-amber-100 text-amber-600 border-amber-200"
        return "bg-slate-100 text-slate-600 border-slate-200"
    }

    const getLogIcon = (description: string) => {
        const lower = description.toLowerCase()
        if (lower.includes('status') || lower.includes('update')) return RefreshCw
        if (lower.includes('[call]')) return Phone
        if (lower.includes('[note]')) return StickyNote
        return Activity
    }

    // Render helper for description to highlight Action tag
    const renderDescription = (text: string) => {
        const actionMatch = text.match(/^\[(NOTE|CALL)\]\s*(.*)/)
        if (actionMatch) {
            const [_, actionType, content] = actionMatch
            return (
                <span>
                    <span className={cn(
                        "text-[10px] uppercase font-black px-1.5 py-0.5 rounded mr-2 align-middle",
                        actionType === 'CALL' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                        {actionType}
                    </span>
                    {content}
                </span>
            )
        }
        return text
    }

    return (
        <Card style={{ padding: "0px" }} className={cn("rounded-sm border  shadow-sm h-full flex flex-col", className)}>
            <CardHeader style={{ padding: "0px" }} className="border-b pb-4 bg-slate-50 dark:bg-slate-900/20 flex flex-row items-center justify-between">
                <CardTitle className="text-lg p-4 font-bold flex items-center gap-2">
                    {/* <History className="h-5 w-5 text-primary" /> */}
                    Activity Logs
                </CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 gap-2 font-bold text-xs" onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-3 w-3" /> Create Log
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Create Activity Log
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="action" className="text-sm font-bold text-slate-500 uppercase tracking-wide">Action Type</Label>
                                <Select value={action} onValueChange={setAction}>
                                    <SelectTrigger id="action" className="w-full font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NOTE">
                                            <span className="flex items-center gap-2">
                                                <FileText className="h-3.5 w-3.5" /> NOTE
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="CALL">
                                            <span className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5" /> CALL
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="note" className="text-sm font-bold text-slate-500 uppercase tracking-wide">Log Description</Label>
                                <Textarea
                                    id="note"
                                    placeholder="Enter your log details here..."
                                    className="min-h-[100px] resize-none"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={submitting || !note.trim()}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Log
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent className="pt-6 flex-1 max-h-[500px] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin h-6 w-6 text-slate-300" />
                    </div>
                ) : logs.length > 0 ? (
                    <div className="relative space-y-8 pl-3 pb-4">
                        {/* Vertical Line */}
                        <div className="absolute left-[27px] top-2 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800" />

                        {logs.map((log) => {
                            const isSystem = log.description.toLowerCase().includes('status') || log.description.toLowerCase().includes('update');
                            return (
                                <div key={log.id} className="relative flex gap-5 group">
                                    {/* Timeline Node */}
                                    <div className={cn(
                                        "z-10 w-8 h-8 rounded-full border-2 mt-0 shadow-sm transition-transform group-hover:scale-110 flex items-center justify-center shrink-0",
                                        getLogColor(log.description)
                                    )}>
                                        {(() => {
                                            const Icon = getLogIcon(log.description);
                                            return <Icon className="h-4 w-4" />
                                        })()}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                                {renderDescription(log.description)}
                                            </p>
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" />
                                            {new Date(log.createdAt).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 px-6">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="h-5 w-5 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No activity recorded yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

