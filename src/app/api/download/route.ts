import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";

        // Case 1: JSON payload (e.g., base64 PDF or other file)
        if (contentType.includes("application/json")) {
            const { fileBase64, filename, mimeType } = await request.json();

            if (!fileBase64 || !filename) {
                return NextResponse.json({ error: "Missing fileBase64 or filename" }, { status: 400 });
            }

            // Default to application/octet-stream if MIME not provided
            const type = mimeType || "application/octet-stream";

            const base64Data = fileBase64.replace(/^data:[\w\/\-\+]+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");

            return new NextResponse(buffer, {
                headers: {
                    "Content-Type": type,
                    "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
                    "Content-Length": buffer.length.toString(),
                },
            });
        }

        // Case 2: FormData upload
        const formData = await request.formData();
        const file = formData.get("file") as Blob;
        const filename = formData.get("filename") as string;

        if (!file || !filename) {
            return NextResponse.json({ error: "Missing file or filename" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const type = (file as File).type || "application/octet-stream";

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": type,
                "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
                "Content-Length": buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Download API error:", error);
        return NextResponse.json({ error: "Failed to process download" }, { status: 500 });
    }
}
