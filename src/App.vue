<template>
  <div class="app-shell" :class="{ 'no-motion': !motion }">
    <div class="sky-frame">
      <SkyBackground :theme="theme" />
    </div>

    <WelcomeFlow v-if="!ready" :settings="settings" @done="finishWelcome" />

    <main v-else class="page">
      <header class="hero">
        <div class="hero-top">
          <div class="brand">
            <span class="brand-mark"><BrandMark /></span>
            <span class="brand-text">
              <b>Dear Weather</b>
              <em>每天先看{{ herName }}那边</em>
            </span>
          </div>

          <div class="hero-actions">
            <button
              type="button"
              class="icon-btn"
              :class="{ spinning: refreshing }"
              aria-label="刷新天气"
              :disabled="refreshing"
              @click="refresh"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 12a8 8 0 1 1-2.3-5.6"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
                <path
                  d="M20 4v4.4h-4.4"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <button type="button" class="icon-btn" aria-label="打开设置" @click="openSettings('cities')">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 8h10M18 8h2M4 16h2M10 16h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                <circle cx="16" cy="8" r="2.2" stroke="currentColor" stroke-width="1.7" />
                <circle cx="8" cy="16" r="2.2" stroke="currentColor" stroke-width="1.7" />
              </svg>
            </button>
          </div>
        </div>

        <div class="hero-copy">
          <span class="hero-eyebrow">{{ greeting }}，{{ dateText }}</span>
          <h1>
            先看{{ herName }}那边<span class="hero-dot">。</span>
          </h1>
          <p class="hero-line">{{ dailyLineText }}</p>
        </div>

        <p v-if="mockScene" class="mock-badge">
          正在演示「{{ mockLabel }}」场景 · 关闭页面后恢复真实天气
        </p>
      </header>

      <p v-if="error" class="error-bar">
        <span>{{ error }}</span>
        <button type="button" @click="refresh">再试一次</button>
      </p>

      <template v-for="section in layoutOrder" :key="section">
        <CityCard
          v-if="section === 'her'"
          role="her"
          :person-name="herName"
          :city="settings.her.city"
          :bundle="herBundle"
          :motion="motion"
        />

        <TwinMap
          v-else-if="section === 'map' && settings.showMap !== false"
          :me-city="settings.me.city"
          :her-city="settings.her.city"
          :me-bundle="meBundle"
          :her-bundle="herBundle"
          :motion="motion"
        />

        <CityCard
          v-else-if="section === 'me'"
          role="me"
          :person-name="meName"
          :city="settings.me.city"
          :bundle="meBundle"
          :motion="motion"
        />

        <div v-else-if="section === 'care'" class="care-group">
          <CareCard
            v-if="primary"
            :event="primary"
            :phrase="phraseFor(primary)"
            :has-letter="Boolean(letterForEvent(primary))"
            @cycle="cycle(primary)"
            @share="openPoster(primary)"
            @letter="openEventLetter(primary)"
          />

          <CareCard
            v-if="secondary"
            variant="soft"
            :event="secondary"
            :phrase="phraseFor(secondary)"
            :has-letter="Boolean(letterForEvent(secondary))"
            @cycle="cycle(secondary)"
            @share="openPoster(secondary)"
            @letter="openEventLetter(secondary)"
          />
        </div>

        <LetterShelf
          v-else-if="section === 'letters'"
          :letters="settings.letters"
          :me="meBundle"
          :her="herBundle"
          :settings="settings"
          :event="primary"
          :person-name="herName"
          @open="openLetter"
          @write="writeLetter"
          @hint="showToast"
        />

        <HourlyStrip
          v-else-if="section === 'hourly' && herBundle"
          :bundle="herBundle"
          :city="settings.her.city"
        />

        <ForecastList
          v-else-if="section === 'forecast' && herBundle"
          :bundle="herBundle"
          :city="settings.her.city"
        />
      </template>

      <footer class="page-foot">
        <div class="foot-line soft">
          <span>{{ updatedText }}</span>
          <span class="foot-sep">·</span>
          <span>只保存在这台设备</span>
        </div>
        <button type="button" class="foot-link" @click="openSettings('about')">
          设置与备份
        </button>
      </footer>
    </main>

    <CarePopup
      :event="popupEvent"
      :phrase="popupEvent ? phraseFor(popupEvent) : ''"
      :has-letter="Boolean(letterForEvent(popupEvent))"
      :person-name="herName"
      @close="popupEvent = null"
      @cycle="cycle(popupEvent)"
      @share="openPoster(popupEvent)"
      @letter="openEventLetter(popupEvent)"
    />

    <LetterModal
      :letter="activeLetter"
      :person-name="meName"
      @close="activeLetter = null"
      @edit="editLetter"
    />

    <SettingsSheet
      :open="settingsOpen"
      :settings="settings"
      :initial-tab="settingsTab"
      :initial-letter-id="settingsLetterId"
      :start-new-letter="settingsNewLetter"
      @close="closeSettings"
      @save="saveSettingsFromSheet"
      @save-silent="saveSettingsSilently"
      @clear="clearData"
    />

    <PosterModal
      :open="posterOpen"
      :me="meBundle"
      :her="herBundle"
      :settings="settings"
      :event="posterEvent"
      :phrase="posterEvent ? phraseFor(posterEvent) : ''"
      @close="posterOpen = false"
      @notice="showToast"
    />

    <Toast :message="toast" />

    <DebugPanel v-if="debug && ready" :scene="mockScene" @set="setMock" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import BrandMark from './components/BrandMark.vue'
