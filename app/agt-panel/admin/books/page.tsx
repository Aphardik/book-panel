"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/agt-panel/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/agt-panel/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/agt-panel/components/ui/table"
import {
    Loader2, Plus, Eye, Edit, Trash2, BookOpen, User, Tag, Package,
    CheckCircle2, XCircle, Calendar, DollarSign, Hash, FileText,
    Languages, BookMarked, Sparkles, Upload, Search, ChevronLeft, ChevronRight, Download,
    BadgeCheck
} from "lucide-react"
import Link from "next/link"
import { ColumnToggle, Column } from "@/agt-panel/components/admin/column-toggle"
import { useToast } from "@/agt-panel/components/ui/use-toast"
import { Input } from "@/agt-panel/components/ui/input"
import { Label } from "@/agt-panel/components/ui/label"
import { exportToCSV } from "@/agt-panel/lib/export-utils"
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/agt-panel/components/ui/dialog"
import { booksApi, mastersApi } from "@/agt-panel/lib/api-client"
import ExcelImportDialog from "@/agt-panel/components/admin/excel-import-dialog"
import { MultiSelect } from "@/agt-panel/components/ui/multi-select"
import { FilterX, Filter, SlidersHorizontal } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/agt-panel/components/ui/sheet"

interface Book {
    id: number | string
    title: string
    author: string
    description?: string
    frontImage?: string
    backImage?: string
    stockQty?: number
    isAvailable?: boolean
    featured?: boolean
    languageId?: number
    categoryId?: number | null
    category?: any
    createdAt?: string
    updatedAt?: string
    bookCode?: number
    kabatNumber?: number
    bookSize?: string
    tikakar?: string
    prakashak?: string
    sampadak?: string
    anuvadak?: string
    vishay?: string
    shreni1?: string
    shreni2?: string
    shreni3?: string
    pages?: number
    yearAD?: number
    vikramSamvat?: number
    veerSamvat?: number
    price?: number
    prakar?: string
    edition?: number
    [key: string]: any
}

