import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || 'sample.wav';

  if (!request.body) {
      return new NextResponse('No body', { status: 400 });
  }

  // Upload to Vercel Blob
  // access: 'public' is fine for this demo, allows simple playback
  try {
      const blob = await put(`samples/${userId}/${filename}`, request.body, {
        access: 'public',
      });

      return NextResponse.json(blob);
  } catch (err) {
      console.error(err);
      return new NextResponse('Upload failed', { status: 500 });
  }
}