import CareCard from './components/CareCard.vue'
import CarePopup from './components/CarePopup.vue'
import CityCard from './components/CityCard.vue'
import DebugPanel from './components/DebugPanel.vue'
import ForecastList from './components/ForecastList.vue'
import HourlyStrip from './components/HourlyStrip.vue'
import LetterModal from './components/LetterModal.vue'
import LetterShelf from './components/LetterShelf.vue'
import PosterModal from './components/PosterModal.vue'
import SettingsSheet from './components/SettingsSheet.vue'
import SkyBackground from './components/SkyBackground.vue'
import Toast from './components/Toast.vue'
import TwinMap from './components/TwinMap.vue'
import WelcomeFlow from './components/WelcomeFlow.vue'

import {
  dateKeyIn,
  formatDateCN,
  formatRelative,
  greetingFor,
  hourIn
} from './lib/format'
import { dailyLine, phrasePool } from './lib/phrases'
import { fetchAll } from './lib/qweather'
import { mockBundles } from './lib/mock'
import {
  buildEvents,
  eventMatchesLetter,
  letterUnlocked,
  primaryEvent as pickPrimary,
  secondaryEvent as pickSecondary
} from './lib/rules'
import { playChime } from './lib/sound'
import {
  clearAll,
  DEFAULT_LAYOUT,
  loadCache,
  loadHistory,
  loadSettings,
  markPopupSeen,
  mergeSettings,
  popupSeen,
  recordHistory,
  saveCache,
  saveHistory,
  saveSettings
} from './lib/storage'

/* ------------------------------------------------------------------ */
/* 状态                                                               */
/* ------------------------------------------------------------------ */

const settings = ref(loadSettings())
const cache = ref(loadCache())
const history = ref(loadHistory())
const events = ref([])

const loading = ref(!cache.value)
const refreshing = ref(false)
const busy = ref(false)
const error = ref('')

const nowTick = ref(Date.now())
const phraseIndex = ref({})

const popupEvent = ref(null)
const activeLetter = ref(null)
const posterOpen = ref(false)
const posterEvent = ref(null)

const settingsOpen = ref(false)
const settingsTab = ref('cities')
const settingsLetterId = ref('')
const settingsNewLetter = ref(false)

