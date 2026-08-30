export default async function onRequest(context) {
  const request = context.request;
  const env = context.env || {};
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=60, s-maxage=60',
    'access-control-allow-origin': '*'
  };
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }
  const key = typeof env.UPTIMEROBOT_API_KEY === 'string' ? env.UPTIMEROBOT_API_KEY.trim() : '';
  if (!key) {
    return new Response(JSON.stringify({ error: 'env_missing', message: 'status environment is not configured' }), { status: 503, headers });
  }
  try {
    const body = new URLSearchParams();
    body.set('api_key', key);
    body.set('format', 'json');
    body.set('logs', '0');
    body.set('response_times', '1');
    body.set('custom_uptime_ratios', '30');
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'upstream_http', upstream_status: response.status }), { status: 503, headers });
    }
    const data = await response.json();
    if (data.stat !== 'ok' || !Array.isArray(data.monitors)) {
      return new Response(JSON.stringify({ error: 'upstream_auth_or_format' }), { status: 503, headers });
    }
    const services = data.monitors.map((monitor, index) => ({
      name: String(monitor.friendly_name || `核心服务 ${index + 1}`).trim().slice(0, 40),
      domain: (() => { try { const host = new URL(String(monitor.url || '')).hostname; return host && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host) ? host.slice(0, 100) : ''; } catch (_) { return ''; } })(),
      status: Number(monitor.status) === 2 ? 'up' : (Number(monitor.status) === 9 || Number(monitor.status) === 0 ? 'down' : 'warn'),
      response_time_ms: Number.isFinite(Number(monitor.response_times?.[0]?.value)) ? Number(monitor.response_times[0].value) : null,
      uptime_30d: typeof monitor.custom_uptime_ratio === 'string' ? monitor.custom_uptime_ratio : null
    }));
    return new Response(JSON.stringify({ version: '2026-08-30.3-cloud', updated_at: new Date().toISOString(), services }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'cloud_fetch_failed', reason: error && error.name ? String(error.name) : 'unknown' }), { status: 503, headers });
  }
}
