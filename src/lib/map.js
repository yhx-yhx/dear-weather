/* 天地图 Web Mercator 瓦片计算。不依赖地图库，自己摆 3～4 行瓦片。 */

const TILE = 256
const MAX_LAT = 85.05112878

export function lonToX(lon, z) {
  return ((Number(lon) + 180) / 360) * Math.pow(2, z) * TILE
}

export function latToY(lat, z) {
  const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, Number(lat)))
  const rad = (clamped * Math.PI) / 180
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, z) *
    TILE
  )
}

export function fitZoom(a, b, width, height, padding = 46, maxZoom = 10, minZoom = 1) {
  for (let z = maxZoom; z >= minZoom; z -= 1) {
    const ax = lonToX(a.lon, z)
    const ay = latToY(a.lat, z)
    const bx = lonToX(b.lon, z)
    const by = latToY(b.lat, z)
    if (
      Math.abs(ax - bx) <= Math.max(40, width - padding * 2) &&
      Math.abs(ay - by) <= Math.max(40, height - padding * 2)
    ) {
      return z
    }
  }
  return minZoom
}

export function tileUrl({ layer, x, y, z, key, sub = 0 }) {
  const host = `t${Math.abs(sub) % 8}`
  return `https://${host}.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${key}`
}

export function layoutMap(me, her, width, height, options = {}) {
  const padding = options.padding || 48
  const key = options.key || ''
  const z = fitZoom(me, her, width, height, padding, options.maxZoom || 10, options.minZoom || 1)
  const world = Math.pow(2, z)

  const ax = lonToX(me.lon, z)
  const ay = latToY(me.lat, z)
  const bx = lonToX(her.lon, z)
  const by = latToY(her.lat, z)

  const centerX = (ax + bx) / 2
  const centerY = (ay + by) / 2
  const offsetX = centerX - width / 2
  const offsetY = centerY - height / 2

  const mePoint = { x: ax - offsetX, y: ay - offsetY }
  const herPoint = { x: bx - offsetX, y: by - offsetY }

  // 同城时稍微错开两个光点
  const samePlace = Math.hypot(mePoint.x - herPoint.x, mePoint.y - herPoint.y) < 18
  if (samePlace) {
    mePoint.x -= 9
    herPoint.x += 9
  }

  const tiles = []
  const minX = Math.floor(offsetX / TILE)
  const maxX = Math.floor((offsetX + width) / TILE)
  const minY = Math.floor(offsetY / TILE)
  const maxY = Math.floor((offsetY + height) / TILE)

  for (let y = minY; y <= maxY; y += 1) {
    if (y < 0 || y >= world) continue
    for (let x = minX; x <= maxX; x += 1) {
      const wrapped = ((x % world) + world) % world
      const left = x * TILE - offsetX
      const top = y * TILE - offsetY
      const base = { x: wrapped, y, z, key, sub: Math.abs(x + y) }
      tiles.push({
        key: `vec-${z}-${wrapped}-${y}`,
        url: tileUrl({ ...base, layer: 'vec' }),
        style: { left: `${left}px`, top: `${top}px` }
      })
      tiles.push({
        key: `cva-${z}-${wrapped}-${y}`,
        url: tileUrl({ ...base, layer: 'cva' }),
        style: { left: `${left}px`, top: `${top}px` }
      })
    }
  }

  const dx = herPoint.x - mePoint.x
  const dy = herPoint.y - mePoint.y
  const length = Math.max(1, Math.hypot(dx, dy))
  const nx = -dy / length
  const ny = dx / length
  let curve = Math.min(52, Math.max(18, length * 0.2))
  let control = {
    x: (mePoint.x + herPoint.x) / 2 + nx * curve,
    y: (mePoint.y + herPoint.y) / 2 + ny * curve
  }
  // 让弧线向上弯
  if (control.y > (mePoint.y + herPoint.y) / 2) {
    control = {
      x: (mePoint.x + herPoint.x) / 2 - nx * curve,
      y: (mePoint.y + herPoint.y) / 2 - ny * curve
    }
  }

  const mid = {
    x: 0.25 * mePoint.x + 0.5 * control.x + 0.25 * herPoint.x,
    y: 0.25 * mePoint.y + 0.5 * control.y + 0.25 * herPoint.y
  }

  return {
    z,
    tiles,
    mePoint,
    herPoint,
    control,
    mid,
    arc: `M ${mePoint.x} ${mePoint.y} Q ${control.x} ${control.y} ${herPoint.x} ${herPoint.y}`,
    samePlace
  }
}
