import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Guarda una imagen subida por formulario y devuelve su URL publica.
 * En Vercel el sistema de archivos es efimero y lo que se escribe en tiempo de
 * ejecucion no queda expuesto por la red, asi que ahi se usa Vercel Blob
 * (activo cuando BLOB_READ_WRITE_TOKEN esta configurado). En desarrollo local,
 * sin ese token, se guarda en public/uploads/<subfolder>/ como antes.
 */
export async function saveUploadedImage(
  formData: FormData,
  subfolder: string
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No se recibió ningún archivo." };
  }

  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) {
    return { error: "Formato no soportado. Usa JPG, PNG o WEBP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "La imagen no debe superar 4 MB." };
  }

  const filename = `${randomUUID()}.${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${subfolder}/${filename}`, file, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return { url: `/uploads/${subfolder}/${filename}` };
}
