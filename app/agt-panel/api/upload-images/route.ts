// import { NextRequest, NextResponse } from 'next/server';
// import { writeFile, mkdir, readFile } from 'fs/promises';
// import path from 'path';
// import fs from 'fs';

// export async function POST(request: NextRequest) {
//     try {
//         const contentType = request.headers.get('content-type') || '';

//         // Handle multipart/form-data (manual file uploads from form)
//         if (contentType.includes('multipart/form-data')) {
//             const formData = await request.formData();
//             const files = formData.getAll('files') as File[];

//             if (!files || files.length === 0) {
//                 return NextResponse.json({ error: "No files provided" }, { status: 400 });
//             }

//             const uploadDir = path.join(process.cwd(), 'public', 'books');

//             try {
//                 await mkdir(uploadDir, { recursive: true });
//             } catch (err) {
//                 // Already exists
//             }

//             const uploadedFiles: string[] = [];
//             for (const file of files) {
//                 const buffer = Buffer.from(await file.arrayBuffer());
//                 const filename = file.name;

//                 const filePath = path.join(uploadDir, filename);
//                 await writeFile(filePath, buffer);

//                 // Return the filename so it can be saved in the database
//                 uploadedFiles.push(filename);
//             }

//             return NextResponse.json({
//                 message: "Files uploaded successfully",
//                 uploadedFiles
//             });
//         }

//         // Handle JSON (local path processing for Excel import)
//         const body = await request.json();
//         const { paths, returnData } = body as { paths: string[], returnData?: boolean };

//         if (!paths || !Array.isArray(paths)) {
//             return NextResponse.json({ error: "No paths provided" }, { status: 400 });
//         }

//         const uploadDir = path.join(process.cwd(), 'public', 'books');

//         try {
//             await mkdir(uploadDir, { recursive: true });
//         } catch (err) {
//             // Already exists
//         }

//         const results = {
//             success: 0,
//             failed: 0,
//             uploadedFiles: [] as any[], // Can now be strings or objects with data
//             errors: [] as string[]
//         };

//         for (const localPath of paths) {
//             if (!localPath) continue;

//             try {
//                 const normalizedPath = path.normalize(localPath.trim());

//                 if (!fs.existsSync(normalizedPath)) {
//                     results.failed++;
//                     results.errors.push(`File not found: ${localPath}`);
//                     continue;
//                 }

//                 const buffer = await readFile(normalizedPath);
//                 const filename = path.basename(normalizedPath);

//                 const filePath = path.join(uploadDir, filename);
//                 await writeFile(filePath, buffer);

//                 results.success++;
//                 if (returnData) {
//                     const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
//                     results.uploadedFiles.push({
//                         path: localPath,
//                         filename: filename,
//                         data: `data:${mimeType};base64,${buffer.toString('base64')}`
//                     });
//                 } else {
//                     results.uploadedFiles.push(filename);
//                 }
//             } catch (error: any) {
//                 console.error(`Error processing path ${localPath}:`, error);
//                 results.failed++;
//                 results.errors.push(`Error reading ${localPath}: ${error.message}`);
//             }
//         }

//         return NextResponse.json({
//             message: "Local import completed",
//             results
//         });
//     } catch (error: any) {
//         console.error("Image upload/import error:", error);
//         return NextResponse.json({ error: error.message }, { status: 500 });
//     }
// }
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const files = formData.getAll('files') as File[];

            if (!files || files.length === 0) {
                return NextResponse.json({ error: "No files provided" }, { status: 400 });
            }

            const uploadDir = path.join(process.cwd(), 'public', 'books');
            await mkdir(uploadDir, { recursive: true });

            const uploadedFiles: string[] = [];
            for (const file of files) {
                const buffer = Buffer.from(await file.arrayBuffer());
                await writeFile(path.join(uploadDir, file.name), buffer);
                uploadedFiles.push(file.name);
            }

            return NextResponse.json({ message: "Files uploaded successfully", uploadedFiles });
        }

        // JSON path-based import
        const body = await request.json();
        const { paths, returnData } = body as { paths: string[], returnData?: boolean };

        if (!paths || !Array.isArray(paths)) {
            return NextResponse.json({ error: "No paths provided" }, { status: 400 });
        }

        const results = {
            success: 0,
            failed: 0,
            uploadedFiles: [] as any[],
            errors: [] as string[]
        };

        for (const localPath of paths) {
            if (!localPath) continue;

            try {
                // Normalize handles both Windows (C:\...) and Unix (/home/...) paths
                const normalizedPath = path.normalize(localPath.trim())

                if (!fs.existsSync(normalizedPath)) {
                    results.failed++;
                    results.errors.push(`File not found: ${localPath}`);
                    continue;
                }

                const buffer = await readFile(normalizedPath);
                const filename = path.basename(normalizedPath);

                // Detect mime type from extension
                const ext = filename.toLowerCase().split('.').pop()
                const mimeMap: Record<string, string> = {
                    jpg: 'image/jpeg', jpeg: 'image/jpeg',
                    png: 'image/png', webp: 'image/webp', gif: 'image/gif'
                }
                const mimeType = mimeMap[ext || ''] || 'image/jpeg'

                results.success++;

                if (returnData) {
                    results.uploadedFiles.push({
                        path: localPath,   // original path — used as key in imageMap
                        filename,
                        data: `data:${mimeType};base64,${buffer.toString('base64')}`
                    });
                } else {
                    results.uploadedFiles.push(filename);
                }

            } catch (error: any) {
                results.failed++;
                results.errors.push(`Error reading ${localPath}: ${error.message}`);
            }
        }

        return NextResponse.json({ message: "Local import completed", results });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