export default function AdminBooksPage() {
    const router = useRouter()
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteBookId, setDeleteBookId] = useState<string | number | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [viewBook, setViewBook] = useState<Book | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [loadingBookDetails, setLoadingBookDetails] = useState(false)
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

    // Filter Social Options
    const [languages, setLanguages] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")

    // New Filter States
    const [kabatNumber, setKabatNumber] = useState<string>("")
    const [minPages, setMinPages] = useState<string>("")
    const [maxPages, setMaxPages] = useState<string>("")
    const [bookSize, setBookSize] = useState<string>("")
    const [yearAD, setYearAD] = useState<string>("")
    const [vikramSamvat, setVikramSamvat] = useState<string>("")
    const [veerSamvat, setVeerSamvat] = useState<string>("")

    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Column Visibility State
    const [columns, setColumns] = useState<Column[]>([
        { id: "title", label: "Title", isVisible: true },
        { id: "author", label: "Author", isVisible: true },
        { id: "bookCode", label: "Code", isVisible: false },
        { id: "kabatNumber", label: "Kabat No", isVisible: false },
        { id: "category", label: "Category", isVisible: false },
        { id: "language", label: "Language", isVisible: false },
        { id: "vishay", label: "Vishay", isVisible: false },
        { id: "prakar", label: "Prakar", isVisible: false },
        { id: "shreni1", label: "Shreni 1", isVisible: false },
        { id: "shreni2", label: "Shreni 2", isVisible: false },
        { id: "shreni3", label: "Shreni 3", isVisible: false },
        { id: "tikakar", label: "Tikakar", isVisible: false },
        { id: "prakashak", label: "Prakashak", isVisible: false },
        { id: "sampadak", label: "Sampadak", isVisible: false },
        { id: "anuvadak", label: "Anuvadak", isVisible: false },
        { id: "pages", label: "Pages", isVisible: false },
        { id: "bookSize", label: "Size", isVisible: false },
        { id: "edition", label: "Edition", isVisible: false },
        { id: "yearAD", label: "Year (AD)", isVisible: false },
        { id: "vikramSamvat", label: "Vikram Samvat", isVisible: false },
        { id: "veerSamvat", label: "Veer Samvat", isVisible: false },
        { id: "price", label: "Price", isVisible: false },
        { id: "copies", label: "Copies", isVisible: true },
        { id: "status", label: "Status", isVisible: true },
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

    // Fetch filter options
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [langData, catData] = await Promise.all([
                    mastersApi.getLanguages(),
                    mastersApi.getCategories()
                ])
                setLanguages(langData || [])
                setCategories(catData || [])
            } catch (error) {
                console.error("Error fetching filters:", error)
            }
        }
        fetchFilters()
    }, [])

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setCurrentPage(1) // Reset to first page on search
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const fetchBooks = async () => {
        setLoading(true)
        try {
            const data = await booksApi.getAll({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                languageIds: selectedLanguages,
                categoryIds: selectedCategories,
                isAvailable: availabilityFilter === "all" ? undefined : availabilityFilter === "available",
                kabatNumber: kabatNumber || undefined,
                minPages: minPages ? parseInt(minPages) : undefined,
                maxPages: maxPages ? parseInt(maxPages) : undefined,
                bookSize: bookSize || undefined,
                yearAD: yearAD || undefined,
                vikramSamvat: vikramSamvat || undefined,
                veerSamvat: veerSamvat || undefined
            })
            setBooks(data.books || [])
            setTotalPages(data.pagination?.totalPages || 1)
            setTotalItems(data.pagination?.total || 0)
        } catch (error) {
            console.error("Error fetching books:", error)
            toast({
                title: "Error",
                description: "Failed to fetch books. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBooks()
    }, [currentPage, itemsPerPage, debouncedSearch])

    const handleViewClick = async (bookId: string | number) => {
        setLoadingBookDetails(true)
        setIsViewModalOpen(true)

        try {
            const bookDetails = await booksApi.getById(bookId)
            setViewBook(bookDetails)
        } catch (error) {
            console.error("Error fetching book details:", error)
            toast({
                title: "Error",
                description: "Failed to fetch book details. Please try again.",
                variant: "destructive",
            })
            setIsViewModalOpen(false)
        } finally {
            setLoadingBookDetails(false)
        }
    }

    const handleDeleteClick = (bookId: string | number) => {
        setDeleteBookId(bookId)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteBookId) return

        try {
            await booksApi.delete(deleteBookId)
            setBooks(books.filter((book) => book.id !== deleteBookId))
            toast({
                title: "Success",
                description: "Book deleted successfully.",
            })
        } catch (error) {
            console.error("Error deleting book:", error)
            toast({
                title: "Error",
                description: "Failed to delete book. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsDeleteDialogOpen(false)
            setDeleteBookId(null)
        }
    }

    const handleExport = async () => {
        try {
            setExportLoading(true)
            const data = await booksApi.getAll({
                limit: 10000, // Fetch all for export
                search: debouncedSearch
            })
            const booksList = Array.isArray(data) ? data : (data.books || [])

            const exportData = booksList.map((b: any) => ({
                "ID": b.id,
                "Title": b.title,
                "Author": b.author,
                "Price": b.price || 0,
                "Stock": b.stockQty || 0,
                "Available": b.isAvailable ? "Yes" : "No",
                "Code": b.bookCode || ""
            }));
            exportToCSV(exportData, "Books");
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

    const closeViewModal = () => {
        setIsViewModalOpen(false)
        setViewBook(null)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Books Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage, search, and import your library collection.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={handleExport} disabled={exportLoading} className="flex-1 md:flex-none">
                        {exportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="flex-1 md:flex-none">
                        <Upload className="mr-2 h-4 w-4" /> Import Excel
                    </Button>
                    <Link href="/agt-panel/admin/add-book" className="flex-1 md:flex-none">
                        <Button className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Book
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="shadow-sm border-muted">
                <CardHeader>
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <CardTitle className="text-xl">All Books ({totalItems})</CardTitle>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search title, author, code..."
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
                                            {(selectedLanguages.length > 0 || selectedCategories.length > 0 || availabilityFilter !== "all" || kabatNumber || minPages || maxPages || bookSize || yearAD || vikramSamvat || veerSamvat) && (
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
                                                <SheetTitle className="text-xl font-bold text-white uppercase tracking-wider">Filter Books</SheetTitle>
                                            </div>
                                        </SheetHeader>

                                        <div className="flex-1 p-6 space-y-6">
                                            {/* General Categorization */}
                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Tag className="h-3 w-3" /> Categorization
                                                </h4>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-slate-400">Languages</Label>
                                                        <MultiSelect
                                                            placeholder="Select Languages"
                                                            options={languages.map(l => ({ label: l.name, value: l.id.toString() }))}
                                                            selected={selectedLanguages}
                                                            onChange={setSelectedLanguages}
                                                            className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-slate-400">Categories</Label>
                                                        <MultiSelect
                                                            placeholder="Select Categories"
                                                            options={categories.map(c => ({ label: c.name, value: c.id.toString() }))}
                                                            selected={selectedCategories}
                                                            onChange={setSelectedCategories}
                                                            className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Page Range - Matching UI Reference style */}
                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <BookMarked className="h-3 w-3" /> Book Details
                                                </h4>
                                                <div className="space-y-3">
                                                    <Label className="text-xs text-slate-400">Pages Range</Label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Input
                                                            placeholder="Min"
                                                            type="number"
                                                            value={minPages}
                                                            onChange={(e) => setMinPages(e.target.value)}
                                                            className="bg-[#1e293b] border-slate-700 focus:border-primary/50 text-slate-200"
                                                        />
                                                        <Input
                                                            placeholder="Max"
                                                            type="number"
                                                            value={maxPages}
                                                            onChange={(e) => setMaxPages(e.target.value)}
                                                            className="bg-[#1e293b] border-slate-700 focus:border-primary/50 text-slate-200"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-slate-400">Kabat Number</Label>
                                                        <Input
                                                            placeholder="e.g. 15"
                                                            value={kabatNumber}
                                                            onChange={(e) => setKabatNumber(e.target.value)}
                                                            className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-slate-400">Book Size</Label>
                                                        <Input
                                                            placeholder="e.g. A4, Royal"
                                                            value={bookSize}
                                                            onChange={(e) => setBookSize(e.target.value)}
                                                            className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Advanced Timeline */}
                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" /> Timeline & Availability
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-slate-400">Year (AD)</Label>
                                                        <Input
                                                            placeholder="2024"
                                                            value={yearAD}
                                                            onChange={(e) => setYearAD(e.target.value)}
                                                            className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-slate-400">Availability</Label>
                                                        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                                                            <SelectTrigger className="bg-[#1e293b] border-slate-700 text-slate-200 h-10">
                                                                <SelectValue placeholder="Status" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#1e293b] border-slate-700 text-slate-200">
                                                                <SelectItem value="all">All Items</SelectItem>
                                                                <SelectItem value="available">Available</SelectItem>
                                                                <SelectItem value="outofstock">Out of Stock</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-slate-400">Vikram Samvat</Label>
                                                        <Input
                                                            placeholder="e.g. 2080"
                                                            value={vikramSamvat}
                                                            onChange={(e) => setVikramSamvat(e.target.value)}
                                                            className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-slate-400">Veer Samvat</Label>
                                                        <Input
                                                            placeholder="e.g. 2550"
                                                            value={veerSamvat}
                                                            onChange={(e) => setVeerSamvat(e.target.value)}
                                                            className="bg-[#1e293b] border-slate-700 text-slate-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <SheetFooter className="p-6 bg-[#1e293b]/50 border-t border-slate-800 flex flex-col gap-3">
                                            <Button
                                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg shadow-primary/20"
                                                onClick={() => {
                                                    fetchBooks()
                                                    setIsFilterOpen(false)
                                                }}
                                            >
                                                Apply Filters
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full text-slate-400 hover:text-white font-semibold h-11"
                                                onClick={() => {
                                                    setSelectedLanguages([])
                                                    setSelectedCategories([])
                                                    setAvailabilityFilter("all")
                                                    setKabatNumber("")
                                                    setMinPages("")
                                                    setMaxPages("")
                                                    setBookSize("")
                                                    setYearAD("")
                                                    setVikramSamvat("")
                                                    setVeerSamvat("")
                                                    setSearchQuery("")
                                                    // Trigger fetch immediately after clearing
                                                    // Note: fetchBooks uses the states, so we rely on them being cleared
                                                    setTimeout(() => fetchBooks(), 0)
                                                    setIsFilterOpen(false)
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
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading books...</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table className="font-tiro">
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        {isColumnVisible("title") && <TableHead className="w-[300px]">Title</TableHead>}
                                        {isColumnVisible("author") && <TableHead>Author</TableHead>}
                                        {isColumnVisible("bookCode") && <TableHead>Code</TableHead>}
                                        {isColumnVisible("kabatNumber") && <TableHead>Kabat No</TableHead>}
                                        {isColumnVisible("category") && <TableHead>Category</TableHead>}
                                        {isColumnVisible("language") && <TableHead>Language</TableHead>}
                                        {isColumnVisible("vishay") && <TableHead>Vishay</TableHead>}
                                        {isColumnVisible("prakar") && <TableHead>Prakar</TableHead>}
                                        {isColumnVisible("shreni1") && <TableHead>Shreni 1</TableHead>}
                                        {isColumnVisible("shreni2") && <TableHead>Shreni 2</TableHead>}
                                        {isColumnVisible("shreni3") && <TableHead>Shreni 3</TableHead>}
                                        {isColumnVisible("tikakar") && <TableHead>Tikakar</TableHead>}
                                        {isColumnVisible("prakashak") && <TableHead>Prakashak</TableHead>}
                                        {isColumnVisible("sampadak") && <TableHead>Sampadak</TableHead>}
                                        {isColumnVisible("anuvadak") && <TableHead>Anuvadak</TableHead>}
                                        {isColumnVisible("pages") && <TableHead>Pages</TableHead>}
                                        {isColumnVisible("bookSize") && <TableHead>Size</TableHead>}
                                        {isColumnVisible("edition") && <TableHead>Edition</TableHead>}
                                        {isColumnVisible("yearAD") && <TableHead>Year (AD)</TableHead>}
                                        {isColumnVisible("vikramSamvat") && <TableHead>Vikram Samvat</TableHead>}
                                        {isColumnVisible("veerSamvat") && <TableHead>Veer Samvat</TableHead>}
                                        {isColumnVisible("price") && <TableHead>Price</TableHead>}
                                        {isColumnVisible("copies") && <TableHead className="w-24">Copies</TableHead>}
                                        {isColumnVisible("status") && <TableHead className="w-32">Status</TableHead>}
                                        {isColumnVisible("actions") && <TableHead className="text-right w-32">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {books.map((book) => (
                                        <TableRow
                                            key={book.id}
                                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/agt-panel/admin/books/${book.id}`)}
                                        >
                                            {isColumnVisible("title") && <TableCell className="font-medium max-w-[300px]">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="truncate block flex-1 font-bold text-primary hover:underline" title={book.title}>
                                                        {book.title}
                                                    </span>
                                                    {book.featured && (
                                                        <BadgeCheck className="h-4 w-4 flex-shrink-0 fill-blue-500" />
                                                    )}
                                                </div>
                                            </TableCell>}
                                            {isColumnVisible("author") && <TableCell className="text-muted-foreground">
                                                <div className="truncate max-w-[150px]" title={book.author}>
                                                    {book.author || '—'}
                                                </div>
                                            </TableCell>}
                                            {isColumnVisible("bookCode") && <TableCell>{book.bookCode}</TableCell>}
                                            {isColumnVisible("kabatNumber") && <TableCell>{book.kabatNumber}</TableCell>}
                                            {isColumnVisible("category") && <TableCell>{book.category?.name || '—'}</TableCell>}
                                            {isColumnVisible("language") && <TableCell>{book.language?.name || '—'}</TableCell>}
                                            {isColumnVisible("vishay") && <TableCell>{book.vishay}</TableCell>}
                                            {isColumnVisible("prakar") && <TableCell>{book.prakar}</TableCell>}
                                            {isColumnVisible("shreni1") && <TableCell>{book.shreni1}</TableCell>}
                                            {isColumnVisible("shreni2") && <TableCell>{book.shreni2}</TableCell>}
                                            {isColumnVisible("shreni3") && <TableCell>{book.shreni3}</TableCell>}
                                            {isColumnVisible("tikakar") && <TableCell>{book.tikakar}</TableCell>}
                                            {isColumnVisible("prakashak") && <TableCell>{book.prakashak}</TableCell>}
                                            {isColumnVisible("sampadak") && <TableCell>{book.sampadak}</TableCell>}
                                            {isColumnVisible("anuvadak") && <TableCell>{book.anuvadak}</TableCell>}
                                            {isColumnVisible("pages") && <TableCell>{book.pages}</TableCell>}
                                            {isColumnVisible("bookSize") && <TableCell>{book.bookSize}</TableCell>}
                                            {isColumnVisible("edition") && <TableCell>{book.edition}</TableCell>}
                                            {isColumnVisible("yearAD") && <TableCell>{book.yearAD}</TableCell>}
                                            {isColumnVisible("vikramSamvat") && <TableCell>{book.vikramSamvat}</TableCell>}
                                            {isColumnVisible("veerSamvat") && <TableCell>{book.veerSamvat}</TableCell>}
                                            {isColumnVisible("price") && <TableCell>₹{book.price}</TableCell>}
                                            {isColumnVisible("copies") && <TableCell>
                                                <span className="font-mono">{book.stockQty ?? 0}</span>
                                            </TableCell>}
                                            {isColumnVisible("status") && <TableCell>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${book.isAvailable
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : "bg-red-50 text-red-700 border-red-200"
                                                        }`}
                                                >
                                                    {book.isAvailable ? "Available" : "Out of Stock"}
                                                </span>
                                            </TableCell>}
                                            {isColumnVisible("actions") && <TableCell className="text-right">
                                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-primary"
                                                        title="View"
                                                        onClick={() => router.push(`/agt-panel/admin/books/${book.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Link href={`/agt-panel/admin/books/edit/${book.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" title="Edit">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        title="Delete"
                                                        onClick={() => handleDeleteClick(book.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>}
                                        </TableRow>
                                    ))}
                                    {books.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20">
                                                <div className="flex flex-col items-center gap-2">
                                                    <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                                                    <p className="text-muted-foreground font-medium">
                                                        {searchQuery ? "No books found matching your search." : "No books found. Add one to get started."}
                                                    </p>
                                                    {searchQuery && (
                                                        <Button variant="link" onClick={() => setSearchQuery("")} className="text-primary">
                                                            Clear Search
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {!loading && books.length > 0 && (
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
                                <span className="hidden md:inline ml-2 opacity-70">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                                </span>
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
                                                className={`w-9 h-9 p-0 font-semibold ${currentPage === pageNum ? "shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        )
                                    })}
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <span className="text-muted-foreground px-1 select-none">...</span>
                                    )}
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
                </CardContent>
            </Card>

            {/* Delete Verification Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader className="pb-4">
                        <AlertDialogTitle className="text-2xl font-bold text-destructive flex items-center gap-2">
                            <Trash2 className="h-6 w-6" />Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-muted-foreground">
                            You are about to permanently erase
                            <span className="font-bold text-foreground mx-1">"{books.find(b => b.id === deleteBookId)?.title}"</span>
                            from the system. This will also remove all historical interest logs. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="h-12 rounded-xl border-2 font-bold px-6">Keep Record</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 h-12 rounded-xl text-destructive-foreground font-bold px-8 shadow-lg shadow-destructive/20 border-none">
                            Confirm Deletion
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Excel Ingestion Layer */}
            <ExcelImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onImportComplete={fetchBooks}
            />
        </div>
    )
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-primary/60">
            <span className="p-1.5 bg-primary/10 rounded-lg">{icon}</span>
            {title}
        </div>
    )
}

function MetaField({ label, value, className = "" }: { label: string; value: any; className?: string }) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-4 p-4 items-baseline hover:bg-muted/30 transition-colors ${className}`}>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
            <p className="text-sm font-semibold text-foreground leading-relaxed break-words">
                {value ?? <span className="text-muted-foreground/30 font-normal italic">Not Specified</span>}
            </p>
        </div>
    )
}

