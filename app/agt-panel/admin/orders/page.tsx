"use client"

import { useEffect, useState } from "react";
import { ordersApi, readersApi } from "@/agt-panel/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/agt-panel/components/ui/card";
import { Button } from "@/agt-panel/components/ui/button";
import { Input } from "@/agt-panel/components/ui/input";
import { Separator } from "@/agt-panel/components/ui/separator";
import { Loader2, Eye, Edit, Trash2, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/agt-panel/components/ui/table";
import { Badge } from "@/agt-panel/components/ui/badge";
import { FilterX, Filter, SlidersHorizontal, MapPin, ClipboardList, Info } from "lucide-react"
import { MultiSelect } from "@/agt-panel/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/agt-panel/components/ui/select";
import { useToast } from "@/agt-panel/components/ui/use-toast";
import { Label } from "@/agt-panel/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/agt-panel/components/ui/sheet";
import { exportToCSV } from "@/agt-panel/lib/export-utils";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/agt-panel/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnToggle, Column } from "@/agt-panel/components/admin/column-toggle";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [readers, setReaders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [deleteOrderId, setDeleteOrderId] = useState<string | number | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Filter State
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [selectedCities, setSelectedCities] = useState<string[]>([])
    const [selectedStates, setSelectedStates] = useState<string[]>([])
    const [availableCities, setAvailableCities] = useState<string[]>([])
    const [availableStates, setAvailableStates] = useState<string[]>([])
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Column Visibility State
    const [columns, setColumns] = useState<Column[]>([
        { id: "id", label: "Order ID", isVisible: true },
        { id: "date", label: "Date", isVisible: true },
        { id: "reader", label: "Reader", isVisible: true },
        { id: "status", label: "Status", isVisible: true },
        { id: "books", label: "Books", isVisible: true },
        { id: "shipping", label: "Shipping details", isVisible: true }, // Changed label to be more descriptive if needed, but "Shipping" is fine.
        { id: "actions", label: "Actions", isVisible: true },
    ])

    const handleColumnToggle = (id: string, isVisible: boolean) => {
        setColumns(prev => prev.map(col => col.id === id ? { ...col, isVisible } : col))
    }

    const isColumnVisible = (id: string) => columns.find(c => c.id === id)?.isVisible

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    const [exportLoading, setExportLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setCurrentPage(1) // Reset to first page on search
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        fetchInitialData()
    }, [currentPage, itemsPerPage, debouncedSearch])
    console.log(selectedOrder, "selectedOrder")

    async function fetchInitialData() {
        try {
            setLoading(true)
            const [ordersData, readersData] = await Promise.all([
                ordersApi.getAll({
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debouncedSearch,
                    statuses: selectedStatuses,
                    cities: selectedCities,
                    states: selectedStates
                }),
                readersApi.getAll({ limit: 1000 })
            ])
            const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.orders || [])
            const readersList = Array.isArray(readersData) ? readersData : (readersData.readers || [])
            setOrders(ordersList)
            setReaders(readersList)

            // Extract unique cities and states
            const cities = Array.from(new Set(readersList.map((r: any) => r.city).filter(Boolean))) as string[]
            const states = Array.from(new Set(readersList.map((r: any) => r.state).filter(Boolean))) as string[]
            setAvailableCities(cities.sort())
            setAvailableStates(states.sort())

            // Fix: Calculate total pages manually if API returns a flat array
            if (Array.isArray(ordersData)) {
                setTotalPages(Math.ceil(ordersList.length / itemsPerPage) || 1)
                setTotalItems(ordersList.length)
            } else {
                setTotalPages(ordersData.pagination?.totalPages || 1)
                setTotalItems(ordersData.pagination?.total || ordersList.length)
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    async function fetchOrders() {
        try {
            const data = await ordersApi.getAll({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                statuses: selectedStatuses,
                cities: selectedCities,
                states: selectedStates
            })
            const ordersList = Array.isArray(data) ? data : (data.orders || [])
            setOrders(ordersList)

            if (Array.isArray(data)) {
                setTotalPages(Math.ceil(ordersList.length / itemsPerPage) || 1)
                setTotalItems(ordersList.length)
            } else {
                setTotalPages(data.pagination?.totalPages || 1)
                setTotalItems(data.pagination?.total || ordersList.length)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleExport = async () => {
        try {
            setExportLoading(true)
            const data = await ordersApi.getAll({
                limit: 10000, // Fetch all for export
                search: debouncedSearch,
                statuses: selectedStatuses,
                cities: selectedCities,
                states: selectedStates
            })
            const ordersList = Array.isArray(data) ? data : (data.orders || [])

            const exportData = ordersList.map((o: any) => ({
                "Order ID": o.id,
                "Date": o.orderDate ? new Date(o.orderDate).toLocaleDateString() : "N/A",
                "Reader": getReaderName(o.readerId),
                "Status": o.status,
                "Books": o?.OrderedBook?.map((book: any) => book.Book?.title || book.title || "Unknown Book").join(", "),
                "Shipping Details": o.shippingDetails || ""
            }));
            exportToCSV(exportData, "Orders");
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

    const handleStatusChange = async (id: number | string, status: string) => {
        try {
            await ordersApi.updateStatus(id, status)
            toast({ title: "Success", description: "Order status updated" })
            fetchOrders()
            // Update selected order if it's open
            if (selectedOrder && selectedOrder.id === id) {
                setSelectedOrder({ ...selectedOrder, status })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
    }

    const handleBookStatusChange = async (orderId: number | string, bookId: number | string, status: string) => {
        try {
            if (!bookId) {
                toast({ title: "Error", description: "Book ID missing", variant: "destructive" })
                return
            }
            await ordersApi.updateBookStatus(orderId, bookId, status)
            toast({ title: "Success", description: "Book status updated" })
            // Refresh order details to show new status
            fetchOrderDetails(orderId)
        } catch (error) {
            toast({ title: "Error", description: "Failed to update book status", variant: "destructive" })
        }
    }

    const handleDeleteOrder = async (id: string | number) => {
        setDeleteOrderId(id)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteOrderId) return
        try {
            await ordersApi.delete(deleteOrderId)
            toast({ title: "Success", description: "Order deleted successfully" })
            setOrders(orders.filter(o => o.id !== deleteOrderId))
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete order", variant: "destructive" })
        } finally {
            setIsDeleteDialogOpen(false)
            setDeleteOrderId(null)
        }
    }

    const fetchOrderDetails = async (orderId: any) => {
        try {
            // First open with available data (placeholder)
            const fallbackOrder = orders.find(o => o.id === orderId)
            setSelectedOrder(fallbackOrder)

            // Then fetch full details
            const fullOrder = await ordersApi.getById(orderId)
            setSelectedOrder(fullOrder)
        } catch (error) {
            console.error("Failed to fetch full order details", error)
            toast({ title: "Error", description: "Failed to load order details", variant: "destructive" })
        }
    }

    const getReaderName = (readerId: any) => {
        const reader = readers.find(r => r.id === readerId)
        if (!reader) return `Reader #${readerId}`
        const name = reader.name ||
            (reader.firstname && reader.lastname ? `${reader.firstname} ${reader.lastname}` : null) ||
            (reader.firstName && reader.lastName ? `${reader.firstName} ${reader.lastName}` : null) ||
            reader.firstName ||
            reader.firstname ||
            `Reader #${readerId}`
        return name
    }

    const getReaderDetails = (readerId: any) => {
        return readers.find(r => r.id === readerId)
    }

    if (loading) return <Loader2 className="animate-spin" />

    const selectedReader = selectedOrder ? getReaderDetails(selectedOrder.readerId) : null

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Orders Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage, search, and export order information.</p>
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
                        <CardTitle className="text-xl">All Orders ({totalItems})</CardTitle>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search orders..."
                                    className="pl-10 h-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="h-10 px-3 flex items-center gap-2 border-primary/20 hover:bg-primary/5 transition-all">
                                        <Filter className="h-4 w-4 text-primary" />
                                        <span className="hidden sm:inline">Filters</span>
                                        {(selectedStatuses.length > 0 || selectedCities.length > 0 || selectedStates.length > 0) && (
                                            <span className="ml-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-full sm:max-w-md bg-[#0f172a] border-slate-800 text-slate-200 overflow-y-auto overflow-x-hidden p-0 flex flex-col">
                                    <SheetHeader className="p-6 border-b border-slate-800 bg-[#1e293b]/50">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <SlidersHorizontal className="h-5 w-5 text-primary" />
                                            </div>
                                            <SheetTitle className="text-xl font-bold text-white uppercase tracking-wider">Filter Orders</SheetTitle>
                                        </div>
                                    </SheetHeader>

                                    <div className="flex-1 p-6 space-y-6">
                                        {/* Order Status */}
                                        <div className="space-y-4">
                                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <ClipboardList className="h-3 w-3" /> Status
                                            </h4>
                                            <div className="space-y-1.5">
                                                <MultiSelect
                                                    placeholder="Select Status"
                                                    options={[
                                                        { label: "Pending", value: "PENDING" },
                                                        { label: "Processing", value: "PROCESSING" },
                                                        { label: "Shipped", value: "SHIPPED" },
                                                        { label: "Delivered", value: "DELIVERED" },
                                                        { label: "Cancelled", value: "CANCELLED" },
                                                    ]}
                                                    selected={selectedStatuses}
                                                    onChange={setSelectedStatuses}
                                                    className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                />
                                            </div>
                                        </div>

                                        {/* Location Details */}
                                        <div className="space-y-4">
                                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <MapPin className="h-3 w-3" /> Location
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-400">City</Label>
                                                    <MultiSelect
                                                        placeholder="Select Cities"
                                                        options={availableCities.map(city => ({ label: city, value: city }))}
                                                        selected={selectedCities}
                                                        onChange={setSelectedCities}
                                                        className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-400">State</Label>
                                                    <MultiSelect
                                                        placeholder="Select States"
                                                        options={availableStates.map(state => ({ label: state, value: state }))}
                                                        selected={selectedStates}
                                                        onChange={setSelectedStates}
                                                        className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-slate-800">
                                            <div className="flex items-start gap-2">
                                                <Info className="h-4 w-4 text-primary mt-0.5" />
                                                <p className="text-xs text-slate-400 leading-relaxed">
                                                    Cities and States are derived from existing reader addresses.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <SheetFooter className="p-6 bg-[#1e293b]/50 border-t border-slate-800 flex flex-col gap-3">
                                        <Button
                                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg shadow-primary/20"
                                            onClick={() => {
                                                fetchOrders()
                                                setIsFilterOpen(false)
                                            }}
                                        >
                                            Apply Filters
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full text-slate-400 hover:text-white font-semibold h-11"
                                            onClick={() => {
                                                setSelectedStatuses([])
                                                setSelectedCities([])
                                                setSelectedStates([])
                                                setSearchQuery("")
                                                fetchInitialData()
                                            }}
                                        >
                                            Reset All Filters
                                        </Button>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>
                            <ColumnToggle columns={columns} onToggle={handleColumnToggle} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {isColumnVisible("id") && <TableHead>Order ID</TableHead>}
                                {isColumnVisible("date") && <TableHead>Date</TableHead>}
                                {isColumnVisible("reader") && <TableHead>Reader</TableHead>}
                                {isColumnVisible("status") && <TableHead>Status</TableHead>}
                                {isColumnVisible("books") && <TableHead>Books</TableHead>}
                                {isColumnVisible("shipping") && <TableHead>Shipping</TableHead>}
                                {isColumnVisible("actions") && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>

                            {(orders.length > itemsPerPage
                                ? orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                : orders
                            ).map((order) => (
                                <TableRow
                                    key={order.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => router.push(`/agt-panel/admin/orders/${order.id}`)}
                                >
                                    {isColumnVisible("id") && <TableCell className="font-medium text-primary hover:underline">#{order.id}</TableCell>}
                                    {isColumnVisible("date") && <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>}
                                    {isColumnVisible("reader") && <TableCell>
                                        <Link
                                            href={`/agt-panel/admin/readers/${order.readerId}`}
                                            className="text-primary hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {getReaderName(order.readerId)}
                                        </Link>
                                    </TableCell>}
                                    {isColumnVisible("status") && <TableCell>
                                        <Badge variant={
                                            order.status === 'DELIVERED' ? 'default' :
                                                order.status === 'CANCELLED' ? 'destructive' :
                                                    'secondary'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </TableCell>}
                                    {isColumnVisible("books") && <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {order?.OrderedBook?.map((book: any, idx: number) => (
                                                <Link
                                                    key={idx}
                                                    href={`/agt-panel/admin/books/${book.bookId || book.id}`}
                                                    className="text-primary hover:underline text-xs bg-muted/50 px-2 py-0.5 rounded"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {book.Book?.title || book.title || "Unknown"}
                                                </Link>
                                            ))}
                                        </div>
                                    </TableCell>}
                                    {isColumnVisible("shipping") && <TableCell className="max-w-[200px] truncate">{order.shippingDetails}</TableCell>}
                                    {isColumnVisible("actions") && <TableCell className="text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-primary"
                                                onClick={() => router.push(`/agt-panel/admin/orders/${order.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-amber-600"
                                                onClick={() => router.push(`/agt-panel/admin/orders/${order.id}`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600"
                                                onClick={() => handleDeleteOrder(order.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {orders.length === 0 && !loading && (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground">No orders found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {
                !loading && orders.length > 0 && (
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
                )
            }


            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the order and all associated data.
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
        </div >
    )
}

