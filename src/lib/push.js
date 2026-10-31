/* Web Push 订阅。Worker 负责在云端定时发送，页面关掉也能收到。 */

const SW_URL = './sw.js'

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function pushBlockReason() {
  if (typeof window === 'undefined') return '当前环境不支持系统通知'
  if (!window.isSecureContext) return '需要 HTTPS 才能开启系统通知'
  if (!('serviceWorker' in navigator)) return '这个浏览器不支持 Service Worker'
  if (!('PushManager' in window)) return '这个浏览器不支持 Web Push'
  if (!('Notification' in window)) return '这个浏览器不支持系统通知'
  return ''
}

function normalizeWorker(url) {
  return String(url || '')
    .trim()
    .replace(/\/+$/, '')
}

function checkWorker(url) {
  const base = normalizeWorker(url)
  if (!base) throw new Error('先填 Worker 地址')
  let parsed
  try {
    parsed = new URL(base)
  } catch (e) {
    throw new Error('Worker 地址格式不对')
  }
  const local =
    parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  if (parsed.protocol !== 'https:' && !local) {
    throw new Error('Worker 地址必须是 HTTPS')
  }
  return base
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

async function ensureRegistration() {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  return navigator.serviceWorker.register(SW_URL)
}

export async function currentSubscription() {
  if (!pushSupported()) return null
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return null
  try {
    return await registration.pushManager.getSubscription()
  } catch (e) {
    return null
  }
}

export async function permissionState() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export async function enablePush({ workerUrl, token, city }) {
  const base = checkWorker(workerUrl)
  const reason = pushBlockReason()
  if (reason) throw new Error(reason)

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') {
    throw new Error('通知权限没有开启，去浏览器设置里允许后再试')
  }

  const registration = await ensureRegistration()
  await navigator.serviceWorker.ready

  let config
  try {
    const res = await fetch(`${base}/config`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    config = await res.json()
  } catch (error) {
    throw new Error('连不上 Worker，检查地址和部署状态')
  }
  if (!config.publicKey) {
    throw new Error('Worker 还没有配置 VAPID 公钥')
  }

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey)
      })
    } catch (error) {
      const name = error && error.name
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw new Error('iPhone 需要先“添加到主屏幕”，再从主屏幕打开后开启')
      }
      throw new Error('这个浏览器没能完成订阅，换 Chrome 或 Safari 再试')
    }
  }

  const res = await fetch(`${base}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      subscription: subscription.toJSON(),
      city: city
        ? {
            id: city.id,
            name: city.name,
            tz: city.tz
          }
        : null
    })
  })
  if (!res.ok) {
    let message = `订阅失败（${res.status}）`
    try {
      const data = await res.json()
      if (data && data.error) message = data.error
    } catch (e) {
      /* ignore */
    }
    await subscription.unsubscribe().catch(() => {})
    throw new Error(message)
  }

  return subscription
}

export async function disablePush({ workerUrl, token }) {
  const subscription = await currentSubscription()
  if (!subscription) return false

  const base = normalizeWorker(workerUrl)
  if (base) {
    try {
      await fetch(`${base}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, endpoint: subscription.endpoint })
      })
    } catch (e) {
      /* 即使服务端没删掉，也先取消本机订阅 */
    }
  }
  await subscription.unsubscribe().catch(() => {})
  return true
}

export async function sendTestPush({ workerUrl, token }) {
  const base = checkWorker(workerUrl)
  const res = await fetch(`${base}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  let data = null
  try {
    data = await res.json()
  } catch (e) {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `发送失败（${res.status}）`)
  }
  return data || { count: 0 }
}
