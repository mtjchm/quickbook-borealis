import { Role } from '../types/index';
import sharp from 'sharp';
import { BlobServiceClient } from '@azure/storage-blob';
import path from 'path';

// check whether the authenticated user is allowed to manage this company.
export function isCompanyAdmin(user: any, companyOwnerId: number) {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true; // global admin
  return user.userId === companyOwnerId; // company owner
}


// Process an input image buffer before uploading (api/upload)
export async function processImageBuffer(input: Buffer): Promise<Buffer> {
  // target dimensions for header
  const target = { ratio: 128 / 35, width: 1280, height: 350 };

  // read metadata with sharp
  const img = sharp(input);
  const meta = await img.metadata();
  const currentRatio = meta.width / meta.height;

  // center-crop to correct ratio then resize
  let pipeline = img;
  if (Math.abs(currentRatio - target.ratio)) {
    const srcWidth = meta.width;
    const srcHeight = meta.height;
    let cropWidth = srcWidth;
    let cropHeight = srcHeight; // set new center for crop box

    const srcRatio = srcWidth / srcHeight;
    if (srcRatio > target.ratio) {
      cropWidth = Math.round(srcHeight * target.ratio); // source is wider -> reduce width
    } else {
      cropHeight = Math.round(srcWidth / target.ratio); // source is taller -> reduce height
    }

    const left = Math.round((srcWidth - cropWidth) / 2); 
    const top = Math.round((srcHeight - cropHeight) / 2);

    pipeline = pipeline.extract({ left, top, width: cropWidth, height: cropHeight });
  }

  // Resize to target dimensions, convert to png
  const out = await pipeline
    .resize(target.width, target.height, { fit: 'cover' })
    .png()
    .toBuffer();

  return out;
}


 // Upload png buffer; return blob URL
export async function uploadBuffer(blobName: string, buffer: Buffer, contentType = 'image/png'): Promise<string> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
  const containerName = process.env.AZURE_STORAGE_CONTAINER || '';
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // basename since blobName can include slashes
  const safeName = path.basename(blobName);
  const blockBlobClient = containerClient.getBlockBlobClient(safeName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlobClient.url;
}