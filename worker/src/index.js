import { buildPushPayload } from '@block65/webcrypto-web-push'
import { fetchWeather } from './weather.js'
import { buildMessage } from './message.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  })
}

function authorized(env, token) {
  return Boolean(env.PUSH_TOKEN) && String(token || '') === env.PUSH_TOKEN
}

function validSubscription(sub) {
  return Boolean(
    sub &&
      typeof sub.endpoint === 'string' &&
      sub.endpoint.startsWith('https://') &&
      sub.keys &&
      typeof sub.keys.auth === 'string' &&
      typeof sub.keys.p256dh === 'string'
  )
}

async function endpointId(endpoint) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(endpoint)
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function listSubscriptions(env) {
  if (!env.SUBSCRIPTIONS) return []
  const subscriptions = []
  let cursor
  do {
    const page = await env.SUBSCRIPTIONS.list({ prefix: 'sub:', cursor })
    for (const key of page.keys) {
      const raw = await env.SUBSCRIPTIONS.get(key.name)
      if (!raw) continue
      try {
        subscriptions.push({ key: key.name, ...JSON.parse(raw) })
      } catch (error) {
        console.log(`skip broken subscription ${key.name}`)
      }
    }
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
  return subscriptions
}

async function sendPush(env, subscription, message) {
  const vapid = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY
  }
  if (!vapid.subject || !vapid.publicKey || !vapid.privateKey) {
    throw new Error('缺少 VAPID 配置')
  }

  const payload = await buildPushPayload(
    {
      data: message,
      options: { ttl: 3600, urgency: 'normal' }
    },
    subscription,
    vapid
  )

  const response = await fetch(subscription.endpoint, {
    method: payload.method,
    headers: payload.headers,
    body: payload.body
  })

  if (response.status === 404 || response.status === 410) {
    await env.SUBSCRIPTIONS.delete(subscription.key)
  }
  return response.status
}

async function sendToAll(env, message) {
  const subscriptions = await listSubscriptions(env)
  const results = []
  for (const subscription of subscriptions) {
    try {
      results.push(await sendPush(env, subscription, message))
    } catch (error) {
      console.log(`push failed: ${error.message}`)
      results.push('error')
    }
  }
  return { count: subscriptions.length, results }
}

async function run(env) {
  const bundle = await fetchWeather(env)
  const message = buildMessage(bundle)
  const result = await sendToAll(env, message)
  console.log(
    JSON.stringify({
      city: bundle.city.name,
      temp: bundle.now.temp,
      scene: message.scene,
      subscriptions: result.count,
      results: result.results,
      at: new Date().toISOString()
    })
  )
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/config') {
      return json({
        publicKey: env.VAPID_PUBLIC_KEY || '',
        city: env.HER_CITY_NAME || '',
        ready: Boolean(env.VAPID_PUBLIC_KEY && env.SUBSCRIPTIONS)
      })
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({
        ok: true,
        city: env.HER_CITY_NAME || '',
        kv: Boolean(env.SUBSCRIPTIONS),
        vapid: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY)
      })
    }

    if (request.method === 'POST' && url.pathname === '/subscribe') {
      let body
      try {
        body = await request.json()
      } catch (error) {
        return json({ error: '请求格式不对' }, 400)
      }
      if (!authorized(env, body.token)) {
        return json({ error: '口令不对' }, 401)
      }
      if (!env.SUBSCRIPTIONS) {
        return json({ error: '还没有绑定 KV 存储' }, 503)
      }
      if (!validSubscription(body.subscription)) {
        return json({ error: '订阅信息不完整' }, 400)
      }
      const id = await endpointId(body.subscription.endpoint)
      await env.SUBSCRIPTIONS.put(
        `sub:${id}`,
        JSON.stringify({
          endpoint: body.subscription.endpoint,
          expirationTime: body.subscription.expirationTime || null,
          keys: {
            auth: body.subscription.keys.auth,
            p256dh: body.subscription.keys.p256dh
          },
          createdAt: Date.now(),
          userAgent: request.headers.get('User-Agent') || ''
        })
      )
      return json({ ok: true, id })
    }

    if (request.method === 'POST' && url.pathname === '/unsubscribe') {
      let body
      try {
        body = await request.json()
      } catch (error) {
        return json({ error: '请求格式不对' }, 400)
      }
      if (!authorized(env, body.token)) {
        return json({ error: '口令不对' }, 401)
      }
      if (!env.SUBSCRIPTIONS || !body.endpoint) {
        return json({ ok: true })
      }
      const id = await endpointId(body.endpoint)
      await env.SUBSCRIPTIONS.delete(`sub:${id}`)
      return json({ ok: true })
    }

    if (request.method === 'POST' && url.pathname === '/test') {
      let body
      try {
        body = await request.json()
      } catch (error) {
        return json({ error: '请求格式不对' }, 400)
      }
      if (!authorized(env, body.token)) {
        return json({ error: '口令不对' }, 401)
      }
      const result = await sendToAll(env, {
        title: 'Dear Weather 测试通知',
        body: '如果你看到这条，说明她的手机已经能收到提醒了。',
        url: 'https://yhx-yhx.github.io/dear-weather/',
        scene: 'test'
      })
      return json({ ok: true, ...result })
    }

    return json({
      ok: true,
      service: 'dear-weather-push',
      routes: ['/config', '/subscribe', '/unsubscribe', '/test', '/health']
    })
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      run(env).catch((error) => {
        console.log(`scheduled run failed: ${error.message}`)
      })
    )
  }
}
