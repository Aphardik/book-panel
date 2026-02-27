// "use client"

// import { useState } from "react"
// import { Button } from "@/agt-panel/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/agt-panel/components/ui/dialog"
// import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Download, FileIcon } from "lucide-react"
// import { useToast } from "@/agt-panel/components/ui/use-toast"
// import * as XLSX from 'xlsx'
// import { booksApi } from "@/agt-panel/lib/api-client"

// interface ExcelBookRow {
//     'पुस्तक कोड / नंबर': any
//     'कबाट नंबर': any
//     'बुक साइज': any
//     'पुस्तक का नाम': any
//     'माहिती': any
//     'कर्ता/लेखक': any
//     'टीकाकार': any
//     'प्रकाशक': any
//     'संपादक': any
//     'अनुवादक': any
//     'भाषा': any
//     'विषय': any
//     'श्रेणि ૧': any
//     'श्रेणि ૨': any
//     'श्रेणि ૩': any
//     'पाना': any
//     'इ. स.': any
//     'विक्रम संवत': any
//     'वीर संवत': any
//     'किमत': any
//     'प्रकार': any
//     'खाસ પુસ્તક': any
//     'आवृत्ति': any
//     'front-cover'?: any
//     'back-cover'?: any
// }

// interface ImportResult {
//     success: number
//     failed: number
//     errors: string[]
// }

// export default function ExcelImportDialog({ open, onOpenChange, onImportComplete }: {
//     open: boolean
//     onOpenChange: (open: boolean) => void
//     onImportComplete: () => void
// }) {
//     const [excelFile, setExcelFile] = useState<File | null>(null)
//     const [importing, setImporting] = useState(false)
//     const [result, setResult] = useState<ImportResult | null>(null)
//     const { toast } = useToast()

//     const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const selectedFile = e.target.files?.[0]
//         if (selectedFile) {
//             if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
//                 selectedFile.type === 'application/vnd.ms-excel') {
//                 setExcelFile(selectedFile)
//                 setResult(null)
//             } else {
//                 toast({
//                     title: "Invalid File",
//                     description: "Please select an Excel file (.xlsx or .xls)",
//                     variant: "destructive"
//                 })
//             }
//         }
//     }

//     const parseExcelData = async (file: File): Promise<ExcelBookRow[]> => {
//         return new Promise((resolve, reject) => {
//             const reader = new FileReader()
//             reader.onload = (e) => {
//                 try {
//                     const data = e.target?.result
//                     const workbook = XLSX.read(data, { type: 'binary' })
//                     const sheetName = workbook.SheetNames[0]
//                     const worksheet = workbook.Sheets[sheetName]
//                     const jsonData = XLSX.utils.sheet_to_json<ExcelBookRow>(worksheet)
//                     resolve(jsonData)
//                 } catch (error) {
//                     reject(error)
//                 }
//             }
//             reader.onerror = () => reject(new Error('Failed to read file'))
//             reader.readAsBinaryString(file)
//         })
//     }

//     const mapExcelRowToBook = (row: any) => {
//         const parseNum = (val: any) => {
//             if (val === undefined || val === null || val === '') return null;
//             const parsed = parseInt(String(val).replace(/[^0-9.-]/g, ''));
//             return isNaN(parsed) ? null : parsed;
//         };

//         const parseFloatNum = (val: any) => {
//             if (val === undefined || val === null || val === '') return null;
//             const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
//             return isNaN(parsed) ? null : parsed;
//         };

//         const langStr = String(row['भाषा'] || '').trim();
//         const languageMap: { [key: string]: number } = {
//             'हिंदी': 1, 'हि': 1, 'हि.': 1, 'Sanskrit': 1,
//             'गुजराती': 2, 'ગુ': 2, 'ગુ.': 2,
//             'अंग्रेजी': 3, 'Eng': 3,
//             'सं': 1,
//         }

//         const isFeatured = String(row['खाસ પુસ્તક'] || row['खाસ પુસ્તક'] || row['खास पुस्तक'] || '').toLowerCase();
//         const featured = isFeatured === 'yes' || isFeatured === 'true' || isFeatured === 'હા' || isFeatured === 'हा';

//         // Helper to extract filename from a potential path for database reference
//         const getFilename = (val: any) => {
//             if (!val) return null;
//             const s = String(val);
//             return s.split(/[\\/]/).pop() || null;
//         }

//         const frontFilename = getFilename(row['front-cover']);
//         const backFilename = getFilename(row['back-cover']);

//         return {
//             bookCode: parseNum(row['पुस्तक कोड / नंबर']) || 0,
//             kabatNumber: parseNum(row['कबाट नंबर']),
//             bookSize: String(row['बुक साइज'] || '').trim() || null,
//             title: String(row['पुस्तक का नाम'] || '').trim(),
//             description: String(row['माहितી'] || '').trim() || null,
//             author: String(row['कर्ता/लेखक'] || '').trim() || null,
//             tikakar: String(row['टीकाकार'] || '').trim() || null,
//             prakashak: String(row['प्रकाशक'] || '').trim() || null,
//             sampadak: String(row['संपादक'] || '').trim() || null,
//             anuvadak: String(row['अनुवादक'] || '').trim() || null,
//             vishay: String(row['विषय'] || '').trim() || null,
//             shreni1: String(row['শ্রেणि ૧'] || '').trim() || null,
//             shreni2: String(row['শ্রেणि ૨'] || '').trim() || null,
//             shreni3: String(row['শ্রেणि ૩'] || '').trim() || null,
//             pages: parseNum(row['पाના'] || row['પાના']),
//             yearAD: parseNum(row['इ. स.']),
//             vikramSamvat: parseNum(row['विक્રમ સંવત'] || row['विक्रम संवत']),
//             veerSamvat: parseNum(row['વીર સંવત'] || row['वीर संवत']),
//             price: parseFloatNum(row['કિમત'] || row['किमत']),
//             prakar: String(row['પ્રકાર'] || row['प्रकार'] || '').trim() || null,
//             edition: parseNum(row['આવૃત્તિ'] || row['आवृत्ति']),
//             isAvailable: true,
//             featured: featured,
//             languageId: languageMap[langStr] || 1,
//             categoryId: null,
//             stockQty: 1,
//             frontImage: frontFilename || null,
//             backImage: backFilename || null
//         }
//     }

