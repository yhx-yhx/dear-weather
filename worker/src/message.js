const RAIN_RE = /雨|阵雨|暴雨|毛毛雨|冻雨|雨夹雪|雨雪/
const SNOW_RE = /雪|冰雹|冻雨/
const THUNDER_RE = /雷/
const FOG_RE = /雾|霾|沙|尘/

const PHRASES = {
  warning: [
    '她那边有天气预警，先看一眼再出门。',
    '这种天气，安全比准时重要。',
    '别逞强，等一等也没关系。'
  ],
  rain: [
    '伞带了吗？没带就买一把，别淋着。',
    '鞋别穿太薄，雨天脚冷最容易感冒。',
    '如果雨太大，就等一等，不用急着回去。'
  ],
  snow: [
    '下雪了。路滑，走慢一点。',
    '手套和围巾都带上，别只顾着看雪。',
    '回去喝点热的，别让手一直冰着。'
  ],
  thunder: [
    '打雷了，先别在外面走。',
    '雷雨天别站在树下，等一等再走。',
    '这种天气适合早点回家。'
  ],
  cold: [
    '多穿一件，不用好看，先暖和。',
    '降温了，别硬扛，外套穿上。',
    '晚上盖好被子，别踢。'
  ],
  hot: [
    '冰饮可以，别只喝冰的。',
    '中午别在外面晒太久。',
    '空调别开太低，容易感冒。'
  ],
  wind: [
    '风大，头发和心情都容易被吹乱。',
    '出门把外套扣好。',
    '走路别低头看手机。'
  ],
  aqi: [
    '今天空气一般，口罩可以戴上。',
    '雾霾天不适合跑步，改成室内吧。',
    '回家先洗把脸，会舒服一点。'
  ],
  fog: [
    '雾大，过马路多看一眼。',
    '看不清的时候就慢一点，不丢人。',
    '窗户先别开太大。'
  ],
  clear: [
    '她那边天气很好，适合把好消息告诉她。',
    '晴天适合出门，也适合被惦记。',
    '好天气别浪费，去走两步。'
  ],
  daily: [
    '今天也想知道她那边怎么样。',
    '先看她那边，再安排自己的一天。',
    '天气只是天气，惦记才是正事。'
  ]
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function windMax(scale) {
  if (scale === undefined || scale === null) return 0
  const parts = String(scale)
    .split('-')
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n))
  return parts.length ? Math.max(...parts) : 0
}

function hourIn(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date())
    const hour = parts.find((part) => part.type === 'hour')
    return hour ? Number(hour.value) : new Date().getHours()
  } catch (error) {
    return new Date().getHours()
  }
}

function dateText(tz) {
  try {
    const parts = new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz,
      month: 'numeric',
      day: 'numeric',
      weekday: 'long'
    }).formatToParts(new Date())
    const month = (parts.find((part) => part.type === 'month') || {}).value || ''
    const day = (parts.find((part) => part.type === 'day') || {}).value || ''
    const weekday = (parts.find((part) => part.type === 'weekday') || {}).value || ''
    return `${month}月${day}日 · ${weekday}`
  } catch (error) {
    return ''
  }
}

function pick(scene) {
  const pool = PHRASES[scene] || PHRASES.daily
  const day = Math.floor(Date.now() / 86400000)
  return pool[day % pool.length]
}

function truncate(text, max) {
  const value = String(text || '')
  return value.length > max ? `${value.slice(0, max)}…` : value
}

