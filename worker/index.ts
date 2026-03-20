export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  BACKEND_ORIGIN: string;
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function buildUpstreamUrl(requestUrl: string, backendOrigin: string): URL {
  const incoming = new URL(requestUrl);
  return new URL(incoming.pathname + incoming.search, normalizeOrigin(backendOrigin));
}

function stripHopByHopAndCorsRequestHeaders(headers: Headers): Headers {
  const next = new Headers(headers);

  // Avoid backend CORS logic; this is a server-to-server fetch.
  next.delete('origin');
  next.delete('access-control-request-method');
  next.delete('access-control-request-headers');

  // Hop-by-hop headers.
  next.delete('connection');
  next.delete('keep-alive');
  next.delete('proxy-authenticate');
  next.delete('proxy-authorization');
  next.delete('te');
  next.delete('trailers');
  next.delete('transfer-encoding');
  next.delete('upgrade');

  return next;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Reverse-proxy API calls so the SPA can always use same-origin `/api/...`.
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      if (!env.BACKEND_ORIGIN || !env.BACKEND_ORIGIN.trim()) {
        return new Response('BACKEND_ORIGIN is not configured', { status: 500 });
      }

      if (request.method === 'OPTIONS') {
        // Same-origin preflight shouldn't happen, but make it safe.
        return new Response(null, { status: 204 });
      }

      const upstreamUrl = buildUpstreamUrl(request.url, env.BACKEND_ORIGIN);
      const init: RequestInit = {
        method: request.method,
        headers: stripHopByHopAndCorsRequestHeaders(request.headers),
        redirect: 'manual',
      };

      // Only forward body when allowed.
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
      }

      return fetch(new Request(upstreamUrl.toString(), init));
    }

    return env.ASSETS.fetch(request);
  },
};
