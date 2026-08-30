export default async function onRequest(context) {
  const request = context.request;
  const env = context.env || {};
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=60, s-maxage=60',
    'access-control-allow-origin': '*'
  };
  if (request.method !== 'GET') return new Response(JSON.stringify({error:'method_not_allowed'}), {status:405,headers});
  const key=typeof env.UPTIMEROBOT_API_KEY==='string'?env.UPTIMEROBOT_API_KEY.trim():'';
  if(!key)return new Response(JSON.stringify({error:'env_missing'}),{status:503,headers});
  try{
    const body=new URLSearchParams({api_key:key,format:'json',logs:'1',response_times:'1',response_times_limit:'24',custom_uptime_ratios:'1-7-30'});
    const response=await fetch('https://api.uptimerobot.com/v2/getMonitors',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
    if(!response.ok)return new Response(JSON.stringify({error:'upstream_http'}),{status:503,headers});
    const data=await response.json();if(data.stat!=='ok'||!Array.isArray(data.monitors))return new Response(JSON.stringify({error:'upstream_auth_or_format'}),{status:503,headers});
    const services=data.monitors.map((m,index)=>{
      const rt=Array.isArray(m.response_times)?m.response_times.slice(0,24).map(x=>({at:Number(x.datetime)||0,ms:Number(x.value)||0})).filter(x=>x.at>0&&x.ms>=0):[];
      const incidents=Array.isArray(m.logs)?m.logs.slice(0,12).map(x=>({type:Number(x.type)===1?'down':'up',at:Number(x.datetime)||0,duration:Number(x.duration)||0,reason:x.reason&&typeof x.reason==='object'?String(x.reason.detail||x.reason.code||''):''})).filter(x=>x.at>0):[];
      return {name:String(m.friendly_name||`核心服务 ${index+1}`).trim().slice(0,80),domain:(()=>{try{const h=new URL(String(m.url||'')).hostname;return h&&!/^\d{1,3}(\.\d{1,3}){3}$/.test(h)?h.slice(0,100):''}catch(_){return ''}})(),status:Number(m.status)===2?'up':(Number(m.status)===9||Number(m.status)===0?'down':'warn'),type:Number(m.type)===1?'HTTP':(Number(m.type)===2?'关键词':'端口'),interval_seconds:Number(m.interval)||null,average_response_time:Number(m.average_response_time)||null,response_times:rt,incidents,uptime_1d:(String(m.custom_uptime_ratio||'').split('-')[0]||null),uptime_7d:(String(m.custom_uptime_ratio||'').split('-')[1]||null),uptime_30d:(String(m.custom_uptime_ratio||'').split('-')[2]||null)};
    });
    return new Response(JSON.stringify({version:'2026-08-30.4-real',updated_at:new Date().toISOString(),services}),{status:200,headers});
  }catch(_){return new Response(JSON.stringify({error:'upstream_request_failed'}),{status:503,headers});}
}
