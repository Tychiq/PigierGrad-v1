import { supabase } from "./supabase";

/**
 * Triggers a download in a new browser tab.
 */
export async function triggerDownload(blob: Blob, filename: string): Promise<void> {
    try {
        // Step 1: Upload to Supabase bucket
        const fileExt = filename.split(".").pop();
        const filePath = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("exports")
            .upload(filePath, blob, {
                contentType: blob.type,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // Step 2: Get public URL
        const { data } = supabase.storage.from("exports").getPublicUrl(filePath);
        if (!data?.publicUrl) throw new Error("Could not generate public URL");

        // Step 3: Open in new tab
        const newTab = window.open(data.publicUrl, "_blank");
        if (!newTab) throw new Error("Failed to open new tab. Check your popup blocker.");

        // Optional Step 4: Cleanup Supabase after a delay
        setTimeout(() => {
            supabase.storage.from("exports").remove([filePath]).catch(console.error);
        }, 60000);

    } catch (error) {
        console.error("Download helper error:", error);
        throw error;
    }
}
