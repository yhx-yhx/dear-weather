/* 本地存储：设置、天气缓存、每日高低温历史。所有数据只留在这台设备。 */

import { dateKeyIn } from './format'

const NS = 'dear-weather'
const KEYS = {
  settings: `${NS}:settings:v1`,
  cache: `${NS}:cache:v1`,
  history: `${NS}:history:v1`
}

const BUILT_IN_PUSH_URL = import.meta.env.VITE_PUSH_WORKER_URL || ''
const BUILT_IN_PUSH_TOKEN = import.meta.env.VITE_PUSH_TOKEN || ''

export const DEFAULT_LAYOUT = ['her', 'map', 'me', 'care', 'letters', 'hourly', 'forecast']

export const DEFAULT_SETTINGS = {
  version: 1,
  onboarded: false,
  createdAt: null,
  me: { name: '我', city: null },
  her: { name: '她', city: null },
  layout: [...DEFAULT_LAYOUT],
  thresholds: {
    cold: 10,
    gap: 8,
    drop: 4,
    hot: 33,
    wind: 6,
    aqi: 150
  },
  theme: 'auto',
  refreshMinutes: 30,
  motion: true,
  sound: false,
  showMap: true,
  apiKey: '',
  apiHost: '',
  pushUrl: BUILT_IN_PUSH_URL,
  pushToken: BUILT_IN_PUSH_TOKEN,
  phrases: {},
  letters: []
}

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (e) {
    return value
  }
}

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    return false
  }
}

export function mergeSettings(raw) {
  const base = clone(DEFAULT_SETTINGS)
  if (!raw || typeof raw !== 'object') return base

  const layout = []
  if (Array.isArray(raw.layout)) {
    raw.layout.forEach((key) => {
      if (DEFAULT_LAYOUT.includes(key) && !layout.includes(key)) layout.push(key)
    })
  }
  DEFAULT_LAYOUT.forEach((key) => {
    if (!layout.includes(key)) layout.push(key)
  })

  return {
    ...base,
    ...raw,
    me: { ...base.me, ...(raw.me || {}) },
    her: { ...base.her, ...(raw.her || {}) },
    thresholds: { ...base.thresholds, ...(raw.thresholds || {}) },
    layout,
    pushUrl: raw.pushUrl || base.pushUrl,
    pushToken: raw.pushToken || base.pushToken,
    phrases: raw.phrases && typeof raw.phrases === 'object' ? { ...raw.phrases } : {},
    letters: Array.isArray(raw.letters) ? raw.letters : []
  }
}

export function loadSettings() {
  return mergeSettings(read(KEYS.settings))
}

export function saveSettings(settings) {
  return write(KEYS.settings, settings)
}

export function loadCache() {
  const cache = read(KEYS.cache)
  if (!cache || !cache.fetchedAt) return null
  return cache
}

export function saveCache(cache) {
  return write(KEYS.cache, cache)
}

export function loadHistory() {
  const history = read(KEYS.history)
  return history && typeof history === 'object' ? history : {}
}

export function saveHistory(history) {
  return write(KEYS.history, history)
}

/** 记录某座城市今天的高低温，只保留最近 30 个日期 */
export function recordHistory(history, key, bundle, tz) {
  if (!bundle || !bundle.daily || !bundle.daily[0]) return history
  const today = bundle.daily[0]
  const date = dateKeyIn(tz)
  const bucket = history[key] && typeof history[key] === 'object' ? history[key] : {}
  bucket[date] = {
    max: Number(today.tempMax),
    min: Number(today.tempMin),
    at: Date.now()
  }
  const dates = Object.keys(bucket).sort().slice(-30)
  const pruned = {}
  dates.forEach((d) => {
    pruned[d] = bucket[d]
  })
  history[key] = pruned
  return history
}

export function exportSettings(settings) {
  return JSON.stringify(
    {
      app: 'dear-weather',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings
    },
    null,
    2
  )
}

export function importSettings(text) {
  const data = JSON.parse(text)
  const settings = data && data.settings ? data.settings : data
  if (!settings || typeof settings !== 'object') {
    throw new Error('这份文件里没有可用的设置')
  }
  return mergeSettings(settings)
}

export function clearAll() {
  Object.values(KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      /* ignore */
    }
  })
  clearPopupMarks()
}

export function clearPopupMarks() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${NS}:popup:`)) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
  } catch (e) {
    /* ignore */
  }
}

export function popupSeen(key) {
  try {
    return localStorage.getItem(`${NS}:popup:${key}`) === '1'
  } catch (e) {
    return false
  }
}

export function markPopupSeen(key) {
  try {
    localStorage.setItem(`${NS}:popup:${key}`, '1')
  } catch (e) {
    /* ignore */
  }
}