//     const dataURLtoFile = (dataurl: string, filename: string) => {
//         const arr = dataurl.split(',')
//         const mime = arr[0].match(/:(.*?);/)?.[1]
//         const bstr = atob(arr[1])
//         let n = bstr.length
//         const u8arr = new Uint8Array(n)
//         while (n--) {
//             u8arr[n] = bstr.charCodeAt(n)
//         }
//         return new File([u8arr], filename, { type: mime })
//     }

//     const handleImport = async () => {
//         if (!excelFile) {
//             toast({ title: "No File Selected", description: "Please select an Excel file", variant: "destructive" })
//             return
//         }

//         setImporting(true)
//         try {
//             // 1. Parse Excel data
//             const excelData = await parseExcelData(excelFile)
//             if (excelData.length === 0) {
//                 toast({ title: "Empty File", description: "The Excel file contains no data", variant: "destructive" })
//                 setImporting(false)
//                 return
//             }

//             // 2. Collect image paths
//             const pathsToUploadSet = new Set<string>();
//             excelData.forEach(row => {
//                 if (row['front-cover']) pathsToUploadSet.add(String(row['front-cover']));
//                 if (row['back-cover']) pathsToUploadSet.add(String(row['back-cover']));
//             });
//             const pathsToUpload = Array.from(pathsToUploadSet);

//             // 3. Fetch Base64 Image Data
//             const imageMap = new Map<string, string>();
//             if (pathsToUpload.length > 0) {
//                 const imgRes = await fetch('/api/upload-images', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ paths: pathsToUpload, returnData: true })
//                 });

//                 if (imgRes.ok) {
//                     const imgData = await imgRes.json();
//                     imgData.results?.uploadedFiles?.forEach((file: any) => {
//                         imageMap.set(file.path, file.data);
//                     });
//                 }
//             }

//             // 4. Map books with embedded Base64
//             const preparedBooks = excelData.map(row => {
//                 const book = mapExcelRowToBook(row);
//                 const frontPath = String(row['front-cover'] || "");
//                 const backPath = String(row['back-cover'] || "");
//                 return {
//                     ...book,
//                     frontImage: imageMap.get(frontPath) || null,
//                     backImage: imageMap.get(backPath) || null
//                 };
//             });

//             // 5. Send JSON to Backend
//             const response = await booksApi.bulkCreate({ books: preparedBooks })
//             const createdCount = response.count || 0
//             const failedCount = excelData.length - createdCount

//             setResult({
//                 success: createdCount,
//                 failed: failedCount,
//                 errors: failedCount > 0 ? ["Some books failed to import"] : []
//             })

//             if (createdCount > 0) {
//                 if (onImportComplete) onImportComplete()
//                 toast({ title: "Import Complete", description: `Successfully imported ${createdCount} books.` })
//             }
//         } catch (error: any) {
//             console.error("Bulk import error:", error)
//             toast({ title: "Import Failed", description: error.message, variant: "destructive" })
//         } finally {
//             setImporting(false)
//         }
//     }

//     const handleDownloadSample = () => {
//         const headers = [
//             'पुस्तक कोड / नंबर', 'कबाट नंबर', 'बुक साइज', 'पुस्तक का नाम', 'माहिती',
//             'कर्ता/लेखक', 'टीकाकार', 'प्रकाशक', 'संपादक', 'अनुवादक', 'भाषा',
//             'विषय', 'श्रेणि ૧', 'श्रेणि ૨', 'श्रेणि ૩', 'पाना', 'इ. स.',
//             'विक्रम संवत', 'वीर संवत', 'किमत', 'प्रकार', 'खाસ પુસ્તક', 'आवृत्ति',
//             'front-cover', 'back-cover'
//         ];
//         const sampleData = [{
//             'पुस्तक कोड / नंबर': 101, 'कबाट नंबर': 5, 'बुक साइज': 'Pocket', 'पुस्तक का नाम': 'Sample Book', 'माहिती': 'Desc',
//             'कर्ता/लेखक': 'Author', 'टीकाकार': 'Comm', 'प्रकाशक': 'Pub', 'संपादक': 'Ed', 'अनुवादक': 'Trans', 'भाषा': 'हिंदी',
//             'विषय': 'Jainism', 'श्रेणि ૧': 'Cat1', 'श्रेणि ૨': 'Cat2', 'श्रेणि ૩': 'Cat3', 'पाना': 250, 'इ. स.': 2023,
//             'विक्रम संवत': 2079, 'वीर संवत': 2549, 'किमत': 150.00, 'प्रकार': 'Hard', 'खाસ પુસ્તક': 'Yes', 'आवृत्ति': 1,
//             'front-cover': 'C:\\Images\\cover101_front.jpg', 'back-cover': 'C:\\Images\\cover101_back.jpg'
//         }];
//         const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
//         const workbook = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(workbook, worksheet, "Books");
//         XLSX.writeFile(workbook, "book_import_sample.xlsx");
//     }

//     const handleClose = () => {
//         setExcelFile(null)
//         setResult(null)
//         onOpenChange(false)
//     }

//     return (
//         <Dialog open={open} onOpenChange={handleClose}>
//             <DialogContent className="max-w-2xl text-slate-900 border-none shadow-2xl bg-white/95 backdrop-blur-xl">
//                 <DialogHeader>
//                     <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-800 bg-clip-text text-transparent">
//                         <Upload className="h-6 w-6 text-gray-800" />
//                         Import CSV
//                     </DialogTitle>
//                     <DialogDescription className="text-slate-600 font-medium">
//                         Images will be automatically loaded from your local file system using the paths provided in your Excel file.
//                     </DialogDescription>
//                 </DialogHeader>

//                 <div className="space-y-8 py-6">
//                     <div className="space-y-4">
//                         <div className="flex justify-between items-center">
//                             <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
//                                 <FileIcon className="h-4 w-4" /> Excel Mapping
//                             </h4>
//                             <Button variant="outline" size="sm" onClick={handleDownloadSample} className="text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all rounded-full px-4 shadow-sm hover:translate-y-[-1px]">
//                                 <Download className="h-3.5 w-3.5 mr-1.5" /> Download Example
//                             </Button>
//                         </div>

