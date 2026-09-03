import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const rawBackendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:5000/api';

// Strip trailing slashes from the backend URL
const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '');

async function handleProxy(req: NextRequest) {
  try {
    // Strip the `/api/proxy` prefix and keep query parameters
    const pathname = req.nextUrl.pathname.replace('/api/proxy', '');
    const searchParams = req.nextUrl.search;
    const target = `${BACKEND_URL}${pathname}${searchParams}`;

    console.log('Proxy forwarding to:', target);

    // Forward request headers (excluding host and content-length)
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'host' && lowerKey !== 'content-length') {
        headers.set(key, value);
      }
    });

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    // Forward body for HTTP methods that support a payload
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const text = await req.text();
        if (text) {
          options.body = text;
        }
      } else if (contentType.includes('multipart/form-data')) {
        options.body = await req.formData();
      } else {
        const bodyBuf = await req.arrayBuffer();
        if (bodyBuf.byteLength > 0) {
          options.body = bodyBuf;
        }
      }
    }

    const res = await fetch(target, options);

    // Get response body as ArrayBuffer to handle all formats (JSON, text, binary)
    const data = await res.arrayBuffer();

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'transfer-encoding' &&
        lowerKey !== 'content-encoding' &&
        lowerKey !== 'content-length'
      ) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(data, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      {
        message: 'Proxy error connecting to backend API',
        error: error.message,
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const HEAD = handleProxy;
