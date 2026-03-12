"use client"

import { useState, useEffect } from "react"
import {
    FileText,
    Download,
    Loader2,
    Plus,
    History,
    Trash2,
    BarChart3,
    ArrowLeft,
    Search,
    Calendar,
    ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/agt-panel/components/ui/card"
import { Button } from "@/agt-panel/components/ui/button"
import { useToast } from "@/agt-panel/components/ui/use-toast"
import { reportsApi } from "@/agt-panel/lib/api-client"
import { exportToCSV } from "@/agt-panel/lib/export-utils"
import { Separator } from "@/agt-panel/components/ui/separator"
import { Badge } from "@/agt-panel/components/ui/badge"
import { Input } from "@/agt-panel/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/agt-panel/components/ui/table"
import Link from "next/link"
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
import { useRouter } from "next/navigation"

export default function ReportsDashboardPage() {
    const router = useRouter()
    const [savedReports, setSavedReports] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedReport, setSelectedReport] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [reportToDelete, setReportToDelete] = useState<number | string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchSavedReports()
    }, [])

    const fetchSavedReports = async () => {
        try {
            setIsLoading(true)
            const reports = await reportsApi.getAll()
            
            // In the new builder, we save `isDynamic: false` when creating a snapshot, 
            // and `savedData` will exist. 
            const onlyStatic = (reports || []).filter((r: any) => 
                r.configuration?.isStatic === true || 
                r.configuration?.isDynamic === false ||
                r.configuration?.savedData !== undefined
            )
            setSavedReports(onlyStatic)
        } catch (error) {
            console.error("Failed to fetch saved reports:", error)
            toast({ title: "Error", description: "Failed to fetch reports", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const deleteReport = (id: number | string, e: React.MouseEvent) => {
        e.stopPropagation()
        setReportToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!reportToDelete) return
        try {
            await reportsApi.delete(reportToDelete)
            setSavedReports(prev => prev.filter(r => r.id !== reportToDelete))
            if (selectedReport?.id === reportToDelete) setSelectedReport(null)
            toast({ title: "Deleted", description: "Report removed successfully" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete report", variant: "destructive" })
        } finally {
            setIsDeleteDialogOpen(false)
            setReportToDelete(null)
        }
    }

    const handleExport = (report: any) => {
        const { savedData, selectedFields } = report.configuration
        if (!savedData) return

        const exportData = savedData.map((item: any) => {
            const cleanRow: any = {}
            selectedFields.forEach((fId: string) => {
                const label = item[`__label_${fId}`] || fId
                cleanRow[label] = item[fId]
            })
            return cleanRow
        })

        exportToCSV(exportData, `Report_${report.name}_${new Date().toLocaleDateString()}`)
        toast({ title: "Export Started" })
    }

    const filteredReports = savedReports.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.configuration.baseObject.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading && !selectedReport) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>

    if (selectedReport) {
        const config = selectedReport.configuration
        const data = config.savedData || []

        return (
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{selectedReport.name}</h1>
                            <p className="text-muted-foreground text-sm mt-1">Viewing saved report results from {new Date(config.savedAt).toLocaleDateString()}.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleExport(selectedReport)}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                        <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={(e) => deleteReport(selectedReport.id, e as any)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Card className="shadow-sm border-muted">
                    <CardHeader>
                        <CardTitle className="text-xl">Report Records ({data.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {(config.selectedColumns || []).map((col: any) => (
                                        <TableHead key={col.alias} className="font-bold">
                                            {col.label}
                                        </TableHead>
                                    ))}
                                    {/* Fallback for old configurations */}
                                    {!config.selectedColumns && (config.selectedFields || []).map((fId: string) => {
                                        const label = data[0]?.[`__label_${fId}`] || fId.replace(/_/g, ' ')
                                        return (
                                            <TableHead key={fId} className="font-bold">
                                                {label}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={config.selectedColumns?.length || config.selectedFields?.length || 1} className="py-20 text-center text-muted-foreground">
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item: any, idx: number) => (
                                        <TableRow key={idx}>
                                            {(config.selectedColumns || []).map((col: any) => {
                                                const val = item[col.alias]
                                                return (
                                                    <TableCell key={col.alias}>
                                                        {val === null || val === undefined ? (
                                                            <span className="text-muted-foreground/50 italic text-xs">null</span>
                                                        ) : col.type === "boolean" ? (
                                                            <Badge variant={val ? "default" : "secondary"} className="text-[10px] uppercase font-semibold">
                                                                {val ? "true" : "false"}
                                                            </Badge>
                                                        ) : (
                                                            String(val)
                                                        )}
                                                    </TableCell>
                                                )
                                            })}
                                            {/* Fallback for old configurations */}
                                            {!config.selectedColumns && (config.selectedFields || []).map((fId: string) => {
                                                const val = item[fId]
                                                return (
                                                    <TableCell key={fId}>
                                                        {val === true ? "Yes" : val === false ? "No" : String(val ?? "N/A")}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Saved Reports</h1>
                    <p className="text-muted-foreground text-sm mt-1">View and manage your generated report snapshots.</p>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => router.push("/agt-panel/admin/reports/create")}>
                        <Plus className="mr-2 h-4 w-4" /> Build New Report
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-muted">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="text-xl">All Reports ({filteredReports.length})</CardTitle>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search reports..."
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
                                <TableHead>Report Name</TableHead>
                                <TableHead>Object Type</TableHead>
                                <TableHead>Records</TableHead>
                                <TableHead>Saved Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center text-muted-foreground">
                                        No saved reports found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReports.map((report) => (
                                    <TableRow
                                        key={report.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setSelectedReport(report)}
                                    >
                                        <TableCell className="font-bold text-primary hover:underline">
                                            {report.name}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {report.configuration.baseTable || report.configuration.baseObject || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            {report.configuration.savedData?.length || 0}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(report.configuration.savedAt || report.createdAt || new Date()).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-primary"
                                                    onClick={() => setSelectedReport(report)}
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600"
                                                    onClick={(e) => deleteReport(report.id, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the saved report snapshot. This action cannot be undone.
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
