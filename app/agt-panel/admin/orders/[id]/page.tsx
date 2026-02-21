"use client"

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { ordersApi, readersApi } from "@agt-panel/lib/api-client";
import { ActivityLogSection } from "@agt-panel/components/admin/activity-log-section";
import { Card, CardContent, CardHeader, CardTitle } from "@agt-panel/components/ui/card";
import { Button } from "@agt-panel/components/ui/button";
import { Separator } from "@agt-panel/components/ui/separator";
import {
    Loader2, ArrowLeft, User, Package, MapPin, Phone, Mail,
    Calendar, Edit, Trash2, Clock, CheckCircle2, History, MessageSquare, AlertCircle
} from "lucide-react";
import { Badge } from "@agt-panel/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@agt-panel/components/ui/select";
import { useToast } from "@agt-panel/components/ui/use-toast";
import Link from "next/link";
import { cn } from "@agt-panel/lib/utils";

export default function OrderViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [order, setOrder] = useState<any>(null);
    const [reader, setReader] = useState<any>(null);
    // const [logs, setLogs] = useState<any[]>([]); // Removed
    const [loading, setLoading] = useState(true);
    // const [logsLoading, setLogsLoading] = useState(false); // Removed
    const [refreshLogsKey, setRefreshLogsKey] = useState(0);

    useEffect(() => {
        fetchOrderDetails();
        // fetchActivityLogs(); // Removed
    }, [id]);

    async function fetchOrderDetails() {
        try {
            setLoading(true);
            const orderData = await ordersApi.getById(id);
            setOrder(orderData);

            if (orderData.readerId) {
                const readerData = await readersApi.getById(orderData.readerId);
                setReader(readerData);
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to fetch order details", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    // fetchActivityLogs removed. Handled by ActivityLogSection.

    const handleStatusChange = async (status: string) => {
        try {
            await ordersApi.updateStatus(id, status);
            toast({ title: "Success", description: "Order status updated" });
            setOrder({ ...order, status });
            setRefreshLogsKey(prev => prev + 1); // Refresh timeline via key
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    }

    const handleBookStatusChange = async (bookId: number | string, status: string) => {
        try {
            await ordersApi.updateBookStatus(id, bookId, status);
            toast({ title: "Success", description: "Book status updated" });
            fetchOrderDetails(); // Refresh to get updated book status
            setRefreshLogsKey(prev => prev + 1); // Refresh timeline via key
        } catch (error) {
            toast({ title: "Error", description: "Failed to update book status", variant: "destructive" });
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
    );

    if (!order) return <div className="p-8 text-center">Order not found</div>;

    const books = order.OrderedBook || order.items || [];

    return (
        <div className="container mx-auto px-4 py-2 max-w-7xl space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-100 dark:bg-slate-900/50 p-6 rounded-sm">
                <div className="flex items-center gap-5">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-sm border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Order #{order.id}</h1>
                            <Badge className="bg-primary/10 text-primary border-none rounded-sm px-3 py-1 font-bold text-xs">
                                {order.status}
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Placed on {new Date(order.orderDate || order.createdAt).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Select value={order.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full md:w-[200px] h-10 rounded-sm font-semibold">
                            <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm">
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PROCESS">Process</SelectItem>
                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* <Button variant="outline" className="rounded-sm h-10 px-4 gap-2 font-bold" disabled>
                        <Edit className="h-4 w-4" /> Edit
                    </Button> */}
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Order Details & Information */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Reader & Shipping Summary */}
                    <Card style={{ paddingTop: '0px' }} className="rounded-sm shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-100 dark:bg-slate-800/30 py-4 px-6 border-b">
                            <CardTitle style={{ marginBottom: "-17px" }} className="text-base font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <User className="h-4 w-4" /> Reader & Shipping Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-6 px-6">
                            {reader ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Column 1: Personal info */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reader Details</p>
                                            <Link href={`/agt-panel/admin/readers/${reader.id}`} className="text-xl font-black text-primary hover:underline">
                                                {reader.firstname} {reader.lastname}
                                            </Link>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">ID: {reader.id}</p>
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            <div className="flex items-center gap-3 text-sm font-semibold">
                                                <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-sm flex items-center justify-center text-slate-500">
                                                    <Phone className="h-3.5 w-3.5" />
                                                </div>
                                                {reader.mobile}
                                            </div>
                                            {reader.email && (
                                                <div className="flex items-center gap-3 text-sm font-semibold">
                                                    <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-sm flex items-center justify-center text-slate-500">
                                                        <Mail className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="truncate">{reader.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 2: Address info */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping Address</p>
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
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-sm border border-amber-100">
                                    <AlertCircle className="h-5 w-5" />
                                    <p className="text-sm font-bold">Reader metadata unavailable</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ordered Items Table */}
                    <Card style={{ paddingTop: '0px' }} className="rounded-sm border shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-900 dark:bg-slate-950 text-white py-4 px-6 flex flex-row justify-between items-center shrink-0">
                            <CardTitle className="text-lg font-bold flex items-center gap-3">
                                <Package className="h-5 w-5 text-primary" />
                                Ordered Books list
                            </CardTitle>
                            <Badge variant="outline" className="border-slate-700 text-slate-300 rounded-sm font-bold">
                                {books.length} Items
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/80 border-b">
                                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Book Details</th>
                                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</th>
                                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Item Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {books.length > 0 ? (
                                            books.map((item: any, i: number) => {
                                                const title = item.Book?.title || item.title || "Unknown Title";
                                                const bookId = item.bookId || item.id;
                                                const isWaitlisted = (item.status || "WAITLISTED") === "WAITLISTED";
                                                return (
                                                    <tr key={i} className={cn(
                                                        "transition-colors",
                                                        isWaitlisted
                                                            ? "bg-red-100 hover:bg-red-200 dark:bg-red-800/30 dark:hover:bg-red-900/10"
                                                            : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                                    )}>
                                                        <td className="py-5 px-6">
                                                            <Link
                                                                href={`/agt-panel/admin/books/${bookId}`}
                                                                className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors block leading-tight"
                                                            >
                                                                {title}
                                                            </Link>
                                                        </td>
                                                        <td className="py-5 px-6 font-mono text-xs font-bold text-slate-500">
                                                            {item.Book?.bookCode || '—'}
                                                        </td>
                                                        <td className="py-5 px-6 font-black text-slate-700 dark:text-slate-300">
                                                            {item.quantity || 1}
                                                        </td>
                                                        <td className="py-5 px-6">
                                                            <Select
                                                                value={item.status || "WAITLISTED"}
                                                                onValueChange={(val) => handleBookStatusChange(item.id || item.bookId, val)}
                                                            >
                                                                <SelectTrigger className="w-[140px] h-9 rounded-sm font-bold text-xs ring-0">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-sm">
                                                                    <SelectItem value="NEW_ORDER">New Order</SelectItem>
                                                                    <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                                                                    {/* <SelectItem value="AVAILABLE">Available</SelectItem> */}
                                                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                                                                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                                                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-slate-400 font-medium italic">
                                                    No items found in this order.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Meta Data */}
                    {/* <div className="flex flex-wrap gap-4">
                        <Card className="flex-1 min-w-[200px] rounded-sm bg-primary/5 border-primary/20 p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total Items</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{books.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)}</p>
                            </div>
                        </Card>
                        <Card className="flex-1 min-w-[200px] rounded-sm bg-green-50/50 dark:bg-green-950/20 border-green-200/50 p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-sm bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 shrink-0">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-green-600/60">Order Status</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white capitalize">{order.status?.toLowerCase()}</p>
                            </div>
                        </Card>
                        <Card className="flex-1 min-w-[200px] rounded-sm bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-sm bg-white dark:bg-slate-900 border flex items-center justify-center text-slate-400 shrink-0">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <Button variant="ghost" className="p-0 h-auto font-black text-red-500 hover:text-red-600 hover:bg-transparent" disabled>
                                Delete Order
                            </Button>
                        </Card>
                    </div> */}

                </div>

                {/* Right Column: Activity Timeline (Salesforce Inspired) */}
                <div className="lg:col-span-4 space-y-6">
                    <ActivityLogSection
                        entityId={id}
                        entityType="order"
                        readerId={order?.readerId}
                        key={refreshLogsKey}
                    />
                </div>
            </div>
        </div>
    );
}

