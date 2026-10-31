/* 分享卡：1080 × 1440，Canvas 本地绘制，不经过任何服务端 */

import qrcode from 'qrcode-generator'
import { weatherKind } from './icons'
import {
  cityTitle,
  distanceKm,
  formatDateCN,
  formatDistance,
  num
} from './format'

const W = 1080
const H = 1440
const FAMILY =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif'
const SERIF = '"Songti SC", "Noto Serif SC", "SimSun", serif'
const INK = '#4f4358'
const INK_SOFT = '#8b7c96'
const HER = '#d9799f'
const ME = '#6f9ec7'

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function wrapLines(ctx, text, maxWidth) {
  const chars = Array.from(String(text || ''))
  const lines = []
  let current = ''
  chars.forEach((char) => {
    const next = current + char
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = char
    } else {
      current = next
    }
  })
  if (current) lines.push(current)
  return lines
}

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const lines = wrapLines(ctx, text, maxWidth).slice(0, maxLines)
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
  return lines.length
}

function fitText(ctx, text, maxWidth) {
  const value = String(text || '')
  if (ctx.measureText(value).width <= maxWidth) return value
  let result = value
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1)
  }
  return `${result}…`
}

function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function drawGrain(ctx) {
  const random = seededRandom(20261031)
  ctx.save()
  for (let i = 0; i < 460; i += 1) {
    const x = random() * W
    const y = random() * H
    const r = random() * 1.6 + 0.3
    ctx.globalAlpha = random() * 0.05 + 0.01
    ctx.fillStyle = i % 3 === 0 ? HER : i % 3 === 1 ? ME : INK
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawGlyph(ctx, kind, x, y, size, color = HER) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 64, size / 64)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2.6

  const cloud = () => {
    ctx.beginPath()
    ctx.arc(24, 34, 9, Math.PI * 0.5, Math.PI * 1.5)
    ctx.arc(32, 27, 11, Math.PI, Math.PI * 1.9)
    ctx.arc(43, 33, 9, Math.PI * 1.2, Math.PI * 0.5)
    ctx.lineTo(24, 43)
    ctx.closePath()
    ctx.fill()
  }

  if (kind === 'sun' || kind === 'hot') {
    ctx.beginPath()
    ctx.arc(32, 32, 11, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI / 4) * i
      ctx.beginPath()
      ctx.moveTo(32 + Math.cos(angle) * 17, 32 + Math.sin(angle) * 17)
      ctx.lineTo(32 + Math.cos(angle) * 24, 32 + Math.sin(angle) * 24)
      ctx.stroke()
    }
    if (kind === 'hot') {
      ctx.beginPath()
      ctx.moveTo(18, 52)
      ctx.quadraticCurveTo(24, 48, 30, 52)
      ctx.quadraticCurveTo(36, 56, 44, 52)
      ctx.stroke()
    }
  } else if (kind === 'moon') {
    ctx.beginPath()
    ctx.arc(34, 32, 15, Math.PI * 0.35, Math.PI * 1.65)
    ctx.arc(26, 28, 15, Math.PI * 1.2, Math.PI * 0.45, true)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(48, 18, 1.6, 0, Math.PI * 2)
    ctx.arc(52, 28, 1.1, 0, Math.PI * 2)
    ctx.fill()
  } else if (kind === 'partly' || kind === 'partly-night') {
    ctx.beginPath()
    ctx.arc(24, 24, 10, 0, Math.PI * 2)
    ctx.fill()
    cloud()
  } else if (kind === 'overcast') {
    ctx.globalAlpha = 0.55
    cloud()
    ctx.globalAlpha = 1
    ctx.save()
    ctx.translate(8, 6)
    cloud()
    ctx.restore()
  } else if (kind === 'rain' || kind === 'thunder' || kind === 'sleet') {
    cloud()
    ctx.strokeStyle = kind === 'thunder' ? '#c48a3a' : ME
    if (kind === 'thunder') {
      ctx.beginPath()
      ctx.moveTo(34, 42)
      ctx.lineTo(29, 52)
      ctx.lineTo(35, 52)
      ctx.lineTo(31, 61)
      ctx.stroke()
    } else {
      ;[20, 30, 40].forEach((dx) => {
        ctx.beginPath()
        ctx.moveTo(dx, 47)
        ctx.lineTo(dx - 3, 56)
        ctx.stroke()
      })
    }
  } else if (kind === 'snow' || kind === 'cold') {
    if (kind === 'snow') cloud()
    ctx.strokeStyle = ME
    ;[
      [22, 52],
      [32, 57],
      [42, 52]
    ].forEach(([cx, cy]) => {
      for (let i = 0; i < 3; i += 1) {
        const angle = (Math.PI / 3) * i
        ctx.beginPath()
        ctx.moveTo(cx - Math.cos(angle) * 5, cy - Math.sin(angle) * 5)
        ctx.lineTo(cx + Math.cos(angle) * 5, cy + Math.sin(angle) * 5)
        ctx.stroke()
      }
    })
  } else if (kind === 'fog' || kind === 'wind') {
    ctx.lineWidth = 3
    ;[24, 34, 44].forEach((dy, index) => {
      ctx.beginPath()
      ctx.moveTo(16 + index * 2, dy)
      ctx.lineTo(48 - index * 3, dy)
      ctx.stroke()
    })
  } else if (kind === 'warning') {
    ctx.beginPath()
    ctx.moveTo(32, 12)
    ctx.lineTo(56, 54)
    ctx.lineTo(8, 54)
    ctx.closePath()
    ctx.globalAlpha = 0.18
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(32, 26)
    ctx.lineTo(32, 42)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(32, 48, 1.8, 0, Math.PI * 2)
    ctx.fill()
  } else if (kind === 'letter') {
    roundRect(ctx, 10, 18, 44, 30, 5)
    ctx.globalAlpha = 0.18
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(12, 22)
    ctx.lineTo(32, 36)
    ctx.lineTo(52, 22)
    ctx.stroke()
  } else if (kind === 'gap') {
    ctx.beginPath()
    ctx.arc(18, 32, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(46, 32, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.setLineDash([3, 5])
    ctx.moveTo(25, 32)
    ctx.quadraticCurveTo(32, 22, 39, 32)
    ctx.stroke()
  } else {
    cloud()
  }

  ctx.restore()
}

function drawQrCode(ctx, text, x, y, size) {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const count = qr.getModuleCount()
  const quiet = 3
  const total = count + quiet * 2
  const cell = size / total
  ctx.save()
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, x - 8, y - 8, size + 16, size + 16, 14)
  ctx.fill()
  ctx.fillStyle = INK
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.isDark(row, col)) continue
      const px = Math.round(x + (col + quiet) * cell)
      const py = Math.round(y + (row + quiet) * cell)
      const pw = Math.round(x + (col + quiet + 1) * cell) - px
      const ph = Math.round(y + (row + quiet + 1) * cell) - py
      ctx.fillRect(px, py, pw, ph)
    }
  }
  ctx.restore()
}

