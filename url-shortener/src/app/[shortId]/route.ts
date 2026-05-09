import { NextResponse } from 'next/server';
import { UrlService, NotFoundException, ExpiredException } from '@/services/UrlService';
import { repository } from '@/repositories/UrlRepository';

const urlService = new UrlService(repository);

export async function GET(request: Request, { params }: { params: Promise<{ shortId: string }> }) {
  try {
    const { shortId } = await params;
    const originalUrl = await urlService.getOriginalUrl(shortId);

    return NextResponse.redirect(originalUrl, 301);
  } catch (error) {
    if (error instanceof NotFoundException) {
      return new NextResponse('URL Not Found', { status: 404 });
    }
    if (error instanceof ExpiredException) {
      return new NextResponse('URL Expired', { status: 410 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