function careFor(bundle) {
  const now = bundle.now || {}
  const today = (bundle.daily && bundle.daily[0]) || {}
  const tomorrow = (bundle.daily && bundle.daily[1]) || {}
  const temp = num(now.temp)
  const feels = num(now.feelsLike, temp)
  const min = num(today.tempMin, temp)
  const max = num(today.tempMax, temp)
  const hour = hourIn(bundle.city.tz)
  const text = now.text || '天气'
  const warning = bundle.warnings && bundle.warnings[0]

  if (warning) {
    return {
      scene: 'warning',
      title: `她那边有${warning.typeName || '天气'}预警`,
      detail: `${warning.title || '天气预警'}${warning.text ? `：${truncate(warning.text, 80)}` : ''}`,
      temp,
      text
    }
  }

  const wetNow = RAIN_RE.test(text) || num(now.precip) > 0
  const nextWet = (bundle.hourly || [])
    .slice(0, 6)
    .find((item) => num(item.pop) >= 50 || RAIN_RE.test(item.text || ''))

  if (wetNow || nextWet) {
    const snow = SNOW_RE.test(text) || (nextWet && SNOW_RE.test(nextWet.text || ''))
    const thunder = THUNDER_RE.test(text)
    const scene = thunder ? 'thunder' : snow ? 'snow' : 'rain'
    const when = wetNow ? '现在' : `从 ${nextWet.fxTime ? nextWet.fxTime.slice(11, 16) : '稍后'} 开始`
    return {
      scene,
      title: snow ? '她那边下雪了' : thunder ? '她那边在打雷' : '她那边要下雨了',
      detail: `${text}，${when}，体感 ${Math.round(feels)}℃。`,
      temp,
      text
    }
  }

  if (temp < 10 || (hour >= 18 && min < 10)) {
    return {
      scene: 'cold',
      title: `她那边 ${Math.round(temp)}℃`,
      detail: `体感 ${Math.round(feels)}℃，今晚最低 ${Math.round(min)}℃。`,
      temp,
      text
    }
  }

  if (temp >= 33) {
    return {
      scene: 'hot',
      title: `她那边 ${Math.round(temp)}℃`,
      detail: `体感 ${Math.round(feels)}℃，注意防晒补水。`,
      temp,
      text
    }
  }

  const wind = windMax(now.windScale)
  if (wind >= 6) {
    return {
      scene: 'wind',
      title: '她那边风有点大',
      detail: `${now.windDir || '风'} ${now.windScale} 级，体感 ${Math.round(feels)}℃。`,
      temp,
      text
    }
  }

  const aqi = num(bundle.air && bundle.air.aqi, 0)
  if (aqi >= 150) {
    return {
      scene: 'aqi',
      title: '她那边空气一般',
      detail: `AQI ${Math.round(aqi)}，${(bundle.air && bundle.air.category) || '空气质量一般'}。`,
      temp,
      text
    }
  }

  if (num(now.vis, 30) <= 5 || FOG_RE.test(text)) {
    return {
      scene: 'fog',
      title: '她那边能见度不高',
      detail: `${text}，能见度 ${now.vis || '较低'} 公里。`,
      temp,
      text
    }
  }

  const drop = num(tomorrow.tempMax, max) - max
  if (drop <= -4) {
    return {
      scene: 'cold',
      title: '明天她那边要降温',
      detail: `明天最高 ${Math.round(num(tomorrow.tempMax))}℃，比今天低 ${Math.abs(Math.round(drop))}℃。`,
      temp,
      text
    }
  }

  if (/晴/.test(text) && temp >= 8 && temp <= 28) {
    return {
      scene: 'clear',
      title: '她那边天气很好',
      detail: `${text}，${Math.round(temp)}℃，${Math.round(min)}° / ${Math.round(max)}°。`,
      temp,
      text
    }
  }

  return {
    scene: 'daily',
    title: '今天也想知道她那边怎么样',
    detail: `${text}，${Math.round(temp)}℃，${Math.round(min)}° / ${Math.round(max)}°。`,
    temp,
    text
  }
}

export function buildMessage(bundle) {
  const care = careFor(bundle)
  const phrase = pick(care.scene)
  const city = bundle.city.name || '她那边'
  const date = dateText(bundle.city.tz)
  const site = 'https://yhx-yhx.github.io/dear-weather/'

  return {
    title: truncate(care.title, 48),
    body: truncate(`${care.detail}「${phrase}」`, 280),
    text: truncate(
      [
        `Dear Weather · ${date}`,
        `${city} ${Math.round(care.temp)}℃ ${care.text}`,
        '',
        care.title,
        care.detail,
        `「${phrase}」`,
        '',
        site
      ].join('\n'),
      900
    ),
    url: site,
    scene: care.scene
  }
}
