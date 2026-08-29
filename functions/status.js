export default async function handler(request, env) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=60, s-maxage=60',
    'access-control-allow-origin': '*'
  };
  if (request.method !== 'GET') return new Response(JSON.stringify({error:'method_not_allowed'}), {status:405, headers});
  const key = env.UPTIMEROBOT_API_KEY;
  if (!key) return new Response(JSON.stringify({error:'status_unavailable'}), {status:503, headers});
  try {
    const body = new URLSearchParams({api_key:key, format:'json', logs:'0', response_times:'1', custom_uptime_ratios:'30'});
    const r = await fetch('https://api.uptimerobot.com/v2/getMonitors', {method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body, signal:AbortSignal.timeout(8000)});
    if (!r.ok) throw new Error('upstream');
    const j = await r.json();
    if (j.stat !== 'ok' || !Array.isArray(j.monitors)) throw new Error('upstream');
    const names = new Map([
      ['QQ官机平台','QQ官机平台'], ['CPA接口服务','AI接口服务'], ['GPT2接口服务','AI注册服务'],
      ['图片服务','图片服务'], ['Webhook服务','消息回调服务']
    ]);
    const services = j.monitors.map((m, index) => ({
      name: names.get(m.friendly_name) || `核心服务 ${index + 1}`,
      status: Number(m.status) === 2 ? 'up' : Number(m.status) === 9 || Number(m.status) === 0 ? 'down' : 'warn',
      response_time_ms: Number.isFinite(Number(m.response_times?.[0]?.value)) ? Number(m.response_times[0].value) : null,
      uptime_30d: typeof m.custom_uptime_ratio === 'string' ? m.custom_uptime_ratio : null
    }));
    return new Response(JSON.stringify({updated_at:new Date().toISOString(),services}), {status:200,headers});
  } catch (_) {
    return new Response(JSON.stringify({error:'status_unavailable'}), {status:503,headers});
  }
}
