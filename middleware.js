export const config = {
  matcher: '/:path*',
};

export default async function middleware(request) {
  const TARGET_HOST = 'xyzstore.rf.gd'; // Domain asli lu
  const url = new URL(request.url);
  const currentHost = request.headers.get('host');

  url.hostname = TARGET_HOST;
  url.protocol = 'https:';

  const requestHeaders = new Headers(request.headers);
  // Ini kunci agar iFastNet tidak nge-blokir/suspended:
  requestHeaders.set('host', TARGET_HOST);
  requestHeaders.set('referer', `https://${TARGET_HOST}`);

  const response = await fetch(url.toString(), {
    method: request.method,
    headers: requestHeaders,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(response.headers);
  const location = responseHeaders.get('location');
  if (location) {
    responseHeaders.set('location', location.replaceAll(TARGET_HOST, currentHost));
  }

  responseHeaders.delete('content-security-policy');
  responseHeaders.delete('x-frame-options');

  const contentType = responseHeaders.get('content-type') || '';
  if (contentType.includes('text/') || contentType.includes('json') || contentType.includes('javascript')) {
    let text = await response.text();
    text = text.replaceAll(TARGET_HOST, currentHost);
    return new Response(text, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}