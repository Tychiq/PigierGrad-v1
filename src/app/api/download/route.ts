import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const { pdfBase64, filename } = await request.json();
      
      if (!pdfBase64 || !filename) {
        return NextResponse.json({ error: "Missing pdfBase64 or filename" }, { status: 400 });
      }
      
      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }
    
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const filename = formData.get("filename") as string;

    if (!file || !filename) {
      return NextResponse.json({ error: "Missing file or filename" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const mimeType = (file as File).type || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json({ error: "Failed to process download" }, { status: 500 });
  }
}