const toast = ref('')
const mockScene = ref('')

const debug = (() => {
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1'
  } catch (e) {
    return false
  }
})()

let toastTimer = null
let popupTimer = null
let tickTimer = null
let refreshTimer = null

/* ------------------------------------------------------------------ */
/* 派生数据                                                            */
/* ------------------------------------------------------------------ */

const ready = computed(
  () =>
    Boolean(settings.value.onboarded) &&
    Boolean(settings.value.me && settings.value.me.city) &&
    Boolean(settings.value.her && settings.value.her.city)
)

const meName = computed(() => settings.value.me.name || '我')
const herName = computed(() => settings.value.her.name || '她')
const motion = computed(() => settings.value.motion !== false)

const layoutOrder = computed(() => {
  const saved = Array.isArray(settings.value.layout) ? settings.value.layout : []
  const order = []
  saved.forEach((key) => {
    if (DEFAULT_LAYOUT.includes(key) && !order.includes(key)) order.push(key)
  })
  DEFAULT_LAYOUT.forEach((key) => {
    if (!order.includes(key)) order.push(key)
  })
  return order
})

const liveBundles = computed(() => {
  if (mockScene.value) {
    return mockBundles(mockScene.value, {
      me: settings.value.me.city,
      her: settings.value.her.city
    })
  }
  return cache.value
})

const meBundle = computed(() => (liveBundles.value ? liveBundles.value.me : null))
const herBundle = computed(() => (liveBundles.value ? liveBundles.value.her : null))

const primary = computed(() => pickPrimary(events.value))
const secondary = computed(() => pickSecondary(events.value, primary.value))

const herTz = computed(() => (settings.value.her.city && settings.value.her.city.tz) || undefined)

const greeting = computed(() => greetingFor(hourIn(herTz.value, new Date(nowTick.value))))
const dateText = computed(() => formatDateCN(new Date(nowTick.value), herTz.value))
const dailyLineText = computed(() =>
  localize(dailyLine(new Date(nowTick.value), settings.value.phrases))
)

const theme = computed(() => {
  if (!ready.value) return 'dawn'
  const picked = settings.value.theme
  if (picked && picked !== 'auto') return picked
  const her = herBundle.value
  if (!her || !her.now) return 'day'
  const text = her.now.text || ''
  if (/雷|雨/.test(text)) return 'rain'
  if (/雪/.test(text)) return 'snow'
  if (/雾|霾|沙|尘/.test(text)) return 'fog'
  const hour = hourIn(herTz.value, new Date(nowTick.value))
  if (hour >= 23 || hour < 5) return 'night'
  if (hour < 8) return 'dawn'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'day'
})

const updatedText = computed(() => {
  const at = liveBundles.value && liveBundles.value.fetchedAt
  if (!at) return '还没有更新过'
  return `更新于 ${formatRelative(at, nowTick.value)}`
})

const mockLabel = computed(() => {
  const map = {
    rain: '下雨',
    cold: '很冷',
    hot: '高温',
    gap: '温差',
    clear: '好天气',
    warning: '预警',
    aqi: '空气'
  }
  return map[mockScene.value] || mockScene.value
})

/* ------------------------------------------------------------------ */
/* 数据加载                                                            */
/* ------------------------------------------------------------------ */

async function loadAll(force = false) {
  const me = settings.value.me.city
  const her = settings.value.her.city
  if (!me || !her) return

  if (mockScene.value) {
    rebuildEvents()
    return
  }
  if (busy.value) return
  if (!force && cache.value && cache.value.fetchedAt) {
    const minutes = Number(settings.value.refreshMinutes) || 30
    if (Date.now() - cache.value.fetchedAt < minutes * 60000) {
      rebuildEvents()
      return
    }
  }

  busy.value = true
  refreshing.value = true
  error.value = ''
  if (!cache.value) loading.value = true

  try {
    const data = await fetchAll({ me, her }, settings.value)
    cache.value = data
    saveCache(data)

    const nextHistory = history.value || {}
    recordHistory(nextHistory, 'me', data.me, me.tz)
    recordHistory(nextHistory, 'her', data.her, her.tz)
    history.value = nextHistory
    saveHistory(nextHistory)

    rebuildEvents()
    maybePopup()
  } catch (err) {
    error.value = (err && err.message) || '天气没拉下来，等会儿再试'
  } finally {
    busy.value = false
    refreshing.value = false
    loading.value = false
  }
}

