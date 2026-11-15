import imageCompression from "browser-image-compression";

export async function compressAndUploadImage(file: File): Promise<string> {
  const options = {
    maxSizeMB: 0.25, // Máximo 250KB para carregar instantâneo no 4G
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
  };

  let fileToUpload: File = file;
  try {
    fileToUpload = await imageCompression(file, options);
  } catch (error) {
    console.warn("Falha ao comprimir imagem, enviando original:", error);
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Configuração do Cloudinary ausente nas variáveis de ambiente.");
  }

  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao enviar imagem para o Cloudinary.");
  }

  const data = await response.json();
  // Retorna URL já otimizada com qualidade e formato automáticos
  return data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
}
