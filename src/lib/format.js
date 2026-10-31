/* 展示层的格式化工具 */

export function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function formatTemp(value) {
  return `${Math.round(num(value))}°`
}

export function formatTempValue(value) {
  return `${Math.round(num(value))}℃`
}

export function formatRelative(ts, now = Date.now()) {
  if (!ts) return ''
  const diff = Math.max(0, now - ts)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  return `${days} 天前`
}

export function hourIn(tz, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz || undefined,
      hour: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date)
    const hour = parts.find((p) => p.type === 'hour')
    return hour ? Number(hour.value) : date.getHours()
  } catch (e) {
    return date.getHours()
  }
}

export function clockIn(tz, date = new Date()) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz || undefined,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(date)
  } catch (e) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
}

export function dateKeyIn(tz, date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date)
  } catch (e) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`
  }
}

export function weekdayCN(date = new Date(), tz) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz || undefined,
      weekday: 'long'
    }).format(date)
  } catch (e) {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  }
}

export function formatDateCN(date = new Date(), tz) {
  try {
    const parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz || undefined,
      month: 'long',
      day: 'numeric'
    }).formatToParts(date)
    const month = (parts.find((part) => part.type === 'month') || {}).value || ''
    const day = (parts.find((part) => part.type === 'day') || {}).value || ''
    return `${month}月${day}日 · ${weekdayCN(date, tz)}`
  } catch (e) {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

export function formatHour(iso) {
  if (!iso || typeof iso !== 'string') return ''
  const match = iso.match(/T(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

export function formatDayLabel(iso, index = 0) {
  if (!iso) return ''
  if (index === 0) return '今天'
  if (index === 1) return '明天'
  if (index === 2) return '后天'
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso.slice(5)
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
}

export function formatShortDate(iso) {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length < 3) return iso
  return `${Number(parts[1])}/${Number(parts[2])}`
}

export function greetingFor(hour) {
  if (hour < 5) return '夜深了'
  if (hour < 9) return '早'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 23) return '晚上好'
  return '夜深了'
}

export function windMax(scale) {
  if (scale === undefined || scale === null) return 0
  const text = String(scale)
  const parts = text.split('-').map((p) => Number(p)).filter((n) => Number.isFinite(n))
  return parts.length ? Math.max(...parts) : 0
}

export function cityTitle(city) {
  if (!city) return ''
  const name = city.name || ''
  const adm2 = city.adm2 || ''
  let base = name
  if (/(区|县|旗)$/.test(name) && adm2) base = adm2
  return base.replace(/(市|地区|自治州|盟)$/, '') || base
}

export function citySub(city) {
  if (!city) return ''
  const bits = [city.adm1, city.country].filter(Boolean)
  const unique = []
  bits.forEach((bit) => {
    if (!unique.includes(bit) && bit !== city.name && bit !== city.adm2) unique.push(bit)
  })
  return unique.join(' · ')
}

export function cityFullLabel(city) {
  if (!city) return ''
  const title = cityTitle(city)
  const sub = citySub(city)
  return sub ? `${title} · ${sub}` : title
}

export function distanceKm(a, b) {
  if (!a || !b) return 0
  const toRad = (deg) => (Number(deg) * Math.PI) / 180
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const dLat = lat2 - lat1
  const dLon = toRad(Number(b.lon) - Number(a.lon))
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function formatDistance(km) {
  if (!Number.isFinite(km) || km < 1) return '同一座城市'
  if (km < 100) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString('en-US')} km`
}

export function aqiLabel(aqi) {
  const n = num(aqi)
  if (n <= 50) return '优'
  if (n <= 100) return '良'
  if (n <= 150) return '轻度'
  if (n <= 200) return '中度'
  if (n <= 300) return '重度'
  return '严重'
}

export function aqiTone(aqi) {
  const n = num(aqi)
  if (n <= 50) return 'good'
  if (n <= 100) return 'ok'
  if (n <= 150) return 'warn'
  return 'bad'
}

export function truncate(text, length = 60) {
  const value = String(text || '').replace(/\s+/g, ' ').trim()
  if (value.length <= length) return value
  return `${value.slice(0, length)}…`
}

export function mmddIn(tz, date = new Date()) {
  const key = dateKeyIn(tz, date)
  return key.slice(5)
}

export function isSameDay(ts, now = Date.now()) {
  if (!ts) return false
  const a = new Date(ts)
  const b = new Date(now)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
