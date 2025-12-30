import { supabase } from "./supabase";

/**
 * Triggers a file download by uploading it to a temporary Supabase storage bucket
 * and opening the public/signed URL in a new tab via Orchids' postMessage.
 * This bypasses iframe sandbox restrictions and modern browser blocks on data URIs.
 */
export async function triggerDownload(
  blob: Blob,
  filename: string
): Promise<void> {
  try {
    const fileExt = filename.split(".").pop();
    const filePath = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    // 1. Upload to the exports bucket
    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 2. Get a public URL (since we made the bucket public)
    const { data } = supabase.storage.from("exports").getPublicUrl(filePath);

    if (!data?.publicUrl) throw new Error("Could not generate public URL");

    // 3. Use Orchids' postMessage to open the URL
    // We append ?download=1 to hint to the browser/API if needed, 
    // but the bucket and blob should already handle it.
    window.parent.postMessage({ 
      type: "OPEN_EXTERNAL_URL", 
      data: { url: data.publicUrl } 
    }, "*");

    // 4. Optional: Clean up after a delay (since it's a temp export)
    // We don't wait for this
    setTimeout(() => {
      supabase.storage.from("exports").remove([filePath]).catch(console.error);
    }, 60000); // 1 minute cleanup
    
  } catch (error) {
    console.error("Download helper error:", error);
    throw error;
  }
}
