// "use client"
// import type React from "react"
// import { useState, useRef, useEffect, useCallback } from "react"
// import { Button } from "@/agt-panel/components/ui/button"
// import { Input } from "@/agt-panel/components/ui/input"
// import { Label } from "@/agt-panel/components/ui/label"
// import { Textarea } from "@/agt-panel/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/agt-panel/components/ui/select"
// import { useToast } from "@/agt-panel/hooks/use-toast"
// import { Loader2, Upload, X, ChevronDown, ChevronUp } from "lucide-react"
// import Image from "next/image"
// import { booksApi, mastersApi } from "@/agt-panel/lib/api-client"

// interface BookFormProps {
//   initialData?: any
//   isEditing?: boolean
//   onSubmit: (book: any) => void
//   onCancel: () => void
//   bookId?: string | number
// }

// const AccordionSection = ({
//   title,
//   isExpanded,
//   onToggle,
//   children
// }: {
//   title: string
//   isExpanded: boolean
//   onToggle: () => void
//   children: React.ReactNode
// }) => (
//   <div className="border border-border rounded-lg overflow-hidden">
//     <button
//       type="button"
//       onClick={onToggle}
//       className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted/80 transition-colors"
//     >
//       <h3 className="text-sm font-semibold">{title}</h3>
//       {isExpanded ? (
//         <ChevronUp className="h-4 w-4" />
//       ) : (
//         <ChevronDown className="h-4 w-4" />
//       )}
//     </button>
//     {isExpanded && (
//       <div className="p-4 space-y-4 bg-background">
//         {children}
//       </div>
//     )}
//   </div>
// )

// export function BookForm({ initialData, isEditing = false, onSubmit, onCancel, bookId }: BookFormProps) {
//   const [formData, setFormData] = useState({
//     title: initialData?.title || "",
//     author: initialData?.author || "",
//     categoryId: initialData?.categoryId || initialData?.category?.id || "",
//     languageId: initialData?.languageId || initialData?.language?.id || "",
//     price: initialData?.price || 0,
//     stockQty: initialData?.stockQty || initialData?.totalCopies || 0,
//     description: initialData?.description || "",
//     bookCode: initialData?.bookCode || "",
//     kabatNumber: initialData?.kabatNumber || "",
//     bookSize: initialData?.bookSize || "",
//     tikakar: initialData?.tikakar || "",
//     prakashak: initialData?.prakashak || "",
//     sampadak: initialData?.sampadak || "",
//     anuvadak: initialData?.anuvadak || "",
//     vishay: initialData?.vishay || "",
//     shreni1: initialData?.shreni1 || "",
//     shreni2: initialData?.shreni2 || "",
//     shreni3: initialData?.shreni3 || "",
//     pages: initialData?.pages || "",
//     yearAD: initialData?.yearAD || "",
//     vikramSamvat: initialData?.vikramSamvat || "",
//     veerSamvat: initialData?.veerSamvat || "",
//     prakar: initialData?.prakar || "",
//     edition: initialData?.edition || "",
//     isAvailable: initialData?.isAvailable ?? true,
//     featured: initialData?.featured ?? false,
//     frontImage: initialData?.frontImage || initialData?.imageUrl || "",
//     backImage: initialData?.backImage || initialData?.backImageUrl || "",
//   })

//   const [frontImageFile, setFrontImageFile] = useState<File | null>(null)
//   const [backImageFile, setBackImageFile] = useState<File | null>(null)
//   const [frontPreview, setFrontPreview] = useState<string | null>(initialData?.frontImage || initialData?.imageUrl || null)
//   const [backPreview, setBackPreview] = useState<string | null>(initialData?.backImage || null)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
//   const [languages, setLanguages] = useState<{ id: number; name: string }[]>([])
//   const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)
//   const [isLanguagesLoading, setIsLanguagesLoading] = useState(true)

//   // Accordion state - all sections open by default
//   const [expandedSections, setExpandedSections] = useState({
//     basic: true,
//     classification: true,
//     contributors: true,
//     publication: true,
//     pricing: true,
//     images: true,
//   })

//   const frontInputRef = useRef<HTMLInputElement>(null)
//   const backInputRef = useRef<HTMLInputElement>(null)
//   const { toast } = useToast()

//   useEffect(() => {
//     const loadMasters = async () => {
//       try {
//         const cats = await mastersApi.getCategories()
//         setCategories(cats || [])
//       } catch (error) {
//         console.error("Error loading categories", error)
//         toast({ title: "Warning", description: "Failed to load categories", variant: "destructive" })
//       } finally {
//         setIsCategoriesLoading(false)
//       }

