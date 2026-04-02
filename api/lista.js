// Vercel Serverless Function — Proxy seguro para a Supabase Edge Function
// As credenciais NÃO estão no código — ficam nas variáveis de ambiente do Vercel

export default async function handler(req, res) {
  // CORS para o browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-access-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_FUNCTION_URL; // ex: https://xxx.supabase.co/functions/v1/lista-api
  const ACCESS_KEY   = process.env.ACCESS_KEY;            // senha da lista

  if (!SUPABASE_URL || !ACCESS_KEY) {
    return res.status(503).json({ error: 'Servidor não configurado' });
  }

  // Valida a senha que veio do browser
  const clientKey = req.headers['x-access-key'];
  if (clientKey !== ACCESS_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Extrai o sub-path: /api/lista/products/1 → /products/1
  const subPath = req.url.replace(/^\/api\/lista/, '') || '/';

  // Repassa a chamada para o Supabase com a chave real
  const upstream = await fetch(SUPABASE_URL + subPath, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'x-access-key': ACCESS_KEY,
    },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
  });

  const data = await upstream.json();
  return res.status(upstream.status).json(data);
}
