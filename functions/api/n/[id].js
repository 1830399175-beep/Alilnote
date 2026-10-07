/* 纸条短链的取出口：GET /api/n/<短码>
   取到就把数据原样还回去，前端自己解压还原；取不到就是过期或被删了。 */
const json = (o, s) => new Response(JSON.stringify(o), {
  status: s || 200,
  headers: { 'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequestGet({ params, env }) {
  if (!env.NOTE_KV) return json({ error: 'no-kv' }, 500);
  const id = String(params.id || '');
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(id)) return json({ error: 'bad-id' }, 400);

  const d = await env.NOTE_KV.get(id);
  if (!d) return json({ error: 'not-found' }, 404);
  return json({ d });
}