//       try {
//         const langs = await mastersApi.getLanguages()
//         setLanguages(langs || [])
//       } catch (error) {
//         console.error("Error loading languages", error)
//         toast({ title: "Warning", description: "Failed to load languages", variant: "destructive" })
//       } finally {
//         setIsLanguagesLoading(false)
//       }
//     }
//     loadMasters()
//   }, [toast])

//   useEffect(() => {
//     if (initialData) {
//       setFormData(prev => ({
//         ...prev,
//         title: initialData.title || prev.title,
//         author: initialData.author || prev.author,
//         categoryId: initialData.categoryId || initialData.category?.id || prev.categoryId,
//         languageId: initialData.languageId || initialData.language?.id || prev.languageId,
//         price: initialData.price || prev.price,
//         stockQty: initialData.stockQty || initialData.totalCopies || prev.stockQty,
//         frontImage: initialData.frontImage || initialData.imageUrl || "",
//         backImage: initialData.backImage || initialData.backImageUrl || "",
//         bookCode: initialData.bookCode || prev.bookCode,
//         kabatNumber: initialData.kabatNumber || prev.kabatNumber,
//         bookSize: initialData.bookSize || prev.bookSize,
//         tikakar: initialData.tikakar || prev.tikakar,
//         prakashak: initialData.prakashak || prev.prakashak,
//         sampadak: initialData.sampadak || prev.sampadak,
//         anuvadak: initialData.anuvadak || prev.anuvadak,
//         vishay: initialData.vishay || prev.vishay,
//         shreni1: initialData.shreni1 || prev.shreni1,
//         shreni2: initialData.shreni2 || prev.shreni2,
//         shreni3: initialData.shreni3 || prev.shreni3,
//         pages: initialData.pages || prev.pages,
//         yearAD: initialData.yearAD || prev.yearAD,
//         vikramSamvat: initialData.vikramSamvat || prev.vikramSamvat,
//         veerSamvat: initialData.veerSamvat || prev.veerSamvat,
//         prakar: initialData.prakar || prev.prakar,
//         edition: initialData.edition || prev.edition,
//         isAvailable: initialData.isAvailable ?? prev.isAvailable,
//         featured: initialData.featured ?? prev.featured,
//       }))
//       setFrontPreview(initialData.frontImage || null)
//       setBackPreview(initialData.backImage || null)
//     }
//   }, [initialData])

//   const resolveImageUrl = (preview: string | null, type: 'front' | 'back') => {
//     if (!preview) return "/placeholder.svg"

//     // If it's a data URL, use it (newly selected image)
//     if (preview.startsWith('data:')) {
//       return preview
//     }

//     // If we're editing and have a book ID, and the preview represents existing data
//     if (isEditing && bookId) {
//       const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://agt-api.adhyatmparivar.com';
//       return `${baseUrl}/api/books/${bookId}/image/${type}`
//     }

//     // Fallback for other cases
//     if (preview.startsWith('http') || preview.startsWith('/')) {
//       return preview
//     }
//     // Otherwise it's a relative filename, prepend /books/
//     return `/books/${preview}`
//   }

