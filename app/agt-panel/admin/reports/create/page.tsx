"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
    Download, Loader2, Plus, ArrowRight, Check, X,
    ChevronRight, Layers, Table as TableIcon, Save, ArrowLeft,
    Database, Link2, Eye, FileSpreadsheet, FileText,
    BarChart2, RefreshCw, Search, ChevronDown, AlertCircle,
    Hash, Type, Calendar, ToggleLeft, Columns, Filter, Edit
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/agt-panel/components/ui/card"
import { Button } from "@/agt-panel/components/ui/button"
import { useToast } from "@/agt-panel/components/ui/use-toast"
import { reportsApi } from "@/agt-panel/lib/api-client"
import { Separator } from "@/agt-panel/components/ui/separator"
import { Badge } from "@/agt-panel/components/ui/badge"
import { Input } from "@/agt-panel/components/ui/input"
import { Label } from "@/agt-panel/components/ui/label"
import { Checkbox } from "@/agt-panel/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/agt-panel/components/ui/table"
import { cn } from "@/agt-panel/lib/utils"
import { ScrollArea, ScrollBar } from "@/agt-panel/components/ui/scroll-area"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/agt-panel/components/ui/dialog"
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/agt-panel/components/ui/tooltip"
import {
    Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/agt-panel/components/ui/collapsible"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/agt-panel/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/agt-panel/components/ui/select"
import { useRouter } from "next/navigation"

// ─── Types ───────────────────────────────────────────────────────────────────

interface DBColumn {
    id: string           // "table__column"
    name: string
    label: string
    type: "string" | "number" | "boolean" | "date"
    pgType: string
    isPrimaryKey: boolean
    nullable: boolean
}

interface DBTable {
    name: string
    label: string
    rowCount: number
    columns: DBColumn[]
}

interface DBRelationship {
    fromTable: string
    fromColumn: string
    toTable: string
    toColumn: string
    label: string
}

interface SelectedColumn {
    table: string
    column: string
    alias: string
    label: string
    type: DBColumn["type"]
    aggregation?: "count" | "sum" | "avg" | "min" | "max"
}

interface ReportFilter {
    table: string
    column: string
    operator: string
    value: any
    label: string
}

interface ActiveJoin {
    fromTable: string
    fromColumn: string
    toTable: string
    toColumn: string
}

// ─── API helpers ─────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://agt-api.adhyatmparivar.com";
// const BASE = "http://localhost:3000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error ?? res.statusText)
    }
    return res.json()
}

// ─── Tiny helpers ────────────────────────────────────────────────────────────

const TYPE_ICON: Record<DBColumn["type"], React.ReactNode> = {
    number: <Hash className="h-3 w-3 text-blue-500" />,
    string: <Type className="h-3 w-3 text-green-500" />,
    date: <Calendar className="h-3 w-3 text-orange-500" />,
    boolean: <ToggleLeft className="h-3 w-3 text-purple-500" />,
}

const TABLE_COLORS = [
    "border-blue-500/40 bg-blue-500/5",
    "border-emerald-500/40 bg-emerald-500/5",
    "border-amber-500/40 bg-amber-500/5",
    "border-rose-500/40 bg-rose-500/5",
    "border-violet-500/40 bg-violet-500/5",
    "border-cyan-500/40 bg-cyan-500/5",
]

function tableColor(idx: number) { return TABLE_COLORS[idx % TABLE_COLORS.length] }