//                         <div className="relative group">
//                             <input
//                                 type="file"
//                                 accept=".xlsx,.xls"
//                                 onChange={handleExcelChange}
//                                 className="hidden"
//                                 id="excel-upload"
//                             />
//                             <div
//                                 onClick={() => !importing && document.getElementById('excel-upload')?.click()}
//                                 className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden
//                                     ${excelFile
//                                         ? 'border-green-400 bg-green-50/50 hover:bg-green-50'
//                                         : 'border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'
//                                     }`}
//                             >
//                                 <div className={`h-10 w-10 mx-auto rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 transform
//                                     ${excelFile ? 'bg-green-100 text-green-600 scale-110 shadow-green-100 shadow-xl' : 'bg-white text-slate-300 shadow-sm group-hover:scale-110 group-hover:shadow-blue-100 group-hover:shadow-xl'}
//                                 `}>
//                                     <FileSpreadsheet color="green" className="h-10 w-10" />
//                                 </div>
//                                 <h3 className={`text-lg font-bold mb-2 ${excelFile ? 'text-green-700' : 'text-slate-700'}`}>
//                                     {excelFile ? excelFile.name : "Select your Excel data file"}
//                                 </h3>
//                                 {/* <p className="text-sm text-slate-400 max-w-[280px] mx-auto leading-relaxed">
//                                     Include <b>front-cover</b> and <b>back-cover</b> columns with full image paths like <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">C:\Photos\01.jpg</code>
//                                 </p> */}
//                             </div>
//                         </div>
//                     </div>

//                     {result && (
//                         <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
//                             <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-3xl shadow-sm">
//                                 <div className="h-12 w-12 bg-green-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
//                                     <CheckCircle2 className="h-6 w-6" />
//                                 </div>
//                                 <div>
//                                     <p className="text-xs font-black uppercase tracking-widest text-green-600/60">Success</p>
//                                     <p className="text-2xl font-black text-green-700">{result.success}</p>
//                                 </div>
//                             </div>
//                             <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-3xl shadow-sm">
//                                 <div className="h-12 w-12 bg-red-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
//                                     <XCircle className="h-6 w-6" />
//                                 </div>
//                                 <div>
//                                     <p className="text-xs font-black uppercase tracking-widest text-red-600/60">Failed</p>
//                                     <p className="text-2xl font-black text-red-700">{result.failed}</p>
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {result?.errors && result.errors.length > 0 && (
//                         <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl max-h-32 overflow-y-auto custom-scrollbar">
//                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Import Logs</p>
//                             <ul className="text-[11px] font-medium text-slate-500 space-y-1.5">
//                                 {result.errors.map((e, i) => (
//                                     <li key={i} className="flex gap-2">
//                                         <span className="text-red-400">•</span>
//                                         {e}
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     )}

//                     <div className="flex justify-between items-center pt-2">
//                         <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
//                             {importing ? "Processing data..." : "Ready to sync"}
//                         </p>
//                         <div className="flex gap-3">
//                             <Button variant="ghost" onClick={handleClose} disabled={importing} className="font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full px-6 transition-all">
//                                 Cancel
//                             </Button>
//                             {!result && (
//                                 <Button
//                                     onClick={handleImport}
//                                     disabled={!excelFile || importing}
//                                     className="h-12 font-black uppercase tracking-widest bg-slate-900 hover:bg-blue-600 text-white shadow-xl shadow-slate-200 hover:shadow-blue-200 transition-all rounded-full px-8 flex items-center gap-3 transform active:scale-95"
//                                 >
//                                     {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
//                                     Start Import
//                                 </Button>
//                             )}
//                             {result && (
//                                 <Button onClick={handleClose} className="h-12 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 shadow-xl shadow-blue-100">
//                                     Done
//                                 </Button>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     )
// }

// "use client"

// import { useState } from "react"
// import { Button } from "@/agt-panel/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/agt-panel/components/ui/dialog"
// import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Download, FileIcon } from "lucide-react"
// import { useToast } from "@/agt-panel/components/ui/use-toast"
// import * as XLSX from 'xlsx'
// import { booksApi } from "@/agt-panel/lib/api-client"

// interface ExcelBookRow {
//     'पुस्तक कोड / नंबर': any
//     'कबाट नंबर': any
//     'बुक साइज': any
//     'पुस्तक का नाम': any
//     'माहिती': any
//     'कर्ता/लेखक': any
//     'टीकाकार': any
//     'प्रकाशक': any
//     'संपादक': any
//     'अनुवादक': any
//     'भाषा': any
//     'विषय': any
//     'श्रेणि ૧': any
//     'श्रेणि ૨': any
//     'श्रेणि ૩': any
//     'पाना': any
//     'इ. स.': any
//     'विक्रम संवत': any
//     'वीर संवत': any
//     'किमत': any
//     'प्रकार': any
//     'खाસ પુસ્તક': any
//     'आवृत्ति': any
//     'front-cover'?: any
//     'back-cover'?: any
// }

// interface ImportResult {
//     success: number
//     failed: number
//     errors: string[]
// }

// export default function ExcelImportDialog({ open, onOpenChange, onImportComplete }: {
//     open: boolean
//     onOpenChange: (open: boolean) => void
//     onImportComplete: () => void
// }) {
//     const [excelFile, setExcelFile] = useState<File | null>(null)
//     const [importing, setImporting] = useState(false)
//     const [result, setResult] = useState<ImportResult | null>(null)
//     const [importProgress, setImportProgress] = useState("")
//     const { toast } = useToast()

//     const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const selectedFile = e.target.files?.[0]
//         if (selectedFile) {
//             if (
//                 selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
//                 selectedFile.type === 'application/vnd.ms-excel'
//             ) {
//                 setExcelFile(selectedFile)
//                 setResult(null)
//             } else {
//                 toast({
//                     title: "Invalid File",
//                     description: "Please select an Excel file (.xlsx or .xls)",
//                     variant: "destructive"
//                 })
//             }
//         }
//     }

//     const parseExcelData = async (file: File): Promise<ExcelBookRow[]> => {
//         return new Promise((resolve, reject) => {
//             const reader = new FileReader()
//             reader.onload = (e) => {
//                 try {
//                     const data = e.target?.result
//                     const workbook = XLSX.read(data, { type: 'binary' })
//                     const sheetName = workbook.SheetNames[0]
//                     const worksheet = workbook.Sheets[sheetName]
//                     const jsonData = XLSX.utils.sheet_to_json<ExcelBookRow>(worksheet)
//                     resolve(jsonData)
//                 } catch (error) {
//                     reject(error)
//                 }
//             }
//             reader.onerror = () => reject(new Error('Failed to read file'))
//             reader.readAsBinaryString(file)
//         })
//     }

