import imageCompression from "browser-image-compression";

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB exato

export async function compressAndUploadImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2).replace(".", ",");
    throw new Error(
      `A imagem selecionada tem ${sizeInMb} MB. O limite máximo permitido é 1 MB por foto para manter o portal rápido.`
    );
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Configurações do Cloudinary ausentes nas variáveis de ambiente.");
  }

  // Comprime e otimiza ainda mais antes do envio
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 0.35, // Reduz para ~350 KB mantendo nitidez
    maxWidthOrHeight: 1400,
    useWebWorker: true,
    fileType: "image/webp",
  });

  const formData = new FormData();
  formData.append("file", compressedFile);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "caldas-online");

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
