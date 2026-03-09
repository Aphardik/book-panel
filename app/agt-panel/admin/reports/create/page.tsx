"use client"

import { useState, useMemo } from "react"
import {
    Download,
    Loader2,
    BookOpen,
    ShoppingCart,
    Users,
    Plus,
    ArrowRight,
    Database,
    Check,
    X,
    ChevronRight,
    Info,
    Layers,
    Table as TableIcon,
    Save,
    ArrowLeft
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/agt-panel/components/ui/card"
import { Button } from "@/agt-panel/components/ui/button"
import { useToast } from "@/agt-panel/components/ui/use-toast"
import { booksApi, ordersApi, readersApi, reportsApi } from "@/agt-panel/lib/api-client"
import { exportToCSV } from "@/agt-panel/lib/export-utils"
import { Separator } from "@/agt-panel/components/ui/separator"
import { Badge } from "@/agt-panel/components/ui/badge"
import { Input } from "@/agt-panel/components/ui/input"
import { Label } from "@/agt-panel/components/ui/label"
import { Checkbox } from "@/agt-panel/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/agt-panel/components/ui/table"
import { cn } from "@/agt-panel/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/agt-panel/components/ui/dialog"
import { useRouter } from "next/navigation"

// --- Types & Schema Definition ---

type ObjectType = "books" | "orders" | "readers"

interface Field {
    id: string
    label: string
    type: "string" | "number" | "boolean" | "date"
    source: ObjectType | "masters"
    path: string // Path in the returned object
}

interface Relationship {
    from: ObjectType
    to: ObjectType
    label: string
    key: string // The key in 'from' that maps to 'to'
    joinField: string // The field in 'to' that 'key' matches (usually id)
    type: "1:1" | "1:N"
}

const SCHEMA: Record<ObjectType, { label: string; icon: any; fields: Field[] }> = {
    books: {
        label: "Books",
        icon: BookOpen,
        fields: [
            { id: "b_id", label: "Book ID", type: "number", source: "books", path: "id" },
            { id: "b_code", label: "Book Code", type: "string", source: "books", path: "bookCode" },
            { id: "b_title", label: "Title", type: "string", source: "books", path: "title" },
            { id: "b_author", label: "Author", type: "string", source: "books", path: "author" },
            { id: "b_price", label: "Price", type: "number", source: "books", path: "price" },
            { id: "b_total", label: "Total Copies", type: "number", source: "books", path: "totalCopies" },
            { id: "b_avail", label: "Available Copies", type: "number", source: "books", path: "availableCopies" },
            { id: "b_kabat", label: "Kabat No", type: "string", source: "books", path: "kabatNumber" },
            { id: "b_year", label: "Year (AD)", type: "string", source: "books", path: "yearAD" },
            { id: "b_vikram", label: "Vikram Samvat", type: "string", source: "books", path: "vikramSamvat" },
            { id: "b_veer", label: "Veer Samvat", type: "string", source: "books", path: "veerSamvat" },
            { id: "b_pages", label: "Pages", type: "number", source: "books", path: "pages" },
            { id: "b_status", label: "Is Available", type: "boolean", source: "books", path: "isAvailable" },
            { id: "b_cat", label: "Category", type: "string", source: "books", path: "Category.name" },
            { id: "b_lang", label: "Language", type: "string", source: "books", path: "Language.name" },
            { id: "b_vishay", label: "Vishay", type: "string", source: "books", path: "vishay" },
            { id: "b_prakar", label: "Prakar", type: "string", source: "books", path: "prakar" },
            { id: "b_size", label: "Book Size", type: "string", source: "books", path: "bookSize" },
            { id: "b_edition", label: "Edition", type: "number", source: "books", path: "edition" },
            { id: "b_sam", label: "Sampadak", type: "string", source: "books", path: "sampadak" },
            { id: "b_tik", label: "Tikakar", type: "string", source: "books", path: "tikakar" },
            { id: "b_prak", label: "Prakashak", type: "string", source: "books", path: "prakashak" },
            { id: "b_anu", label: "Anuvadak", type: "string", source: "books", path: "anuvadak" },
        ]
    },
    orders: {
        label: "Orders",
        icon: ShoppingCart,
        fields: [
            { id: "o_id", label: "Order ID", type: "number", source: "orders", path: "id" },
            { id: "o_date", label: "Order Date", type: "date", source: "orders", path: "orderDate" },
            { id: "o_status", label: "Status", type: "string", source: "orders", path: "status" },
            { id: "o_shipping", label: "Shipping Details", type: "string", source: "orders", path: "shippingDetails" },
            { id: "o_books", label: "Book Titles", type: "string", source: "orders", path: "OrderedBook.Book.title" },
            { id: "o_count", label: "Total Items", type: "number", source: "orders", path: "OrderedBook.count" },
        ]
    },
    readers: {
        label: "Readers",
        icon: Users,
        fields: [
            { id: "r_id", label: "Reader ID", type: "number", source: "readers", path: "id" },
            { id: "r_fname", label: "First Name", type: "string", source: "readers", path: "firstname" },
            { id: "r_lname", label: "Last Name", type: "string", source: "readers", path: "lastname" },
            { id: "r_email", label: "Email", type: "string", source: "readers", path: "email" },
            { id: "r_phone", label: "Phone", type: "string", source: "readers", path: "mobile" },
            { id: "r_occ", label: "Occupation", type: "string", source: "readers", path: "occupation" },
            { id: "r_city", label: "City", type: "string", source: "readers", path: "city" },
            { id: "r_state", label: "State", type: "string", source: "readers", path: "state" },
            { id: "r_pincode", label: "Pincode", type: "string", source: "readers", path: "pincode" },
            { id: "r_address", label: "Address", type: "string", source: "readers", path: "address" },
        ]
    }
}

const RELATIONSHIPS: Relationship[] = [
    { from: "orders", to: "readers", label: "Reader Stats", key: "readerId", joinField: "id", type: "1:1" },
    { from: "readers", to: "orders", label: "Link Order History", key: "id", joinField: "readerId", type: "1:N" },
]

export default function CreateReportPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [baseObject, setBaseObject] = useState<ObjectType | null>(null)
    const [selectedFields, setSelectedFields] = useState<string[]>([])
    const [joinedObjects, setJoinedObjects] = useState<ObjectType[]>([])
    const [data, setData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
    const [reportName, setReportName] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    // --- Helpers ---

    const getNestedValue = (obj: any, path: string) => {
        if (!obj) return null;
        const isOrderRelated = path.includes('OrderedBook') || path.includes('items') || path.includes('order');
        if (isOrderRelated) {
            const booksArray = obj.OrderedBook || obj.orderedBook || obj.items || obj.OrderedItems || obj.OrderItems || [];
            if (path.endsWith('.count')) return booksArray.length;
            if (path.includes('title') || path.includes('Book')) {
                const getTitles = (items: any[]) => items.map((b: any) => b.Book?.title || b.book?.title || b.title || b.bookTitle || "N/A").filter(t => t !== "N/A").join(", ");
                if (Array.isArray(booksArray)) return getTitles(booksArray) || "N/A";
            }
        }
        if (Array.isArray(obj)) return obj.map(o => getNestedValue(o, path)).filter(Boolean).join(", ");
        const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
        if (Array.isArray(value)) return value.join(", ");
        return value;
    }

    const allAvailableFields = useMemo(() => {
        if (!baseObject) return []
        let fields = [...SCHEMA[baseObject].fields]
        joinedObjects.forEach(obj => {
            const joinedFields = SCHEMA[obj].fields.map(f => ({ ...f, label: `${SCHEMA[obj].label}: ${f.label}`, id: `${obj}_${f.id}` }))
            fields = [...fields, ...joinedFields]
        })
        return fields
    }, [baseObject, joinedObjects])

    // --- Actions ---

    const handleSaveReport = async (saveData: boolean = false) => {
        if (!reportName.trim() || !baseObject) return
        setIsSaving(true)
        try {
            await reportsApi.create({
                name: reportName,
                configuration: {
                    baseObject,
                    selectedFields,
                    joinedObjects,
                    isStatic: saveData,
                    savedData: saveData ? data.slice(0, 1000).map(item => {
                        const row: any = {}
                        selectedFields.forEach(fId => {
                            const field = allAvailableFields.find(f => f.id === fId)
                            if (field) {
                                if (field.source !== baseObject) {
                                    const joinedItem = item[`__joined_${field.source}`]
                                    row[fId] = joinedItem ? getNestedValue(joinedItem, field.path) : "N/A"
                                } else {
                                    row[fId] = getNestedValue(item, field.path)
                                }
                                row[`__label_${fId}`] = field.label
                            }
                        })
                        return row
                    }) : null,
                    savedAt: new Date().toISOString()
                }
            })
            toast({ title: "Success", description: "Report saved successfully" })
            router.push("/agt-panel/admin/reports")
        } catch (error) {
            toast({ title: "Error", description: "Failed to save report", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleObjectSelect = (obj: ObjectType) => {
        setBaseObject(obj)
        setSelectedFields(SCHEMA[obj].fields.slice(0, 4).map(f => f.id))
        setStep(2)
    }

    const toggleField = (fieldId: string) => {
        setSelectedFields(prev => prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId])
    }

    const toggleJoin = (obj: ObjectType) => {
        setJoinedObjects(prev => {
            if (prev.includes(obj)) {
                setSelectedFields(s => s.filter(id => !id.startsWith(`${obj}_`)))
                return prev.filter(o => o !== obj)
            } else {
                return [...prev, obj]
            }
        })
    }

    const fetchReportData = async () => {
        if (!baseObject) return
        setIsLoading(true)
        try {
            const fetchBase = async (type: ObjectType) => {
                const resp = await (type === "books" ? booksApi.getAll({ limit: 1000 }) : type === "orders" ? ordersApi.getAll({ limit: 1000 }) : readersApi.getAll({ limit: 1000 }));
                if (Array.isArray(resp)) return resp;
                const potentialData = (resp as any)[type] || (resp as any).data || (resp as any).items || (resp as any).results;
                return Array.isArray(potentialData) ? potentialData : Object.values(resp as object).find(val => Array.isArray(val)) || [];
            }
            const baseData = await fetchBase(baseObject)
            let finalData = [...baseData]
            for (const objType of joinedObjects) {
                const rel = RELATIONSHIPS.find(r => r.from === baseObject && r.to === objType)
                if (rel) {
                    const joinedData = await fetchBase(objType)
                    finalData = finalData.map(item => {
                        const joinVal = item[rel.key]
                        const related = rel.type === '1:1' ? joinedData.find(j => String(j[rel.joinField]) === String(joinVal)) : joinedData.filter(j => String(j[rel.joinField]) === String(joinVal));
                        return { ...item, [`__joined_${objType}`]: related }
                    })
                }
            }
            setData(finalData)
            setStep(3)
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = () => {
        if (data.length === 0) return
        const exportData = data.map(item => {
            const row: Record<string, any> = {}
            selectedFields.forEach(fId => {
                const fieldConfig = allAvailableFields.find(f => f.id === fId)
                if (fieldConfig) {
                    const val = fieldConfig.source !== baseObject ? getNestedValue(item[`__joined_${fieldConfig.source}`], fieldConfig.path) : getNestedValue(item, fieldConfig.path);
                    row[fieldConfig.label] = val
                }
            })
            return row
        })
        exportToCSV(exportData, `Report_${baseObject}`)
    }

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : router.push("/agt-panel/admin/reports")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Report Builder</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {step === 1 ? "Select the primary object for your report." : step === 2 ? "Pick columns and link related data." : "Review and save your generated report."}
                        </p>
                    </div>
                </div>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(Object.entries(SCHEMA) as [ObjectType, any][]).map(([key, config]) => (
                        <Card key={key} className="cursor-pointer hover:border-primary transition-colors border-muted shadow-sm" onClick={() => handleObjectSelect(key)}>
                            <CardHeader>
                                <div className="p-3 rounded-lg bg-primary/10 w-fit text-primary mb-2">
                                    <config.icon size={24} />
                                </div>
                                <CardTitle>{config.label}</CardTitle>
                                <CardDescription>Reports from {config.label.toLowerCase()} records.</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button variant="ghost" className="w-full justify-between">
                                    Select Object <ArrowRight size={16} />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {step === 2 && baseObject && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-8">
                        <section className="space-y-4">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <TableIcon size={14} /> {SCHEMA[baseObject].label} Columns
                            </h3>
                            <div className="grid gap-2 border rounded-lg p-4 bg-muted/30">
                                {SCHEMA[baseObject].fields.map(field => (
                                    <div key={field.id} className="flex items-center space-x-3">
                                        <Checkbox id={field.id} checked={selectedFields.includes(field.id)} onCheckedChange={() => toggleField(field.id)} />
                                        <Label htmlFor={field.id} className="text-sm cursor-pointer">{field.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {RELATIONSHIPS.filter(r => r.from === baseObject).map(rel => (
                            <section key={rel.to} className="space-y-4">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Layers size={14} /> {rel.label}
                                </h3>
                                <div className="space-y-4">
                                    <Button variant={joinedObjects.includes(rel.to) ? "default" : "outline"} className="w-full justify-between" onClick={() => toggleJoin(rel.to)}>
                                        Link {SCHEMA[rel.to].label} Data <Plus size={16} className={cn(joinedObjects.includes(rel.to) && "rotate-45")} />
                                    </Button>
                                    {joinedObjects.includes(rel.to) && (
                                        <div className="grid gap-2 border rounded-lg p-4 bg-muted/30">
                                            {SCHEMA[rel.to].fields.map(field => {
                                                const fId = `${rel.to}_${field.id}`
                                                return (
                                                    <div key={fId} className="flex items-center space-x-3">
                                                        <Checkbox id={fId} checked={selectedFields.includes(fId)} onCheckedChange={() => toggleField(fId)} />
                                                        <Label htmlFor={fId} className="text-sm cursor-pointer">{field.label}</Label>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>

                    <div className="lg:col-span-8">
                        <Card className="shadow-sm border-muted">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-lg">Selected Columns ({selectedFields.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-wrap gap-2">
                                    {selectedFields.map(fId => (
                                        <Badge key={fId} variant="secondary" className="px-3 py-1.5 flex gap-2">
                                            {allAvailableFields.find(f => f.id === fId)?.label}
                                            <button onClick={() => toggleField(fId)}><X size={12} /></button>
                                        </Badge>
                                    ))}
                                    {selectedFields.length === 0 && <p className="text-sm text-muted-foreground">No columns selected.</p>}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                <Button disabled={selectedFields.length === 0 || isLoading} onClick={fetchReportData}>
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />} Preview Report
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                            <Check className="text-emerald-600 bg-emerald-50 rounded-full p-1" />
                            <span className="font-bold">Report Preview Ready</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setStep(2)}>Modify Columns</Button>
                            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                                <DialogTrigger asChild><Button size="sm"><Save className="mr-2 h-4 w-4" /> Save Data Snapshot</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Name this Snapshot</DialogTitle></DialogHeader>
                                    <div className="py-4"><Label>Report Name</Label><Input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="e.g. Monthly Readers" /></div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => handleSaveReport(false)} disabled={isSaving || !reportName}>Save as Template</Button>
                                        <Button onClick={() => handleSaveReport(true)} disabled={isSaving || !reportName}>Save with Data</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                        </div>
                    </div>

                    <Card className="shadow-sm border-muted overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {selectedFields.map(fId => <TableHead key={fId} className="font-bold">{allAvailableFields.find(f => f.id === fId)?.label}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.slice(0, 50).map((item, idx) => (
                                    <TableRow key={idx}>
                                        {selectedFields.map(fId => {
                                            const f = allAvailableFields.find(f => f.id === fId)
                                            const val = f?.source !== baseObject ? getNestedValue(item[`__joined_${f?.source}`], f?.path || '') : getNestedValue(item, f?.path || '');
                                            return <TableCell key={fId}>{String(val ?? "N/A")}</TableCell>
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}
        </div>
    )
}