function fmtCount(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CreateReportPage() {
    const router = useRouter()
    const { toast } = useToast()

    // ── Schema state ──
    const [tables, setTables] = useState<DBTable[]>([])
    const [relationships, setRelationships] = useState<DBRelationship[]>([])
    const [schemaLoading, setSchemaLoading] = useState(true)
    const [schemaError, setSchemaError] = useState<string | null>(null)

    // ── Report builder state ──
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [baseTable, setBaseTable] = useState<DBTable | null>(null)
    const [selectedCols, setSelectedCols] = useState<SelectedColumn[]>([])
    const [activeJoins, setActiveJoins] = useState<ActiveJoin[]>([])
    const [searchCols, setSearchCols] = useState("")
    const [reportFilters, setReportFilters] = useState<ReportFilter[]>([])
    const [groupBy, setGroupBy] = useState<{ table: string, column: string }[]>([])

    // ── Preview / data state ──
    const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([])
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewSearchQuery, setPreviewSearchQuery] = useState("")
    const [previewFilters, setPreviewFilters] = useState<Record<string, string>>({})
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

    // ── Save state ──
    const [saveOpen, setSaveOpen] = useState(false)
    const [reportName, setReportName] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    // ── Export ──
    const [isExporting, setIsExporting] = useState(false)

    const getActiveFilterCount = () => {
        return Object.values(previewFilters).filter(v => v !== "").length
    }

    const applyFilters = useCallback((rows: any[]) => {
        return rows.filter((item: any) => {
            // Search filter
            if (previewSearchQuery) {
                const query = previewSearchQuery.toLowerCase()
                const matchesSearch = Object.values(item).some(val =>
                    String(val).toLowerCase().includes(query)
                )
                if (!matchesSearch) return false
            }

            // Dynamic filters based on column alias
            for (const [alias, filterValue] of Object.entries(previewFilters)) {
                if (!filterValue) continue
                const itemValue = String(item[alias] ?? "").toLowerCase()
                if (!itemValue.includes(filterValue.toLowerCase())) {
                    return false
                }
            }

            return true
        })
    }, [previewSearchQuery, previewFilters])

    const filteredPreviewRows = useMemo(() => applyFilters(previewRows), [previewRows, applyFilters])

    // ── Table search on step 1 ──
    const [tableSearch, setTableSearch] = useState("")

    // ─── Load schema on mount ────────────────────────────────────────────────

    const loadSchema = useCallback(async () => {
        setSchemaLoading(true)
        setSchemaError(null)
        try {
            const [tbls, rels] = await Promise.all([
                apiFetch<DBTable[]>("/api/schema/tables"),
                apiFetch<DBRelationship[]>("/api/schema/relationships"),
            ])
            setTables(tbls)
            setRelationships(rels)
        } catch (e: any) {
            setSchemaError(e.message)
            toast({ title: "Schema Error", description: e.message, variant: "destructive" })
        } finally {
            setSchemaLoading(false)
        }
    }, [toast])

    useEffect(() => { loadSchema() }, [loadSchema])

    // ─── Derived data ────────────────────────────────────────────────────────

    /** Tables that can be joined FROM any currently included table */
    const joinableTables = useMemo(() => {
        if (!baseTable) return []
        const includedTableNames = new Set<string>([baseTable.name, ...activeJoins.map(j => j.toTable)])

        return tables.filter(t => {
            // Must not be already included
            if (includedTableNames.has(t.name)) return false

            // Must have a relationship to ANY included table
            return relationships.some(r =>
                (includedTableNames.has(r.fromTable) && r.toTable === t.name) ||
                (includedTableNames.has(r.toTable) && r.fromTable === t.name)
            )
        })
    }, [baseTable, activeJoins, tables, relationships])

    /** Find the FK relationship between a target table and ANY table currently in the report */
    function findRelationship(targetTableName: string): DBRelationship | undefined {
        if (!baseTable) return undefined
        const includedTableNames = [baseTable.name, ...activeJoins.map(j => j.toTable)]

        // Prefer joins from the base table if possible, otherwise any included table
        return relationships.find(r =>
            (includedTableNames.includes(r.fromTable) && r.toTable === targetTableName) ||
            (includedTableNames.includes(r.toTable) && r.fromTable === targetTableName)
        )
    }

    /** All columns available for selection (base + joined tables) */
    const availableCols = useMemo(() => {
        const joinedTableNames = activeJoins.map(j => j.toTable)
        const joinedTables = tables.filter(t => joinedTableNames.includes(t.name))
        const allTbls = baseTable ? [baseTable, ...joinedTables] : []
        let cols: (DBColumn & { tableName: string; tableLabel: string })[] = []
        allTbls.forEach(t => {
            t.columns.forEach(c => cols.push({ ...c, tableName: t.name, tableLabel: t.label }))
        })
        if (searchCols.trim()) {
            const q = searchCols.toLowerCase()
            cols = cols.filter(c => c.label.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.tableName.toLowerCase().includes(q))
        }
        return cols
    }, [baseTable, activeJoins, tables, searchCols])

    const isColSelected = (tableName: string, colName: string) =>
        selectedCols.some(c => c.table === tableName && c.column === colName)

    // ─── Actions ─────────────────────────────────────────────────────────────

    function handleSelectBaseTable(tbl: DBTable) {
        setBaseTable(tbl)
        setActiveJoins([])
        // Auto-select first 5 non-FK columns
        const autoSelected: SelectedColumn[] = tbl.columns.slice(0, 5).map(c => ({
            table: tbl.name, column: c.name,
            alias: `${tbl.name}__${c.name}`,
            label: `${tbl.label}: ${c.label}`,
            type: c.type,
        }))
        setSelectedCols(autoSelected)
        setStep(2)
    }

    function toggleColumn(tableName: string, tableLabel: string, col: DBColumn) {
        setSelectedCols(prev => {
            const exists = prev.some(c => c.table === tableName && c.column === col.name)
            if (exists) return prev.filter(c => !(c.table === tableName && c.column === col.name))
            return [...prev, {
                table: tableName,
                column: col.name,
                alias: `${tableName}__${col.name}`,
                label: `${tableLabel}: ${col.label}`,
                type: col.type,
            }]
        })
    }

    function toggleJoin(joinedTable: DBTable) {
        if (!baseTable) return;

        setActiveJoins(prev => {
            const exists = prev.some(j => j.toTable === joinedTable.name)
            if (exists) {
                // Recursive removal: remove this join AND any joins that depend on it
                const toRemove = new Set<string>([joinedTable.name])
                let changed = true
                while (changed) {
                    changed = false
                    prev.forEach(j => {
                        if (toRemove.has(j.fromTable) && !toRemove.has(j.toTable)) {
                            toRemove.add(j.toTable)
                            changed = true
                        }
                    })
                }

                setSelectedCols(s => s.filter(c => !toRemove.has(c.table)))
                return prev.filter(j => !toRemove.has(j.toTable))
            }

            // Add join ... (rest of the logic)
            const includedTableNames = [baseTable.name, ...prev.map(j => j.toTable)]
            const sourceTable = includedTableNames.find(tn =>
                relationships.some(r =>
                    (r.fromTable === tn && r.toTable === joinedTable.name) ||
                    (r.toTable === tn && r.fromTable === joinedTable.name)
                )
            )

            if (!sourceTable) return prev

            const actualRel = relationships.find(r =>
                (r.fromTable === sourceTable && r.toTable === joinedTable.name) ||
                (r.toTable === sourceTable && r.fromTable === joinedTable.name)
            )

            if (!actualRel) return prev

            const join: ActiveJoin = actualRel.fromTable === sourceTable
                ? { fromTable: actualRel.fromTable, fromColumn: actualRel.fromColumn, toTable: actualRel.toTable, toColumn: actualRel.toColumn }
                : { fromTable: actualRel.toTable, fromColumn: actualRel.toColumn, toTable: actualRel.fromTable, toColumn: actualRel.fromColumn }

            return [...prev, join]
        })
    }

    function isTableJoined(tblName: string) {
        return activeJoins.some(j => j.toTable === tblName || j.fromTable === tblName)
    }

    async function handlePreview() {
        if (!baseTable || selectedCols.length === 0) return
        setPreviewLoading(true)
        try {
            const body = {
                baseTable: baseTable.name,
                selectedColumns: selectedCols.map(c => ({ 
                    table: c.table, 
                    column: c.column, 
                    alias: c.alias,
                    aggregation: c.aggregation 
                })),
                joins: activeJoins,
                filters: reportFilters.map(f => ({
                    table: f.table,
                    column: f.column,
                    operator: f.operator,
                    value: f.value
                })),
                groupBy: groupBy,
                limit: 100,
            }
            const res = await apiFetch<{ rows: Record<string, any>[] }>("/api/schema/preview", {
                method: "POST",
                body: JSON.stringify(body),
            })
            setPreviewRows(res.rows)
            setStep(3)
        } catch (e: any) {
            toast({ title: "Preview failed", description: e.message, variant: "destructive" })
        } finally {
            setPreviewLoading(false)
        }
    }

    async function handleExportCSV() {
        if (!baseTable) return
        setIsExporting(true)
        try {
            const body = {
                baseTable: baseTable.name,
                selectedColumns: selectedCols.map(c => ({ 
                    table: c.table, 
                    column: c.column, 
                    alias: c.alias,
                    aggregation: c.aggregation 
                })),
                joins: activeJoins,
                filters: reportFilters.map(f => ({
                    table: f.table,
                    column: f.column,
                    operator: f.operator,
                    value: f.value
                })),
                groupBy,
            }
            const res = await apiFetch<{ rows: Record<string, any>[] }>("/api/schema/export", {
                method: "POST",
                body: JSON.stringify(body),
            })

            // Build CSV client-side
            const filteredResults = applyFilters(res.rows)
            const headers = selectedCols.map(c => c.label)
            const aliasMap = Object.fromEntries(selectedCols.map(c => [c.alias, c.label]))
            const csvRows = filteredResults.map(row =>
                selectedCols.map(c => {
                    const val = row[c.alias] ?? ""
                    const str = String(val).replace(/"/g, '""')
                    return `"${str}"`
                }).join(",")
            )
            const csvContent = [headers.join(","), ...csvRows].join("\n")
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `report_${baseTable.name}_${Date.now()}.csv`
            a.click()
            URL.revokeObjectURL(url)
            toast({ title: "Export ready", description: `${filteredResults.length} rows downloaded.` })
        } catch (e: any) {
            toast({ title: "Export failed", description: e.message, variant: "destructive" })
        } finally {
            setIsExporting(false)
        }
    }

    async function handleExportExcel() {
        if (!baseTable) return
        setIsExporting(true)
        try {
            // Dynamic import to avoid SSR issues
            const XLSX = await import("xlsx")
            const body = {
                baseTable: baseTable.name,
                selectedColumns: selectedCols.map(c => ({ 
                    table: c.table, 
                    column: c.column, 
                    alias: c.alias,
                    aggregation: c.aggregation 
                })),
                joins: activeJoins,
                filters: reportFilters.map(f => ({
                    table: f.table,
                    column: f.column,
                    operator: f.operator,
                    value: f.value
                })),
                groupBy,
            }
            const res = await apiFetch<{ rows: Record<string, any>[] }>("/api/schema/export", {
                method: "POST",
                body: JSON.stringify(body),
            })
            const filteredResults = applyFilters(res.rows)
            const sheetData = filteredResults.map(row =>
                Object.fromEntries(selectedCols.map(c => [c.label, row[c.alias] ?? ""]))
            )
            const ws = XLSX.utils.json_to_sheet(sheetData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, baseTable.label)
            XLSX.writeFile(wb, `report_${baseTable.name}_${Date.now()}.xlsx`)
            toast({ title: "Excel ready", description: `${filteredResults.length} rows exported.` })
        } catch (e: any) {
            toast({ title: "Excel export failed", description: e.message, variant: "destructive" })
        } finally {
            setIsExporting(false)
        }
    }

    async function handleSaveReport(withData: boolean) {
        if (!reportName.trim() || !baseTable) return
        setIsSaving(true)
        try {
            const configuration: any = {
                baseTable: baseTable.name,
                baseTableLabel: baseTable.label,
                selectedColumns: selectedCols,
                joins: activeJoins,
                filters: reportFilters,
                groupBy: groupBy,
                isDynamic: !withData,
                createdAt: new Date().toISOString(),
            }
            if (withData) {
                configuration.savedData = filteredPreviewRows
                configuration.savedAt = new Date().toISOString()
            }
            await reportsApi.create({ name: reportName, configuration })
            toast({ title: "Report saved!", description: reportName })
            router.push("/agt-panel/admin/reports")
        } catch (e: any) {
            toast({ title: "Save failed", description: e.message, variant: "destructive" })
        } finally {
            setIsSaving(false)
            setSaveOpen(false)
        }
    }

    // ─── Render helpers ───────────────────────────────────────────────────────

    const filteredTables = useMemo(() =>
        tables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
            t.label.toLowerCase().includes(tableSearch.toLowerCase())),
        [tables, tableSearch]
    )

    const chartConfig = useMemo(() => {
        if (previewRows.length === 0 || selectedCols.length === 0) return null;
        // Don't use book_code for charting if possible
        const stringCol = selectedCols.find(c => c.type === "string" && !c.column.toLowerCase().includes("book_code") && !c.column.toLowerCase().includes("bookcode"))?.alias
            || selectedCols.find(c => c.type === "string")?.alias;

        const numberCol = selectedCols.find(c => c.type === "number" && !c.column.toLowerCase().includes("book_code") && !c.column.toLowerCase().includes("bookcode"))?.alias;

        if (!stringCol) return null; // Need grouping

        const dataMap: Record<string, number> = {};
        previewRows.forEach(r => {
            const key = String(r[stringCol] || "Unknown");
            const val = numberCol ? Number(r[numberCol] || 0) : 1;
            dataMap[key] = (dataMap[key] || 0) + val;
        });

        const data = Object.entries(dataMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15); // Top 15 to avoid crowding

        return {
            data,
            xAxisKey: stringCol,
            yAxisKey: numberCol || "Count",
            xLabel: selectedCols.find(c => c.alias === stringCol)?.label || stringCol,
            yLabel: numberCol ? selectedCols.find(c => c.alias === numberCol)?.label : "Record Count",
        };
    }, [previewRows, selectedCols]);

// ─── Filter Form Component ────────────────────────────────────────────────
function FilterForm({ tables, onAdd }: { tables: (DBTable | null)[], onAdd: (f: ReportFilter) => void }) {
    const [selectedTable, setSelectedTable] = useState<string>("")
    const [selectedColumn, setSelectedColumn] = useState<string>("")
    const [operator, setOperator] = useState("=")
    const [value, setValue] = useState("")

    const currentTable = tables.find(t => t?.name === selectedTable)
    const currentColumn = currentTable?.columns.find(c => c.name === selectedColumn)

    const handleSubmit = () => {
        if (!selectedTable || !selectedColumn) return
        onAdd({
            table: selectedTable,
            column: selectedColumn,
            operator,
            value,
            label: `${currentTable?.label}: ${currentColumn?.label}`
        })
        // Reset
        setSelectedColumn("")
        setValue("")
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label className="text-xs">Table</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                        {tables.map(t => t ? (
                            <SelectItem key={t.name} value={t.name}>{t.label}</SelectItem>
                        ) : null)}
                    </SelectContent>
                </Select>
            </div>

            {selectedTable && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-xs">Column</Label>
                    <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                            {currentTable?.columns.map(c => (
                                <SelectItem key={c.name} value={c.name}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs">Operator</Label>
                    <Select value={operator} onValueChange={setOperator}>
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="=">Equals (=)</SelectItem>
                            <SelectItem value="!=">Not Equals (!=)</SelectItem>
                            <SelectItem value="LIKE">Contains (LIKE)</SelectItem>
                            <SelectItem value="ILIKE">Contains Case Insensitive (ILIKE)</SelectItem>
                            <SelectItem value=">">Greater than (&gt;)</SelectItem>
                            <SelectItem value="<">Less than (&lt;)</SelectItem>
                            <SelectItem value=">=">Greater or Equal (&ge;)</SelectItem>
                            <SelectItem value="<=">Less or Equal (&le;)</SelectItem>
                            <SelectItem value="IS NULL">Is Null</SelectItem>
                            <SelectItem value="IS NOT NULL">Is Not Null</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">Value</Label>
                    <Input 
                        className="h-9 text-xs" 
                        value={value} 
                        onChange={e => setValue(e.target.value)} 
                        disabled={operator.includes("NULL")}
                    />
                </div>
            </div>

            <DialogFooter>
                <Button onClick={handleSubmit} disabled={!selectedTable || !selectedColumn} className="w-full">
                    Add Filter
                </Button>
            </DialogFooter>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════
    return (
        <TooltipProvider>
            <div className="container mx-auto px-4 py-6 max-w-7xl">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() =>
                            step > 1 ? setStep((step - 1) as any) : router.push("/agt-panel/admin/reports")
                        }>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Dynamic Report Builder</h1>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                {step === 1 && "Select a base table — schema auto-detected from your database"}
                                {step === 2 && `Configuring report on · ${baseTable?.label}`}
                                {step === 3 && "Preview complete — review, export, or save"}
                            </p>
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 text-sm">
                        {[
                            { n: 1, label: "Choose Table" },
                            { n: 2, label: "Select Columns" },
                            { n: 3, label: "Preview & Export" },
                        ].map(({ n, label }, i) => (
                            <div key={n} className="flex items-center gap-2">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border",
                                    step === n ? "bg-primary text-primary-foreground border-primary"
                                        : step > n ? "bg-emerald-500 text-white border-emerald-500"
                                            : "bg-muted text-muted-foreground border-border"
                                )}>
                                    {step > n ? <Check className="h-3 w-3" /> : n}
                                </div>
                                <span className={cn("hidden sm:block text-xs",
                                    step === n ? "text-foreground font-medium" : "text-muted-foreground"
                                )}>{label}</span>
                                {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════
                STEP 1 — Choose base table
            ══════════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div className="space-y-6">
                        {/* Schema error */}
                        {schemaError && (
                            <Card className="border-destructive bg-destructive/5">
                                <CardContent className="flex items-center gap-3 pt-5 pb-5">
                                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium text-destructive">Failed to load schema</p>
                                        <p className="text-sm text-muted-foreground">{schemaError}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={loadSchema}>
                                        <RefreshCw className="h-3 w-3 mr-1" /> Retry
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Search + Refresh */}
                        <div className="flex gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tables..."
                                    className="pl-9"
                                    value={tableSearch}
                                    onChange={e => setTableSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={loadSchema} disabled={schemaLoading}>
                                <RefreshCw className={cn("h-4 w-4", schemaLoading && "animate-spin")} />
                            </Button>
                        </div>

                        {/* Summary bar */}
                        {!schemaLoading && !schemaError && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Database className="h-3.5 w-3.5" />
                                    <strong className="text-foreground">{tables.length}</strong> tables detected
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Link2 className="h-3.5 w-3.5" />
                                    <strong className="text-foreground">{relationships.length}</strong> relationships
                                </span>
                            </div>
                        )}

                        {/* Table grid */}
                        {schemaLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader className="pb-2">
                                            <div className="h-8 w-8 rounded-lg bg-muted mb-2" />
                                            <div className="h-4 w-32 bg-muted rounded" />
                                            <div className="h-3 w-24 bg-muted rounded mt-1" />
                                        </CardHeader>
                                        <CardFooter><div className="h-8 w-full bg-muted rounded" /></CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTables.map((tbl, idx) => {
                                    const relCount = relationships.filter(
                                        r => r.fromTable === tbl.name || r.toTable === tbl.name
                                    ).length
                                    return (
                                        <Card
                                            key={tbl.name}
                                            className={cn(
                                                "cursor-pointer border-2 hover:border-primary/60 hover:shadow-md transition-all duration-200 group",
                                                tableColor(idx)
                                            )}
                                            onClick={() => handleSelectBaseTable(tbl)}
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="p-2.5 rounded-lg bg-background/80 border">
                                                        <Database className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs font-mono">
                                                        {fmtCount(tbl.rowCount)} rows
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors">
                                                    {tbl.label}
                                                </CardTitle>
                                                <CardDescription className="font-mono text-xs">{tbl.name}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0 pb-3">
                                                <div className="flex gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Columns className="h-3 w-3" /> {tbl.columns.length} columns
                                                    </span>
                                                    {relCount > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {relationships
                                                                .filter(r => r.fromTable === tbl.name || r.toTable === tbl.name)
                                                                .map(r => {
                                                                    const targetName = r.fromTable === tbl.name ? r.toTable : r.fromTable;
                                                                    const targetTbl = tables.find(t => t.name === targetName);
                                                                    return targetTbl ? (
                                                                        <Badge key={targetName} variant="outline" className="text-[9px] px-1 py-0 opacity-70">
                                                                            {targetTbl.label}
                                                                        </Badge>
                                                                    ) : null;
                                                                })
                                                                .slice(0, 3)}
                                                            {relCount > 3 && <span className="text-[9px] text-muted-foreground">+{relCount - 3} more</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-0">
                                                <Button variant="ghost" className="w-full justify-between text-xs h-8 group-hover:bg-primary/10 transition-colors">
                                                    Build report <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}
                                {filteredTables.length === 0 && !schemaLoading && (
                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                        <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p>No tables found matching "{tableSearch}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                STEP 2 — Select columns & joins
            ══════════════════════════════════════════════════════════════ */}
                {step === 2 && baseTable && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* ── LEFT: Joins + Column picker ── */}
                        <div className="lg:col-span-5 space-y-5">

                            {/* Join Related Tables */}
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader className="pb-3 px-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Link2 className="h-4 w-4" />
                                            Linked Tables
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-background text-[10px]">{joinableTables.length} Discoverable</Badge>
                                    </div>
                                    <CardDescription className="text-[10px] uppercase font-black tracking-widest leading-none mt-1 opacity-60">
                                        Chain tables to combine data
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-3 pb-3 pt-0">
                                    <div className="space-y-1.5">
                                        {joinableTables.length === 0 && (
                                            <p className="text-[10px] text-center text-muted-foreground p-4 italic">
                                                No more linkable tables found.
                                            </p>
                                        )}
                                        {joinableTables.map((jt) => {
                                            const rel = findRelationship(jt.name)
                                            return (
                                                <div
                                                    key={jt.name}
                                                    className="flex items-center justify-between p-2 rounded-lg bg-background border hover:border-primary transition-all cursor-pointer group"
                                                    onClick={() => toggleJoin(jt)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                                            <Plus size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black leading-none">{jt.label}</p>
                                                            {rel && (
                                                                <p className="text-[9px] text-muted-foreground font-mono mt-1">
                                                                    via {rel.fromTable}.{rel.fromColumn}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground">{jt.rowCount} Rows</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Active Links Visualization */}
                            {activeJoins.length > 0 && (
                                <div className="space-y-1.5 px-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                                        <Check size={10} /> Active Links
                                    </p>
                                    {activeJoins.map((j) => (
                                        <div key={j.toTable} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <Link2 size={12} className="text-emerald-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black uppercase truncate leading-none">{j.toTable}</p>
                                                <p className="text-[8px] text-muted-foreground uppercase leading-none mt-1">Join: {j.fromTable}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 hover:text-red-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleJoin(tables.find(t => t.name === j.toTable)!);
                                                }}
                                            >
                                                <X size={10} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Column picker */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Columns className="h-4 w-4 text-primary" />
                                        Available Columns
                                        <Badge variant="secondary" className="text-xs">{availableCols.length}</Badge>
                                    </CardTitle>
                                    <div className="relative mt-1">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Filter columns..."
                                            className="pl-8 h-8 text-xs"
                                            value={searchCols}
                                            onChange={e => setSearchCols(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <ScrollArea className="h-72 pr-2">
                                        {/* Group by table */}
                                        {[baseTable, ...tables.filter(t => isTableJoined(t.name))].map((tbl, ti) => {
                                            const cols = availableCols.filter(c => c.tableName === tbl.name)
                                            if (cols.length === 0) return null
                                            return (
                                                <Collapsible key={tbl.name} defaultOpen={ti === 0}>
                                                    <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 px-1 hover:bg-muted/50 rounded text-xs font-semibold text-muted-foreground uppercase tracking-wider group">
                                                        <span className="flex items-center gap-1.5">
                                                            <TableIcon className="h-3 w-3" /> {tbl.label}
                                                        </span>
                                                        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="space-y-0.5 mb-2">
                                                            {cols.map(col => (
                                                                <div
                                                                    key={col.id}
                                                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer"
                                                                    onClick={() => toggleColumn(col.tableName, col.tableLabel, col)}
                                                                >
                                                                    <Checkbox
                                                                        checked={isColSelected(col.tableName, col.name)}
                                                                        onCheckedChange={() => toggleColumn(col.tableName, col.tableLabel, col)}
                                                                        className="pointer-events-none"
                                                                    />
                                                                    <span className="shrink-0">{TYPE_ICON[col.type]}</span>
                                                                    <span className="text-xs flex-1 truncate">{col.label}</span>
                                                                    {col.isPrimaryKey && (
                                                                        <Badge variant="outline" className="text-[9px] px-1 py-0">PK</Badge>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            )
                                        })}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── RIGHT: Selected columns + action ── */}
                        <div className="lg:col-span-7 space-y-5">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-primary" />
                                            Report Columns
                                            <Badge className="text-xs">{selectedCols.length}</Badge>
                                        </CardTitle>
                                        {selectedCols.length > 0 && (
                                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedCols([])}>
                                                Clear all
                                            </Button>
                                        )}
                                    </div>
                                    <CardDescription className="text-xs">
                                        Drag to reorder · click × to remove
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {selectedCols.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <Columns className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No columns selected yet</p>
                                            <p className="text-xs mt-1">Choose from the left panel</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedCols.map((col, idx) => (
                                                <div key={col.alias} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border group">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <span className="shrink-0">{TYPE_ICON[col.type]}</span>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-bold truncate">{col.label}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate uppercase">{col.table}:{col.column}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Aggregation Selector */}
                                                    <Select 
                                                        value={col.aggregation || "none"} 
                                                        onValueChange={(val) => {
                                                            setSelectedCols(prev => prev.map(c => 
                                                                c.alias === col.alias ? { ...c, aggregation: val === "none" ? undefined : val as any } : c
                                                            ))
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-7 w-[100px] text-[10px] py-0 px-2">
                                                            <SelectValue placeholder="Agg" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none" className="text-[10px]">None</SelectItem>
                                                            <SelectItem value="count" className="text-[10px]">Count</SelectItem>
                                                            {col.type === "number" && (
                                                                <>
                                                                    <SelectItem value="sum" className="text-[10px]">Sum</SelectItem>
                                                                    <SelectItem value="avg" className="text-[10px]">Avg</SelectItem>
                                                                </>
                                                            )}
                                                            <SelectItem value="min" className="text-[10px]">Min</SelectItem>
                                                            <SelectItem value="max" className="text-[10px]">Max</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Group By Toggle */}
                                                    <Button 
                                                        variant={groupBy.some(g => g.table === col.table && g.column === col.column) ? "default" : "outline"} 
                                                        size="sm" 
                                                        className="h-7 px-2 text-[10px]"
                                                        onClick={() => {
                                                            setGroupBy(prev => {
                                                                const exists = prev.some(g => g.table === col.table && g.column === col.column)
                                                                if (exists) return prev.filter(g => !(g.table === col.table && g.column === col.column))
                                                                return [...prev, { table: col.table, column: col.column }]
                                                            })
                                                        }}
                                                    >
                                                        Group
                                                    </Button>

                                                    <button
                                                        onClick={() => setSelectedCols(s => s.filter(c => c.alias !== col.alias))}
                                                        className="p-1 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>

                                {/* Backend Filters Section */}
                                <Separator />
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                            <Filter className="h-3 w-3" /> Report Filters
                                        </p>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-7 text-[10px]">
                                                    <Plus className="h-3 w-3 mr-1" /> Add Filter
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Add Report Filter</DialogTitle>
                                                </DialogHeader>
                                                <FilterForm 
                                                    tables={[baseTable, ...tables.filter(t => isTableJoined(t.name))]} 
                                                    onAdd={(filter) => setReportFilters(prev => [...prev, filter])}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {reportFilters.length === 0 && (
                                            <p className="text-[10px] text-muted-foreground italic">No backend filters applied</p>
                                        )}
                                        {reportFilters.map((f, i) => (
                                            <Badge key={i} variant="outline" className="text-[10px] py-1 px-2 flex items-center gap-1 bg-amber-500/5 border-amber-500/20">
                                                <span className="font-bold">{f.label}</span>
                                                <span className="opacity-60">{f.operator}</span>
                                                <span>{String(f.value)}</span>
                                                <X className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" onClick={() => setReportFilters(prev => prev.filter((_, idx) => idx !== i))} />
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>

                                {/* Active joins summary */}
                                {activeJoins.length > 0 && (
                                    <>
                                        <Separator />
                                        <CardContent className="pt-4">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                                                <Link2 className="h-3 w-3" /> Active Joins
                                            </p>
                                            <div className="space-y-1">
                                                {activeJoins.map(j => (
                                                    <div key={`${j.fromTable}-${j.toTable}`} className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                                                        <span className="text-foreground">{j.fromTable}</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                        <span className="text-primary">{j.toTable}</span>
                                                        <span className="text-muted-foreground/60">on {j.fromColumn} = {j.toColumn}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </>
                                )}

                                <CardFooter className="border-t pt-4 flex justify-between">
                                    <Button variant="ghost" onClick={() => setStep(1)}>
                                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                                    </Button>
                                    <Button
                                        disabled={selectedCols.length === 0 || previewLoading}
                                        onClick={handlePreview}
                                    >
                                        {previewLoading
                                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                                            : <><Eye className="h-4 w-4 mr-2" /> Preview Report</>
                                        }
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                STEP 3 — Preview & export
            ══════════════════════════════════════════════════════════════ */}
                {step === 3 && (
                    <div className="space-y-5">

                        {/* Action bar - Salesforce Style */}
                        <div className="bg-white dark:bg-slate-900 border rounded-lg shadow-sm">
                            <div className="border-b px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30">
                                        <BarChart2 className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wide">Report Preview</h2>
                                        <p className="text-xs text-slate-500">
                                            {filteredPreviewRows.length} rows · {selectedCols.length} columns · {baseTable?.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsFilterPanelOpen(true)} className={cn("relative", getActiveFilterCount() > 0 && "border-primary text-primary bg-primary/5")}>
                                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                                        Filter
                                        {getActiveFilterCount() > 0 && (
                                            <Badge className="ml-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center font-bold text-[9px] bg-primary text-primary-foreground">
                                                {getActiveFilterCount()}
                                            </Badge>
                                        )}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Modify
                                    </Button>

                                    {/* Export CSV */}
                                    <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExporting}>
                                        {isExporting
                                            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            : <FileText className="h-3.5 w-3.5 mr-1.5" />
                                        }
                                        CSV
                                    </Button>

                                    {/* Export Excel */}
                                    <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting}>
                                        {isExporting
                                            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            : <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                                        }
                                        Excel
                                    </Button>

                                    {/* Save dialog */}
                                    <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Report
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Save Report</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                <div className="space-y-1.5">
                                                    <Label>Report name</Label>
                                                    <Input
                                                        value={reportName}
                                                        onChange={e => setReportName(e.target.value)}
                                                        placeholder="e.g. Monthly Orders by Customer"
                                                        onKeyDown={e => e.key === "Enter" && handleSaveReport(false)}
                                                    />
                                                </div>
                                                <div className="rounded-lg border p-3 bg-muted/30 text-xs space-y-1 text-muted-foreground">
                                                    <p><strong className="text-foreground">Template</strong> — saves configuration only. Runs live each time.</p>
                                                    <p><strong className="text-foreground">Snapshot</strong> — saves current {previewRows.length} rows with the config.</p>
                                                </div>
                                            </div>
                                            <DialogFooter className="gap-2">
                                                <Button variant="outline" onClick={() => handleSaveReport(false)} disabled={isSaving || !reportName.trim()}>
                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save as Template"}
                                                </Button>
                                                <Button onClick={() => handleSaveReport(true)} disabled={isSaving || !reportName.trim()}>
                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Snapshot"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-4">
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search preview data..."
                                        className="pl-9 h-9 text-sm"
                                        value={previewSearchQuery}
                                        onChange={(e) => setPreviewSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="p-0">
                                {/* Chart Section */}
                                {/* {chartConfig?.data && chartConfig.data.length > 0 && (
                                    <div className="p-4 border-b bg-white dark:bg-slate-900">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Data Overview</p>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartConfig.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} name={chartConfig.yLabel} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )} */}

                                {/* Data Table Section */}
                                <ScrollArea className="h-[500px] w-full rounded-b-lg">
                                    <div className="w-max min-w-full">
                                        <Table>
                                            <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/80 border-b shadow-sm">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="w-10 text-center text-slate-500 font-semibold uppercase text-[10px] tracking-wider">#</TableHead>
                                                    {selectedCols.map(col => (
                                                        <TableHead key={col.alias} className="whitespace-nowrap font-semibold uppercase text-[10px] tracking-wider text-slate-600 dark:text-slate-300">
                                                            <div className="flex items-center gap-1.5">
                                                                {TYPE_ICON[col.type]}
                                                                <span>{col.label}</span>
                                                            </div>
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredPreviewRows.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={selectedCols.length + 1} className="text-center py-12 text-muted-foreground">
                                                            No data matching your search/filters
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredPreviewRows.map((row, idx) => (
                                                        <TableRow key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                                                            <TableCell className="text-center text-slate-400 text-xs w-10 border-r border-slate-100 dark:border-slate-800">
                                                                {idx + 1}
                                                            </TableCell>
                                                            {selectedCols.map(col => {
                                                                const val = row[col.alias]
                                                                const display = val === null || val === undefined ? "" : String(val)
                                                                const isNull = val === null || val === undefined
                                                                return (
                                                                    <TableCell key={col.alias} className="max-w-[200px]">
                                                                        {isNull ? (
                                                                            <span className="text-muted-foreground/50 italic text-xs">null</span>
                                                                        ) : col.type === "boolean" ? (
                                                                            <Badge variant={val ? "default" : "secondary"} className="text-[10px] uppercase font-semibold">
                                                                                {val ? "true" : "false"}
                                                                            </Badge>
                                                                        ) : (
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <span className="truncate block text-sm max-w-[180px]">{display}</span>
                                                                                </TooltipTrigger>
                                                                                {display.length > 30 && (
                                                                                    <TooltipContent><p className="max-w-xs break-words">{display}</p></TooltipContent>
                                                                                )}
                                                                            </Tooltip>
                                                                        )}
                                                                    </TableCell>
                                                                )
                                                            })}
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                )}
                {/* Filter Sidebar */}
                <Sheet open={isFilterPanelOpen} onOpenChange={setIsFilterPanelOpen}>
                    <SheetContent className="w-[380px] p-0 border-l flex flex-col shadow-2xl z-[150]">
                        <SheetHeader className="p-6 border-b">
                            <div className="flex items-center gap-3">
                                <Filter className="h-5 w-5 text-primary" />
                                <SheetTitle>Filter Preview</SheetTitle>
                            </div>
                            <SheetDescription>Apply local filters to the preview results</SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {(selectedCols || []).map((col: any) => (
                                <div key={col.alias} className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.label}</Label>
                                    <Input
                                        placeholder={`Search in ${col.label}...`}
                                        value={previewFilters[col.alias] || ""}
                                        onChange={(e) => setPreviewFilters(prev => ({ ...prev, [col.alias]: e.target.value }))}
                                        className="h-9"
                                    />
                                </div>
                            ))}
                        </div>

                        <SheetFooter className="p-6 border-t bg-muted/20">
                            <Button variant="ghost" className="w-full mr-2" onClick={() => setPreviewFilters({})}>
                                Reset
                            </Button>
                            <Button className="w-full" onClick={() => setIsFilterPanelOpen(false)}>
                                Done
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        </TooltipProvider>
    )
}