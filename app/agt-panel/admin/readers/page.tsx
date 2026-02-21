"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnToggle, Column } from "@/agt-panel/components/admin/column-toggle"
import { readersApi } from "@/agt-panel/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/agt-panel/components/ui/card"
import { Button } from "@/agt-panel/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/agt-panel/components/ui/table"
import { Eye, Edit, Trash2, Search, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useToast } from "@/agt-panel/components/ui/use-toast"
import { exportToCSV } from "@/agt-panel/lib/export-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/agt-panel/components/ui/dialog"
import { Input } from "@/agt-panel/components/ui/input"
import { Label } from "@/agt-panel/components/ui/label"
import { Textarea } from "@/agt-panel/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/agt-panel/components/ui/select"
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

export default function ReadersPage() {
    const router = useRouter()
    const [readers, setReaders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedReader, setSelectedReader] = useState<any>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deleteReaderId, setDeleteReaderId] = useState<string | number | null>(null)

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Column Visibility State
    const [columns, setColumns] = useState<Column[]>([
        { id: "id", label: "ID", isVisible: true },
        { id: "name", label: "Name", isVisible: true },
        { id: "mobile", label: "Mobile", isVisible: true },
        { id: "email", label: "Email", isVisible: true },
        { id: "city", label: "City", isVisible: true },
        { id: "state", label: "State", isVisible: true },
        { id: "address", label: "Address", isVisible: true },
        { id: "actions", label: "Actions", isVisible: true },
    ])

    const handleColumnToggle = (id: string, isVisible: boolean) => {
        setColumns(prev => prev.map(col => col.id === id ? { ...col, isVisible } : col))
    }

    const isColumnVisible = (id: string) => columns.find(c => c.id === id)?.isVisible

    const [exportLoading, setExportLoading] = useState(false)
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
        fetchReaders()
    }, [currentPage, itemsPerPage, debouncedSearch])

    async function fetchReaders() {
        setLoading(true)
        try {
            const data = await readersApi.getAll({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch
            })
            const readersList = Array.isArray(data) ? data : (data.readers || [])
            setReaders(readersList)
            // Fix: Calculate total pages manually if API returns a flat array (no pagination metadata)
            if (Array.isArray(data)) {
                setTotalPages(Math.ceil(readersList.length / itemsPerPage) || 1)
                setTotalItems(readersList.length)
            } else {
                setTotalPages(data.pagination?.totalPages || 1)
                setTotalItems(data.pagination?.total || readersList.length)
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Failed to fetch readers", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            setExportLoading(true)
            const data = await readersApi.getAll({
                limit: 10000, // Fetch all for export
                search: debouncedSearch
            })
            const readersList = Array.isArray(data) ? data : (data.readers || [])

            const exportData = readersList.map((r: any) => ({
                "ID": r.id,
                "Name": `${r.firstname || ''} ${r.lastname || ''}`.trim(),
                "Mobile": r.mobile,
                "Email": r.email || "",
                "Age": r.age || "",
                "Gender": r.gender || "",
                "Occupation": r.occupation || "",
                "City": r.city || "",
                "State": r.state || "",
                "Address": r.address || ""
            }));
            exportToCSV(exportData, "Readers");
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

    const handleEditClick = (reader: any) => {
        setSelectedReader({ ...reader })
        setIsEditModalOpen(true)
    }

    const handleUpdateReader = async () => {
        if (!selectedReader) return
        try {
            await readersApi.update(selectedReader.id, selectedReader)
            toast({ title: "Success", description: "Reader updated successfully" })
            setIsEditModalOpen(false)
            fetchReaders()
        } catch (error) {
            toast({ title: "Error", description: "Failed to update reader", variant: "destructive" })
        }
    }

    const handleDeleteClick = (id: string | number) => {
        setDeleteReaderId(id)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteReaderId) return
        try {
            await readersApi.delete(deleteReaderId)
            toast({ title: "Success", description: "Reader deleted successfully" })
            setReaders(readers.filter(r => r.id !== deleteReaderId))
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete reader", variant: "destructive" })
        } finally {
            setIsDeleteDialogOpen(false)
            setDeleteReaderId(null)
        }
    }

    if (loading) return <Loader2 className="animate-spin" />

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Readers Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage, search, and export reader information.</p>
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
                        <CardTitle className="text-xl">All Readers ({totalItems})</CardTitle>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search readers..."
                                    className="pl-10 h-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <ColumnToggle columns={columns} onToggle={handleColumnToggle} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {isColumnVisible("id") && <TableHead>ID</TableHead>}
                                {isColumnVisible("name") && <TableHead>Name</TableHead>}
                                {isColumnVisible("mobile") && <TableHead>Mobile</TableHead>}
                                {isColumnVisible("email") && <TableHead>Email</TableHead>}
                                {isColumnVisible("city") && <TableHead>City</TableHead>}
                                {isColumnVisible("state") && <TableHead>State</TableHead>}
                                {isColumnVisible("address") && <TableHead>Address</TableHead>}
                                {isColumnVisible("actions") && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Slice the array for valid pagination if we have more items than the page size (client-side fallback) */}
                            {(readers.length > itemsPerPage
                                ? readers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                : readers
                            ).map((reader) => (
                                <TableRow
                                    key={reader.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => router.push(`/agt-panel/admin/readers/${reader.id}`)}
                                >
                                    {isColumnVisible("id") && <TableCell>{reader.id}</TableCell>}
                                    {isColumnVisible("name") && <TableCell className="font-bold text-primary hover:underline">{reader.firstname} {reader.lastname}</TableCell>}
                                    {isColumnVisible("mobile") && <TableCell>{reader.mobile}</TableCell>}
                                    {isColumnVisible("email") && <TableCell>{reader.email}</TableCell>}
                                    {isColumnVisible("city") && <TableCell>{reader.city}</TableCell>}
                                    {isColumnVisible("state") && <TableCell>{reader.state}</TableCell>}
                                    {isColumnVisible("address") && <TableCell className="max-w-[200px] truncate">{reader.address}</TableCell>}
                                    {isColumnVisible("actions") && <TableCell className="text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-primary"
                                                onClick={() => router.push(`/agt-panel/admin/readers/${reader.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-amber-600"
                                                onClick={() => handleEditClick(reader)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600"
                                                onClick={() => handleDeleteClick(reader.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {readers.length === 0 && !loading && (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground">No readers found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {!loading && readers.length > 0 && (
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


            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Reader</DialogTitle>
                    </DialogHeader>
                    {selectedReader && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input
                                        value={selectedReader.firstname}
                                        onChange={(e) => setSelectedReader({ ...selectedReader, firstname: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input
                                        value={selectedReader.lastname}
                                        onChange={(e) => setSelectedReader({ ...selectedReader, lastname: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Mobile</Label>
                                <Input
                                    value={selectedReader.mobile}
                                    onChange={(e) => setSelectedReader({ ...selectedReader, mobile: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={selectedReader.email}
                                    onChange={(e) => setSelectedReader({ ...selectedReader, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                        value={selectedReader.city}
                                        onChange={(e) => setSelectedReader({ ...selectedReader, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input
                                        value={selectedReader.state}
                                        onChange={(e) => setSelectedReader({ ...selectedReader, state: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Textarea
                                    value={selectedReader.address || ""}
                                    onChange={(e) => setSelectedReader({ ...selectedReader, address: e.target.value })}
                                    className="resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateReader}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the reader and their history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

