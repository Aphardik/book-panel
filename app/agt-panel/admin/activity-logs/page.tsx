"use client"

import { useEffect, useState } from "react"
import { logsApi, readersApi, ordersApi } from "@/agt-panel/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/agt-panel/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/agt-panel/components/ui/table"
import { Button } from "@/agt-panel/components/ui/button"
import { Input } from "@/agt-panel/components/ui/input"
import { Textarea } from "@/agt-panel/components/ui/textarea"
import { Label } from "@/agt-panel/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/agt-panel/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/agt-panel/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/agt-panel/components/ui/alert-dialog"
import { Loader2, Eye, Edit, Trash2, Calendar, User, FileText, Package, Search, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/agt-panel/components/ui/use-toast"
import { exportToCSV } from "@/agt-panel/lib/export-utils"

interface ActivityLog {
    id: number | string
    description: string
    readerId?: number | string
    orderId?: number | string
    createdAt: string
    updatedAt?: string
}

interface Reader {
    id: number | string
    firstName?: string
    lastName?: string
    name?: string
    [key: string]: any
}

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [readers, setReaders] = useState<Reader[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [viewLog, setViewLog] = useState<ActivityLog | null>(null)
    const [editLog, setEditLog] = useState<ActivityLog | null>(null)
    const [deleteLogId, setDeleteLogId] = useState<string | number | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editDescription, setEditDescription] = useState("")
    const [exportLoading, setExportLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    const { toast } = useToast()

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setCurrentPage(1) // Reset to first page on search
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        fetchData()
    }, [currentPage, itemsPerPage, debouncedSearch])

    async function fetchData() {
        try {
            setLoading(true)
            const [logsData, readersData, ordersData] = await Promise.all([
                logsApi.getAll({
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debouncedSearch
                }),
                readersApi.getAll(),
                ordersApi.getAll()
            ])
            setLogs(Array.isArray(logsData) ? logsData : (logsData.logs || []))
            setReaders(readersData || [])
            const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.orders || [])
            setOrders(ordersList)

            if (Array.isArray(logsData)) {
                setTotalPages(Math.ceil((logsData.length || 0) / itemsPerPage) || 1)
                setTotalItems(logsData.length || 0)
            } else {
                setTotalPages(logsData.pagination?.totalPages || 1)
                setTotalItems(logsData.pagination?.total || (logsData.logs?.length || 0))
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast({
                title: "Error",
                description: "Failed to fetch activity logs. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            setExportLoading(true)
            const data = await logsApi.getAll({
                limit: 10000, // Fetch all for export
                search: debouncedSearch
            })
            const logsList = data.logs || []

            // We need to expand the logs for export if they are order-related
            const expandedForExport = logsList.flatMap((log: any) => {
                if (!log.orderId) return [{ ...log }];

                const order = orders.find(o => String(o.id) === String(log.orderId));
                if (!order || !order.OrderedBook || order.OrderedBook.length === 0) {
                    return [{ ...log }];
                }

                return order.OrderedBook.map((book: any) => ({
                    ...log,
                    bookId: book.id || book.bookId,
                    bookTitle: book.Book?.title || book.title || "Unknown Book"
                }));
            });

            const exportData = expandedForExport.map((log: any) => ({
                "Date": formatDateTime(log.createdAt),
                "Reader": getReaderName(log.readerId),
                "Description": log.description,
                "Book Title": log.bookTitle || "N/A",
                "Order ID": log.orderId ? `#${log.orderId}` : "N/A",
                "Book ID": log.bookId || "N/A"
            }));
            exportToCSV(exportData, "ActivityLogs");
        } catch (error) {
            console.error("Export failed:", error)
            toast({
                title: "Export Failed",
                description: "Failed to fetch full data for export.",
                variant: "destructive"
            })
        } finally {
            setExportLoading(false)
        }
    }


    const getReaderName = (readerId?: number | string): string => {
        if (!readerId) return "N/A"
        // console.log(readerId, "readerId")
        const reader = readers.find(r => r.id === readerId)
        // console.log(reader, "reader")
        if (!reader) return `Reader #${readerId}`

        // Try different name formats
        if (reader.name) return reader.name
        if (reader.firstname && reader.lastname) return `${reader.firstname} ${reader.lastname}`
        if (reader.firstName) return reader.firstName
        return `Reader #${readerId}`
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleViewClick = (log: ActivityLog) => {
        setViewLog(log)
        setIsViewModalOpen(true)
    }

    const handleEditClick = (log: ActivityLog) => {
        setEditLog(log)
        setEditDescription(log.description)
        setIsEditModalOpen(true)
    }

    const handleDeleteClick = (logId: string | number) => {
        setDeleteLogId(logId)
        setIsDeleteDialogOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editLog) return

        setSaving(true)
        try {
            await logsApi.update(editLog.id, { description: editDescription })

            // Update local state
            setLogs(logs.map(log =>
                log.id === editLog.id
                    ? { ...log, description: editDescription }
                    : log
            ))

            toast({
                title: "Success",
                description: "Activity log updated successfully.",
            })
            setIsEditModalOpen(false)
            setEditLog(null)
        } catch (error) {
            console.error("Error updating activity log:", error)
            toast({
                title: "Error",
                description: "Failed to update activity log. Please try again.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteLogId) return

        try {
            await logsApi.delete(deleteLogId)
            setLogs(logs.filter(log => log.id !== deleteLogId))
            toast({
                title: "Success",
                description: "Activity log deleted successfully.",
            })
        } catch (error) {
            console.error("Error deleting activity log:", error)
            toast({
                title: "Error",
                description: "Failed to delete activity log. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsDeleteDialogOpen(false)
            setDeleteLogId(null)
        }
    }

    const getExpandedLogs = () => {
        return logs.flatMap(log => {
            if (!log.orderId) return [{ ...log, displayId: log.id }];

            const order = orders.find(o => String(o.id) === String(log.orderId));
            if (!order || !order.OrderedBook || order.OrderedBook.length === 0) {
                return [{ ...log, displayId: log.id }];
            }

            return order.OrderedBook.map((book: any, index: number) => ({
                ...log,
                bookId: book.id || book.bookId,
                bookTitle: book.Book?.title || book.title || "Unknown Book",
                displayId: `${log.id}-${book.id || index}`
            }));
        });
    }

    const expandedLogs = getExpandedLogs();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
                    <p className="text-muted-foreground text-sm mt-1">Monitor and export account activity information.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={handleExport} disabled={exportLoading} className="flex-1 md:flex-none">
                        {exportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-muted">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="text-xl">All Logs ({totalItems})</CardTitle>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-10 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Reader Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Order ID</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(expandedLogs.length > itemsPerPage
                                ? expandedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                : expandedLogs
                            ).map((log: any) => (
                                <TableRow key={log.displayId}>
                                    <TableCell className="font-medium">
                                        {formatDateTime(log.createdAt)}
                                    </TableCell>
                                    <TableCell>{getReaderName(log.readerId)}</TableCell>
                                    <TableCell className="max-w-md">
                                        <div className="flex flex-col">
                                            <span>{log.description}</span>
                                            {log.bookTitle && (
                                                <span className="text-xs text-muted-foreground font-medium mt-1">
                                                    Book: {log.bookTitle}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {log.orderId ? (
                                            <div className="flex flex-col">
                                                <span>#{log.orderId}</span>
                                                {log.bookId && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Book ID: {log.bookId}
                                                    </span>
                                                )}
                                            </div>
                                        ) : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="View"
                                                onClick={() => handleViewClick(log)}
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Edit"
                                                onClick={() => handleEditClick(log)}
                                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete"
                                                onClick={() => handleDeleteClick(log.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {expandedLogs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        No activity logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {expandedLogs.length === 0 && !loading && (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground">No activity logs found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {!loading && logs.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium">Rows per page:</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(val) => {
                                setItemsPerPage(parseInt(val))
                                setCurrentPage(1)
                            }}
                        >
                            <SelectTrigger className="w-[70px] h-9 border-muted bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1 mx-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = 1;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "ghost"}
                                        size="sm"
                                        className={`w-9 h-9 p-0 font-semibold`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}


            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6 text-green-600" />
                            Activity Log Details
                        </DialogTitle>
                    </DialogHeader>
                    {viewLog && (
                        <div className="space-y-4 py-4">
                            <InfoCard
                                icon={<Calendar className="h-5 w-5" />}
                                label="Created At"
                                value={formatDateTime(viewLog.createdAt)}
                                color="cyan"
                            />
                            <InfoCard
                                icon={<User className="h-5 w-5" />}
                                label="Reader Name"
                                value={getReaderName(viewLog.readerId)}
                                color="purple"
                            />
                            <InfoCard
                                icon={<Package className="h-5 w-5" />}
                                label="Order ID"
                                value={viewLog.orderId ? `#${viewLog.orderId}` : "N/A"}
                                color="indigo"
                            />
                            {(viewLog as any).bookId && (
                                <InfoCard
                                    icon={<FileText className="h-5 w-5" />}
                                    label="Book Title"
                                    value={`${(viewLog as any).bookTitle} (ID: ${(viewLog as any).bookId})`}
                                    color="cyan"
                                />
                            )}
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                                <p className="text-base text-gray-900 leading-relaxed">
                                    {viewLog.description}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Edit className="h-6 w-6 text-amber-600" />
                            Edit Activity Log
                        </DialogTitle>
                    </DialogHeader>
                    {editLog && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Reader Name</Label>
                                    <Input
                                        value={getReaderName(editLog.readerId)}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Order ID</Label>
                                    <Input
                                        value={editLog.orderId ? `#${editLog.orderId}` : "N/A"}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={6}
                                    className="resize-none"
                                    placeholder="Enter activity log description..."
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={saving || !editDescription.trim()}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the activity log.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// Reusable Info Card Component
function InfoCard({
    icon,
    label,
    value,
    color = "gray"
}: {
    icon: React.ReactNode
    label: string
    value: any
    color?: "cyan" | "purple" | "indigo" | "gray"
}) {
    const colorClasses = {
        cyan: "bg-cyan-50 border-cyan-200 text-cyan-600",
        purple: "bg-purple-50 border-purple-200 text-purple-600",
        indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
        gray: "bg-gray-50 border-gray-200 text-gray-600"
    }

    return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${colorClasses[color]}`}>
            <div className="mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-base font-semibold text-gray-900 break-words">
                    {value ?? "N/A"}
                </p>
            </div>
        </div>
    )
}