//     const mapExcelRowToBook = (row: any) => {
//         const parseNum = (val: any) => {
//             if (val === undefined || val === null || val === '') return null
//             const parsed = parseInt(String(val).replace(/[^0-9.-]/g, ''))
//             return isNaN(parsed) ? null : parsed
//         }
//         const parseFloatNum = (val: any) => {
//             if (val === undefined || val === null || val === '') return null
//             const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ''))
//             return isNaN(parsed) ? null : parsed
//         }

//         const langStr = String(row['भाषा'] || '').trim()
//         const languageMap: { [key: string]: number } = {
//             'हिंदी': 1, 'हि': 1, 'हि.': 1, 'Sanskrit': 1,
//             'गुजराती': 2, 'ગુ': 2, 'ગુ.': 2,
//             'अंग्रेजी': 3, 'Eng': 3,
//             'सं': 1,
//         }

//         const isFeatured = String(row['खाસ પુસ્તક'] || row['खास पुस्तक'] || '').toLowerCase()
//         const featured = isFeatured === 'yes' || isFeatured === 'true' || isFeatured === 'હા' || isFeatured === 'हा'

//         return {
//             bookCode: parseNum(row['पुस्तक कोड / नंबर']) || 0,
//             kabatNumber: parseNum(row['कबाट नंबर']) ?? '',
//             bookSize: String(row['बुक साइज'] || '').trim(),
//             title: String(row['पुस्तक का नाम'] || '').trim(),
//             description: String(row['माहिती'] || '').trim(),
//             author: String(row['कर्ता/लेखक'] || '').trim(),
//             tikakar: String(row['टीकाकार'] || '').trim(),
//             prakashak: String(row['प्रकाशक'] || '').trim(),
//             sampadak: String(row['संपादक'] || '').trim(),
//             anuvadak: String(row['अनुवादक'] || '').trim(),
//             vishay: String(row['विषय'] || '').trim(),
//             shreni1: String(row['श्रेणि ૧'] || '').trim(),
//             shreni2: String(row['श्रेणि ૨'] || '').trim(),
//             shreni3: String(row['श्रेणि ૩'] || '').trim(),
//             pages: parseNum(row['पाना'] || row['પાના']) ?? '',
//             yearAD: parseNum(row['इ. स.']) ?? '',
//             vikramSamvat: parseNum(row['विक्रम संवत']) ?? '',
//             veerSamvat: parseNum(row['वीर संवत']) ?? '',
//             price: parseFloatNum(row['किमत']) ?? 0,
//             prakar: String(row['प्रकार'] || '').trim(),
//             edition: parseNum(row['आवृत्ति']) ?? '',
//             isAvailable: 'true',
//             featured: String(featured),
//             languageId: languageMap[langStr] || 1,
//             categoryId: '',
//             stockQty: 1,
//         }
//     }

//     const handleImport = async () => {
//         if (!excelFile) {
//             toast({ title: "No File Selected", description: "Please select an Excel file", variant: "destructive" })
//             return
//         }

//         setImporting(true)
//         setImportProgress("Parsing Excel file...")

//         try {
//             // 1. Parse Excel rows
//             const excelData = await parseExcelData(excelFile)
//             if (excelData.length === 0) {
//                 toast({ title: "Empty File", description: "The Excel file contains no data", variant: "destructive" })
//                 setImporting(false)
//                 return
//             }

//             // 2. Collect ALL unique image paths
//             const allPaths = new Set<string>()
//             excelData.forEach(row => {
//                 const front = String(row['front-cover'] || '').trim()
//                 const back = String(row['back-cover'] || '').trim()
//                 if (front) allPaths.add(front)
//                 if (back) allPaths.add(back)
//             })

//             setImportProgress(`Found ${excelData.length} books. Fetching ${allPaths.size} local images...`)

//             // 3. Fetch ALL images at once from local system via Next.js API
//             const imageMap = new Map<string, File>()
//             if (allPaths.size > 0) {
//                 try {
//                     const imgRes = await fetch('/api/upload-images', {
//                         method: 'POST',
//                         headers: { 'Content-Type': 'application/json' },
//                         body: JSON.stringify({ paths: Array.from(allPaths), returnData: true })
//                     })

//                     if (imgRes.ok) {
//                         const imgData = await imgRes.json()
//                         const uploadedFiles = imgData.results?.uploadedFiles || []

//                         setImportProgress(`Processing ${uploadedFiles.length} image files...`)

//                         for (const fileItem of uploadedFiles) {
//                             if (fileItem.data) {
//                                 // Convert base64 data URL → Blob → File
//                                 const blob = await fetch(fileItem.data).then(r => r.blob())
//                                 const filename = fileItem.filename || 'image.jpg'
//                                 const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
//                                 imageMap.set(fileItem.path, file)
//                             }
//                         }
//                     }
//                 } catch (err) {
//                     console.error("Local image pre-fetch failed:", err)
//                 }
//             }

//             setImportProgress(`Preparing bulk data for ${excelData.length} books...`)

//             // 4. Build ONE multipart FormData where:
//             //    - Text fields go as:  books[i][fieldName]
//             //    - Image files go as:  books[i][frontImage] and books[i][backImage]
//             const fd = new FormData()

//             for (let i = 0; i < excelData.length; i++) {
//                 const row = excelData[i]
//                 const book = mapExcelRowToBook(row)

//                 // Append text fields
//                 Object.entries(book).forEach(([key, value]) => {
//                     fd.append(`books[${i}][${key}]`, String(value ?? ''))
//                 })

//                 // Append front image from map if available
//                 const frontPath = String(row['front-cover'] || '').trim()
//                 if (frontPath && imageMap.has(frontPath)) {
//                     fd.append(`books[${i}][frontImage]`, imageMap.get(frontPath)!)
//                 }

//                 // Append back image from map if available
//                 const backPath = String(row['back-cover'] || '').trim()
//                 if (backPath && imageMap.has(backPath)) {
//                     fd.append(`books[${i}][backImage]`, imageMap.get(backPath)!)
//                 }
//             }

//             setImportProgress(`Sending bulk request to server...`)

//             // 5. POST to /api/books/bulk using booksApi
//             const responseData = await booksApi.bulkCreate(fd)

//             const successCount = responseData.count || 0
//             const failedCount = responseData.failed || 0
//             const errorList: string[] = responseData.errors
//                 ? responseData.errors.map((e: any) => `Book ${e.index + 1}: ${e.error}`)
//                 : []

