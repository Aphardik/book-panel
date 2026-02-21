"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@agt-panel/components/ui/card"
import { Separator } from "@agt-panel/components/ui/separator"
import { Badge } from "@agt-panel/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@agt-panel/components/ui/table"
import { Button } from "@agt-panel/components/ui/button"
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, Home, Package, History } from "lucide-react"
import Link from "next/link"
import { readersApi, ordersApi } from "@agt-panel/lib/api-client"
import { useToast } from "@agt-panel/components/ui/use-toast"
import { cn } from "@agt-panel/lib/utils"
import { ActivityLogSection } from "@agt-panel/components/admin/activity-log-section"

interface ReaderHistory {
    id: number
    readerId: number
    firstname: string
    lastname: string
    email: string
    address: string
    city: string
    state: string
    pincode: string
    changedAt: string
}

interface Reader {
    id: number
    firstname: string
    lastname: string
    mobile: string
    email: string
    address: string
    city: string
    state: string
    pincode: string
    isactive: boolean
    createdat: string
    ReaderHistory?: ReaderHistory[]
}

interface OrderBook {
    id: number
    orderId: number
    bookId: number
    quantity: number
    status: string
    Book?: {
        id: number
        title: string
        author: string
        description?: string
        bookCode?: number
    }
}

interface Order {
    id: number
    readerId: number
    status: string
    orderDate: string
    createdAt: string
    updatedAt: string
    shippingDetails?: string
    OrderedBook?: OrderBook[]
}

