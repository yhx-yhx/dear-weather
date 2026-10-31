/* 和风天气 icon code → 页面里使用的手绘图标类型 */

export function weatherKind(code, text = '') {
  const n = Number(code)
  if (!n || n === 999) return kindFromText(text)
  if (n >= 100 && n <= 103) return n === 100 ? 'sun' : 'partly'
  if (n === 104) return 'overcast'
  if (n >= 150 && n <= 153) return n === 150 ? 'moon' : 'partly-night'
  if (n >= 300 && n <= 399) {
    if (n === 302 || n === 303 || n === 304) return 'thunder'
    if (n === 313 || n === 404 || n === 405 || n === 406) return 'sleet'
    return 'rain'
  }
  if (n >= 400 && n <= 499) return 'snow'
  if (n >= 500 && n <= 515) return 'fog'
  if (n === 900) return 'hot'
  if (n === 901) return 'cold'
  return kindFromText(text)
}

export function kindFromText(text = '') {
  const value = String(text)
  if (/雷/.test(value)) return 'thunder'
  if (/雨夹雪|冻雨|雨雪/.test(value)) return 'sleet'
  if (/雪/.test(value)) return 'snow'
  if (/雨|阵雨|暴雨|毛毛雨/.test(value)) return 'rain'
  if (/雾|霾|沙|尘/.test(value)) return 'fog'
  if (/阴/.test(value)) return 'overcast'
  if (/云/.test(value)) return 'partly'
  if (/晴/.test(value)) return 'sun'
  if (/风/.test(value)) return 'wind'
  return 'partly'
}

export function sceneKind(scene) {
  const map = {
    rain: 'rain',
    snow: 'snow',
    sleet: 'sleet',
    thunder: 'thunder',
    cold: 'cold',
    hot: 'hot',
    wind: 'wind',
    fog: 'fog',
    aqi: 'fog',
    warning: 'warning',
    gap: 'gap',
    clear: 'sun',
    night: 'moon',
    daily: 'letter'
  }
  return map[scene] || 'partly'
}

export const KIND_LABELS = {
  sun: '晴',
  moon: '晴夜',
  partly: '多云',
  'partly-night': '多云',
  overcast: '阴',
  rain: '雨',
  thunder: '雷雨',
  sleet: '雨夹雪',
  snow: '雪',
  fog: '雾',
  wind: '风',
  hot: '热',
  cold: '冷',
  warning: '预警',
  gap: '双城',
  letter: '信'
}
