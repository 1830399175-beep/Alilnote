/* 纸条短链的存入口：POST /api/n
   收到前端压好的一整份纸条数据，算一个短码，存进 KV，把短码还回去。

   短码按内容算：同一条纸条反复分享，短码始终一样，服务器里不会存第二份。
   30 天到期由 KV 自己删（expirationTtl），不用另外跑清理任务。
   绑定：Pages 项目 → Settings → Functions → KV namespace bindings → 变量名 NOTE_KV */
const TTL = 30 * 24 * 3600;   // 保留 30 天
const MAX = 512 * 1024;       // 单条上限；正常纸条（含图）也就几十 KB

const json = (o, s) => new Response(JSON.stringify(o), {
  status: s || 200,
  headers: { 'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequestPost({ request, env }) {
  if (!env.NOTE_KV) return json({ error: 'no-kv' }, 500);
  const body = await request.text();
  if (!body) return json({ error: 'empty' }, 400);
  if (body.length > MAX) return json({ error: 'too-long' }, 413);

  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)));
  let s = '';
  for (const b of h) s += String.fromCharCode(b);
  const id = btoa(s).replace(/\+/g, '-').replace(/\//g, '_').slice(0, 12);

  await env.NOTE_KV.put(id, body, { expirationTtl: TTL });
  return json({ id });
}