function rebuildEvents() {
  const me = meBundle.value
  const her = herBundle.value
  if (!me || !her) {
    events.value = []
    return
  }
  events.value = buildEvents({
    me,
    her,
    settings: settings.value,
    history: history.value,
    now: new Date(nowTick.value)
  })
}

function refresh() {
  if (mockScene.value) {
    rebuildEvents()
    showToast('演示场景不用刷新')
    return
  }
  loadAll(true)
}

/* ------------------------------------------------------------------ */
/* 短句与信件                                                          */
/* ------------------------------------------------------------------ */

function localize(text) {
  const value = String(text || '')
  const name = herName.value
  if (!value || name === '她') return value
  return value.split('她').join(name)
}

function phraseFor(event) {
  if (!event) return ''
  const scene = event.phrases || event.scene || 'daily'
  const pool = phrasePool(scene, settings.value.phrases)
  if (!pool.length) return ''
  const index = phraseIndex.value[event.key] || 0
  let phrase = pool[index % pool.length]
  if (pool.length > 1 && phrase === event.title) {
    phrase = pool[(index + 1) % pool.length]
  }
  return localize(phrase)
}

function cycle(event) {
  if (!event) return
  phraseIndex.value = {
    ...phraseIndex.value,
    [event.key]: (phraseIndex.value[event.key] || 0) + 1
  }
}

function letterForEvent(event) {
  if (!event) return null
  const list = settings.value.letters || []
  const unlocked = list.filter((letter) =>
    letterUnlocked(letter, {
      me: meBundle.value,
      her: herBundle.value,
      settings: settings.value,
      event,
      now: new Date(nowTick.value)
    })
  )
  if (!unlocked.length) return null
  const matched = unlocked.find(
    (letter) => letter.trigger !== 'any' && eventMatchesLetter(letter, event)
  )
  return matched || unlocked[0]
}

function openEventLetter(event) {
  const letter = letterForEvent(event)
  if (!letter) {
    showToast('这封信还没到可以拆的时候')
    return
  }
  openLetter(letter)
}

function openLetter(letter) {
  if (!letter) return
  const stamp = Date.now()
  const list = settings.value.letters.map((item) =>
    item.id === letter.id ? { ...item, lastOpenedAt: stamp } : item
  )
  const next = { ...settings.value, letters: list }
  settings.value = next
  saveSettings(next)
  activeLetter.value = list.find((item) => item.id === letter.id) || letter
  popupEvent.value = null
}

function editLetter(letter) {
  if (!letter) return
  activeLetter.value = null
  settingsTab.value = 'letters'
  settingsLetterId.value = letter.id
  settingsNewLetter.value = false
  settingsOpen.value = true
}

function writeLetter() {
  settingsTab.value = 'letters'
  settingsLetterId.value = ''
  settingsNewLetter.value = true
  settingsOpen.value = true
}

/* ------------------------------------------------------------------ */
/* 弹窗与分享                                                          */
/* ------------------------------------------------------------------ */

function maybePopup() {
  clearTimeout(popupTimer)
  const event = primary.value
  if (!event || event.priority < 60) return
  const key = `${dateKeyIn(herTz.value, new Date(nowTick.value))}:${event.key}`
  if (popupSeen(key)) return
  popupTimer = setTimeout(() => {
    popupEvent.value = event
    markPopupSeen(key)
    if (settings.value.sound) playChime()
  }, 900)
}

