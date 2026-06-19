const DEFAULT_AVAILABILITY = {
  almeria: '1 unit · Aug 1 · $1,495/mo',
  courtyard: 'No active rental listed',
  olive: 'No active rental listed'
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

function safeCompare(left = '', right = '') {
  const maxLength = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < maxLength; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

async function readAvailability(env) {
  const stored = await env.AVAILABILITY?.get('current', 'json');
  return { ...DEFAULT_AVAILABILITY, ...(stored || {}) };
}

export async function onRequestGet({ env }) {
  return json(await readAvailability(env));
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return json({ error: 'Manager access has not been configured yet.' }, 503);

  const clientAddress = request.headers.get('CF-Connecting-IP') || 'unknown';
  const attemptKey = `login-attempts:${clientAddress}`;
  const failedAttempts = Number(await env.AVAILABILITY?.get(attemptKey) || 0);
  if (failedAttempts >= 5) {
    return json({ error: 'Too many incorrect attempts. Please wait 15 minutes and try again.' }, 429);
  }

  const authorization = request.headers.get('Authorization') || '';
  const submittedPassword = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!safeCompare(submittedPassword, env.ADMIN_PASSWORD)) {
    await env.AVAILABILITY?.put(attemptKey, String(failedAttempts + 1), { expirationTtl: 900 });
    return json({ error: 'That password is not correct.' }, 401);
  }
  await env.AVAILABILITY?.delete(attemptKey);

  const body = await request.json().catch(() => ({}));
  if (body.action === 'verify') return json(await readAvailability(env));
  if (body.action !== 'update') return json({ error: 'Invalid request.' }, 400);

  const availability = body.availability || {};
  const allowed = ['almeria', 'courtyard', 'olive'];
  const clean = {};
  for (const property of allowed) {
    const value = typeof availability[property] === 'string' ? availability[property].trim() : '';
    if (!value || value.length > 60) return json({ error: 'Each availability message must be between 1 and 60 characters.' }, 400);
    clean[property] = value;
  }

  if (!env.AVAILABILITY) return json({ error: 'Availability storage has not been configured yet.' }, 503);
  await env.AVAILABILITY.put('current', JSON.stringify(clean));
  return json(clean);
}
