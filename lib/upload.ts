import { Id } from "../convex/_generated/dataModel";

export interface UploadFile {
  /** Local file URI returned by expo-image-picker or expo-document-picker */
  uri: string;
  /** MIME type, e.g. "image/jpeg" or "video/mp4" */
  type: string;
  /** Original filename (used for logging / display only) */
  name: string;
}

/**
 * Upload a local file to Convex built-in file storage.
 *
 * @param file               File descriptor with uri, type, and name.
 * @param generateUploadUrl  Mutation that returns a presigned upload URL.
 * @param getUrl             Mutation that resolves a storageId to a permanent URL.
 * @returns                  The permanent public URL of the uploaded file.
 */
export async function uploadFile(
  file: UploadFile,
  generateUploadUrl: () => Promise<string>,
  getUrl: (args: { storageId: Id<"_storage"> }) => Promise<string>
): Promise<string> {
  // Step 1: Get a presigned upload URL from Convex
  const uploadUrl = await generateUploadUrl();

  // Step 2: Read the local file as a blob
  const blobRes = await fetch(file.uri);
  if (!blobRes.ok) {
    throw new Error(`Failed to read local file: ${file.uri}`);
  }
  const blob = await blobRes.blob();

  // Step 3: POST the blob to the Convex upload URL
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(
      `Failed to upload file (${uploadRes.status}): ${uploadRes.statusText}`
    );
  }

  const { storageId } = (await uploadRes.json()) as { storageId: string };

  // Step 4: Get the canonical serving URL from Convex
  const publicUrl = await getUrl({ storageId: storageId as Id<"_storage"> });
  return publicUrl;
}