//             setResult({ success: successCount, failed: failedCount, errors: errorList })

//             if (successCount > 0) {
//                 if (onImportComplete) onImportComplete()
//                 toast({
//                     title: "Import Complete",
//                     description: `Successfully imported ${successCount} of ${excelData.length} books.`
//                 })
//             }

//         } catch (error: any) {
//             console.error("Bulk import error:", error)
//             toast({ title: "Import Failed", description: error.message, variant: "destructive" })
//         } finally {
//             setImporting(false)
//             setImportProgress("")
//         }
//     }

//     const handleDownloadSample = () => {
//         const headers = [
//             'पुस्तक कोड / नंबर', 'कबाट नंबर', 'बुक साइज', 'पुस्तक का नाम', 'माहिती',
//             'कर्ता/लेखक', 'टीकाकार', 'प्रकाशक', 'संपादक', 'अनुवादक', 'भाषा',
//             'विषय', 'श्रेणि ૧', 'श्रेणि ૨', 'श्रेणि ૩', 'पाना', 'इ. स.',
//             'विक्रम संवत', 'वीर संवत', 'किमत', 'प्रकार', 'खाસ પુસ્તक', 'आवृत्ति',
//             'front-cover', 'back-cover'
//         ]
//         const sampleData = [{
//             'पुस्तक कोड / नंबर': 101, 'कबाट नंबर': 5, 'बुक साइज': 'Pocket',
//             'पुस्तक का नाम': 'Sample Book', 'माहिती': 'Description here',
//             'कर्ता/लेखक': 'Author Name', 'टीकाकार': 'Commentator', 'प्रकाशक': 'Publisher',
//             'संपादक': 'Editor', 'अनुवादक': 'Translator', 'भाषा': 'हिंदी',
//             'विषय': 'Jainism', 'श्रेणि ૧': 'Cat1', 'श्रेणि ૨': 'Cat2', 'श्रेणि ૩': 'Cat3',
//             'पाना': 250, 'इ. स.': 2023, 'विक्रम संवत': 2079, 'वीर संवत': 2549,
//             'किमत': 150.00, 'प्रकार': 'Hard', 'खाસ પુસ્તક': 'Yes', 'आवृत्ति': 1,
//             'front-cover': 'C:\\Images\\cover101_front.jpg',
//             'back-cover': 'C:\\Images\\cover101_back.jpg'
//         }]
//         const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers })
//         const workbook = XLSX.utils.book_new()
//         XLSX.utils.book_append_sheet(workbook, worksheet, "Books")
//         XLSX.writeFile(workbook, "book_import_sample.xlsx")
//     }

//     const handleClose = () => {
//         if (importing) return
//         setExcelFile(null)
//         setResult(null)
//         setImportProgress("")
//         onOpenChange(false)
//     }

//     return (
//         <Dialog open={open} onOpenChange={handleClose}>
//             <DialogContent className="max-w-2xl text-slate-900 border-none shadow-2xl bg-white/95 backdrop-blur-xl">
//                 <DialogHeader>
//                     <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
//                         <Upload className="h-6 w-6 text-gray-800" />
//                         Import Excel
//                     </DialogTitle>
//                     <DialogDescription className="text-slate-600 font-medium">
//                         Images will be automatically loaded from your local file system using the paths in your Excel file.
//                     </DialogDescription>
//                 </DialogHeader>

//                 <div className="space-y-8 py-6">
//                     <div className="space-y-4">
//                         <div className="flex justify-between items-center">
//                             <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
//                                 <FileIcon className="h-4 w-4" /> Excel File
//                             </h4>
//                             <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={handleDownloadSample}
//                                 className="text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all rounded-full px-4 shadow-sm"
//                             >
//                                 <Download className="h-3.5 w-3.5 mr-1.5" /> Download Example
//                             </Button>
//                         </div>

//                         <div className="relative group">
//                             <input
//                                 type="file"
//                                 accept=".xlsx,.xls"
//                                 onChange={handleExcelChange}
//                                 className="hidden"
//                                 id="excel-upload"
//                                 disabled={importing}
//                             />
//                             <div
//                                 onClick={() => !importing && document.getElementById('excel-upload')?.click()}
//                                 className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer
//                                     ${importing ? 'opacity-50 cursor-not-allowed' :
//                                         excelFile
//                                             ? 'border-green-400 bg-green-50/50 hover:bg-green-50'
//                                             : 'border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'
//                                     }`}
//                             >
//                                 <div className={`h-10 w-10 mx-auto rounded-3xl flex items-center justify-center mb-6 transition-all duration-500
//                                     ${excelFile ? 'bg-green-100 scale-110 shadow-xl' : 'bg-white shadow-sm group-hover:scale-110'}`}
//                                 >
//                                     <FileSpreadsheet color="green" className="h-10 w-10" />
//                                 </div>
//                                 <h3 className={`text-lg font-bold mb-2 ${excelFile ? 'text-green-700' : 'text-slate-700'}`}>
//                                     {excelFile ? excelFile.name : "Select your Excel data file"}
//                                 </h3>
//                                 <p className="text-sm text-slate-400">Supports .xlsx and .xls files</p>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Progress */}
//                     {importing && importProgress && (
//                         <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
//                             <Loader2 className="h-5 w-5 animate-spin text-blue-500 shrink-0" />
//                             <p className="text-sm font-medium text-blue-700">{importProgress}</p>
//                         </div>
//                     )}

//                     {/* Results */}
//                     {result && (
//                         <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-3xl shadow-sm">
//                                     <div className="h-12 w-12 bg-green-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
//                                         <CheckCircle2 className="h-6 w-6" />
//                                     </div>
//                                     <div>
//                                         <p className="text-xs font-black uppercase tracking-widest text-green-600/60">Success</p>
//                                         <p className="text-2xl font-black text-green-700">{result.success}</p>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-3xl shadow-sm">
//                                     <div className="h-12 w-12 bg-red-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
//                                         <XCircle className="h-6 w-6" />
//                                     </div>
//                                     <div>
//                                         <p className="text-xs font-black uppercase tracking-widest text-red-600/60">Failed</p>
//                                         <p className="text-2xl font-black text-red-700">{result.failed}</p>
//                                     </div>
//                                 </div>
//                             </div>

