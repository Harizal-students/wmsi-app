import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const { image, type } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${image}`,
      {
        folder: 'wmsi-screenshots',
        public_id: `${type}-${Date.now()}`,
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto:low' },
          { fetch_format: 'jpg' }
        ]
      }
    );

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      size: uploadResult.bytes
    });

  } catch (error: any) {
    console.error('[Cloudinary] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}