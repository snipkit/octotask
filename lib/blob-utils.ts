import { put, list, del } from "@vercel/blob"

// Upload a file to Vercel Blob
export async function uploadTaskAttachment(file: File, taskId: string) {
  try {
    const blob = await put(`tasks/${taskId}/${file.name}`, file, {
      access: "public",
    })

    return {
      success: true,
      url: blob.url,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    }
  } catch (error) {
    console.error("Error uploading file to Blob:", error)
    return { success: false, error }
  }
}

// List all attachments for a task
export async function listTaskAttachments(taskId: string) {
  try {
    const { blobs } = await list({
      prefix: `tasks/${taskId}/`,
    })

    return {
      success: true,
      attachments: blobs.map((blob) => ({
        url: blob.url,
        fileName: blob.pathname.split("/").pop(),
        contentType: blob.contentType,
        size: blob.size,
      })),
    }
  } catch (error) {
    console.error("Error listing task attachments:", error)
    return { success: false, error }
  }
}

// Delete an attachment
export async function deleteTaskAttachment(url: string) {
  try {
    await del(url)
    return { success: true }
  } catch (error) {
    console.error("Error deleting attachment:", error)
    return { success: false, error }
  }
}