function openPoster(event) {
  posterEvent.value = event || primary.value
  if (!posterEvent.value) {
    showToast('还没有可以生成分享图的关心')
    return
  }
  popupEvent.value = null
  posterOpen.value = true
}

/* ------------------------------------------------------------------ */
/* 设置                                                                */
/* ------------------------------------------------------------------ */

function openSettings(tab = 'cities') {
  settingsTab.value = tab
  settingsLetterId.value = ''
  settingsNewLetter.value = false
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
  settingsLetterId.value = ''
  settingsNewLetter.value = false
}

function saveSettingsFromSheet(next) {
  const prev = settings.value
  const cityChanged =
    (prev.me.city && prev.me.city.id) !== (next.me.city && next.me.city.id) ||
    (prev.her.city && prev.her.city.id) !== (next.her.city && next.her.city.id)
  const keyChanged =
    String(prev.apiKey || '') !== String(next.apiKey || '') ||
    String(prev.apiHost || '') !== String(next.apiHost || '')

  settings.value = mergeSettings(next)
  saveSettings(settings.value)
  closeSettings()
  rebuildEvents()

  if (cityChanged || keyChanged) {
    cache.value = null
    loadAll(true)
  }
  showToast('设置已保存')
}

function saveSettingsSilently(next) {
  settings.value = mergeSettings(next)
  saveSettings(settings.value)
  rebuildEvents()
}

function applyPushParams() {
  try {
    const params = new URLSearchParams(window.location.search)
    const pushUrl = params.get('push')
    const pushToken = params.get('token')
    if (!pushUrl || !pushToken) return false

    const next = { ...settings.value, pushUrl, pushToken }
    settings.value = next
    saveSettings(next)

    const url = new URL(window.location.href)
    url.searchParams.delete('push')
    url.searchParams.delete('token')
    window.history.replaceState({}, '', url.toString())

    if (ready.value) {
      openSettings('notify')
      showToast('推送配置已填入，点“开启通知”')
    }
    return true
  } catch (error) {
    return false
  }
}

function finishWelcome({ me, her }) {
  const next = {
    ...settings.value,
    onboarded: true,
    createdAt: settings.value.createdAt || Date.now(),
    me: { ...settings.value.me, city: me },
    her: { ...settings.value.her, city: her }
  }
  settings.value = next
  saveSettings(next)
  loadAll(true)
  applyPushParams()
}

function clearData() {
  clearAll()
  settings.value = loadSettings()
  cache.value = null
  history.value = {}
  events.value = []
  settingsOpen.value = false
  popupEvent.value = null
  activeLetter.value = null
  showToast('本机数据已清空')
  setTimeout(() => window.location.reload(), 500)
}

/* ------------------------------------------------------------------ */
/* 提示与演示                                                          */
/* ------------------------------------------------------------------ */

function showToast(message) {
  toast.value = message || ''
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2800)
}

function setMock(scene) {
  mockScene.value = scene || ''
  popupEvent.value = null
  phraseIndex.value = {}
  rebuildEvents()
  if (mockScene.value) showToast(`演示场景：${mockLabel.value}`)
}

/* ------------------------------------------------------------------ */
/* 生命周期                                                            */
/* ------------------------------------------------------------------ */

watch(
  () => [settingsOpen.value, posterOpen.value, Boolean(popupEvent.value), Boolean(activeLetter.value)],
  (flags) => {
    const locked = flags.some(Boolean)
    document.body.classList.toggle('is-locked', locked)
  }
)

watch(
  () => settings.value.refreshMinutes,
  () => {
    /* 新的刷新间隔会在下一次计时里生效 */
  }
)

onMounted(() => {
  if (ready.value) {
    applyPushParams()
    if (cache.value && cache.value.fetchedAt) rebuildEvents()
    loadAll(false)
  }

  tickTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 30000)

  refreshTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') return
    if (!ready.value || mockScene.value) return
    const at = cache.value && cache.value.fetchedAt
    const minutes = Number(settings.value.refreshMinutes) || 30
    if (!at || Date.now() - at >= minutes * 60000) loadAll(false)
  }, 60000)

  document.addEventListener('visibilitychange', onVisible)
})

