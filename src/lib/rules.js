/* 关心触发引擎：把两座城市的天气翻译成一张张卡片 */

import {
  dateKeyIn,
  formatHour,
  hourIn,
  mmddIn,
  num,
  truncate,
  windMax
} from './format'

const RAIN_RE = /雨|阵雨|暴雨|毛毛雨|冻雨|雨夹雪|雨雪/
const SNOW_RE = /雪|冰雹|冻雨/
const THUNDER_RE = /雷/
const FOG_RE = /雾|霾|沙|尘/

function latestHistoryBefore(history, key, todayKey, maxDays = 3) {
  const bucket = history && history[key]
  if (!bucket) return null
  const dates = Object.keys(bucket)
    .filter((date) => date < todayKey)
    .sort()
  if (!dates.length) return null
  const latest = dates[dates.length - 1]
  const diffDays = Math.round(
    (new Date(`${todayKey}T12:00:00`).getTime() - new Date(`${latest}T12:00:00`).getTime()) /
      86400000
  )
  if (!Number.isFinite(diffDays) || diffDays > maxDays) return null
  const record = bucket[latest]
  if (!record || !Number.isFinite(Number(record.max))) return null
  return { date: latest, max: Number(record.max), min: Number(record.min), diffDays }
}

function relativeDayLabel(dateKey, todayKey) {
  const diff = Math.round(
    (new Date(`${todayKey}T12:00:00`).getTime() - new Date(`${dateKey}T12:00:00`).getTime()) /
      86400000
  )
  if (diff <= 0) return '上次'
  if (diff === 1) return '昨天'
  return `${diff} 天前`
}

function baseEvent(fields) {
  return {
    priority: 0,
    level: 'info',
    scene: 'daily',
    title: '',
    detail: '',
    unlock: '',
    meta: {},
    ...fields
  }
}

