import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const rawBackendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://127.0.0.1:5000/api';

// Strip trailing slashes from the backend URL
const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '');

// Hop-by-hop headers that must NOT be forwarded to avoid fetch failures in Node.js
const HOP_BY_HOP_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
]);

async function handleProxy(req: NextRequest) {
  try {
    // Strip the `/api/proxy` prefix and keep query parameters
    const pathname = req.nextUrl.pathname.replace('/api/proxy', '');
    const searchParams = req.nextUrl.search;
    const target = `${BACKEND_URL}${pathname}${searchParams}`;

    // Clean headers for forwarding
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!HOP_BY_HOP_HEADERS.has(lowerKey)) {
        headers.set(key, value);
      }
    });

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    // Forward request payload for mutation methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const text = await req.text();
        if (text) {
          options.body = text;
          headers.set('content-type', 'application/json');
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

    let res: Response;
    try {
      res = await fetch(target, options);
    } catch (primaryErr) {
      // If localhost failed (e.g. Windows IPv6 ::1 vs IPv4 127.0.0.1 mismatch), retry with 127.0.0.1
      if (target.includes('localhost')) {
        const ipv4Target = target.replace('localhost', '127.0.0.1');
        res = await fetch(ipv4Target, options);
      } else {
        throw primaryErr;
      }
    }

    // Read response body as ArrayBuffer to handle all content types
    const data = await res.arrayBuffer();

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!HOP_BY_HOP_HEADERS.has(lowerKey) && lowerKey !== 'content-encoding') {
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
        error: error.message || 'fetch failed',
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
