"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@agt-panel/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@agt-panel/components/ui/table"
import { Button } from "@agt-panel/components/ui/button"
import { Loader2, ArrowLeft, BookOpen, Users, Package, User, Mail, Phone, MapPin } from "lucide-react"
import { ordersApi } from "@agt-panel/lib/api-client"
import { useToast } from "@agt-panel/components/ui/use-toast"

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
}

interface BookStats {
    bookId: number
    totalOrderedQuantity: number
    readersCount: number
    readers: Reader[]
}

export default function BookReadersPage() {
    const params = useParams()
    const router = useRouter()
    const bookId = params.id as string
    const [bookStats, setBookStats] = useState<BookStats | null>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        async function fetchBookStats() {
            try {
                const data = await ordersApi.getBookStats(bookId)
                setBookStats(data)
            } catch (error) {
                console.error("Error fetching book stats:", error)
                toast({
                    title: "Error",
                    description: "Failed to fetch book readers. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        if (bookId) {
            fetchBookStats()
        }
    }, [bookId, toast])

    const handleReaderClick = (readerId: number) => {
        router.push(`/admin/readers/${readerId}`)
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

    if (!bookStats) {
        return (
            <div className="container mx-auto py-10">
                <Card>
                    <CardContent className="py-10 text-center">
                        <p className="text-gray-500">No data found for this book.</p>
                        <Button onClick={() => router.push("/admin/books")} className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Books
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            {/* Compact Header */}
            <div className="flex items-center gap-3 mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin/books")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Book Readers</h1>
            </div>

            {/* Compact Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Book ID</p>
                                <p className="text-2xl font-bold">{bookStats.bookId}</p>
                            </div>
                            <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                                <p className="text-2xl font-bold">{bookStats.totalOrderedQuantity}</p>
                            </div>
                            <Package className="h-8 w-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Total Readers</p>
                                <p className="text-2xl font-bold">{bookStats.readersCount}</p>
                            </div>
                            <Users className="h-8 w-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Compact Readers Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Readers ({bookStats.readers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {bookStats.readers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No readers have ordered this book yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]">ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="w-[130px]">Mobile</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="w-[120px]">City</TableHead>
                                        <TableHead className="w-[100px]">State</TableHead>
                                        <TableHead className="w-[80px]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookStats.readers.map((reader) => (
                                        <TableRow
                                            key={reader.id}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => handleReaderClick(reader.id)}
                                        >
                                            <TableCell className="font-medium">{reader.id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                    <span className="font-medium">
                                                        {reader.firstname} {reader.lastname}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm">{reader.mobile}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm truncate">{reader.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm">{reader.city}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{reader.state}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${reader.isactive
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                        }`}
                                                >
                                                    {reader.isactive ? "Active" : "Inactive"}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

