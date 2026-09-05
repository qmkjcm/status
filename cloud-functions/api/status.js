const CACHE_TTL_MS = 60_000;
const cache = {fast:{payload:null,at:0},history:{payload:null,at:0}};

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

export default async function onRequest(context) {
  const request = context.request;
  const env = context.env || {};
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=60, s-maxage=60',
    'access-control-allow-origin': '*'
  };
  if (request.method !== 'GET') return new Response(JSON.stringify({error:'method_not_allowed'}), {status:405,headers});
  const history = new URL(request.url).searchParams.get('history') === '1';
  const slot = cache[history ? 'history' : 'fast'];
  const key=typeof env.UPTIMEROBOT_API_KEY==='string'?env.UPTIMEROBOT_API_KEY.trim():'';
  const probeTargets = [
    ['倾慕云小窝','www.qmkjcm.cn','https://www.qmkjcm.cn/'],
    ['倾慕公益API','api.qmkjcm.cn','https://api.qmkjcm.cn/'],
    ['倾慕慕官机平台','qq.qmkjcm.cn','https://qq.qmkjcm.cn/']
  ];
  if (!history) {
    try {
      if (slot.payload && Date.now() - slot.at < CACHE_TTL_MS) {
        return new Response(slot.payload,{status:200,headers:{...headers,'x-status-cache':'hit'}});
      }
      const checkedAt = new Date().toISOString();
      const probeResults = await Promise.all(probeTargets.map(async ([name,domain,target]) => {
        const started = Date.now();
        try {
          const response = await withTimeout(fetch(target,{method:'GET',redirect:'follow'}),2200);
          try { if (response.body && typeof response.body.cancel === 'function') await response.body.cancel(); } catch (_) {}
          return {name,domain,status:response.status>=200&&response.status<400?'up':'down',latency_ms:Date.now()-started,http_status:response.status};
        } catch (_) {
          return {name,domain,status:'down',latency_ms:Date.now()-started,http_status:0};
        }
      }));
      const services = probeResults.map(x => ({name:x.name,domain:x.domain,checked_at:checkedAt,status:x.status,type:'HTTP',interval_seconds:300,average_response_time:x.latency_ms,edge_latency_ms:x.latency_ms,edge_status:x.http_status,edge_checked_at:checkedAt,response_times:[],incidents:[],uptime_30d:null}));
      const payload = JSON.stringify({version:'2026-09-05.4-probe',updated_at:checkedAt,services});
      slot.payload=payload; slot.at=Date.now();
      return new Response(payload,{status:200,headers:{...headers,'x-status-cache':'miss'}});
    } catch (_) {
      return new Response(JSON.stringify({error:'probe_failed'}),{status:503,headers});
    }
  }
  if(!key)return new Response(JSON.stringify({error:'env_missing'}),{status:503,headers});
  try{
    if (slot.payload && Date.now() - slot.at < CACHE_TTL_MS) {
      return new Response(slot.payload, {status:200,headers:{...headers,'x-status-cache':'hit'}});
    }
    const now=Math.floor(Date.now()/1000);
    const body=new URLSearchParams({api_key:key,format:'json',custom_uptime_ratios:'1-7-30'});
    if (history) {
      body.set('logs','1');
      body.set('response_times','1');
      body.set('response_times_limit','24');
      body.set('response_times_average','1');
      body.set('response_times_start_date',String(now-86400));
      body.set('response_times_end_date',String(now));
    }
    const response=await withTimeout(fetch('https://api.uptimerobot.com/v2/getMonitors',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body}),8000);
    if(!response.ok)return new Response(JSON.stringify({error:'upstream_http'}),{status:503,headers});
    const data=await response.json();if(data.stat!=='ok'||!Array.isArray(data.monitors))return new Response(JSON.stringify({error:'upstream_auth_or_format'}),{status:503,headers});
    const checkedAt = new Date().toISOString();
    const probeMap = new Map();
    const services=data.monitors.map((m,index)=>{
      const rt=Array.isArray(m.response_times)?m.response_times.map(x=>({at:Number(x.datetime)||0,ms:Number(x.value)||0})).filter(x=>x.at>0&&x.ms>=0).sort((a,b)=>b.at-a.at).slice(0,24):[];
      const incidents=Array.isArray(m.logs)?m.logs.map(x=>({type:Number(x.type)===1?'down':'up',at:Number(x.datetime)||0,duration:Number(x.duration)||0,reason:x.reason&&typeof x.reason==='object'?String(x.reason.detail||x.reason.code||''):''})).filter(x=>x.at>0).sort((a,b)=>b.at-a.at).slice(0,12):[];
      const domain=(()=>{try{const h=new URL(String(m.url||'')).hostname;return h&&!/^\d{1,3}(\.\d{1,3}){3}$/.test(h)?h.slice(0,100):''}catch(_){return ''}})();const probe=probeMap.get(domain)||null;
      return {name:String(m.friendly_name||`核心服务 ${index+1}`).trim().slice(0,80),domain,checked_at:checkedAt,status:Number(m.status)===2?'up':(Number(m.status)===9||Number(m.status)===0?'down':'warn'),type:Number(m.type)===1?'HTTP':(Number(m.type)===2?'关键词':'端口'),interval_seconds:Number(m.interval)||null,average_response_time:Number(m.average_response_time)||null,edge_latency_ms:probe?probe.latency_ms:null,edge_status:probe?probe.status:null,edge_checked_at:probe?probe.checked_at:null,edge_error:probe&&probe.error?probe.error:'',response_times:rt,incidents,uptime_1d:(String(m.custom_uptime_ratio||'').split('-')[0]||null),uptime_7d:(String(m.custom_uptime_ratio||'').split('-')[1]||null),uptime_30d:(String(m.custom_uptime_ratio||'').split('-')[2]||null)};
    });
    const payload = JSON.stringify({version:history?'2026-09-05.3-history':'2026-09-05.3-fast',updated_at:new Date().toISOString(),services});
    slot.payload = payload;
    slot.at = Date.now();
    return new Response(payload,{status:200,headers:{...headers,'x-status-cache':'miss'}});
  }catch(_){return new Response(JSON.stringify({error:'upstream_request_failed'}),{status:503,headers});}
}
