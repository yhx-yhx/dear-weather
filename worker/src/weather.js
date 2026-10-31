const DEFAULT_HOST = 'devapi.qweather.com'
const TIMEOUT = 12000

function host(env) {
  const raw = (env.QWEATHER_API_HOST || DEFAULT_HOST).trim()
  return raw.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

function buildUrl(env, path, params) {
  const url = new URL(`https://${host(env)}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

async function request(env, path, params = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)
  let response
  try {
    response = await fetch(buildUrl(env, path, params), {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    })
  } finally {
    clearTimeout(timer)
  }
  if (!response.ok) {
    throw new Error(`QWeather ${path} HTTP ${response.status}`)
  }
  const data = await response.json()
  if (data && data.code && String(data.code) !== '200') {
    throw new Error(`QWeather ${path} code ${data.code}`)
  }
  return data
}

async function safeRequest(env, path, params) {
  try {
    return await request(env, path, params)
  } catch (error) {
    console.log(`optional request failed: ${path} ${error.message}`)
    return null
  }
}

export async function fetchWeather(env) {
  const cityId = env.HER_CITY_ID
  const key = env.QWEATHER_API_KEY
  if (!cityId) throw new Error('缺少 HER_CITY_ID')
  if (!key) throw new Error('缺少 QWEATHER_API_KEY')

  const params = { location: cityId, key }
  const [nowRes, dailyRes, hourlyRes] = await Promise.all([
    request(env, '/v7/weather/now', params),
    request(env, '/v7/weather/3d', params),
    request(env, '/v7/weather/24h', params)
  ])

  const [warningRes, airRes] = await Promise.all([
    safeRequest(env, '/v7/warning/now', params),
    safeRequest(env, '/v7/air/now', params)
  ])

  return {
    city: {
      id: cityId,
      name: env.HER_CITY_NAME || '她那边',
      tz: env.HER_TZ || 'Asia/Shanghai'
    },
    now: nowRes.now || {},
    daily: Array.isArray(dailyRes.daily) ? dailyRes.daily : [],
    hourly: Array.isArray(hourlyRes.hourly) ? hourlyRes.hourly : [],
    warnings: warningRes && Array.isArray(warningRes.warning) ? warningRes.warning : [],
    air: airRes && airRes.now ? airRes.now : null,
    updatedAt: Date.now()
  }
}
