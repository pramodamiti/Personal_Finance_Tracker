export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  BACKEND_ORIGIN?: string;
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

    const fallbackBackendOrigin = 'https://friendly-pancake-69749gv7xp9qhrwx-8080.app.github.dev';
    const workerVersion = 'pft-proxy-v1';

    if (url.pathname === '/__pft_debug') {
      const configured = Boolean(env.BACKEND_ORIGIN && env.BACKEND_ORIGIN.trim());
      const backendOrigin = configured ? normalizeOrigin(env.BACKEND_ORIGIN!) : fallbackBackendOrigin;

      const checkUpstream = url.searchParams.get('checkUpstream') === '1';
      let upstreamHealth: { ok: boolean; status?: number; error?: string } | null = null;
      if (checkUpstream) {
        try {
          const healthUrl = new URL('/actuator/health', backendOrigin);
          const res = await fetch(healthUrl.toString(), { method: 'GET' });
          upstreamHealth = { ok: res.ok, status: res.status };
        } catch (e) {
          upstreamHealth = { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
      }
      return Response.json(
        {
          ok: true,
          workerVersion,
          backendOriginConfigured: configured,
          backendOrigin,
          backendOriginSource: configured ? 'env' : 'fallback',
          upstreamHealth,
          now: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Reverse-proxy API calls so the SPA can always use same-origin `/api/...`.
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const backendOrigin =
        env.BACKEND_ORIGIN && env.BACKEND_ORIGIN.trim() ? normalizeOrigin(env.BACKEND_ORIGIN) : fallbackBackendOrigin;

      if (request.method === 'OPTIONS') {
        // Same-origin preflight shouldn't happen, but make it safe.
        return new Response(null, { status: 204 });
      }

      const upstreamUrl = buildUpstreamUrl(request.url, backendOrigin);
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

    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set('x-pft-worker', workerVersion);

    // Mobile browsers can aggressively cache HTML. Ensure the shell updates quickly.
    const contentType = headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      headers.set('cache-control', 'no-store');
    }

    return new Response(asset.body, { status: asset.status, headers });
  },
};