export function buildEvents({ me, her, settings, history = {}, now = new Date() }) {
  if (!me || !me.now || !her || !her.now) return []

  const t = settings.thresholds
  const herNow = her.now
  const herToday = (her.daily && her.daily[0]) || {}
  const herTomorrow = (her.daily && her.daily[1]) || {}
  const herHour = hourIn(her.city && her.city.tz, now)
  const herTemp = num(herNow.temp)
  const herFeels = num(herNow.feelsLike, herTemp)
  const meTemp = num(me.now.temp)
  const events = []

  /* 1. 天气预警 */
  if (Array.isArray(her.warnings) && her.warnings.length) {
    const warning = her.warnings[0]
    events.push(
      baseEvent({
        key: 'warning',
        priority: 100,
        level: 'warning',
        scene: 'warning',
        title: `她那边有${warning.typeName || '天气'}预警`,
        detail: `${warning.title || '天气预警'}${warning.text ? `：${truncate(warning.text, 54)}` : ''}`,
        phrases: 'warning'
      })
    )
  }

  /* 2. 低温 / 今晚降温 → 解锁信 */
  const tonightMin = num(herToday.tempMin, 99)
  const coldNow = herTemp < t.cold
  const coldTonight = herHour >= 18 && tonightMin < t.cold
  if (coldNow || coldTonight) {
    events.push(
      baseEvent({
        key: 'cold',
        priority: 90,
        level: 'care',
        scene: 'cold',
        title: coldNow ? `她那边 ${Math.round(herTemp)}℃` : `她那边今晚 ${Math.round(tonightMin)}℃`,
        detail: coldNow
          ? `体感 ${Math.round(herFeels)}℃，今晚最低 ${Math.round(tonightMin)}℃。有一封信，等这个温度很久了。`
          : `现在 ${Math.round(herTemp)}℃，今晚会降到 ${Math.round(tonightMin)}℃。有一封信，可以提前拆了。`,
        unlock: 'cold',
        phrases: 'cold'
      })
    )
  }

  /* 3. 雨 / 雪 / 雷 */
  const summary = (her.minutely && her.minutely.summary) || ''
  const nowWet = RAIN_RE.test(herNow.text || '') || num(herNow.precip) > 0
  const nextWet = (her.hourly || [])
    .slice(0, 6)
    .find((hour) => num(hour.pop) >= 50 || RAIN_RE.test(hour.text || ''))

  if (nowWet || RAIN_RE.test(summary) || nextWet) {
    const isSnow = SNOW_RE.test(herNow.text || '') || SNOW_RE.test(summary) || (nextWet && SNOW_RE.test(nextWet.text || ''))
    const isThunder = THUNDER_RE.test(herNow.text || '') || THUNDER_RE.test(summary)
    const scene = isThunder ? 'thunder' : isSnow ? 'snow' : 'rain'
    let title
    let detail

    if (nowWet) {
      title = isSnow ? '她那边下雪了' : isThunder ? '她那边在打雷' : '她那边正在下雨'
      detail = `${herNow.text || '有降水'}，体感 ${Math.round(herFeels)}℃。${
        isSnow ? '路滑，走慢一点。' : '伞要带，鞋也别穿太薄。'
      }`
    } else if (summary) {
      title = isSnow ? '她那边要下雪了' : '她那边要下雨了'
      detail = summary
    } else {
      title = isSnow ? '她那边要下雪了' : '她那边要下雨了'
      detail = `从 ${formatHour(nextWet.fxTime)} 开始，降水概率 ${nextWet.pop}%。伞要带，鞋也别穿太薄。`
    }

    events.push(
      baseEvent({
        key: scene,
        priority: 80,
        level: 'care',
        scene,
        title,
        detail,
        unlock: scene,
        phrases: scene
      })
    )
  }

  /* 4. 今天比上次记录降温 */
  const todayKey = dateKeyIn(her.city && her.city.tz, now)
  const previous = latestHistoryBefore(history, 'her', todayKey, 3)
  if (previous && Number.isFinite(Number(herToday.tempMax))) {
    const delta = Number(herToday.tempMax) - previous.max
    if (delta <= -t.drop) {
      events.push(
        baseEvent({
          key: 'drop',
          priority: 70,
          level: 'care',
          scene: 'cold',
          title: '她那边降温了',
          detail: `今天最高 ${Math.round(Number(herToday.tempMax))}℃，比${relativeDayLabel(
            previous.date,
            todayKey
          )}低了 ${Math.round(Math.abs(delta))}℃。`,
          unlock: 'cold',
          phrases: 'cold'
        })
      )
    }
  }

  /* 5. 明天要降温 */
  if (Number.isFinite(Number(herToday.tempMax)) && Number.isFinite(Number(herTomorrow.tempMax))) {
    const delta = Number(herTomorrow.tempMax) - Number(herToday.tempMax)
    if (delta <= -t.drop) {
      events.push(
        baseEvent({
          key: 'drop-tomorrow',
          priority: 65,
          level: 'info',
          scene: 'cold',
          title: '明天她那边要降温',
          detail: `明天最高 ${Math.round(Number(herTomorrow.tempMax))}℃，比今天低 ${Math.round(
            Math.abs(delta)
          )}℃。今晚提醒她找件厚的。`,
          phrases: 'cold'
        })
      )
    }
  }

  /* 6. 两地温差 */
  const gap = Math.abs(meTemp - herTemp)
  if (gap >= t.gap) {
    events.push(
      baseEvent({
        key: 'gap',
        priority: 60,
        level: 'info',
        scene: 'gap',
        title: `你们之间差 ${Math.round(gap)}℃`,
        detail: `你 ${Math.round(meTemp)}℃，她 ${Math.round(herTemp)}℃。同一时刻，两个季节。`,
        phrases: 'gap',
        meta: { gap: Math.round(gap) }
      })
    )
  }

  /* 7. 高温 */
  if (herTemp >= t.hot) {
    events.push(
      baseEvent({
        key: 'hot',
        priority: 55,
        level: 'care',
        scene: 'hot',
        title: `她那边 ${Math.round(herTemp)}℃`,
        detail: `体感 ${Math.round(herFeels)}℃，注意防晒补水。冰饮可以，别只喝冰的。`,
        unlock: 'hot',
        phrases: 'hot'
      })
    )
  }

  /* 8. 大风 */
  const wind = windMax(herNow.windScale)
  if (wind >= t.wind) {
    events.push(
      baseEvent({
        key: 'wind',
        priority: 50,
        level: 'info',
        scene: 'wind',
        title: `她那边风有点大`,
        detail: `${herNow.windDir || '风'} ${herNow.windScale} 级，体感 ${Math.round(
          herFeels
        )}℃。出门把外套扣好。`,
        phrases: 'wind'
      })
    )
  }

  /* 9. 空气 */
  const aqi = num(her.air && her.air.aqi, 0)
  if (aqi >= t.aqi) {
    events.push(
      baseEvent({
        key: 'aqi',
        priority: 48,
        level: 'info',
        scene: 'aqi',
        title: '她那边空气一般',
        detail: `AQI ${Math.round(aqi)}，${her.air.category || '空气质量一般'}。口罩可以戴上，窗户先别开太大。`,
        phrases: 'aqi'
      })
    )
  }

  /* 10. 雾 / 霾 / 沙尘 */
  if (num(herNow.vis, 30) <= 5 || FOG_RE.test(herNow.text || '')) {
    events.push(
      baseEvent({
        key: 'fog',
        priority: 46,
        level: 'info',
        scene: 'fog',
        title: '她那边能见度不高',
        detail: `${herNow.text || '有雾'}，能见度 ${herNow.vis || '较低'} 公里。过马路多看一眼，慢一点。`,
        phrases: 'fog'
      })
    )
  }

  /* 11. 好天气 */
  const clearText = /晴/.test(herNow.text || '')
  if (clearText && herTemp >= 8 && herTemp <= 28) {
    events.push(
      baseEvent({
        key: 'clear',
        priority: 20,
        level: 'good',
        scene: 'clear',
        title: '她那边天气很好',
        detail: `${herNow.text}，${Math.round(herTemp)}℃。今天适合把好消息告诉她。`,
        phrases: 'clear'
      })
    )
  }

  /* 12. 深夜 */
  if (herHour >= 23 || herHour < 6) {
    events.push(
      baseEvent({
        key: 'night',
        priority: 15,
        level: 'info',
        scene: 'night',
        title: '她那边已经很晚了',
        detail: `她那边 ${String(herHour).padStart(2, '0')} 点多。天气看过了，就别吵她睡觉。`,
        phrases: 'night'
      })
    )
  }

  /* 13. 兜底 */
  events.push(
    baseEvent({
      key: 'daily',
      priority: 0,
      level: 'info',
      scene: 'daily',
      title: '今天也想知道她那边怎么样',
      detail: `${herNow.text || '天气'}，${Math.round(herTemp)}℃。看完天气，记得也照顾好自己。`,
      phrases: 'daily'
    })
  )

  return events.sort((a, b) => b.priority - a.priority)
}

