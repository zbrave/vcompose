export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const q = url.searchParams.get('q');
    if (!q) {
      return jsonResponse({ error: 'Missing query parameter' }, 400);
    }

    const page = url.searchParams.get('page') || '1';
    const pageSize = url.searchParams.get('page_size') || '25';

    try {
      const hubUrl = `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(q)}&page=${page}&page_size=${pageSize}`;
      const response = await fetch(hubUrl);

      if (!response.ok) {
        return jsonResponse({ error: 'Docker Hub API error' }, response.status);
      }

      const data = await response.json();
      return jsonResponse(data, 200);
    } catch {
      return jsonResponse({ error: 'Proxy fetch failed' }, 502);
    }
  },
};

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
