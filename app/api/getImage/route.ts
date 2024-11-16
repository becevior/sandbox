import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export async function GET() {
  try {
    const command = new GetObjectCommand({
      Bucket: 'connerbeckwith-images',
      Key: 'headshot.jpg'
    });

    const response = await s3Client.send(command);
    const stream = await response.Body?.transformToByteArray();

    if (!stream) {
      return new NextResponse('Image not found', { status: 404 });
    }

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error fetching image from S3:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}