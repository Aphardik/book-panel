"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/agt-panel/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/agt-panel/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/agt-panel/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/agt-panel/components/ui/select"
import { Loader2, Trash2, Search, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { exportToCSV } from "@/agt-panel/lib/export-utils"
import { Input } from "@/agt-panel/components/ui/input"
import { useToast } from "@/agt-panel/components/ui/use-toast"
import { format } from "date-fns"
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
import { interestsApi } from "@/agt-panel/lib/api-client"

interface Interest {
    id: string
    bookId: string
    bookTitle: string
    name: string
    email: string
    mobileNo: string
    status: "pending" | "contacted" | "success"
    timestamp: string
    notes: string
    [key: string]: any
}

export default function AdminInterestsPage() {
    const router = useRouter()
    const [interests, setInterests] = useState<Interest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    const [exportLoading, setExportLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [interestToDelete, setInterestToDelete] = useState<Interest | null>(null)
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
        fetchInterests()
    }, [currentPage, itemsPerPage, debouncedSearch])

    const fetchInterests = async () => {
        try {
            setIsLoading(true)
            const result = await interestsApi.getAll({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch
            })
            const interestsList = Array.isArray(result) ? result : (result.interests || [])

            setInterests(interestsList)

            if (Array.isArray(result)) {
                setTotalPages(Math.ceil(interestsList.length / itemsPerPage) || 1)
                setTotalItems(interestsList.length)
            } else {
                setTotalPages(result.pagination?.totalPages || 1)
                setTotalItems(result.pagination?.total || interestsList.length)
            }
        } catch (error) {
            console.error("Error fetching interests:", error)
            toast({
                title: "Error",
                description: "Failed to fetch interests. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            setExportLoading(true)
            const result = await interestsApi.getAll({
                limit: 10000, // Fetch all for export
                search: debouncedSearch
            })
            const interestsList = Array.isArray(result) ? result : (result.interests || [])

            const exportData = interestsList.map((i: any) => ({
                Date: i.timestamp ? format(new Date(i.timestamp), "MMM d, yyyy") : "N/A",
                User: i.name,
                Email: i.email,
                Book: i.bookTitle || "Unknown Book",
                Contact: i.mobileNo,
                Status: i.status
            }));
            exportToCSV(exportData, "Interests");
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


    const handleStatusChange = async (interestId: string, newStatus: string) => {
        try {
            await interestsApi.updateStatus(interestId, newStatus)

            // Optimistic update
            setInterests((prev) =>
                prev.map((interest) =>
                    interest.id === interestId ? { ...interest, status: newStatus as any } : interest
                )
            )

            toast({
                title: "Success",
                description: "Status updated successfully",
            })
        } catch (error) {
            console.error("Error updating status:", error)
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
            })
            // Revert on error
            fetchInterests()
        }
    }

    const handleDeleteClick = (interest: Interest) => {
        setInterestToDelete(interest)
    }

    const confirmDelete = async () => {
        if (!interestToDelete) return

        try {
            setDeletingId(interestToDelete.id)
            await interestsApi.delete(interestToDelete.id)

            setInterests((prev) => prev.filter((i) => i.id !== interestToDelete.id))

            toast({
                title: "Success",
                description: "Interest deleted successfully",
            })
        } catch (error) {
            console.error("Error deleting interest:", error)
            toast({
                title: "Error",
                description: "Failed to delete interest",
                variant: "destructive",
            })
        } finally {
            setDeletingId(null)
            setInterestToDelete(null)
        }
    }

    const filteredInterests = interests // Removing local filter as we use backend search

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Interests Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage, search, and export book interests.</p>
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
                        <CardTitle className="text-xl">All Interests ({totalItems})</CardTitle>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search interests..."
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
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Book</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(filteredInterests.length > itemsPerPage
                                ? filteredInterests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                : filteredInterests
                            ).map((interest) => (
                                <TableRow key={interest.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {interest.timestamp ? format(new Date(interest.timestamp), "MMM d, yyyy") : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{interest.name}</div>
                                        <div className="text-xs text-muted-foreground">{interest.email}</div>
                                    </TableCell>
                                    <TableCell>{interest.bookTitle || "Unknown Book"}</TableCell>
                                    <TableCell>{interest.mobileNo}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={interest.status}
                                            onValueChange={(value) => handleStatusChange(interest.id, value)}
                                        >
                                            <SelectTrigger className="w-[130px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="contacted">Contacted</SelectItem>
                                                <SelectItem value="success">Success</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteClick(interest)}
                                            disabled={deletingId === interest.id}
                                        >
                                            {deletingId === interest.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredInterests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        No interests found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {filteredInterests.length === 0 && !isLoading && (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground">No interests found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {!isLoading && interests.length > 0 && (
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


            <AlertDialog open={!!interestToDelete} onOpenChange={(open) => !open && setInterestToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the interest record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