//   const toggleSection = useCallback((section: keyof typeof expandedSections) => {
//     setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
//   }, [])

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
//     const file = e.target.files?.[0]
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) {
//         toast({ title: "File too large", description: "Max 5MB", variant: "destructive" })
//         return
//       }
//       if (!file.type.startsWith("image/")) {
//         toast({ title: "Invalid file", description: "Not an image", variant: "destructive" })
//         return
//       }

//       const reader = new FileReader()
//       reader.onloadend = () => {
//         if (type === 'front') {
//           setFrontImageFile(file)
//           setFrontPreview(reader.result as string)
//         } else {
//           setBackImageFile(file)
//           setBackPreview(reader.result as string)
//         }
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//   const removeImage = (type: 'front' | 'back') => {
//     if (type === 'front') {
//       setFrontImageFile(null)
//       setFrontPreview(null)
//       updateField('frontImage', "")
//       if (frontInputRef.current) frontInputRef.current.value = ""
//     } else {
//       setBackImageFile(null)
//       setBackPreview(null)
//       updateField('backImage', "")
//       if (backInputRef.current) backInputRef.current.value = ""
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsSubmitting(true)

//     try {
//       if (!formData.title.trim()) throw new Error("Title is required")
//       if (!formData.bookCode) throw new Error("Book Code is required")

//       // 1. Prepare FormData for multipart/form-data submission
//       const formDataToSubmit = new FormData()

//       // Append text/number fields
//       formDataToSubmit.append('title', formData.title.trim())
//       formDataToSubmit.append('author', formData.author.trim() || "")
//       formDataToSubmit.append('description', formData.description.trim() || "")
//       formDataToSubmit.append('categoryId', String(formData.categoryId || ""))
//       formDataToSubmit.append('languageId', String(formData.languageId || 1))
//       formDataToSubmit.append('price', String(formData.price || 0))
//       formDataToSubmit.append('stockQty', String(formData.stockQty || 0))
//       formDataToSubmit.append('bookCode', String(formData.bookCode || 0))
//       formDataToSubmit.append('kabatNumber', String(formData.kabatNumber || ""))
//       formDataToSubmit.append('bookSize', formData.bookSize?.trim() || "")
//       formDataToSubmit.append('tikakar', formData.tikakar?.trim() || "")
//       formDataToSubmit.append('prakashak', formData.prakashak?.trim() || "")
//       formDataToSubmit.append('sampadak', formData.sampadak?.trim() || "")
//       formDataToSubmit.append('anuvadak', formData.anuvadak?.trim() || "")
//       formDataToSubmit.append('vishay', formData.vishay?.trim() || "")
//       formDataToSubmit.append('shreni1', formData.shreni1?.trim() || "")
//       formDataToSubmit.append('shreni2', formData.shreni2?.trim() || "")
//       formDataToSubmit.append('shreni3', formData.shreni3?.trim() || "")
//       formDataToSubmit.append('pages', String(formData.pages || ""))
//       formDataToSubmit.append('yearAD', String(formData.yearAD || ""))
//       formDataToSubmit.append('vikramSamvat', String(formData.vikramSamvat || ""))
//       formDataToSubmit.append('veerSamvat', String(formData.veerSamvat || ""))
//       formDataToSubmit.append('prakar', formData.prakar?.trim() || "")
//       formDataToSubmit.append('edition', String(formData.edition || ""))
//       formDataToSubmit.append('isAvailable', String(Boolean(formData.isAvailable)))
//       formDataToSubmit.append('featured', String(Boolean(formData.featured)))

//       // Append image files if new ones were selected, otherwise append existing filenames/URLs
//       if (frontImageFile) {
//         formDataToSubmit.append('frontImage', frontImageFile)
//       } else if (formData.frontImage) {
//         formDataToSubmit.append('frontImage', formData.frontImage)
//       }

//       if (backImageFile) {
//         formDataToSubmit.append('backImage', backImageFile)
//       } else if (formData.backImage) {
//         formDataToSubmit.append('backImage', formData.backImage)
//       }

//       let result
//       if (isEditing && bookId) {
//         result = await booksApi.update(bookId, formDataToSubmit)
//       } else {
//         result = await booksApi.create(formDataToSubmit)
//       }

//       toast({
//         title: "Success",
//         description: `Book ${isEditing ? "updated" : "added"} successfully!`,
//       })
//       onSubmit(result)

//     } catch (error: any) {
//       console.error(`Error ${isEditing ? "updating" : "adding"} book:`, error)
//       toast({
//         title: "Error",
//         description: error.message || `Failed to ${isEditing ? "update" : "add"} book.`,
//         variant: "destructive",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const updateField = useCallback((field: string, value: any) => {
//     setFormData(prev => ({ ...prev, [field]: value }))
//   }, [])

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       {/* Basic Information */}
//       <AccordionSection
//         title="Basic Information"
//         isExpanded={expandedSections.basic}
//         onToggle={() => toggleSection('basic')}
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="title">Book Title *</Label>
//             <Input
//               id="title"
//               value={formData.title}
//               onChange={(e) => updateField('title', e.target.value)}
//               required
//               disabled={isSubmitting}
//               maxLength={200}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="author">Author</Label>
//             <Input
//               id="author"
//               value={formData.author}
//               onChange={(e) => updateField('author', e.target.value)}
//               disabled={isSubmitting}
//               maxLength={100}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="bookCode">Book Code *</Label>
//             <Input
//               id="bookCode"
//               type="number"
//               value={formData.bookCode}
//               onChange={(e) => updateField('bookCode', e.target.value)}
//               required
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="kabatNumber">Kabat Number</Label>
//             <Input
//               id="kabatNumber"
//               type="number"
//               value={formData.kabatNumber}
//               onChange={(e) => updateField('kabatNumber', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2 col-span-2">
//             <Label htmlFor="description">Description</Label>
//             <Textarea
//               id="description"
//               value={formData.description}
//               onChange={(e) => updateField('description', e.target.value)}
//               disabled={isSubmitting}
//               className="min-h-[80px]"
//               maxLength={1000}
//             />
//           </div>
//         </div>
//       </AccordionSection>

//       {/* Classification */}
//       <AccordionSection
//         title="Classification"
//         isExpanded={expandedSections.classification}
//         onToggle={() => toggleSection('classification')}
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="category">Category</Label>
//             <Select
//               value={String(formData.categoryId)}
//               onValueChange={(value) => updateField('categoryId', value)}
//               disabled={isSubmitting || isCategoriesLoading}
//             >
//               <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
//               <SelectContent>
//                 {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="language">Language</Label>
//             <Select
//               value={String(formData.languageId)}
//               onValueChange={(value) => updateField('languageId', value)}
//               disabled={isSubmitting || isLanguagesLoading}
//             >
//               <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
//               <SelectContent>
//                 {languages.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="vishay">Vishay (Subject)</Label>
//             <Input
//               id="vishay"
//               value={formData.vishay}
//               onChange={(e) => updateField('vishay', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="prakar">Prakar (Type)</Label>
//             <Input
//               id="prakar"
//               value={formData.prakar}
//               onChange={(e) => updateField('prakar', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="shreni1">Shreni 1</Label>
//             <Input
//               id="shreni1"
//               value={formData.shreni1}
//               onChange={(e) => updateField('shreni1', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="shreni2">Shreni 2</Label>
//             <Input
//               id="shreni2"
//               value={formData.shreni2}
//               onChange={(e) => updateField('shreni2', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="shreni3">Shreni 3</Label>
//             <Input
//               id="shreni3"
//               value={formData.shreni3}
//               onChange={(e) => updateField('shreni3', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>
//         </div>
//       </AccordionSection>

//       {/* Contributors */}
//       <AccordionSection
//         title="Contributors"
//         isExpanded={expandedSections.contributors}
//         onToggle={() => toggleSection('contributors')}
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="tikakar">Tikakar</Label>
//             <Input
//               id="tikakar"
//               value={formData.tikakar}
//               onChange={(e) => updateField('tikakar', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="prakashak">Prakashak (Publisher)</Label>
//             <Input
//               id="prakashak"
//               value={formData.prakashak}
//               onChange={(e) => updateField('prakashak', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="sampadak">Sampadak (Editor)</Label>
//             <Input
//               id="sampadak"
//               value={formData.sampadak}
//               onChange={(e) => updateField('sampadak', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="anuvadak">Anuvadak (Translator)</Label>
//             <Input
//               id="anuvadak"
//               value={formData.anuvadak}
//               onChange={(e) => updateField('anuvadak', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>
//         </div>
//       </AccordionSection>

//       {/* Publication Details */}
//       <AccordionSection
//         title="Publication Details"
//         isExpanded={expandedSections.publication}
//         onToggle={() => toggleSection('publication')}
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="pages">Pages</Label>
//             <Input
//               id="pages"
//               type="number"
//               value={formData.pages}
//               onChange={(e) => updateField('pages', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="bookSize">Book Size</Label>
//             <Input
//               id="bookSize"
//               value={formData.bookSize}
//               onChange={(e) => updateField('bookSize', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="edition">Edition</Label>
//             <Input
//               id="edition"
//               type="number"
//               value={formData.edition}
//               onChange={(e) => updateField('edition', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="yearAD">Year (AD)</Label>
//             <Input
//               id="yearAD"
//               type="number"
//               value={formData.yearAD}
//               onChange={(e) => updateField('yearAD', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="vikramSamvat">Vikram Samvat</Label>
//             <Input
//               id="vikramSamvat"
//               type="number"
//               value={formData.vikramSamvat}
//               onChange={(e) => updateField('vikramSamvat', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="veerSamvat">Veer Samvat</Label>
//             <Input
//               id="veerSamvat"
//               type="number"
//               value={formData.veerSamvat}
//               onChange={(e) => updateField('veerSamvat', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>
//         </div>
//       </AccordionSection>

//       {/* Pricing & Stock */}
//       <AccordionSection
//         title="Pricing & Stock"
//         isExpanded={expandedSections.pricing}
//         onToggle={() => toggleSection('pricing')}
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="price">Price</Label>
//             <Input
//               id="price"
//               type="number"
//               min="0"
//               step="0.01"
//               value={formData.price}
//               onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="stockQty">Stock Quantity</Label>
//             <Input
//               id="stockQty"
//               type="number"
//               value={formData.stockQty}
//               onChange={(e) => updateField('stockQty', e.target.value)}
//               disabled={isSubmitting}
//             />
//           </div>

//           <div className="flex items-center space-x-2">
//             <Input
//               id="isAvailable"
//               type="checkbox"
//               checked={Boolean(formData.isAvailable)}
//               onChange={(e) => updateField('isAvailable', e.target.checked)}
//               className="h-4 w-4"
//             />
//             <Label htmlFor="isAvailable">Available for Sale</Label>
//           </div>

//           <div className="flex items-center space-x-2">
//             <Input
//               id="featured"
//               type="checkbox"
//               checked={Boolean(formData.featured)}
//               onChange={(e) => updateField('featured', e.target.checked)}
//               className="h-4 w-4"
//             />
//             <Label htmlFor="featured">Featured Book</Label>
//           </div>
//         </div>
//       </AccordionSection>

//       {/* Book Images */}
//       <AccordionSection
//         title="Book Images"
//         isExpanded={expandedSections.images}
//         onToggle={() => toggleSection('images')}
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label>Front Cover Image</Label>
//             <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] relative bg-muted/30 hover:bg-muted/50 transition-colors">
//               {frontPreview ? (
//                 <div className="relative w-full h-full min-h-[200px]">
//                   <Image src={resolveImageUrl(frontPreview, 'front')} alt="Front Cover" fill className="object-contain rounded-md" />
//                   <Button
//                     type="button"
//                     variant="destructive"
//                     size="icon"
//                     className="absolute top-2 right-2 h-8 w-8"
//                     onClick={() => removeImage('front')}
//                   >
//                     <X className="h-4 w-4" />
//                   </Button>
//                 </div>
//               ) : (
//                 <div
//                   className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center"
//                   onClick={() => !isSubmitting && frontInputRef.current?.click()}
//                 >
//                   <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
//                   <span className="text-sm text-muted-foreground">Click to upload front cover</span>
//                   <span className="text-xs text-muted-foreground mt-1">Max 5MB</span>
//                 </div>
//               )}
//               <input
//                 ref={frontInputRef}
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 onChange={(e) => handleImageChange(e, 'front')}
//                 disabled={isSubmitting}
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>Back Cover Image</Label>
//             <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] relative bg-muted/30 hover:bg-muted/50 transition-colors">
//               {backPreview ? (
//                 <div className="relative w-full h-full min-h-[200px]">
//                   <Image src={resolveImageUrl(backPreview, 'back')} alt="Back Cover" fill className="object-contain rounded-md" />
//                   <Button
//                     type="button"
//                     variant="destructive"
//                     size="icon"
//                     className="absolute top-2 right-2 h-8 w-8"
//                     onClick={() => removeImage('back')}
//                   >
//                     <X className="h-4 w-4" />
//                   </Button>
//                 </div>
//               ) : (
//                 <div
//                   className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center"
//                   onClick={() => !isSubmitting && backInputRef.current?.click()}
//                 >
//                   <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
//                   <span className="text-sm text-muted-foreground">Click to upload back cover</span>
//                   <span className="text-xs text-muted-foreground mt-1">Max 5MB</span>
//                 </div>
//               )}
//               <input
//                 ref={backInputRef}
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 onChange={(e) => handleImageChange(e, 'back')}
//                 disabled={isSubmitting}
//               />
//             </div>
//           </div>
//         </div>
//       </AccordionSection>

//       {/* Form Actions */}
//       <div className="flex justify-end gap-3 pt-4 border-t">
//         <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
//           Cancel
//         </Button>
//         <Button type="submit" disabled={isSubmitting}>
//           {isSubmitting ? (
//             <>
//               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               {isEditing ? "Updating..." : "Adding..."}
//             </>
//           ) : (
//             isEditing ? "Update Book" : "Add Book"
//           )}
//         </Button>
//       </div>
//     </form>
//   )
// }
"use client"
import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/agt-panel/components/ui/button"
import { Input } from "@/agt-panel/components/ui/input"
import { Label } from "@/agt-panel/components/ui/label"
import { Textarea } from "@/agt-panel/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/agt-panel/components/ui/select"
import { useToast } from "@/agt-panel/hooks/use-toast"
import { Loader2, Upload, X, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { booksApi, mastersApi } from "@/agt-panel/lib/api-client"

interface BookFormProps {
  initialData?: any
  isEditing?: boolean
  onSubmit: (book: any) => void
  onCancel: () => void
  bookId?: string | number
}

const AccordionSection = ({
  title,
  isExpanded,
  onToggle,
  children
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) => (
  <div className="border border-border rounded-lg overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted/80 transition-colors"
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
    {isExpanded && (
      <div className="p-4 space-y-4 bg-background">
        {children}
      </div>
    )}
  </div>
)

export function BookForm({ initialData, isEditing = false, onSubmit, onCancel, bookId }: BookFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    author: initialData?.author || "",
    categoryId: initialData?.categoryId || initialData?.category?.id || "",
    languageId: initialData?.languageId || initialData?.language?.id || "",
    price: initialData?.price || 0,
    stockQty: initialData?.stockQty || initialData?.totalCopies || 0,
    description: initialData?.description || "",
    bookCode: initialData?.bookCode || "",
    kabatNumber: initialData?.kabatNumber || "",
    bookSize: initialData?.bookSize || "",
    tikakar: initialData?.tikakar || "",
    prakashak: initialData?.prakashak || "",
    sampadak: initialData?.sampadak || "",
    anuvadak: initialData?.anuvadak || "",
    vishay: initialData?.vishay || "",
    shreni1: initialData?.shreni1 || "",
    shreni2: initialData?.shreni2 || "",
    shreni3: initialData?.shreni3 || "",
    pages: initialData?.pages || "",
    yearAD: initialData?.yearAD || "",
    vikramSamvat: initialData?.vikramSamvat || "",
    veerSamvat: initialData?.veerSamvat || "",
    prakar: initialData?.prakar || "",
    edition: initialData?.edition || "",
    isAvailable: initialData?.isAvailable ?? true,
    featured: initialData?.featured ?? false,
    // Store only the filename, not the full URL
    frontImage: initialData?.frontImage || "",
    backImage: initialData?.backImage || "",
  })

  const [frontImageFile, setFrontImageFile] = useState<File | null>(null)
  const [backImageFile, setBackImageFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(initialData?.frontImage || null)
  const [backPreview, setBackPreview] = useState<string | null>(initialData?.backImage || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [languages, setLanguages] = useState<{ id: number; name: string }[]>([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)
  const [isLanguagesLoading, setIsLanguagesLoading] = useState(true)

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    classification: true,
    contributors: true,
    publication: true,
    pricing: true,
    images: true,
  })

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const cats = await mastersApi.getCategories()
        setCategories(cats || [])
      } catch (error) {
        console.error("Error loading categories", error)
        toast({ title: "Warning", description: "Failed to load categories", variant: "destructive" })
      } finally {
        setIsCategoriesLoading(false)
      }

      try {
        const langs = await mastersApi.getLanguages()
        setLanguages(langs || [])
      } catch (error) {
        console.error("Error loading languages", error)
        toast({ title: "Warning", description: "Failed to load languages", variant: "destructive" })
      } finally {
        setIsLanguagesLoading(false)
      }
    }
    loadMasters()
  }, [toast])

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        title: initialData.title || prev.title,
        author: initialData.author || prev.author,
        categoryId: initialData.categoryId || initialData.category?.id || prev.categoryId,
        languageId: initialData.languageId || initialData.language?.id || prev.languageId,
        price: initialData.price || prev.price,
        stockQty: initialData.stockQty || initialData.totalCopies || prev.stockQty,
        // These are now full URLs returned by the API like:
        // https://yourdomain.com/uploads/frontImage-123.jpg
        frontImage: initialData.frontImage || "",
        backImage: initialData.backImage || "",
        bookCode: initialData.bookCode || prev.bookCode,
        kabatNumber: initialData.kabatNumber || prev.kabatNumber,
        bookSize: initialData.bookSize || prev.bookSize,
        tikakar: initialData.tikakar || prev.tikakar,
        prakashak: initialData.prakashak || prev.prakashak,
        sampadak: initialData.sampadak || prev.sampadak,
        anuvadak: initialData.anuvadak || prev.anuvadak,
        vishay: initialData.vishay || prev.vishay,
        shreni1: initialData.shreni1 || prev.shreni1,
        shreni2: initialData.shreni2 || prev.shreni2,
        shreni3: initialData.shreni3 || prev.shreni3,
        pages: initialData.pages || prev.pages,
        yearAD: initialData.yearAD || prev.yearAD,
        vikramSamvat: initialData.vikramSamvat || prev.vikramSamvat,
        veerSamvat: initialData.veerSamvat || prev.veerSamvat,
        prakar: initialData.prakar || prev.prakar,
        edition: initialData.edition || prev.edition,
        isAvailable: initialData.isAvailable ?? prev.isAvailable,
        featured: initialData.featured ?? prev.featured,
      }))
      setFrontPreview(initialData.frontImage || null)
      setBackPreview(initialData.backImage || null)
    }
  }, [initialData])

  // Extract just the filename from a full URL
  // e.g. "https://domain.com/uploads/frontImage-123.jpg" → "frontImage-123.jpg"
  const extractFilename = (url: string): string => {
    if (!url) return ""
    if (url.includes('/uploads/')) {
      return url.split('/uploads/').pop() || ""
    }
    // If it's already just a filename, return as-is
    if (!url.startsWith('http') && !url.startsWith('/')) {
      return url
    }
    return ""
  }

  // Resolve preview URL for <Image> component
  const resolveImageUrl = (preview: string | null): string => {
    if (!preview) return "/placeholder.svg"
    // Newly selected file (data URL)
    if (preview.startsWith('data:')) return preview
    // Full URL returned by API
    if (preview.startsWith('http')) return preview
    return "/placeholder.svg"
  }

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" })
        return
      }
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'front') {
          setFrontImageFile(file)
          setFrontPreview(reader.result as string)
        } else {
          setBackImageFile(file)
          setBackPreview(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (type: 'front' | 'back') => {
    if (type === 'front') {
      setFrontImageFile(null)
      setFrontPreview(null)
      updateField('frontImage', "")
      if (frontInputRef.current) frontInputRef.current.value = ""
    } else {
      setBackImageFile(null)
      setBackPreview(null)
      updateField('backImage', "")
      if (backInputRef.current) backInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.title.trim()) throw new Error("Title is required")
      if (!formData.bookCode) throw new Error("Book Code is required")

      const fd = new FormData()

      // Text fields
      fd.append('title', formData.title.trim())
      fd.append('author', formData.author.trim() || "")
      fd.append('description', formData.description.trim() || "")
      fd.append('categoryId', String(formData.categoryId || ""))
      fd.append('languageId', String(formData.languageId || 1))
      fd.append('price', String(formData.price || 0))
      fd.append('stockQty', String(formData.stockQty || 0))
      fd.append('bookCode', String(formData.bookCode || 0))
      fd.append('kabatNumber', String(formData.kabatNumber || ""))
      fd.append('bookSize', formData.bookSize?.trim() || "")
      fd.append('tikakar', formData.tikakar?.trim() || "")
      fd.append('prakashak', formData.prakashak?.trim() || "")
      fd.append('sampadak', formData.sampadak?.trim() || "")
      fd.append('anuvadak', formData.anuvadak?.trim() || "")
      fd.append('vishay', formData.vishay?.trim() || "")
      fd.append('shreni1', formData.shreni1?.trim() || "")
      fd.append('shreni2', formData.shreni2?.trim() || "")
      fd.append('shreni3', formData.shreni3?.trim() || "")
      fd.append('pages', String(formData.pages || ""))
      fd.append('yearAD', String(formData.yearAD || ""))
      fd.append('vikramSamvat', String(formData.vikramSamvat || ""))
      fd.append('veerSamvat', String(formData.veerSamvat || ""))
      fd.append('prakar', formData.prakar?.trim() || "")
      fd.append('edition', String(formData.edition || ""))
      fd.append('isAvailable', String(Boolean(formData.isAvailable)))
      fd.append('featured', String(Boolean(formData.featured)))

      // Images:
      // - If new file selected → send the File object (multer saves it to disk)
      // - If existing image and no new file → send just the filename string
      //   so backend keeps the old file without overwriting
      // - If image was removed → don't append anything (backend sets to null)

      if (frontImageFile) {
        // New file selected — send as File
        fd.append('frontImage', frontImageFile)
      } else if (formData.frontImage) {
        // Existing image — extract filename from full URL and send as text
        const filename = extractFilename(formData.frontImage)
        if (filename) fd.append('frontImageFilename', filename)
      }

      if (backImageFile) {
        fd.append('backImage', backImageFile)
      } else if (formData.backImage) {
        const filename = extractFilename(formData.backImage)
        if (filename) fd.append('backImageFilename', filename)
      }

      let result
      if (isEditing && bookId) {
        result = await booksApi.update(bookId, fd)
      } else {
        result = await booksApi.create(fd)
      }

      toast({
        title: "Success",
        description: `Book ${isEditing ? "updated" : "added"} successfully!`,
      })
      onSubmit(result)

    } catch (error: any) {
      console.error(`Error ${isEditing ? "updating" : "adding"} book:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "add"} book.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Basic Information */}
      <AccordionSection
        title="Basic Information"
        isExpanded={expandedSections.basic}
        onToggle={() => toggleSection('basic')}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Book Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => updateField('author', e.target.value)}
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookCode">Book Code *</Label>
            <Input
              id="bookCode"
              type="number"
              value={formData.bookCode}
              onChange={(e) => updateField('bookCode', e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kabatNumber">Kabat Number</Label>
            <Input
              id="kabatNumber"
              type="number"
              value={formData.kabatNumber}
              onChange={(e) => updateField('kabatNumber', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              disabled={isSubmitting}
              className="min-h-[80px]"
              maxLength={1000}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Classification */}
      <AccordionSection
        title="Classification"
        isExpanded={expandedSections.classification}
        onToggle={() => toggleSection('classification')}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={String(formData.categoryId)}
              onValueChange={(value) => updateField('categoryId', value)}
              disabled={isSubmitting || isCategoriesLoading}
            >
              <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={String(formData.languageId)}
              onValueChange={(value) => updateField('languageId', value)}
              disabled={isSubmitting || isLanguagesLoading}
            >
              <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
              <SelectContent>
                {languages.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vishay">Vishay (Subject)</Label>
            <Input
              id="vishay"
              value={formData.vishay}
              onChange={(e) => updateField('vishay', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prakar">Prakar (Type)</Label>
            <Input
              id="prakar"
              value={formData.prakar}
              onChange={(e) => updateField('prakar', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shreni1">Shreni 1</Label>
            <Input
              id="shreni1"
              value={formData.shreni1}
              onChange={(e) => updateField('shreni1', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shreni2">Shreni 2</Label>
            <Input
              id="shreni2"
              value={formData.shreni2}
              onChange={(e) => updateField('shreni2', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shreni3">Shreni 3</Label>
            <Input
              id="shreni3"
              value={formData.shreni3}
              onChange={(e) => updateField('shreni3', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Contributors */}
      <AccordionSection
        title="Contributors"
        isExpanded={expandedSections.contributors}
        onToggle={() => toggleSection('contributors')}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tikakar">Tikakar</Label>
            <Input
              id="tikakar"
              value={formData.tikakar}
              onChange={(e) => updateField('tikakar', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prakashak">Prakashak (Publisher)</Label>
            <Input
              id="prakashak"
              value={formData.prakashak}
              onChange={(e) => updateField('prakashak', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sampadak">Sampadak (Editor)</Label>
            <Input
              id="sampadak"
              value={formData.sampadak}
              onChange={(e) => updateField('sampadak', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anuvadak">Anuvadak (Translator)</Label>
            <Input
              id="anuvadak"
              value={formData.anuvadak}
              onChange={(e) => updateField('anuvadak', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Publication Details */}
      <AccordionSection
        title="Publication Details"
        isExpanded={expandedSections.publication}
        onToggle={() => toggleSection('publication')}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pages">Pages</Label>
            <Input
              id="pages"
              type="number"
              value={formData.pages}
              onChange={(e) => updateField('pages', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookSize">Book Size</Label>
            <Input
              id="bookSize"
              value={formData.bookSize}
              onChange={(e) => updateField('bookSize', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edition">Edition</Label>
            <Input
              id="edition"
              type="number"
              value={formData.edition}
              onChange={(e) => updateField('edition', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearAD">Year (AD)</Label>
            <Input
              id="yearAD"
              type="number"
              value={formData.yearAD}
              onChange={(e) => updateField('yearAD', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vikramSamvat">Vikram Samvat</Label>
            <Input
              id="vikramSamvat"
              type="number"
              value={formData.vikramSamvat}
              onChange={(e) => updateField('vikramSamvat', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="veerSamvat">Veer Samvat</Label>
            <Input
              id="veerSamvat"
              type="number"
              value={formData.veerSamvat}
              onChange={(e) => updateField('veerSamvat', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Pricing & Stock */}
      <AccordionSection
        title="Pricing & Stock"
        isExpanded={expandedSections.pricing}
        onToggle={() => toggleSection('pricing')}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockQty">Stock Quantity</Label>
            <Input
              id="stockQty"
              type="number"
              value={formData.stockQty}
              onChange={(e) => updateField('stockQty', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Input
              id="isAvailable"
              type="checkbox"
              checked={Boolean(formData.isAvailable)}
              onChange={(e) => updateField('isAvailable', e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isAvailable">Available for Sale</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              id="featured"
              type="checkbox"
              checked={Boolean(formData.featured)}
              onChange={(e) => updateField('featured', e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="featured">Featured Book</Label>
          </div>
        </div>
      </AccordionSection>

      {/* Book Images */}
      <AccordionSection
        title="Book Images"
        isExpanded={expandedSections.images}
        onToggle={() => toggleSection('images')}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Front Image */}
          <div className="space-y-2">
            <Label>Front Cover Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] relative bg-muted/30 hover:bg-muted/50 transition-colors">
              {frontPreview ? (
                <div className="relative w-full h-full min-h-[200px]">
                  <Image
                    src={resolveImageUrl(frontPreview)}
                    alt="Front Cover"
                    fill
                    className="object-contain rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => removeImage('front')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center"
                  onClick={() => !isSubmitting && frontInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload front cover</span>
                  <span className="text-xs text-muted-foreground mt-1">Max 5MB</span>
                </div>
              )}
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, 'front')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Back Image */}
          <div className="space-y-2">
            <Label>Back Cover Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] relative bg-muted/30 hover:bg-muted/50 transition-colors">
              {backPreview ? (
                <div className="relative w-full h-full min-h-[200px]">
                  <Image
                    src={resolveImageUrl(backPreview)}
                    alt="Back Cover"
                    fill
                    className="object-contain rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => removeImage('back')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center"
                  onClick={() => !isSubmitting && backInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload back cover</span>
                  <span className="text-xs text-muted-foreground mt-1">Max 5MB</span>
                </div>
              )}
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e, 'back')}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Adding..."}
            </>
          ) : (
            isEditing ? "Update Book" : "Add Book"
          )}
        </Button>
      </div>
    </form>
  )
}