//                             {result.errors && result.errors.length > 0 && (
//                                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl max-h-40 overflow-y-auto">
//                                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Import Logs</p>
//                                     <ul className="text-[11px] font-medium text-slate-500 space-y-1.5">
//                                         {result.errors.map((e, i) => (
//                                             <li key={i} className="flex gap-2">
//                                                 <span className="text-red-400">•</span>{e}
//                                             </li>
//                                         ))}
//                                     </ul>
//                                 </div>
//                             )}
//                         </div>
//                     )}

//                     <div className="flex justify-between items-center pt-2">
//                         <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
//                             {importing ? "Processing, please wait..." : "Ready to sync"}
//                         </p>
//                         <div className="flex gap-3">
//                             <Button
//                                 variant="ghost"
//                                 onClick={handleClose}
//                                 disabled={importing}
//                                 className="font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full px-6"
//                             >
//                                 Cancel
//                             </Button>
//                             {!result && (
//                                 <Button
//                                     onClick={handleImport}
//                                     disabled={!excelFile || importing}
//                                     className="h-12 font-black uppercase tracking-widest bg-slate-900 hover:bg-blue-600 text-white shadow-xl transition-all rounded-full px-8 flex items-center gap-3"
//                                 >
//                                     {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
//                                     {importing ? "Importing..." : "Start Import"}
//                                 </Button>
//                             )}
//                             {result && (
//                                 <Button
//                                     onClick={handleClose}
//                                     className="h-12 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 shadow-xl"
//                                 >
//                                     Done
//                                 </Button>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     )
// }

"use client"

import { useState, useCallback } from "react"
import { Button } from "@/agt-panel/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/agt-panel/components/ui/dialog"
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Download, FileIcon, ImageIcon, X } from "lucide-react"
import { useToast } from "@/agt-panel/components/ui/use-toast"
import * as XLSX from 'xlsx'

interface ExcelBookRow {
    'Book Code': any; 'Kabat Number': any; 'Book Size': any; 'Book Title': any
    'Description': any; 'Author': any; 'Tikakar': any; 'Publisher': any
    'Sampadak': any; 'Anuvadak': any; 'Language': any; 'Subject': any
    'Category 1': any; 'Category 2': any; 'Category 3': any; 'Pages': any
    'Year AD': any; 'Vikram Samvat': any; 'Veer Samvat': any; 'Price': any
    'Type': any; 'Featured': any; 'Edition': any
}

interface ImportResult {
    success: number; failed: number; errors: string[]
    imageStats?: { matched: number; total: number }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://agt-api.adhyatmparivar.com'

export default function ExcelImportDialog({ open, onOpenChange, onImportComplete }: {
    open: boolean; onOpenChange: (open: boolean) => void; onImportComplete: () => void
}) {
    const [excelFile, setExcelFile] = useState<File | null>(null)
    const [imageFiles, setImageFiles] = useState<Map<string, File>>(new Map())
    const [isDraggingImages, setIsDraggingImages] = useState(false)
    const [importing, setImporting] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [importProgress, setImportProgress] = useState("")
    const { toast } = useToast()

    // ── Excel handler ─────────────────────────────────────────────────────────
    const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        if (f.type.includes('spreadsheetml') || f.type.includes('ms-excel') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
            setExcelFile(f); setResult(null)
        } else {
            toast({ title: "Invalid File", description: "Please select an Excel file (.xlsx or .xls)", variant: "destructive" })
        }
    }