export default function ReaderHistoryPage() {
    const params = useParams()
    const router = useRouter()
    const readerId = params.id as string
    const [reader, setReader] = useState<Reader | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    console.log(orders, "orders")
    useEffect(() => {
        async function fetchReaderData() {
            try {
                const readerData = await readersApi.getById(readerId)
                setReader(readerData)

                const ordersData = await ordersApi.getByReader(readerId)
                setOrders(ordersData || [])
            } catch (error) {
                console.error("Error fetching reader data:", error)
                toast({
                    title: "Error",
                    description: "Failed to fetch reader information. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        if (readerId) {
            fetchReaderData()
        }
    }, [readerId, toast])

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered':
                return 'bg-green-100 text-green-800'
            case 'shipped':
                return 'bg-blue-100 text-blue-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex justify-center items-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    if (!reader) {
        return (
            <div className="container mx-auto py-10">
                <Card>
                    <CardContent className="py-2 text-center">
                        <p className="text-gray-500">Reader not found.</p>
                        <Button onClick={() => router.push("/agt-panel/admin/readers")} className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Readers
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-4 max-w-7xl space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-100 dark:bg-slate-900/50 p-6 rounded-sm">
                <div className="flex items-center gap-5">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push("/agt-panel/admin/readers")}
                        className="rounded-sm border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black  text-slate-900 dark:text-white">Reader Profile</h1>
                            <Badge className={cn(
                                "border-none rounded-sm px-3 py-1 font-bold text-xs",
                                reader.isactive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                            )}>
                                {reader.isactive ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                            <User className="h-3.5 w-3.5" /> ID: {reader.id} • Joined {new Date(reader.createdat).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Details & Tables */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Unique Identifier for debugging if needed: LEFT_COL_START */}

                    {/* row 1: Personal Details */}
                    <Card style={{ padding: "0px" }} className="rounded-sm shadow-sm border-none bg-white dark:bg-slate-900/50 overflow-hidden">
                        <CardHeader className="bg-slate-100 dark:bg-slate-800/30 py-3 px-6 border-b">
                            <CardTitle style={{ marginBottom: "-17px" }} className="text-base font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <User className="h-3.5 w-3.5" /> Personal Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6 px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                        {reader.firstname} {reader.lastname}
                                    </h2>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-sm flex items-center justify-center text-slate-500 shrink-0">
                                                <Phone className="h-3.5 w-3.5" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{reader.mobile}</p>
                                        </div>
                                        {reader.email && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-sm flex items-center justify-center text-slate-500 shrink-0">
                                                    <Mail className="h-3.5 w-3.5" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{reader.email}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipping Address</p>
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-sm flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                                            <MapPin className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                                                {reader.address}
                                            </p>
                                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                                {reader.city}, {reader.state} {reader.pincode}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* row 2: Recent Orders */}
                    <Card style={{ padding: "0px" }} className="rounded-sm border shadow-sm overflow-hidden border-none bg-white dark:bg-slate-900/50">
                        <CardHeader className="bg-slate-900 dark:bg-slate-950 text-white py-4 px-6 flex flex-row justify-between items-center">
                            <CardTitle className="text-base font-black flex items-center gap-2 uppercase tracking-widest">
                                <Package className="h-4 w-4 text-primary" />
                                Recent Orders
                            </CardTitle>
                            <Badge variant="outline" className="border-slate-700 text-slate-300 rounded px-2 py-0.5 text-[10px] font-black uppercase">
                                {orders.length} TOTAL
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-100 dark:bg-slate-900/80">
                                        <TableRow className="hover:bg-transparent border-b">
                                            <TableHead className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 h-10">Order ID</TableHead>
                                            <TableHead className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 h-10">Date</TableHead>
                                            <TableHead className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 h-10">Items Details</TableHead>
                                            <TableHead className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 h-10">Status</TableHead>
                                            <TableHead className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 h-10 text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.length > 0 ? (
                                            orders.map((order) => (
                                                <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b last:border-0">
                                                    <TableCell className="py-3 px-6 font-black text-sm text-primary">
                                                        #{order.id}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-6 font-bold text-xs text-slate-500">
                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                            day: '2-digit', month: 'short', year: 'numeric'
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-6">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {order.OrderedBook?.slice(0, 3).map((ob, i) => (
                                                                <Badge key={i} variant="secondary" className="rounded-sm text-[9px] font-bold py-0 h-5 px-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none">
                                                                    {ob.Book?.title} ({ob.quantity})
                                                                </Badge>
                                                            ))}
                                                            {order.OrderedBook && order.OrderedBook.length > 3 && (
                                                                <span className="text-[9px] font-black text-slate-400 mt-0.5">+{order.OrderedBook.length - 3} more</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-6">
                                                        <Badge className={cn(
                                                            "rounded font-black text-[9px] px-1.5 py-0 h-5 uppercase tracking-tighter border-none",
                                                            order.status === 'DELIVERED' ? "bg-green-100 text-green-700 shadow-none hover:bg-green-100" :
                                                                order.status === 'PENDING' ? "bg-amber-100 text-amber-700 shadow-none hover:bg-amber-100" :
                                                                    "bg-slate-100 text-slate-600 shadow-none hover:bg-slate-100"
                                                        )}>
                                                            {order.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-6 text-right">
                                                        <Button asChild variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/5 rounded">
                                                            <Link href={`/agt-panel/admin/orders/${order.id}`}>View Details</Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-12 text-center text-slate-400 font-bold italic text-sm">
                                                    No orders found for this reader.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* row 3: Change Log History */}
                    {reader.ReaderHistory && reader.ReaderHistory.length > 0 && (
                        <Card className="rounded-sm border shadow-sm overflow-hidden border-none bg-white dark:bg-slate-900/50">
                            <CardHeader className="bg-slate-100 dark:bg-slate-800/30 py-3 px-6 border-b">
                                <CardTitle style={{ marginBottom: "-17px" }} className="text-base font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <History className="h-3.5 w-3.5" /> Change Log History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/30">
                                            <TableRow className="hover:bg-transparent border-b">
                                                <TableHead className="py-2.5 px-6 text-[9px] font-black uppercase tracking-widest text-slate-400 h-9">Date Changed</TableHead>
                                                <TableHead className="py-2.5 px-6 text-[9px] font-black uppercase tracking-widest text-slate-400 h-9">Previous Full Name</TableHead>
                                                <TableHead className="py-2.5 px-6 text-[9px] font-black uppercase tracking-widest text-slate-400 h-9">Previous Address Info</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reader.ReaderHistory.map((history) => (
                                                <TableRow key={history.id} className="hover:bg-slate-50/20 border-b last:border-0 transition-colors">
                                                    <TableCell className="py-3 px-6 text-[10px] font-bold text-slate-500">
                                                        {new Date(history.changedAt).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-6">
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                            {history.firstname} {history.lastname}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-6">
                                                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                            <MapPin className="h-3 w-3 opacity-40" /> {history.address}, {history.city}, {history.pincode}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Activity Timeline */}
                <div className="lg:col-span-4 space-y-6">
                    <ActivityLogSection
                        entityId={readerId}
                        entityType="reader"
                    />
                </div>
            </div>
        </div>
    )
}

