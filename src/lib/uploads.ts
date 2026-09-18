import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Guarda una imagen subida por formulario bajo public/uploads/<subfolder>/ y devuelve su URL publica. */
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return { url: `/uploads/${subfolder}/${filename}` };
}
