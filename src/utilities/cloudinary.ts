import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type CloudinaryResourceType = 'image' | 'raw';

function uploadBufferToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  resourceType: CloudinaryResourceType,
  originalName?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const publicId = originalName
      ? `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      : `${Date.now()}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
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

export async function uploadImageBufferToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  originalName?: string,
): Promise<string> {
  return uploadBufferToCloudinary(fileBuffer, folder, 'image', originalName);
}

export async function uploadRawBufferToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  originalName?: string,
): Promise<string> {
  return uploadBufferToCloudinary(fileBuffer, folder, 'raw', originalName);
}

function extractCloudinaryPublicIdFromUrl(
  url: string,
  resourceType: CloudinaryResourceType,
): string | null {
  try {
    const parsedUrl = new URL(url);
    const match = parsedUrl.pathname.match(
      new RegExp(
        `\\/${resourceType}\\/upload\\/(?:v\\d+\\/)?(.+)\\.[a-zA-Z0-9]+$`,
      ),
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

  const publicId = extractCloudinaryPublicIdFromUrl(url, 'image');

  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
}

export async function deleteCloudinaryRawByUrl(url?: string): Promise<void> {
  if (!url) {
    return;
  }

  const publicId = extractCloudinaryPublicIdFromUrl(url, 'raw');

  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
  });
}
