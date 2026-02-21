"use client"

import { useAuth } from "@/agt-panel/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card } from "@/agt-panel/components/ui/card"
import { Button } from "@/agt-panel/components/ui/button"
import { Input } from "@/agt-panel/components/ui/input"
import { Label } from "@/agt-panel/components/ui/label"
import { useToast } from "@/agt-panel/hooks/use-toast"
import { Loader2, Plus, Trash2, Languages, Pencil, Search, Download } from "lucide-react"
import { exportToCSV } from "@/agt-panel/lib/export-utils"
import { mastersApi } from "@/agt-panel/lib/api-client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/agt-panel/components/ui/dialog"

interface Language {
    id: string
    name: string
    createdAt?: string
}

export default function LanguagesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [languages, setLanguages] = useState<Language[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newLanguageName, setNewLanguageName] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [exportLoading, setExportLoading] = useState(false)

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Edit state
    const [editingLanguage, setEditingLanguage] = useState<Language | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editLanguageName, setEditLanguageName] = useState("")

    // Delete state
    const [deletingLanguage, setDeletingLanguage] = useState<Language | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const { toast } = useToast()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && !loading && !user) {
            router.push("/admin/login")
        }
    }, [user, loading, mounted, router])

    // Fetch languages
    useEffect(() => {
        if (mounted && user) {
            fetchLanguages()
        }
    }, [mounted, user, toast, debouncedSearch])

    const handleExport = async () => {
        try {
            setExportLoading(true)
            const data = await mastersApi.getLanguages({ search: debouncedSearch })
            const exportData = data.map((l: any) => ({
                ID: l.id,
                Name: l.name,
                "Created At": l.createdAt ? new Date(l.createdAt).toLocaleString() : "N/A"
            }));
            exportToCSV(exportData, "Languages");
        } catch (error) {
            console.error("Export failed:", error)
            toast({
                title: "Export Failed",
                description: "Failed to fetch data for export.",
                variant: "destructive"
            })
        } finally {
            setExportLoading(false)
        }
    }

    const fetchLanguages = async () => {
        if (!user) return

        try {
            setIsLoading(true)
            const data = await mastersApi.getLanguages({ search: debouncedSearch })
            setLanguages(data)
        } catch (error: any) {
            console.error("Error fetching languages:", error)
            toast({
                title: "Error",
                description: "Failed to load languages. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddLanguage = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newLanguageName.trim()) {
            toast({
                title: "Validation Error",
                description: "Language name is required",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            const result = await mastersApi.createLanguage({
                name: newLanguageName.trim(),
                code: newLanguageName.trim().toLowerCase().slice(0, 3) // Generating a fallback code
            })

            toast({
                title: "Success",
                description: "Language added successfully!",
            })

            // Add the new language to the list
            setLanguages([
                ...languages,
                result
            ])

            setNewLanguageName("")
            setIsDialogOpen(false)
        } catch (error: any) {
            console.error("Error adding language:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to add language. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditClick = (language: Language) => {
        setEditingLanguage(language)
        setEditLanguageName(language.name)
        setIsEditDialogOpen(true)
    }

    const handleUpdateLanguage = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!editLanguageName.trim() || !editingLanguage) {
            toast({
                title: "Validation Error",
                description: "Language name is required",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            const result = await mastersApi.updateLanguage(editingLanguage.id, {
                name: editLanguageName.trim()
            })

            toast({
                title: "Success",
                description: "Language updated successfully!",
            })

            // Update the language in the list
            setLanguages(languages.map(lang =>
                lang.id === editingLanguage.id
                    ? { ...lang, name: editLanguageName.trim() }
                    : lang
            ))

            setIsEditDialogOpen(false)
            setEditingLanguage(null)
        } catch (error: any) {
            console.error("Error updating language:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to update language. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteClick = (language: Language) => {
        setDeletingLanguage(language)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteLanguage = async () => {
        if (!deletingLanguage) return

        setIsSubmitting(true)

        try {
            await mastersApi.deleteLanguage(deletingLanguage.id)

            toast({
                title: "Success",
                description: "Language deleted successfully!",
            })

            // Remove the language from the list
            setLanguages(languages.filter(lang => lang.id !== deletingLanguage.id))

            setIsDeleteDialogOpen(false)
            setDeletingLanguage(null)
        } catch (error: any) {
            console.error("Error deleting language:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to delete language. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!mounted || loading) return <div>Loading...</div>
    if (!user) return null

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Languages</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage and export book languages.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={handleExport} disabled={exportLoading} className="flex-1 md:flex-none">
                        {exportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export CSV
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-1 md:flex-none">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Language
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Language</DialogTitle>
                                <DialogDescription>
                                    Create a new language for organizing books.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddLanguage} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="languageName">Language Name *</Label>
                                    <Input
                                        id="languageName"
                                        value={newLanguageName}
                                        onChange={(e) => setNewLanguageName(e.target.value)}
                                        placeholder="Enter language name"
                                        required
                                        disabled={isSubmitting}
                                        maxLength={50}
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            "Add Language"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search languages..."
                        className="pl-10 h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Card className="bg-card border-border/50 p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Loading languages...</span>
                    </div>
                ) : languages.length === 0 ? (
                    <div className="text-center py-12">
                        <Languages className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No languages yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Get started by adding your first language.
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Language
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {languages.map((language) => (
                            <div
                                key={language.id}
                                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-md">
                                        <Languages className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="font-medium">{language.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditClick(language)}
                                        title="Edit Language"
                                    >
                                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteClick(language)}
                                        title="Delete Language"
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Language</DialogTitle>
                        <DialogDescription>
                            Update the language name.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateLanguage} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="editLanguageName">Language Name *</Label>
                            <Input
                                id="editLanguageName"
                                value={editLanguageName}
                                onChange={(e) => setEditLanguageName(e.target.value)}
                                placeholder="Enter language name"
                                required
                                disabled={isSubmitting}
                                maxLength={50}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Language"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Language</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the language "{deletingLanguage?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteLanguage}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

