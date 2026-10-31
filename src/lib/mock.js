/* ?debug=1 时使用的模拟天气，方便测试所有关心卡片 */

function pad(n) {
  return String(n).padStart(2, '0')
}

function dayIso(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function hourIso(offset = 0) {
  const date = new Date()
  date.setHours(date.getHours() + offset, 0, 0, 0)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:00+08:00`
}

const SCENES = {
  rain: {
    temp: 12,
    feels: 9,
    text: '小雨',
    icon: '305',
    precip: '0.8',
    windScale: '3',
    windDir: '东北风',
    humidity: 86,
    vis: 8,
    max: 14,
    min: 9,
    dailyText: '小雨',
    dailyIcon: '305',
    pop: 80,
    summary: '未来两小时有小雨，出门记得带伞。'
  },
  cold: {
    temp: 6,
    feels: 3,
    text: '晴',
    icon: '100',
    precip: '0.0',
    windScale: '4',
    windDir: '西北风',
    humidity: 38,
    vis: 26,
    max: 9,
    min: 2,
    dailyText: '晴',
    dailyIcon: '100',
    pop: 0,
    summary: ''
  },
  hot: {
    temp: 35,
    feels: 39,
    text: '晴',
    icon: '100',
    precip: '0.0',
    windScale: '2',
    windDir: '南风',
    humidity: 44,
    vis: 24,
    max: 37,
    min: 27,
    dailyText: '晴',
    dailyIcon: '100',
    pop: 0,
    summary: ''
  },
  gap: {
    temp: 8,
    feels: 6,
    text: '多云',
    icon: '101',
    precip: '0.0',
    windScale: '3',
    windDir: '北风',
    humidity: 52,
    vis: 22,
    max: 11,
    min: 4,
    dailyText: '多云',
    dailyIcon: '101',
    pop: 10,
    summary: ''
  },
  clear: {
    temp: 22,
    feels: 22,
    text: '晴',
    icon: '100',
    precip: '0.0',
    windScale: '2',
    windDir: '东南风',
    humidity: 48,
    vis: 28,
    max: 25,
    min: 14,
    dailyText: '晴',
    dailyIcon: '100',
    pop: 0,
    summary: ''
  },
  warning: {
    temp: 16,
    feels: 14,
    text: '大雨',
    icon: '307',
    precip: '8.2',
    windScale: '6',
    windDir: '东南风',
    humidity: 94,
    vis: 3,
    max: 18,
    min: 13,
    dailyText: '大雨',
    dailyIcon: '307',
    pop: 95,
    summary: '未来两小时有强降雨。',
    warning: {
      title: '暴雨蓝色预警',
      typeName: '暴雨',
      level: '蓝色',
      text: '预计未来 6 小时降雨量将达 50 毫米以上，请注意防范。'
    }
  },
  aqi: {
    temp: 19,
    feels: 19,
    text: '霾',
    icon: '502',
    precip: '0.0',
    windScale: '2',
    windDir: '南风',
    humidity: 62,
    vis: 4,
    max: 22,
    min: 12,
    dailyText: '霾',
    dailyIcon: '502',
    pop: 0,
    summary: '',
    aqi: 186
  }
}

function makeBundle(city, scene, baseTemp = 18) {
  const cfg = SCENES[scene] || SCENES.clear
  const now = {
    obsTime: hourIso(0),
    temp: String(cfg.temp),
    feelsLike: String(cfg.feels),
    text: cfg.text,
    icon: cfg.icon,
    wind360: '90',
    windDir: cfg.windDir,
    windScale: cfg.windScale,
    windSpeed: '12',
    humidity: String(cfg.humidity),
    precip: cfg.precip,
    pressure: '1012',
    cloud: '30',
    dew: '8',
    vis: String(cfg.vis)
  }

  const daily = Array.from({ length: 7 }).map((_, index) => {
    const max = index === 0 ? cfg.max : cfg.max + (index % 3) - 1
    const min = index === 0 ? cfg.min : cfg.min + (index % 2)
    return {
      fxDate: dayIso(index),
      sunrise: '06:41',
      sunset: '17:13',
      tempMax: String(max),
      tempMin: String(min),
      iconDay: index === 0 ? cfg.dailyIcon : '101',
      textDay: index === 0 ? cfg.dailyText : '多云',
      iconNight: '151',
      textNight: '多云',
      windDirDay: cfg.windDir,
      windScaleDay: cfg.windScale,
      humidity: String(cfg.humidity),
      precip: index === 0 ? cfg.precip : '0.0',
      uvIndex: '3',
      vis: String(cfg.vis)
    }
  })

  const hourly = Array.from({ length: 24 }).map((_, index) => ({
    fxTime: hourIso(index + 1),
    temp: String(cfg.temp + Math.round(Math.sin(index / 4) * 2)),
    icon: index < 6 ? cfg.dailyIcon : '101',
    text: index < 6 ? cfg.dailyText : '多云',
    windScale: cfg.windScale,
    windDir: cfg.windDir,
    humidity: String(cfg.humidity),
    precip: index < 6 ? cfg.precip : '0.0',
    pop: String(index < 6 ? cfg.pop : 10)
  }))

  return {
    city,
    now,
    daily,
    hourly,
    air: {
      aqi: String(cfg.aqi || 42),
      level: cfg.aqi ? '4' : '1',
      category: cfg.aqi ? '中度污染' : '优',
      pm2p5: cfg.aqi ? '132' : '18'
    },
    warnings: cfg.warning ? [cfg.warning] : [],
    indices: [
      { type: '3', name: '穿衣指数', category: '较冷', text: '建议穿薄外套或毛衣。' },
      { type: '5', name: '紫外线指数', category: '弱', text: '紫外线较弱，涂擦 SPF12-15 即可。' },
      { type: '9', name: '感冒指数', category: '较易发', text: '温差较大，注意保暖。' }
    ],
    minutely: cfg.summary
      ? { summary: cfg.summary, minutely: [] }
      : { summary: '', minutely: [] },
    updateTime: new Date().toISOString(),
    updatedAt: Date.now(),
    _baseTemp: baseTemp
  }
}

export function mockBundles(scene, { me, her }) {
  const meScene = scene === 'gap' ? 'hot' : 'clear'
  return {
    me: makeBundle(me, meScene, 28),
    her: makeBundle(her, scene, 18),
    fetchedAt: Date.now()
  }
}