export function primaryEvent(events) {
  if (!events || !events.length) return null
  return (
    events.find((event) => event.priority >= 40) ||
    events.find((event) => event.key === 'clear') ||
    events.find((event) => event.key === 'night') ||
    events[0]
  )
}

export function secondaryEvent(events, primary) {
  if (!events || !events.length) return null
  const key = primary && primary.key
  const gap = events.find((event) => event.key === 'gap' && event.key !== key)
  if (gap) return gap
  return (
    events.find(
      (event) => ['clear', 'night', 'daily'].includes(event.key) && event.key !== key
    ) || null
  )
}

export function eventMatchesLetter(letter, event) {
  if (!letter || !event) return false
  if (letter.trigger === 'any') return true
  if (letter.trigger === event.key) return true
  if (letter.trigger === 'cold' && event.scene === 'cold') return true
  if (letter.trigger === 'rain' && ['rain', 'thunder'].includes(event.key)) return true
  if (letter.trigger === 'snow' && event.key === 'snow') return true
  return false
}

export function letterUnlocked(letter, { me, her, settings, event, now = new Date() }) {
  if (!letter || !her || !her.now) return false
  const t = settings.thresholds
  const herTemp = num(her.now.temp)
  const meTemp = num(me && me.now ? me.now.temp : 0)
  switch (letter.trigger) {
    case 'any':
      return true
    case 'date':
      return Boolean(letter.date) && mmddIn(her.city && her.city.tz, now) === letter.date
    case 'cold':
      return herTemp < num(letter.value, t.cold)
    case 'hot':
      return herTemp > num(letter.value, t.hot)
    case 'gap':
      return Math.abs(meTemp - herTemp) >= num(letter.value, t.gap)
    case 'rain':
      return eventMatchesLetter(letter, event) || RAIN_RE.test(her.now.text || '')
    case 'snow':
      return eventMatchesLetter(letter, event) || SNOW_RE.test(her.now.text || '')
    default:
      return false
  }
}

export function triggerLabel(letter, settings) {
  if (!letter) return ''
  const t = settings.thresholds
  switch (letter.trigger) {
    case 'cold':
      return `低于 ${num(letter.value, t.cold)}℃ 时拆开`
    case 'hot':
      return `高于 ${num(letter.value, t.hot)}℃ 时拆开`
    case 'gap':
      return `两地温差大于 ${num(letter.value, t.gap)}℃ 时拆开`
    case 'rain':
      return '她那边下雨时拆开'
    case 'snow':
      return '她那边下雪时拆开'
    case 'date': {
      if (!letter.date) return '指定日期拆开'
      const [month, day] = String(letter.date).split('-')
      if (!month || !day) return '指定日期拆开'
      return `${Number(month)} 月 ${Number(day)} 日拆开`
    }
    case 'any':
    default:
      return '随时可以拆开'
  }
}