function onVisible() {
  if (document.visibilityState !== 'visible') return
  nowTick.value = Date.now()
  if (!ready.value || mockScene.value) return
  const at = cache.value && cache.value.fetchedAt
  const minutes = Number(settings.value.refreshMinutes) || 30
  if (!at || Date.now() - at >= minutes * 60000) loadAll(false)
}

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisible)
  clearInterval(tickTimer)
  clearInterval(refreshTimer)
  clearTimeout(toastTimer)
  clearTimeout(popupTimer)
  document.body.classList.remove('is-locked')
})
</script>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100dvh;
  isolation: isolate;
}

.sky-frame {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  overflow: hidden;
  pointer-events: none;
}

.page {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  min-height: 100dvh;
  margin: 0 auto;
  padding: calc(18px + env(safe-area-inset-top, 0px)) 18px calc(28px + env(safe-area-inset-bottom, 0px));
}

.hero {
  padding: 2px 4px 0;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.brand-mark {
  width: 38px;
  height: 38px;
  flex: none;
  filter: drop-shadow(0 8px 16px rgba(201, 106, 146, 0.18));
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.brand-text b {
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 1.4px;
  color: #4f4358;
}

.brand-text em {
  font-style: normal;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: #c4aecf;
}

.hero-actions {
  display: flex;
  gap: 7px;
  flex: none;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.92);
  color: #8b7c96;
  box-shadow: 0 8px 18px -14px rgba(79, 67, 88, 0.4);
  transition: transform 0.2s ease, background 0.2s ease;
}

.icon-btn:active {
  transform: scale(0.94);
}

.icon-btn:disabled {
  opacity: 0.6;
}

.icon-btn svg {
  width: 17px;
  height: 17px;
}

.icon-btn.spinning svg {
  animation: spin 1.1s linear infinite;
}

.hero-copy {
  margin-top: 22px;
  padding: 0 4px;
}

.hero-eyebrow {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.1px;
  color: #a08cae;
}

.hero-copy h1 {
  margin: 7px 0 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 1.6px;
  line-height: 1.25;
  color: #4a3f54;
}

.hero-dot {
  color: #e98fb2;
}

.hero-line {
  margin: 8px 0 0;
  font-family: var(--font-serif);
  font-size: 12.5px;
  line-height: 1.7;
  letter-spacing: 0.4px;
  color: #8b7c96;
}

.mock-badge {
  margin: 12px 4px 0;
  padding: 7px 11px;
  border-radius: 10px;
  background: rgba(255, 247, 233, 0.9);
  border: 1px solid rgba(240, 220, 186, 0.7);
  font-size: 9.5px;
  line-height: 1.5;
  color: #a8754b;
}

.error-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  padding: 9px 12px;
  border-radius: 12px;
  background: rgba(255, 244, 246, 0.92);
  border: 1px solid rgba(233, 178, 190, 0.55);
  font-size: 10px;
  line-height: 1.5;
  color: #a85d6e;
}

.error-bar button {
  flex: none;
  font-size: 9.5px;
  font-weight: 700;
  color: #b26791;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.page-foot {
  margin-top: 22px;
  padding: 0 6px;
  text-align: center;
}

.foot-line {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 9px;
  letter-spacing: 0.2px;
  color: #b3a2bd;
}

.foot-line.soft {
  margin-top: 3px;
  color: #c1b2ca;
}

.foot-sep {
  color: #d5c9db;
}

.foot-link {
  margin-top: 10px;
  font-size: 9.5px;
  font-weight: 600;
  color: #b26791;
  letter-spacing: 0.3px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon-btn.spinning svg {
    animation: none;
  }
}
</style>
