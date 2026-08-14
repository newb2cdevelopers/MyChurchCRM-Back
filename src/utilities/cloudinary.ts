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
    // Strip the file extension from the original name so Cloudinary does not
    // append the format extension again (e.g. avoid "file.pdf.pdf").
    const publicId = originalName
      ? `${Date.now()}-${originalName
          .replace(/\.[^.]+$/, '')
          .replace(/[^a-zA-Z0-9._-]/g, '_')}`
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

/**
 * Parses a Cloudinary image delivery URL into its public ID and version.
 * The public ID is returned without the file extension so the signed URL can
 * be rebuilt with an explicit format.
 */
function parseCloudinaryImageUrl(
  url: string,
): { publicId: string; version?: string } | null {
  try {
    const parsedUrl = new URL(url);
    const match = parsedUrl.pathname.match(
      /\/image\/upload\/(?:v(\d+)\/)?(.+)\.[a-zA-Z0-9]+$/,
    );
    if (!match) {
      return null;
    }
    return { publicId: match[2], version: match[1] };
  } catch {
    return null;
  }
}

const SIGNED_URL_DEFAULT_TTL_SECONDS = 3600;

/**
 * Generates a time-limited download URL for a PDF stored as an image resource.
 *
 * The account restricts PDF delivery on the public CDN ("Restricted media
 * types"), which rejects even signed CDN URLs with a 401. This method uses
 * Cloudinary's authenticated API download endpoint instead, which is not
 * subject to that delivery restriction. It behaves like an AWS S3 presigned
 * URL: access is refreshed on every list request and expires after the TTL.
 */
export function getSignedPdfUrl(
  url?: string,
  ttlSeconds = SIGNED_URL_DEFAULT_TTL_SECONDS,
): string | undefined {
  if (!url) {
    return undefined;
  }

  const parsed = parseCloudinaryImageUrl(url);

  if (!parsed) {
    return url;
  }

  return cloudinary.utils.private_download_url(parsed.publicId, 'pdf', {
    resource_type: 'image',
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
}