    // ── Image handlers ────────────────────────────────────────────────────────
    const addImages = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (!arr.length) return
        const newMap = new Map(imageFiles)
        arr.forEach(f => newMap.set(f.name, f))
        setImageFiles(newMap)
        toast({ title: `${arr.length} image${arr.length > 1 ? 's' : ''} added`, description: `${newMap.size} total images loaded` })
    }, [imageFiles, toast])

    const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) addImages(e.target.files)
        e.target.value = ''
    }

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingImages(true) }
    const handleDragLeave = () => setIsDraggingImages(false)
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDraggingImages(false)
        if (e.dataTransfer.files?.length) addImages(e.dataTransfer.files)
    }

    const removeImage = (name: string) => { const m = new Map(imageFiles); m.delete(name); setImageFiles(m) }
    const clearAllImages = () => setImageFiles(new Map())

    // ── Excel parsing ─────────────────────────────────────────────────────────
    const parseExcelData = async (file: File): Promise<ExcelBookRow[]> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const wb = XLSX.read(e.target?.result, { type: 'binary' })
                    resolve(XLSX.utils.sheet_to_json<ExcelBookRow>(wb.Sheets[wb.SheetNames[0]]))
                } catch (err) { reject(err) }
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsBinaryString(file)
        })

    // ── Row mapper ────────────────────────────────────────────────────────────
    const mapExcelRowToBook = (row: any) => {
        const parseNum = (v: any) => { const n = parseInt(String(v ?? '').replace(/[^0-9.-]/g, '')); return isNaN(n) ? null : n }
        const parseFloat2 = (v: any) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, '')); return isNaN(n) ? null : n }
        const langMap: Record<string, number> = {
            'हिंदी': 1, 'हि': 1, 'हि.': 1, 'सं': 1, 'Sanskrit': 1, 'Hindi': 1,
            'गुजराती': 2, 'ગુ': 2, 'ગુ.': 2, 'Gujarati': 2,
            'अंग्रेजी': 3, 'Eng': 3, 'English': 3
        }
        const isFeat = String(row['Featured'] || '').toLowerCase()
        return {
            bookCode: parseNum(row['Book Code']) || 0,
            kabatNumber: parseNum(row['Kabat Number']) ?? '',
            bookSize: String(row['Book Size'] || '').trim(),
            title: String(row['Book Title'] || '').trim(),
            description: String(row['Description'] || '').trim(),
            author: String(row['Author'] || '').trim(),
            tikakar: String(row['Tikakar'] || '').trim(),
            prakashak: String(row['Publisher'] || '').trim(),
            sampadak: String(row['Sampadak'] || '').trim(),
            anuvadak: String(row['Anuvadak'] || '').trim(),
            vishay: String(row['Subject'] || '').trim(),
            shreni1: String(row['Category 1'] || '').trim(),
            shreni2: String(row['Category 2'] || '').trim(),
            shreni3: String(row['Category 3'] || '').trim(),
            pages: parseNum(row['Pages']) ?? '',
            yearAD: parseNum(row['Year AD']) ?? '',
            vikramSamvat: parseNum(row['Vikram Samvat']) ?? '',
            veerSamvat: parseNum(row['Veer Samvat']) ?? '',
            price: parseFloat2(row['Price']) ?? 0,
            prakar: String(row['Type'] || '').trim(),
            edition: parseNum(row['Edition']) ?? '',
            isAvailable: 'true',
            featured: String(['yes', 'true', 'હા', 'हा'].includes(isFeat)),
            languageId: langMap[String(row['Language'] || '').trim()] || 1,
            categoryId: '',
            stockQty: 1,
        }
    }

    // ── Image finder — case-insensitive, strips extension ────────────────────
    // Matches files named: {bookCode}_f.jpg  or  {bookCode}_b.png  etc.
    const findImage = (bookCode: number, side: 'f' | 'b'): File | undefined => {
        const target = `${bookCode}_${side}`.toLowerCase()
        for (const [name, file] of imageFiles) {
            const nameWithoutExt = name.replace(/\.[^.]+$/, '').toLowerCase().trim()
            if (nameWithoutExt === target) return file
        }
        return undefined
    }

    // ── Main import ───────────────────────────────────────────────────────────
    const handleImport = async () => {
        if (!excelFile) {
            toast({ title: "No Excel File Selected", variant: "destructive" })
            return
        }
        setImporting(true)

        try {
            setImportProgress("Parsing Excel file...")
            const excelData = await parseExcelData(excelFile)

            if (!excelData.length) {
                toast({ title: "Empty File", description: "No data rows found in the Excel file.", variant: "destructive" })
                return
            }

            setImportProgress(`Preparing ${excelData.length} books...`)

            const fd = new FormData()
            let matchedImages = 0

            for (let i = 0; i < excelData.length; i++) {
                const book = mapExcelRowToBook(excelData[i])
                const bookCode = book.bookCode

                // Append all text fields
                Object.entries(book).forEach(([key, value]) => {
                    fd.append(
                        `books[${i}][${key}]`,
                        value === null || value === undefined ? '' : String(value)
                    )
                })

                // ── Front image ──
                const frontFile = findImage(bookCode, 'f')
                if (frontFile) {
                    const ext = frontFile.name.split('.').pop() || 'jpg'
                    const newName = `${bookCode}_f.${ext}`
                    // Pass filename as 3rd argument to fd.append — this sets
                    // file.originalname on the server regardless of File.name
                    fd.append(`books[${i}][frontImage]`, frontFile, newName)
                    matchedImages++
                    console.log(`✓ Front matched book ${bookCode}: "${frontFile.name}" → "${newName}"`)
                } else {
                    console.warn(`✗ No front image for bookCode ${bookCode}`)
                }

                // ── Back image ──
                const backFile = findImage(bookCode, 'b')
                if (backFile) {
                    const ext = backFile.name.split('.').pop() || 'jpg'
                    const newName = `${bookCode}_b.${ext}`
                    fd.append(`books[${i}][backImage]`, backFile, newName)
                    matchedImages++
                    console.log(`✓ Back matched book ${bookCode}: "${backFile.name}" → "${newName}"`)
                } else {
                    console.warn(`✗ No back image for bookCode ${bookCode}`)
                }
            }

            // ── FormData sanity check ─────────────────────────────────────
            console.group('=== FormData Debug ===')
            let fileCount = 0, fieldCount = 0
            for (const [key, value] of fd.entries()) {
                if (value instanceof File) {
                    console.log(`FILE  ${key} → name="${value.name}" size=${value.size}B type="${value.type}"`)
                    fileCount++
                } else {
                    fieldCount++
                }
            }
            console.log(`Summary: ${fieldCount} text fields | ${fileCount} image files`)
            if (fileCount === 0 && imageFiles.size > 0) {
                console.warn('⚠ Images loaded but NONE matched. Loaded filenames:')
                imageFiles.forEach((_, name) => console.warn(' ', name))
                console.warn('Expected pattern: {bookCode}_f.ext  or  {bookCode}_b.ext')
            }
            console.groupEnd()
            // ─────────────────────────────────────────────────────────────

            setImportProgress(`Uploading ${excelData.length} books with ${matchedImages} images...`)

            // DO NOT set Content-Type header — browser sets multipart/form-data + boundary automatically
            const response = await fetch(`${API_BASE}/api/books/bulk`, {
                method: 'POST',
                body: fd,
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: response.statusText }))
                throw new Error(err.error || err.message || `Import failed (${response.status})`)
            }

            const responseData = await response.json()
            const successCount = responseData.count || 0
            const failedCount = responseData.failed || 0

            setResult({
                success: successCount,
                failed: failedCount,
                errors: (responseData.errors || []).map((e: any) => `Book ${e.index + 1}: ${e.error}`),
                imageStats: { matched: matchedImages, total: imageFiles.size }
            })

            if (successCount > 0) {
                onImportComplete?.()
                toast({
                    title: "Import Complete",
                    description: `Imported ${successCount} of ${excelData.length} books (${matchedImages} images matched).`
                })
            }

        } catch (error: any) {
            console.error('Import error:', error)
            toast({ title: "Import Failed", description: error.message, variant: "destructive" })
        } finally {
            setImporting(false)
            setImportProgress("")
        }
    }

    // ── Sample download ───────────────────────────────────────────────────────
    const handleDownloadSample = () => {
        const headers = [
            'Book Code', 'Kabat Number', 'Book Size', 'Book Title', 'Description',
            'Author', 'Tikakar', 'Publisher', 'Sampadak', 'Anuvadak', 'Language', 'Subject',
            'Category 1', 'Category 2', 'Category 3', 'Pages', 'Year AD', 'Vikram Samvat',
            'Veer Samvat', 'Price', 'Type', 'Featured', 'Edition'
        ]
        const ws = XLSX.utils.json_to_sheet([{
            'Book Code': 101, 'Kabat Number': 5, 'Book Size': 'Pocket',
            'Book Title': 'Sample Book', 'Description': 'Description',
            'Author': 'Author', 'Tikakar': '', 'Publisher': 'Publisher',
            'Sampadak': '', 'Anuvadak': '', 'Language': 'Hindi', 'Subject': 'Jainism',
            'Category 1': 'Cat1', 'Category 2': '', 'Category 3': '', 'Pages': 250,
            'Year AD': 2023, 'Vikram Samvat': 2079, 'Veer Samvat': 2549, 'Price': 150,
            'Type': 'Hard', 'Featured': 'Yes', 'Edition': 1,
        }], { header: headers })
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Books")
        XLSX.writeFile(wb, "book_import_sample.xlsx")
    }

    const handleClose = () => {
        if (importing) return
        setExcelFile(null); setImageFiles(new Map()); setResult(null); setImportProgress("")
        onOpenChange(false)
    }

    const imageList = Array.from(imageFiles.entries())

    // ── UI ────────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-slate-900 border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                        <Upload className="h-6 w-6 text-gray-800" /> Import Excel
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 font-medium">
                        Name your images{' '}
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{'{bookCode}_f.jpg'}</code> for front
                        {' '}and{' '}
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{'{bookCode}_b.jpg'}</code> for back.
                        {' '}e.g.{' '}
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">101_f.jpg</code>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">

                    {/* ── Step 1: Excel ── */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <FileIcon className="h-3.5 w-3.5" /> Step 1 — Excel File
                            </h4>
                            <Button variant="outline" size="sm" onClick={handleDownloadSample}
                                className="text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full px-4 shadow-sm">
                                <Download className="h-3.5 w-3.5 mr-1.5" /> Download Template
                            </Button>
                        </div>

                        <input type="file" accept=".xlsx,.xls" onChange={handleExcelChange}
                            className="hidden" id="excel-upload" disabled={importing} />
                        <div
                            onClick={() => !importing && document.getElementById('excel-upload')?.click()}
                            className={`border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all duration-200
                                ${importing ? 'opacity-50 cursor-not-allowed' :
                                    excelFile
                                        ? 'border-green-400 bg-green-50/60'
                                        : 'border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${excelFile ? 'bg-green-100' : 'bg-white shadow-sm'}`}>
                                    <FileSpreadsheet className={`h-5 w-5 ${excelFile ? 'text-green-600' : 'text-slate-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${excelFile ? 'text-green-700' : 'text-slate-600'}`}>
                                        {excelFile ? excelFile.name : 'Click to select Excel file'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {excelFile ? `${(excelFile.size / 1024).toFixed(1)} KB` : 'Supports .xlsx and .xls'}
                                    </p>
                                </div>
                                {excelFile && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                            </div>
                        </div>
                    </div>

                    {/* ── Step 2: Images ── */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <ImageIcon className="h-3.5 w-3.5" /> Step 2 — Cover Images (Optional)
                                {imageFiles.size > 0 && (
                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        {imageFiles.size} loaded
                                    </span>
                                )}
                            </h4>
                            {imageFiles.size > 0 && !importing && (
                                <button onClick={clearAllImages}
                                    className="text-xs text-red-400 hover:text-red-600 font-bold transition-colors">
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                            <span className="text-base leading-none mt-0.5">💡</span>
                            <span>
                                Name files as <strong>101_f.jpg</strong> (front) and <strong>101_b.jpg</strong> (back)
                                where <strong>101</strong> is the book code from your Excel sheet.
                                Matching is case-insensitive.
                            </span>
                        </div>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !importing && document.getElementById('image-upload')?.click()}
                            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200
                                ${importing ? 'opacity-50 cursor-not-allowed' :
                                    isDraggingImages ? 'border-blue-400 bg-blue-50 scale-[1.01]' :
                                        imageFiles.size > 0
                                            ? 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/50'
                                            : 'border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'}`}
                        >
                            <input type="file" accept="image/*" multiple onChange={handleImageInputChange}
                                className="hidden" id="image-upload" disabled={importing} />
                            <div className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center mb-2
                                ${isDraggingImages ? 'bg-blue-100' : 'bg-white shadow-sm'}`}>
                                <ImageIcon className={`h-4 w-4 ${isDraggingImages ? 'text-blue-500' : 'text-slate-400'}`} />
                            </div>
                            <p className="text-sm font-bold text-slate-600">
                                {isDraggingImages ? 'Drop images here' : 'Click or drag & drop images'}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">Select all cover images at once</p>
                        </div>

                        {/* Image thumbnails grid */}
                        {imageList.length > 0 && (
                            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1">
                                {imageList.map(([name, file]) => (
                                    <div key={name} className="relative group aspect-square">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={name}
                                            className="w-full h-full object-cover rounded-lg border border-slate-200"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded-b-lg truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                            {name}
                                        </div>
                                        {!importing && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeImage(name) }}
                                                className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow-md"
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Progress ── */}
                    {importing && importProgress && (
                        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500 shrink-0" />
                            <p className="text-sm font-medium text-blue-700">{importProgress}</p>
                        </div>
                    )}

                    {/* ── Results ── */}
                    {result && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl">
                                    <div className="h-10 w-10 bg-green-400 rounded-xl flex items-center justify-center text-white shadow-md">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600/60">Success</p>
                                        <p className="text-2xl font-black text-green-700">{result.success}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-2xl">
                                    <div className="h-10 w-10 bg-red-400 rounded-xl flex items-center justify-center text-white shadow-md">
                                        <XCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-red-600/60">Failed</p>
                                        <p className="text-2xl font-black text-red-700">{result.failed}</p>
                                    </div>
                                </div>
                            </div>

                            {result.imageStats && (
                                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-500">
                                    <ImageIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span>
                                        <span className="text-blue-600 font-bold">{result.imageStats.matched}</span> cover images matched
                                        {' '}from <span className="font-bold">{result.imageStats.total}</span> uploaded
                                    </span>
                                </div>
                            )}

                            {result.errors.length > 0 && (
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl max-h-32 overflow-y-auto">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Import Logs</p>
                                    <ul className="text-[11px] font-medium text-slate-500 space-y-1">
                                        {result.errors.map((e, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="text-red-400">•</span>{e}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                            {importing ? "Processing, please wait..." : "Ready to sync"}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                disabled={importing}
                                className="font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full px-6"
                            >
                                Cancel
                            </Button>
                            {!result && (
                                <Button
                                    onClick={handleImport}
                                    disabled={!excelFile || importing}
                                    className="h-11 font-black uppercase tracking-widest bg-slate-900 hover:bg-blue-600 text-white shadow-xl transition-all rounded-full px-8 flex items-center gap-2"
                                >
                                    {importing
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <Upload className="h-4 w-4" />}
                                    {importing ? "Importing..." : "Start Import"}
                                </Button>
                            )}
                            {result && (
                                <Button
                                    onClick={handleClose}
                                    className="h-11 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 shadow-xl"
                                >
                                    Done
                                </Button>
                            )}
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}