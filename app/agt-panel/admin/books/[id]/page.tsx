"use client"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { booksApi, ordersApi, readersApi } from "@agt-panel/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@agt-panel/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@agt-panel/components/ui/table"
import { Button } from "@agt-panel/components/ui/button"
import {
    Loader2, ArrowLeft, BookOpen, User, Hash, Tag, Package,
    Calendar, DollarSign, FileText, CheckCircle2, XCircle,
    Edit, Sparkles, Languages, Info
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@agt-panel/components/ui/use-toast"
import { Badge } from "@agt-panel/components/ui/badge"
import { Separator } from "@agt-panel/components/ui/separator"

export default function AdminBookViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { toast } = useToast()
    const [book, setBook] = useState<any>(null)
    const [orders, setOrders] = useState<any[]>([])
    const [readers, setReaders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Helper to find specific book status in an order
    const findBookStatus = (order: any, bookId: string | number) => {
        const item = order.OrderedBook?.find((ob: any) => ob.bookId === Number(bookId) || ob.bookId === String(bookId))
        return item?.status || order.status || 'WAITLISTED'
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [bookData, ordersData, readersData] = await Promise.all([
                    booksApi.getById(id),
                    ordersApi.getAll({ limit: 1000 }),
                    readersApi.getAll()
                ])
                setBook(bookData)
                setReaders(readersData)

                // Filter orders that contain this book
                const bookIdMatch = Number(id)
                const relatedOrders = (ordersData.orders || ordersData || []).filter((order: any) =>
                    order.OrderedBook?.some((ob: any) => ob.bookId === bookIdMatch)
                ).map((o: any) => ({ ...o, type: 'ORDER' }))

                setOrders(relatedOrders)
            } catch (error) {
                console.error("Error fetching book data:", error)
                toast({
                    title: "Error",
                    description: "Failed to load book details.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id, toast])

    const getReaderName = (readerId: string | number) => {
        const reader = readers.find((r: any) => r.id === readerId)
        return reader?.firstname + ' ' + reader?.lastname || 'Unknown Reader'
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading book catalog...</p>
            </div>
        )
    }

    if (!book) {
        return (
            <div className="container mx-auto py-10 text-center">
                <Card className="p-10">
                    <p className="text-muted-foreground mb-4">Book not found.</p>
                    <Button onClick={() => router.push("/admin/books")}>Back to Library</Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 space-y-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-sm shadow-sm border">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">{book.title}</h1>
                            {book.featured && <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />}
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 mt-2">
                            <User className="h-4 w-4" /> <span className="font-medium">{book.author || 'Anonymous'}</span>
                            <span className="mx-1">•</span>
                            <Hash className="h-4 w-4" /> <span className="font-mono text-xs">{book.bookCode || 'NO_CODE'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={`/admin/books/edit/${book.id}`}>
                        <Button variant="outline" className="gap-2 rounded-sm h-9 px-6 font-semibold border-2">
                            <Edit className="h-4 w-4" /> Edit Details
                        </Button>
                    </Link>
                    <Badge variant={book.isAvailable ? "default" : "destructive"} className="text-sm px-5 py-2 rounded-sm flex items-center gap-2 h-9">
                        {book.isAvailable ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {book.isAvailable ? "In Stock" : "Out of Stock"}
                    </Badge>
                </div>
            </div>

            {/* Main Content Stack */}
            <div className="space-y-8">
                {/* Visuals & Vital Stats */}
                <Card className="overflow-hidden bg-slate-50/50 dark:bg-slate-800/20 shadow-sm rounded-sm">
                    <div className="flex flex-col">
                        {/* Book Covers Row */}
                        {(book.frontImage || book.backImage) && (
                            <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20 border-b">
                                <div className="flex flex-wrap gap-8 justify-start items-start">
                                    {book.frontImage && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Front Cover</p>
                                            <div className="w-44 aspect-[3/4.2] rounded-sm overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-200">
                                                <img
                                                    src={book.frontImage.startsWith('http') || book.frontImage.startsWith('/') ? book.frontImage : `/books/${book.frontImage}`}
                                                    alt="Front Cover"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        if (target.src !== "/placeholder.svg") {
                                                            target.src = "/placeholder.svg";
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {book.backImage && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Back Cover</p>
                                            <div className="w-44 aspect-[3/4.2] rounded-sm overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-200">
                                                <img
                                                    src={book.backImage.startsWith('http') || book.backImage.startsWith('/') ? book.backImage : `/books/${book.backImage}`}
                                                    alt="Back Cover"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        if (target.src !== "/placeholder.svg") {
                                                            target.src = "/placeholder.svg";
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="p-8 space-y-8">
                            {/* Basic Info Grid */}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[2px] bg-primary/20"></span> Basic Information
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Book Code</p>
                                        <p className="font-bold text-xl text-slate-900 dark:text-white">{book.bookCode || '—'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manual ID</p>
                                        <p className="font-bold text-xl text-slate-900 dark:text-white">{book.id}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stock Qty</p>
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-slate-400" />
                                            <p className="font-bold text-xl text-slate-900 dark:text-white">{book.stockQty ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Price</p>
                                        <p className="font-bold text-xl text-green-600">₹{book.price || 0}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pages</p>
                                        <p className="font-bold text-xl text-slate-900 dark:text-white">{book.pages || '—'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Format</p>
                                        <p className="font-bold text-xl text-slate-900 dark:text-white">{book.prakar || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="opacity-50" />

                            {/* Descriptions & Content */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-2 flex items-center gap-2">
                                        <span className="w-8 h-[2px] bg-primary/20"></span> Description
                                    </h3>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                                        {book.description || 'No detailed description available for this book.'}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-2 flex items-center gap-2">
                                        <span className="w-8 h-[2px] bg-primary/20"></span> Classification
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {[book.vishay, book.shreni1, book.shreni2, book.shreni3].filter(Boolean).map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="px-4 py-1.5 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 border-none">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {![book.vishay, book.shreni1, book.shreni2, book.shreni3].some(Boolean) && (
                                            <p className="text-xs text-muted-foreground italic">No categories assigned</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>


                {/* Detailed Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Publication Detail Card */}
                    <Card className="shadow-sm bg-slate-50/50 dark:bg-slate-800/20 rounded-sm p-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-6 flex items-center gap-2">
                            <Info className="h-4 w-4" /> Publication Info
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Publisher</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{book.prakashak || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Edition</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{book.edition || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AD Year</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{book.yearAD || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vikram Samvat</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{book.vikramSamvat || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Veer Samvat</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{book.veerSamvat || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Size</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{book.bookSize || '—'}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Contributors Card */}
                    <Card className="shadow-sm bg-slate-50/50 dark:bg-slate-800/20 rounded-sm p-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-6 flex items-center gap-2">
                            <User className="h-4 w-4" /> Contributors
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tikakar</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">{book.tikakar || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sampadak</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">{book.sampadak || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Anuvadak</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">{book.anuvadak || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Kabat Number</p>
                                    <Badge variant="outline" className="font-mono">{book.kabatNumber || '—'}</Badge>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tables Section - Full Width */}
                <div className="space-y-8">
                    {/* Pending Requests / Queue - FULL WIDTH */}
                    <Card style={{ padding: "0px" }} className="shadow-sm bg-slate-50/50 dark:bg-slate-800/20 rounded-sm">
                        <CardHeader style={{ padding: "0px" }} className="bg-amber-500/5 pb-4 border-b border-amber-100">
                            <div className="flex justify-between p-4 items-center">
                                <div>
                                    <CardTitle className="text-xl  font-bold flex items-center gap-3">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                        </span>
                                        Pending Requests / Queue
                                    </CardTitle>
                                    <p className="text-xs text-amber-700/70 mt-1 font-medium">Orders waiting for stock verification or fulfillment.</p>
                                </div>
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none py-1.5 px-4 rounded-lg">
                                    {orders.filter(o => ['WAITLISTED', 'OUT_OF_STOCK'].includes(findBookStatus(o, book.id))).length} Items
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                        <TableHead className="py-4 pl-6">Order ID</TableHead>
                                        <TableHead className="py-4">Reader Name</TableHead>
                                        <TableHead className="py-4">Requested On (Priority)</TableHead>
                                        <TableHead className="py-4">Current Status</TableHead>
                                        <TableHead className="text-right py-4 pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders
                                        .filter(order => ['WAITLISTED', 'OUT_OF_STOCK'].includes(findBookStatus(order, book.id)))
                                        .sort((a, b) => new Date(a.orderDate || a.createdAt).getTime() - new Date(b.orderDate || b.createdAt).getTime())
                                        .map((order) => (
                                            <TableRow key={order.id} className="hover:bg-amber-50/50 transition-colors border-l-4 border-l-transparent hover:border-l-amber-500">
                                                <TableCell className="font-bold text-slate-900 dark:text-white py-4 pl-6">
                                                    <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline transition-colors">#{order.id}</Link>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Link href={`/admin/readers/${order.readerId}`} className="text-primary transition-colors font-semibold hover:underline dark:text-slate-300">
                                                        {getReaderName(order.readerId) || `Reader #${order.readerId}`}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500 font-medium py-4">
                                                    {new Date(order.orderDate || order.createdAt).toLocaleString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge variant="outline" className="bg-white dark:bg-slate-900 text-xs border-amber-500/50 text-amber-700 rounded-md font-bold">
                                                        {findBookStatus(order, book.id)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right py-4 pr-6">
                                                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm" asChild>
                                                        <Link href={`/admin/orders/${order.id}`}>Review Order</Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {orders.filter(o => ['WAITLISTED', 'OUT_OF_STOCK'].includes(findBookStatus(o, book.id))).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                                <div className="flex flex-col items-center gap-2 opacity-60">
                                                    <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                                                    <p className="font-medium">Queue is empty. All requests are processed!</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Processed / Active Orders - FULL WIDTH */}
                    <Card style={{ padding: "0px" }} className="shadow-sm bg-slate-50/50 dark:bg-slate-800/20 rounded-sm">
                        <CardHeader style={{ padding: "0px" }} className="bg-slate-50 dark:bg-slate-900/50 pb-2 border-b">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl  p-4 font-bold flex items-center gap-3">
                                    <Package className="h-5 w-5 text-primary" />
                                    Ordered Books (History)
                                </CardTitle>
                                <Badge variant="secondary" className="py-1.5 px-4 rounded-lg font-bold">
                                    {orders.filter(o => !['WAITLISTED', 'OUT_OF_STOCK'].includes(findBookStatus(o, book.id))).length} Processed
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="py-4 pl-6">Order ID</TableHead>
                                        <TableHead className="py-4">Reader</TableHead>
                                        <TableHead className="py-4">Fulfillment Date</TableHead>
                                        <TableHead className="py-4">Final Status</TableHead>
                                        <TableHead className="text-right py-4 pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders
                                        .filter(order => !['WAITLISTED', 'OUT_OF_STOCK'].includes(findBookStatus(order, book.id)))
                                        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                                        .map((order) => (
                                            <TableRow key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <TableCell className="font-bold py-4 pl-6">
                                                    <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">#{order.id}</Link>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Link href={`/admin/readers/${order.readerId}`} className="text-primary hover:underline transition-colors font-semibold">
                                                        {getReaderName(order.readerId) || `Reader #${order.readerId}`}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500 py-4">
                                                    {new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge
                                                        variant={findBookStatus(order, book.id) === 'DELIVERED' ? 'default' : 'secondary'}
                                                        className={`rounded-md font-bold ${findBookStatus(order, book.id) === 'DELIVERED' ? 'bg-green-600' : ''}`}
                                                    >
                                                        {findBookStatus(order, book.id)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right py-4 pr-6">
                                                    <Button variant="outline" size="sm" className="rounded-sm font-semibold" asChild>
                                                        <Link href={`/admin/orders/${order.id}`}>View</Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {orders.filter(o => !['WAITLISTED', 'OUT_OF_STOCK'].includes(findBookStatus(o, book.id))).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                                No historical orders found for this book.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

