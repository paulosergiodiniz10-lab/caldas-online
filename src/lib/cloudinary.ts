import imageCompression from "browser-image-compression";

const MAX_INPUT_SIZE_BYTES = 15 * 1024 * 1024; // Aceita até 15 MB da câmera do celular
const MAX_FINAL_SIZE_BYTES = 1 * 1024 * 1024; // Garante que o arquivo final comprimido tenha no máximo 1 MB

export async function compressAndUploadImage(file: File): Promise<string> {
  if (file.size > MAX_INPUT_SIZE_BYTES) {
    throw new Error("A imagem é muito pesada (acima de 15 MB). Escolha uma foto menor.");
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Configurações do Cloudinary ausentes nas variáveis de ambiente.");
  }

  // Comprime automaticamente no celular/PC do usuário antes de enviar (~200-280 KB em WebP)
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 0.28,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: "image/webp",
  });

  if (compressedFile.size > MAX_FINAL_SIZE_BYTES) {
    throw new Error("Não foi possível reduzir a imagem para menos de 1 MB.");
  }

  const formData = new FormData();
  formData.append("file", compressedFile);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "caldas-novas-online");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Falha ao enviar imagem para o servidor.");
  }

  const data = await response.json();
  return data.secure_url as string;
}

/**
 * Otimiza URLs do Cloudinary para entrega leve no navegador.
 * - Se a imagem já estiver em .webp (comprimida no upload), retorna a URL direta
 *   para evitar gasto desnecessário de créditos de transformação no plano Free.
 * - Se for JPG/PNG antigo ou externo no Cloudinary, aplica f_auto,q_auto automaticamente.
 */
export function optimizeCloudinaryUrl(url?: string): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  if (url.includes("/upload/f_auto") || url.toLowerCase().endsWith(".webp")) {
    return url;
  }
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}
