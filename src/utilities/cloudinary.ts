import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageBufferToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  originalName?: string,
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const publicId = originalName
      ? `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      : `${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          return reject(error || new Error('Cloudinary upload failed'));
        }
        resolve(result.secure_url);
      },
    );

    stream.end(fileBuffer);
  });
}

function extractCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const match = parsedUrl.pathname.match(
      /\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/,
    );

    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function deleteCloudinaryImageByUrl(url?: string): Promise<void> {
  if (!url) {
    return;
  }

  const publicId = extractCloudinaryPublicIdFromUrl(url);

  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
}
