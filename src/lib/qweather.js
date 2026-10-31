/* 和风天气 API 封装。纯前端直连，key 由构建时环境变量或本机设置提供。 */

const GEO_HOST = 'geoapi.qweather.com'
const DEFAULT_HOST = 'devapi.qweather.com'
const TIMEOUT = 14000

export class WeatherError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'WeatherError'
    this.code = code
  }
}

const ERROR_TEXT = {
  204: '这个城市暂时没有天气数据',
  400: '请求参数不太对，检查一下城市',
  401: '和风 key 无效，检查一下 .env.local 或设置里的 key',
  402: '和风额度用完了，明天再试',
  403: '这个 key 没有访问权限',
  404: '找不到这个城市',
  429: '请求太频繁，等一会儿再试',
  500: '和风服务器开小差了'
}

function env(key, fallback = '') {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function apiKey(settings) {
  return (settings && settings.apiKey ? String(settings.apiKey).trim() : '') || env('VITE_QWEATHER_API_KEY')
}

export function apiHost(settings) {
  const raw =
    (settings && settings.apiHost ? String(settings.apiHost).trim() : '') ||
    env('VITE_QWEATHER_API_HOST', DEFAULT_HOST)
  return raw.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

export function tdtKey() {
  return env('VITE_TDT_MAP_KEY')
}

export function hasApiKey(settings) {
  return Boolean(apiKey(settings))
}

export function hasTdtKey() {
  return Boolean(tdtKey())
}

function buildUrl(host, path, params) {
  const search = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  return `https://${host}${path}?${search.toString()}`
}

async function request(path, params, options = {}) {
  const host = options.host || DEFAULT_HOST
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeout || TIMEOUT)
  let response
  try {
    response = await fetch(buildUrl(host, path, params), {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    })
  } catch (error) {
    clearTimeout(timer)
    if (error && error.name === 'AbortError') {
      throw new WeatherError('timeout', '天气请求超时，网络可能有点慢')
    }
    throw new WeatherError('network', '连不上天气服务，检查一下网络')
  }
  clearTimeout(timer)

  if (!response.ok) {
    throw new WeatherError(response.status, ERROR_TEXT[response.status] || `天气服务返回 ${response.status}`)
  }

  let data
  try {
    data = await response.json()
  } catch (error) {
    throw new WeatherError('parse', '天气数据格式不太对')
  }

  const code = String(data && data.code ? data.code : '')
  if (code && code !== '200') {
    throw new WeatherError(code, ERROR_TEXT[code] || `天气服务返回 ${code}`)
  }
  return data
}

function baseParams(city, settings) {
  return {
    location: city.id,
    key: apiKey(settings)
  }
}

async function safeRequest(path, params, options) {
  try {
    return await request(path, params, options)
  } catch (error) {
    return null
  }
}

/**
 * 拉取一座城市的完整天气。
 * days=7 时返回 7 天预报；extras=true 时额外拉空气、预警、生活指数和分钟级降水。
 */
export async function fetchCityBundle(city, settings, options = {}) {
  if (!city || !city.id) throw new WeatherError('city', '还没有选择城市')
  const key = apiKey(settings)
  if (!key) throw new WeatherError('key', '还没有配置和风天气 key')

  const host = apiHost(settings)
  const days = options.days || 3
  const extras = Boolean(options.extras)
  const params = baseParams(city, settings)

  const [nowRes, dailyRes, hourlyRes] = await Promise.all([
    request('/v7/weather/now', params, { host }),
    request(`/v7/weather/${days}d`, params, { host }),
    request('/v7/weather/24h', params, { host })
  ])

  const bundle = {
    city,
    now: nowRes.now || {},
    daily: Array.isArray(dailyRes.daily) ? dailyRes.daily : [],
    hourly: Array.isArray(hourlyRes.hourly) ? hourlyRes.hourly : [],
    air: null,
    warnings: [],
    indices: [],
    minutely: null,
    updateTime: nowRes.updateTime || '',
    updatedAt: Date.now()
  }

  if (!extras) return bundle

  const coord = `${Number(city.lon).toFixed(4)},${Number(city.lat).toFixed(4)}`
  const [air, warning, indices, minutely] = await Promise.all([
    safeRequest('/v7/air/now', params, { host }),
    safeRequest('/v7/warning/now', params, { host }),
    safeRequest('/v7/indices/1d', { ...params, type: '3,5,9' }, { host }),
    safeRequest('/v7/minutely/5m', { location: coord, key }, { host })
  ])

  if (air && air.now) bundle.air = air.now
  if (warning && Array.isArray(warning.warning)) bundle.warnings = warning.warning
  if (indices && Array.isArray(indices.daily)) bundle.indices = indices.daily
  if (minutely) {
    bundle.minutely = {
      summary: minutely.summary || '',
      minutely: Array.isArray(minutely.minutely) ? minutely.minutely : []
    }
  }

  return bundle
}

export async function fetchAll(cities, settings) {
  const [me, her] = await Promise.all([
    fetchCityBundle(cities.me, settings, { days: 3, extras: false }),
    fetchCityBundle(cities.her, settings, { days: 7, extras: true })
  ])
  return {
    me,
    her,
    fetchedAt: Date.now()
  }
}

export async function searchCity(keyword, settings, number = 10) {
  const key = apiKey(settings)
  if (!key) throw new WeatherError('key', '还没有配置和风天气 key')
  const query = String(keyword || '').trim()
  if (!query) return []
  const data = await request(
    '/v2/city/lookup',
    {
      location: query,
      key,
      number,
      lang: 'zh'
    },
    { host: GEO_HOST }
  )
  return Array.isArray(data.location) ? data.location : []
}

export async function locateCity(lon, lat, settings) {
  const key = apiKey(settings)
  if (!key) throw new WeatherError('key', '还没有配置和风天气 key')
  const data = await request(
    '/v2/city/lookup',
    {
      location: `${Number(lon).toFixed(4)},${Number(lat).toFixed(4)}`,
      key,
      number: 1,
      lang: 'zh'
    },
    { host: GEO_HOST }
  )
  const list = Array.isArray(data.location) ? data.location : []
  if (!list.length) throw new WeatherError('city', '定位附近没有找到城市')
  return list[0]
}

export function normalizeCity(raw) {
  if (!raw) return null
  return {
    id: String(raw.id || ''),
    name: raw.name || '',
    adm1: raw.adm1 || '',
    adm2: raw.adm2 || '',
    country: raw.country || '',
    lat: Number(raw.lat),
    lon: Number(raw.lon),
    tz: raw.tz || 'Asia/Shanghai'
  }
}
