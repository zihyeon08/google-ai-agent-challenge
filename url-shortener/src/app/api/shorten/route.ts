import { NextResponse } from 'next/server';
import { UrlService, InvalidUrlException } from '@/services/UrlService';
import { repository } from '@/repositories/UrlRepository';

const urlService = new UrlService(repository);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originalUrl } = body;

    if (!originalUrl) {
      return NextResponse.json({ error: 'originalUrl is required' }, { status: 400 });
    }

    const shortId = await urlService.shortenUrl(originalUrl);
    
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const shortUrl = `${protocol}://${host}/${shortId}`;

    return NextResponse.json({ shortId, shortUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidUrlException) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
