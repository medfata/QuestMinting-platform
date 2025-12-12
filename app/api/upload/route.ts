import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, uploadMetadata, generateNFTMetadata, uploadNFTWithMetadata } from '@/lib/services/ipfs';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Pinata free tier limit)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;

    if (action === 'upload-image') {
      // Single image upload
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large. Max size: 25MB' }, { status: 400 });
      }

      const result = await uploadFile(file);
      return NextResponse.json(result);
    }

    if (action === 'upload-images') {
      // Multiple images upload
      const files: File[] = [];
      const groupName = formData.get('groupName') as string;
      
      formData.forEach((value, key) => {
        if (key.startsWith('file-') && value instanceof File) {
          files.push(value);
        }
      });

      if (files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }

      // Validate all files
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          return NextResponse.json({ error: `Invalid file type: ${file.name}` }, { status: 400 });
        }
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: `File too large: ${file.name}` }, { status: 400 });
        }
      }

      const results = [];
      for (const file of files) {
        const result = await uploadFile(file, groupName ? `${groupName}-${file.name}` : undefined);
        results.push({ ...result, fileName: file.name });
      }

      return NextResponse.json({ uploads: results });
    }

    if (action === 'upload-metadata') {
      // Upload metadata JSON
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const imageCid = formData.get('imageCid') as string;
      const attributesJson = formData.get('attributes') as string;
      const externalUrl = formData.get('externalUrl') as string;

      if (!name || !imageCid) {
        return NextResponse.json({ error: 'Name and imageCid are required' }, { status: 400 });
      }

      const attributes = attributesJson ? JSON.parse(attributesJson) : undefined;
      const metadata = generateNFTMetadata(name, description || '', imageCid, attributes, externalUrl);
      const result = await uploadMetadata(metadata, `${name}-metadata`);

      return NextResponse.json(result);
    }

    if (action === 'upload-nft') {
      // Upload image + generate metadata in one step
      const file = formData.get('file') as File;
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const attributesJson = formData.get('attributes') as string;
      const externalUrl = formData.get('externalUrl') as string;

      if (!file || !name) {
        return NextResponse.json({ error: 'File and name are required' }, { status: 400 });
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large. Max size: 25MB' }, { status: 400 });
      }

      const attributes = attributesJson ? JSON.parse(attributesJson) : undefined;
      const result = await uploadNFTWithMetadata(file, name, description || '', attributes, externalUrl);

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
