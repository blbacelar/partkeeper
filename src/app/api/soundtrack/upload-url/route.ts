import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const DEFAULT_BUCKET = 'soundtracks'
const PUBLIC_BUCKET_OPTIONS = {
  public: true,
  fileSizeLimit: 25 * 1024 * 1024, // 25 MB
  allowedMimeTypes: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/flac',
    'audio/aac',
  ],
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType } = (await request.json()) as {
      fileName?: string
      contentType?: string
    }

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 })
    }

    const safeName = sanitizeFileName(fileName)
    const extension = safeName.includes('.') ? safeName.split('.').pop() : 'mp3'
    const uniquePath = `soundtracks/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
    const bucket = process.env.SUPABASE_BUCKET_NAME || DEFAULT_BUCKET

    // Ensure bucket exists
    const { data: existingBucket } = await supabaseAdmin.storage.getBucket(bucket)
    if (!existingBucket) {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucket, PUBLIC_BUCKET_OPTIONS)
      if (bucketError && !bucketError.message.includes('already exists')) {
        console.error('Failed to create bucket:', bucketError)
        return NextResponse.json({ error: 'Failed to prepare storage bucket' }, { status: 500 })
      }
    }

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(uniquePath)

    if (signedError || !signedData) {
      console.error('Failed to create signed upload URL:', signedError)
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
    }

    if (contentType && !PUBLIC_BUCKET_OPTIONS.allowedMimeTypes.includes(contentType)) {
      console.warn('Unsupported content type provided:', contentType)
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(uniquePath)

    return NextResponse.json({
      uploadUrl: signedData.signedUrl,
      token: signedData.token,
      path: uniquePath,
      publicUrl,
    })
  } catch (error) {
    console.error('Error generating soundtrack upload URL:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}