function drawBrand(ctx, x, y) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = INK_SOFT
  ctx.lineWidth = 2.4
  ctx.lineJoin = 'round'
  roundRect(ctx, 0, 8, 34, 24, 5)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(2, 11)
  ctx.lineTo(17, 22)
  ctx.lineTo(32, 11)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(17, 5, 5, Math.PI, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export function buildPoster({ me, her, settings, event, phrase, siteUrl }) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const meCity = cityTitle(me.city)
  const herCity = cityTitle(her.city)
  const meTemp = Math.round(num(me.now.temp))
  const herTemp = Math.round(num(her.now.temp))
  const gap = Math.abs(meTemp - herTemp)
  const distance = distanceKm(me.city, her.city)
  const care = event || {}
  const careTitle = care.title || '今天也想知道她那边怎么样'
  const careDetail = care.detail || `${her.now.text || '天气'}，${herTemp}℃。`
  const carePhrase = phrase || '把今天的天气，替我告诉你。'
  const dateText = formatDateCN(new Date(), her.city && her.city.tz)

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#fdf5f7')
  bg.addColorStop(0.46, '#f8f3fb')
  bg.addColorStop(1, '#eef4fb')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const blobA = ctx.createRadialGradient(930, 120, 20, 930, 120, 520)
  blobA.addColorStop(0, 'rgba(233, 143, 178, 0.26)')
  blobA.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = blobA
  ctx.fillRect(0, 0, W, H)

  const blobB = ctx.createRadialGradient(90, 1260, 20, 90, 1260, 560)
  blobB.addColorStop(0, 'rgba(143, 184, 222, 0.24)')
  blobB.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = blobB
  ctx.fillRect(0, 0, W, H)

  drawGrain(ctx)

  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 2
  roundRect(ctx, 38, 38, W - 76, H - 76, 34)
  ctx.stroke()

  // 页眉
  drawBrand(ctx, 86, 78)
  ctx.textAlign = 'left'
  ctx.fillStyle = INK_SOFT
  ctx.font = `600 22px ${FAMILY}`
  ctx.fillText('D E A R   W E A T H E R', 140, 98)
  ctx.fillStyle = INK
  ctx.font = `600 52px ${FAMILY}`
  ctx.fillText('Dear Weather', 86, 178)
  ctx.textAlign = 'right'
  ctx.fillStyle = INK_SOFT
  ctx.font = `400 24px ${FAMILY}`
  ctx.fillText(dateText, W - 86, 178)

  // 她
  ctx.textAlign = 'left'
  ctx.fillStyle = HER
  ctx.font = `600 30px ${FAMILY}`
  ctx.fillText(`她 · ${herCity}`, 90, 286)
  ctx.fillStyle = INK
  ctx.font = `200 176px ${FAMILY}`
  ctx.fillText(`${herTemp}°`, 82, 456)
  ctx.fillStyle = INK
  ctx.font = `400 42px ${FAMILY}`
  ctx.fillText(her.now.text || '天气', 96, 520)
  ctx.fillStyle = INK_SOFT
  ctx.font = `400 28px ${FAMILY}`
  ctx.fillText(
    `体感 ${Math.round(num(her.now.feelsLike, herTemp))}℃ · ${Math.round(
      num(her.daily && her.daily[0] && her.daily[0].tempMin)
    )}° / ${Math.round(num(her.daily && her.daily[0] && her.daily[0].tempMax))}° · 湿度 ${
      her.now.humidity || '—'
    }%`,
    96,
    574
  )
  drawGlyph(ctx, weatherKind(her.now.icon, her.now.text), 790, 300, 168, HER)

  // 双城连接
  const lineY = 700
  ctx.save()
  ctx.strokeStyle = 'rgba(139, 124, 150, 0.34)'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 9])
  ctx.beginPath()
  ctx.moveTo(150, lineY)
  ctx.quadraticCurveTo(540, lineY - 66, 930, lineY)
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = ME
  ctx.beginPath()
  ctx.arc(150, lineY, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = HER
  ctx.beginPath()
  ctx.arc(930, lineY, 10, 0, Math.PI * 2)
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.fillStyle = INK_SOFT
  ctx.font = `500 24px ${FAMILY}`
  ctx.fillText(`相距 ${formatDistance(distance)} · 温差 ${gap}℃`, 540, lineY - 96)
  ctx.fillStyle = INK
  ctx.font = `400 30px ${FAMILY}`
  ctx.fillText(
    gap >= 8 ? '两座城市，两种天气。' : '天气不同步，惦记可以同步。',
    540,
    lineY + 58
  )

  // 我
  ctx.textAlign = 'left'
  ctx.fillStyle = ME
  ctx.font = `600 28px ${FAMILY}`
  ctx.fillText(`我 · ${meCity}`, 90, 858)
  ctx.fillStyle = INK
  ctx.font = `200 104px ${FAMILY}`
  ctx.fillText(`${meTemp}°`, 86, 958)
  ctx.fillStyle = INK
  ctx.font = `400 36px ${FAMILY}`
  ctx.fillText(me.now.text || '天气', 320, 930)
  ctx.fillStyle = INK_SOFT
  ctx.font = `400 26px ${FAMILY}`
  ctx.fillText(
    `体感 ${Math.round(num(me.now.feelsLike, meTemp))}℃ · 湿度 ${me.now.humidity || '—'}%`,
    322,
    976
  )
  drawGlyph(ctx, weatherKind(me.now.icon, me.now.text), 858, 842, 104, ME)

  // 关心卡
  ctx.save()
  ctx.shadowColor = 'rgba(79, 67, 88, 0.10)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
  roundRect(ctx, 78, 1034, W - 156, 226, 28)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth = 2
  roundRect(ctx, 78, 1034, W - 156, 226, 28)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = HER
  ctx.font = `600 18px ${FAMILY}`
  ctx.fillText('T O D A Y \u2019 S   C A R E', 112, 1082)
  ctx.fillStyle = INK
  ctx.font = `600 36px ${FAMILY}`
  ctx.fillText(fitText(ctx, careTitle, W - 224), 112, 1134)
  ctx.fillStyle = INK_SOFT
  ctx.font = `400 24px ${FAMILY}`
  drawWrapped(ctx, careDetail, 112, 1174, W - 224, 30, 2)
  ctx.fillStyle = HER
  ctx.font = `400 29px ${SERIF}`
  ctx.fillText(fitText(ctx, `「${carePhrase}」`, W - 224), 112, 1242)

  // 页脚
  ctx.fillStyle = INK_SOFT
  ctx.font = `400 20px ${FAMILY}`
  ctx.fillText('dear-weather · 把今天的天气，替我告诉你', 90, 1350)

  drawQrCode(ctx, siteUrl, 830, 1272, 118)
  ctx.textAlign = 'right'
  ctx.fillStyle = INK_SOFT
  ctx.font = `400 18px ${FAMILY}`
  ctx.fillText('扫码打开 Dear Weather', 792, 1388)

  return canvas
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1)
  })
}

export async function savePoster(canvas, filename = 'dear-weather.png') {
  const blob = await canvasToBlob(canvas)
  if (!blob) return false
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return true
}

export async function sharePoster(canvas, filename = 'dear-weather.png') {
  const blob = await canvasToBlob(canvas)
  if (!blob) return 'failed'
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Dear Weather',
        text: '把今天的天气，替我告诉你。'
      })
      return 'shared'
    } catch (error) {
      if (error && error.name === 'AbortError') return 'cancelled'
    }
  }
  await savePoster(canvas, filename)
  return 'downloaded'
}

export function posterDataUrl(canvas) {
  try {
    return canvas.toDataURL('image/png')
  } catch (e) {
    return ''
  }
}
