"use client"

import { useAuth } from "@/agt-panel/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card } from "@/agt-panel/components/ui/card"
import { Button } from "@/agt-panel/components/ui/button"
import { Input } from "@/agt-panel/components/ui/input"
import { Label } from "@/agt-panel/components/ui/label"
import { useToast } from "@/agt-panel/hooks/use-toast"
import { Loader2, Plus, Trash2, Tags, Pencil, Search, Download } from "lucide-react"
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

interface Category {
    id: string
    name: string
    createdAt?: string
}

export default function CategoriesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
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
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editCategoryName, setEditCategoryName] = useState("")

    // Delete state
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
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

    // Fetch categories
    useEffect(() => {
        if (mounted && user) {
            fetchCategories()
        }
    }, [mounted, user, toast, debouncedSearch])

    const handleExport = async () => {
        try {
            setExportLoading(true)
            const data = await mastersApi.getCategories({ search: debouncedSearch })
            const exportData = data.map((c: any) => ({
                ID: c.id,
                Name: c.name,
                "Created At": c.createdAt ? new Date(c.createdAt).toLocaleString() : "N/A"
            }));
            exportToCSV(exportData, "Categories");
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

    const fetchCategories = async () => {
        if (!user) return

        try {
            setIsLoading(true)
            const data = await mastersApi.getCategories({ search: debouncedSearch })
            setCategories(data)
        } catch (error: any) {
            console.error("Error fetching categories:", error)
            toast({
                title: "Error",
                description: "Failed to load categories. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newCategoryName.trim()) {
            toast({
                title: "Validation Error",
                description: "Category name is required",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            const result = await mastersApi.createCategory({
                name: newCategoryName.trim()
            })

            toast({
                title: "Success",
                description: "Category added successfully!",
            })

            // Add the new category to the list
            setCategories([
                ...categories,
                result
            ])

            setNewCategoryName("")
            setIsDialogOpen(false)
        } catch (error: any) {
            console.error("Error adding category:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to add category. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditClick = (category: Category) => {
        setEditingCategory(category)
        setEditCategoryName(category.name)
        setIsEditDialogOpen(true)
    }

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!editCategoryName.trim() || !editingCategory) {
            toast({
                title: "Validation Error",
                description: "Category name is required",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            const result = await mastersApi.updateCategory(editingCategory.id, {
                name: editCategoryName.trim()
            })

            toast({
                title: "Success",
                description: "Category updated successfully!",
            })

            // Update the category in the list
            setCategories(categories.map(cat =>
                cat.id === editingCategory.id
                    ? { ...cat, name: editCategoryName.trim() }
                    : cat
            ))

            setIsEditDialogOpen(false)
            setEditingCategory(null)
        } catch (error: any) {
            console.error("Error updating category:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to update category. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteClick = (category: Category) => {
        setDeletingCategory(category)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteCategory = async () => {
        if (!deletingCategory) return

        setIsSubmitting(true)

        try {
            await mastersApi.deleteCategory(deletingCategory.id)

            toast({
                title: "Success",
                description: "Category deleted successfully!",
            })

            // Remove the category from the list
            setCategories(categories.filter(cat => cat.id !== deletingCategory.id))

            setIsDeleteDialogOpen(false)
            setDeletingCategory(null)
        } catch (error: any) {
            console.error("Error deleting category:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to delete category. Please try again.",
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
                    <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage and export book categories.</p>
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
                                Add Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Category</DialogTitle>
                                <DialogDescription>
                                    Create a new category for organizing books.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="categoryName">Category Name *</Label>
                                    <Input
                                        id="categoryName"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Enter category name"
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
                                            "Add Category"
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
                        placeholder="Search categories..."
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
                        <span className="ml-2 text-muted-foreground">Loading categories...</span>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-12">
                        <Tags className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Get started by adding your first category.
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-md">
                                        <Tags className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="font-medium">{category.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditClick(category)}
                                        title="Edit Category"
                                    >
                                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteClick(category)}
                                        title="Delete Category"
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
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>
                            Update the category name.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="editCategoryName">Category Name *</Label>
                            <Input
                                id="editCategoryName"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                placeholder="Enter category name"
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
                                    "Update Category"
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
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the category "{deletingCategory?.name}"? This action cannot be undone.
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
                            onClick={handleDeleteCategory}
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

