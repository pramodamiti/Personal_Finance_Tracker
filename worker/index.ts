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
  next.delete('host');
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

    if (url.pathname === '/__pft_debug') {
      return Response.json(
        {
          ok: true,
          backendOriginConfigured: Boolean(env.BACKEND_ORIGIN && env.BACKEND_ORIGIN.trim()),
          backendOrigin: env.BACKEND_ORIGIN ? normalizeOrigin(env.BACKEND_ORIGIN) : null,
          now: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Reverse-proxy API calls so the SPA can always use same-origin `/api/...`.
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      if (!env.BACKEND_ORIGIN || !env.BACKEND_ORIGIN.trim()) {
        return Response.json(
          {
            error: 'BACKEND_ORIGIN is not configured',
            hint: 'Set Worker variable BACKEND_ORIGIN to your public backend origin, e.g. https://<codespace>-8080.app.github.dev',
          },
          { status: 500 }
        );
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

      try {
        const upstream = await fetch(new Request(upstreamUrl.toString(), init));
        const headers = new Headers(upstream.headers);
        headers.set('x-pft-proxy', '1');
        headers.set('x-pft-upstream', upstreamUrl.origin);
        return new Response(upstream.body, { status: upstream.status, headers });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return Response.json(
          {
            error: 'Upstream fetch failed',
            upstream: upstreamUrl.toString(),
            message,
          },
          { status: 502 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};
