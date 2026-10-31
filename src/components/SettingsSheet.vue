<template>
  <Transition name="sheet">
    <div v-if="open" class="sheet-mask" @click.self="$emit('close')">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="设置">
        <div class="grabber"></div>

        <div class="sheet-head">
          <div class="sheet-titles">
            <span class="sheet-eyebrow">S E T T I N G S</span>
            <h2>设置</h2>
          </div>
          <button type="button" class="sheet-close" aria-label="关闭" @click="$emit('close')">✕</button>
        </div>

        <div class="tabs">
          <button
            v-for="item in tabs"
            :key="item.key"
            type="button"
            class="tab"
            :class="{ active: tab === item.key }"
            @click="tab = item.key"
          >
            {{ item.label }}
          </button>
        </div>

        <div ref="sheetBody" class="sheet-body">
          <!-- 城市 -->
          <section v-if="tab === 'cities'" class="panel">
            <div class="panel-title">
              <span>你们在哪</span>
              <button type="button" class="inline-link" @click="swapCities">交换城市</button>
            </div>

            <div class="name-grid">
              <label class="field">
                <span>我的称呼</span>
                <input v-model="draft.me.name" type="text" maxlength="12" placeholder="我" />
              </label>
              <label class="field">
                <span>对方称呼</span>
                <input v-model="draft.her.name" type="text" maxlength="12" placeholder="她 / 他" />
              </label>
            </div>

            <div class="pronoun-row">
              <span>首页显示</span>
              <button
                v-for="item in pronounOptions"
                :key="item"
                type="button"
                class="pronoun-chip"
                :class="{ active: draft.her.name === item }"
                @click="draft.her.name = item"
              >
                {{ item }}
              </button>
            </div>

            <div class="city-block">
              <span class="city-label"><i class="dot me"></i>我的城市</span>
              <CityPicker v-model="draft.me.city" placeholder="搜索我的城市…" :settings="draft" />
            </div>
            <div class="city-block">
              <span class="city-label"><i class="dot her"></i>对方城市</span>
              <CityPicker v-model="draft.her.city" placeholder="搜索对方城市…" :settings="draft" />
            </div>

            <p class="hint">
              城市只保存在这台设备。定位失败时直接搜城市即可。
            </p>
          </section>

          <!-- 关心 -->
          <section v-else-if="tab === 'care'" class="panel">
            <div class="panel-title"><span>触发阈值</span></div>
            <div class="threshold-grid">
              <label class="field">
                <span>低温提醒</span>
                <div class="number-row">
                  <input v-model.number="draft.thresholds.cold" type="number" min="-20" max="30" />
                  <em>℃</em>
                </div>
              </label>
              <label class="field">
                <span>两地温差</span>
                <div class="number-row">
                  <input v-model.number="draft.thresholds.gap" type="number" min="1" max="30" />
                  <em>℃</em>
                </div>
              </label>
              <label class="field">
                <span>降温幅度</span>
                <div class="number-row">
                  <input v-model.number="draft.thresholds.drop" type="number" min="1" max="15" />
                  <em>℃</em>
                </div>
              </label>
              <label class="field">
                <span>高温提醒</span>
                <div class="number-row">
                  <input v-model.number="draft.thresholds.hot" type="number" min="20" max="45" />
                  <em>℃</em>
                </div>
              </label>
              <label class="field">
                <span>大风提醒</span>
                <div class="number-row">
                  <input v-model.number="draft.thresholds.wind" type="number" min="1" max="12" />
                  <em>级</em>
                </div>
              </label>
              <label class="field">
                <span>空气提醒</span>
                <div class="number-row">
                  <input v-model.number="draft.thresholds.aqi" type="number" min="50" max="300" />
                  <em>AQI</em>
                </div>
              </label>
            </div>

            <div class="panel-title with-gap">
              <span>关心短句</span>
              <button type="button" class="inline-link" @click="resetPhrase">恢复默认</button>
            </div>
            <label class="field">
              <span>场景</span>
              <select v-model="phraseScene" @change="loadPhrase">
                <option v-for="(meta, key) in SCENE_META" :key="key" :value="key">
                  {{ meta.label }} · {{ meta.hint }}
                </option>
              </select>
            </label>
            <label class="field textarea-field">
              <span>一行一句，留空则使用默认</span>
              <textarea
                v-model="phraseText"
                rows="6"
                placeholder="写几句你会在这种天气里对对方说的话…"
                @input="commitPhrase"
              ></textarea>
            </label>
            <p class="hint">换一句时，会从当前场景的短句里轮换。</p>
          </section>

          <!-- 通知 -->
          <section v-else-if="tab === 'notify'" class="panel">
            <div class="panel-title"><span>对方手机上的系统通知</span></div>
            <p class="about-text">
              在对方手机上打开本站 → 添加到主屏幕 → 在这里开启。开启后，即使 App 关着，Cloudflare Worker 也会按对方的天气推送系统通知。
            </p>

            <label class="field">
              <span>Worker 地址</span>
              <input
                v-model="draft.pushUrl"
                type="url"
                autocomplete="off"
                placeholder="https://dear-weather-push.xxx.workers.dev"
              />
            </label>
            <label class="field">
              <span>访问口令</span>
              <input
                v-model="draft.pushToken"
                type="password"
                autocomplete="off"
                placeholder="Worker 的 PUSH_TOKEN"
              />
            </label>

            <div class="push-status" :class="pushTone">
              <b>{{ pushLabel }}</b>
              <span>{{ pushDetail }}</span>
            </div>

            <div class="button-row">
              <button type="button" class="soft-btn" :disabled="pushBusy" @click="enableNotifications">
                {{ pushBusy ? '处理中…' : '开启通知' }}
              </button>
              <button
                type="button"
                class="soft-btn"
                :disabled="pushBusy || !pushSubscribed"
                @click="disableNotifications"
              >
                关闭通知
              </button>
            </div>
            <button
              type="button"
              class="soft-btn wide"
              :disabled="pushBusy || !pushSubscribed"
              @click="testNotifications"
            >
              发送测试通知
            </button>

            <p v-if="pushError" class="hint push-error">{{ pushError }}</p>
            <p v-else-if="pushNotice" class="hint push-ok">{{ pushNotice }}</p>
            <p class="hint">只支持 HTTPS。iPhone 需要 iOS 16.4+，并且必须先“添加到主屏幕”。</p>
          </section>

          <!-- 信件 -->
          <section v-else-if="tab === 'letters'" class="panel">
            <template v-if="!editingLetter">
              <div class="panel-title">
                <span>写给对方的信</span>
                <button type="button" class="inline-link" @click="newLetter">写一封</button>
              </div>

              <div v-if="draft.letters.length" class="letter-list">
                <div v-for="letter in draft.letters" :key="letter.id" class="letter-row">
                  <div class="letter-row-main">
                    <b>{{ letter.title || '未命名' }}</b>
                    <span>{{ triggerLabel(letter, draft) }}</span>
                  </div>
                  <button type="button" class="mini-btn" @click="editLetter(letter)">编辑</button>
                  <button
                    type="button"
                    class="mini-btn danger"
                    @click="removeLetter(letter.id)"
                  >
                    {{ deletingId === letter.id ? '确认删除' : '删除' }}
                  </button>
                </div>
              </div>
              <div v-else class="empty-panel">
                <span class="empty-icon">✉</span>
                <p>还没有信。写一封，等降温、下雨或某个日子替你说。</p>
                <button type="button" class="soft-btn" @click="newLetter">写第一封</button>
              </div>
            </template>

            <template v-else>
              <div class="panel-title">
                <span>{{ editingLetter.id ? '编辑信件' : '写一封新信' }}</span>
                <button type="button" class="inline-link" @click="editingLetter = null">返回</button>
              </div>

              <label class="field">
                <span>标题</span>
                <input v-model="editingLetter.title" type="text" maxlength="24" placeholder="比如：降温的时候再看" />
              </label>

              <label class="field">
                <span>什么时候可以拆</span>
                <select v-model="editingLetter.trigger">
                  <option value="cold">气温低于</option>
                  <option value="hot">气温高于</option>
                  <option value="gap">两地温差大于</option>
                  <option value="rain">对方那边下雨</option>
                  <option value="snow">对方那边下雪</option>
                  <option value="date">指定日期</option>
                  <option value="any">任意一天</option>
                </select>
              </label>

              <label v-if="['cold', 'hot', 'gap'].includes(editingLetter.trigger)" class="field">
                <span>阈值</span>
                <div class="number-row">
                  <input v-model.number="editingLetter.value" type="number" min="-20" max="45" />
                  <em>{{ editingLetter.trigger === 'gap' ? '℃' : '℃' }}</em>
                </div>
              </label>

              <label v-if="editingLetter.trigger === 'date'" class="field">
                <span>日期</span>
                <input v-model="editingLetter.date" type="text" placeholder="MM-DD，比如 12-24" maxlength="5" />
              </label>

              <label class="field textarea-field">
                <span>信的内容</span>
                <textarea
                  v-model="editingLetter.body"
                  rows="8"
                  placeholder="写长一点也没关系。对方拆开的时候，会慢慢看。"
                ></textarea>
              </label>

              <button type="button" class="save-letter" @click="saveLetter">收好这封信</button>
            </template>
          </section>

          <!-- 外观 -->
          <section v-else-if="tab === 'look'" class="panel">
            <div class="panel-title"><span>主题</span></div>
            <div class="theme-grid">
              <button
                v-for="theme in themes"
                :key="theme.key"
                type="button"
                class="theme-chip"
                :class="{ active: draft.theme === theme.key }"
                @click="draft.theme = theme.key"
              >
                <i :class="`swatch ${theme.key}`"></i>
                {{ theme.label }}
              </button>
            </div>

            <div class="switch-list">
              <label class="switch-row">
                <span>
                  <b>轻动效</b>
                  <em>雨丝、雪点、卡片浮入</em>
                </span>
                <input v-model="draft.motion" type="checkbox" />
              </label>
              <label class="switch-row">
                <span>
                  <b>提示音</b>
                  <em>今日关心弹出时，轻轻响一声</em>
                </span>
                <input v-model="draft.sound" type="checkbox" />
              </label>
              <label class="switch-row">
                <span>
                  <b>双城地图</b>
                  <em>用天地图显示两座城市的位置</em>
                </span>
                <input v-model="draft.showMap" type="checkbox" />
              </label>
            </div>

            <label class="field">
              <span>自动刷新</span>
              <select v-model.number="draft.refreshMinutes">
                <option :value="10">每 10 分钟</option>
                <option :value="30">每 30 分钟</option>
                <option :value="60">每 1 小时</option>
                <option :value="120">每 2 小时</option>
              </select>
            </label>
          </section>

          <!-- 版面 -->
          <section v-else-if="tab === 'layout'" class="panel">
            <div class="panel-title">
              <span>首页顺序</span>
              <button type="button" class="inline-link" @click="resetLayout">恢复默认</button>
            </div>
            <p class="about-text">
              用上下箭头调整模块顺序。关掉双城地图后，地图这一项会自动跳过。
            </p>

            <div class="layout-list">
              <div v-for="(item, index) in draft.layout" :key="item" class="layout-row">
                <span class="layout-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <div class="layout-text">
                  <b>{{ layoutLabels[item] || item }}</b>
                  <span>{{ layoutHints[item] || '' }}</span>
                </div>
                <div class="layout-actions">
                  <button
                    type="button"
                    :disabled="index === 0"
                    aria-label="上移"
                    @click="moveLayout(index, -1)"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    :disabled="index === draft.layout.length - 1"
                    aria-label="下移"
                    @click="moveLayout(index, 1)"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 关于 -->
          <section v-else class="panel">
            <div class="about-card">
              <span class="about-mark"><BrandMark /></span>
              <div>
                <b>Dear Weather</b>
                <p>把今天的天气，替我告诉你。</p>
              </div>
            </div>

            <div class="panel-title with-gap"><span>API 设置</span></div>
            <label class="field">
              <span>和风 key（留空使用站点内置）</span>
              <input v-model="draft.apiKey" type="password" autocomplete="off" placeholder="只保存在本机" />
            </label>
            <label class="field">
              <span>API Host</span>
              <input v-model="draft.apiHost" type="text" autocomplete="off" placeholder="devapi.qweather.com" />
            </label>
            <p class="hint">新 key 如果要求专属 API Host，把控制台里的地址填在这里。</p>

            <div class="panel-title with-gap"><span>备份</span></div>
            <div class="button-row">
              <button type="button" class="soft-btn" @click="exportConfig">导出设置</button>
              <button type="button" class="soft-btn" @click="fileInput && fileInput.click()">导入设置</button>
              <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onImportFile" />
            </div>
            <button type="button" class="danger-btn" @click="onClear">清除本机所有数据</button>

            <p v-if="notice" class="sheet-notice">{{ notice }}</p>
          </section>
        </div>

        <div class="sheet-foot">
          <button type="button" class="foot-ghost" @click="resetDraft">撤销修改</button>
          <button type="button" class="foot-save" @click="save">保存设置</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import BrandMark from './BrandMark.vue'
import CityPicker from './CityPicker.vue'
import {
  DEFAULT_PHRASES,
  SCENE_META
} from '../lib/phrases'
import { triggerLabel } from '../lib/rules'
import {
  currentSubscription,
  disablePush,
  enablePush,
  permissionState,
  pushBlockReason,
  pushSupported,
  sendTestPush
} from '../lib/push'
import {
  DEFAULT_LAYOUT,
  exportSettings,
  importSettings
} from '../lib/storage'

const props = defineProps({
  open: { type: Boolean, default: false },
  settings: { type: Object, required: true },
  initialTab: { type: String, default: 'cities' },
  initialLetterId: { type: String, default: '' },
  startNewLetter: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'save', 'save-silent', 'clear'])

const tabs = [
  { key: 'cities', label: '城市' },
  { key: 'care', label: '关心' },
  { key: 'notify', label: '通知' },
  { key: 'letters', label: '信件' },
  { key: 'look', label: '外观' },
  { key: 'layout', label: '版面' },
  { key: 'about', label: '关于' }
]

const pronounOptions = ['她', '他', 'TA']

const layoutLabels = {
  her: '对方的天气',
  map: '双城地图',
  me: '我的天气',
  care: '今日关心',
  letters: '写给对方的信',
  hourly: '未来 24 小时',
  forecast: '未来几天'
}

const layoutHints = {
  her: '先看对方那边的温度',
  map: '距离、温差和两座城市的位置',
  me: '你这边用来对比',
  care: '天气触发的主要关心卡',
  letters: '提前写好的信',
  hourly: '对方那边接下来一天',
  forecast: '对方那边未来几天'
}

const themes = [
  { key: 'auto', label: '跟随天气' },
  { key: 'dawn', label: '晨雾' },
  { key: 'day', label: '晴日' },
  { key: 'dusk', label: '黄昏' },
  { key: 'rain', label: '雨夜' },
  { key: 'snow', label: '初雪' },
  { key: 'night', label: '月白' },
  { key: 'fog', label: '薄雾' }
]

const tab = ref('cities')
const sheetBody = ref(null)
const draft = ref(clone(props.settings))
const phraseScene = ref('rain')
const phraseText = ref('')
const editingLetter = ref(null)
const deletingId = ref('')
const notice = ref('')
const fileInput = ref(null)

const pushBusy = ref(false)
const pushSubscribed = ref(false)
const pushLabel = ref('未开启')
const pushDetail = ref('设置好 Worker 地址和口令后点开启')
const pushTone = ref('idle')
const pushError = ref('')
const pushNotice = ref('')

let deleteTimer = null

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (e) {
    return value
  }
}

async function refreshPushState() {
  pushError.value = ''
  pushNotice.value = ''

  if (!pushSupported()) {
    pushSubscribed.value = false
    pushLabel.value = '这个浏览器不支持'
    pushDetail.value = pushBlockReason() || '换一个浏览器试试'
    pushTone.value = 'warn'
    return
  }

  const permission = await permissionState()
  if (permission === 'denied') {
    pushSubscribed.value = false
    pushLabel.value = '通知被浏览器拒绝'
    pushDetail.value = '去浏览器设置里允许通知后再试'
    pushTone.value = 'warn'
    return
  }

  const subscription = await currentSubscription()
  pushSubscribed.value = Boolean(subscription)
  if (subscription) {
    pushLabel.value = '已开启'
    pushDetail.value = '这台设备会收到系统通知'
    pushTone.value = 'ok'
  } else {
    pushLabel.value = '未开启'
    pushDetail.value = '设置好 Worker 地址和口令后点开启'
    pushTone.value = 'idle'
  }
}

async function enableNotifications() {
  pushBusy.value = true
  pushError.value = ''
  pushNotice.value = ''
  try {
    await enablePush({
      workerUrl: draft.value.pushUrl,
      token: draft.value.pushToken
    })
    pushSubscribed.value = true
    pushLabel.value = '已开启'
    pushDetail.value = '这台设备会收到系统通知'
    pushTone.value = 'ok'
    pushNotice.value = '系统通知已开启，可以发一条测试通知'
    draft.value.pushUrl = String(draft.value.pushUrl || '')
      .trim()
      .replace(/\/+$/, '')
    emit('save-silent', clone(draft.value))
  } catch (error) {
    pushTone.value = 'warn'
    pushLabel.value = '开启失败'
    pushDetail.value = '检查 Worker 地址和口令'
    pushError.value = (error && error.message) || '开启失败，等会儿再试'
  } finally {
    pushBusy.value = false
  }
}

async function disableNotifications() {
  pushBusy.value = true
  pushError.value = ''
  pushNotice.value = ''
  try {
    await disablePush({
      workerUrl: draft.value.pushUrl,
      token: draft.value.pushToken
    })
    pushSubscribed.value = false
    pushLabel.value = '未开启'
    pushDetail.value = '这台设备不会再收到系统通知'
    pushTone.value = 'idle'
    pushNotice.value = '已关闭系统通知'
    emit('save-silent', clone(draft.value))
  } catch (error) {
    pushError.value = (error && error.message) || '关闭失败，等会儿再试'
  } finally {
    pushBusy.value = false
  }
}

async function testNotifications() {
  pushBusy.value = true
  pushError.value = ''
  pushNotice.value = ''
  try {
    const result = await sendTestPush({
      workerUrl: draft.value.pushUrl,
      token: draft.value.pushToken
    })
    const count = Number(result && result.count) || 0
    pushNotice.value =
      count > 0 ? `已发送给 ${count} 台订阅设备` : '还没有订阅设备'
  } catch (error) {
    pushError.value = (error && error.message) || '发送失败，等会儿再试'
  } finally {
    pushBusy.value = false
  }
}

function resetDraft() {
  draft.value = clone(props.settings)
  editingLetter.value = null
  deletingId.value = ''
  notice.value = ''
  pushError.value = ''
  pushNotice.value = ''
  loadPhrase()
}

function moveLayout(index, delta) {
  const list = [...(draft.value.layout || [])]
  const target = index + delta
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item)
  draft.value.layout = list
}

function resetLayout() {
  draft.value.layout = [...DEFAULT_LAYOUT]
}

function loadPhrase() {
  const custom = draft.value.phrases && draft.value.phrases[phraseScene.value]
  const isCustom = Array.isArray(custom) && custom.length > 0
  const pool = isCustom
    ? custom
    : DEFAULT_PHRASES[phraseScene.value] || DEFAULT_PHRASES.daily
  const name = draft.value.her.name || '她'
  const lines =
    isCustom || name === '她'
      ? pool
      : pool.map((line) => String(line).split('她').join(name))
  phraseText.value = lines.join('\n')
}

function commitPhrase() {
  const lines = phraseText.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (!draft.value.phrases) draft.value.phrases = {}
  if (lines.length) {
    draft.value.phrases[phraseScene.value] = lines
  } else {
    delete draft.value.phrases[phraseScene.value]
  }
}

function resetPhrase() {
  if (draft.value.phrases) delete draft.value.phrases[phraseScene.value]
  loadPhrase()
  notice.value = '已恢复这个场景的默认短句'
}

function swapCities() {
  const meCity = draft.value.me.city
  draft.value.me.city = draft.value.her.city
  draft.value.her.city = meCity
  notice.value = '已交换两座城市'
}

function newLetter() {
  editingLetter.value = {
    id: '',
    title: '',
    body: '',
    trigger: 'cold',
    value: draft.value.thresholds.cold,
    date: '',
    createdAt: Date.now(),
    lastOpenedAt: null
  }
  nextTick(() => {
    if (sheetBody.value) sheetBody.value.scrollTop = 0
  })
}

function editLetter(letter) {
  editingLetter.value = clone(letter)
  nextTick(() => {
    if (sheetBody.value) sheetBody.value.scrollTop = 0
  })
}

function saveLetter() {
  const letter = editingLetter.value
  if (!letter) return
  if (!letter.title.trim()) {
    notice.value = '给这封信起个标题吧'
    return
  }
  if (!letter.body.trim()) {
    notice.value = '信里还没有内容'
    return
  }
  if (!letter.id) {
    letter.id = `letter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    draft.value.letters.push(letter)
  } else {
    const index = draft.value.letters.findIndex((item) => item.id === letter.id)
    if (index >= 0) draft.value.letters[index] = letter
  }
  editingLetter.value = null
  notice.value = '信已经收好，等一个合适的日子'
}

function removeLetter(id) {
  if (deletingId.value === id) {
    draft.value.letters = draft.value.letters.filter((letter) => letter.id !== id)
    deletingId.value = ''
    clearTimeout(deleteTimer)
    notice.value = '已删除这封信'
    return
  }
  deletingId.value = id
  clearTimeout(deleteTimer)
  deleteTimer = setTimeout(() => {
    deletingId.value = ''
  }, 3000)
}

function exportConfig() {
  const text = exportSettings(draft.value)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'dear-weather-settings.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  notice.value = '设置已导出'
}

async function onImportFile(event) {
  const file = event.target.files && event.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    draft.value = importSettings(text)
    notice.value = '已载入设置，点“保存设置”生效'
    loadPhrase()
  } catch (error) {
    notice.value = error && error.message ? error.message : '这个文件读不出来'
  } finally {
    event.target.value = ''
  }
}

function onClear() {
  if (window.confirm('会清掉城市、信件、短句和缓存。确定吗？')) {
    emit('clear')
  }
}

function save() {
  if (!draft.value.me.city || !draft.value.her.city) {
    notice.value = '先把两个城市都选好'
    return
  }
  draft.value.onboarded = true
  emit('save', clone(draft.value))
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetDraft()
      tab.value = props.initialTab || 'cities'
      loadPhrase()
      if (tab.value === 'letters') {
        if (props.startNewLetter) {
          newLetter()
        } else if (props.initialLetterId) {
          const found = draft.value.letters.find((letter) => letter.id === props.initialLetterId)
          if (found) editLetter(found)
        }
      }
      if (tab.value === 'notify') refreshPushState()
      nextTick(() => {
        if (sheetBody.value) sheetBody.value.scrollTop = 0
      })
    }
  }
)

watch(tab, (value) => {
  if (value !== 'letters') editingLetter.value = null
  if (value === 'notify') refreshPushState()
  nextTick(() => {
    if (sheetBody.value) sheetBody.value.scrollTop = 0
  })
})

watch(phraseScene, loadPhrase)
watch(() => draft.value.her.name, loadPhrase)

onBeforeUnmount(() => clearTimeout(deleteTimer))
</script>

<style scoped>
.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 55;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(79, 67, 88, 0.28);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.sheet {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 88dvh;
  display: flex;
  flex-direction: column;
  padding: 10px 0 0;
  border-radius: 30px 30px 0 0;
  background:
    radial-gradient(300px 200px at 92% 0%, rgba(255, 224, 236, 0.55), rgba(255, 224, 236, 0) 72%),
    linear-gradient(165deg, #fffdfd 0%, #fdf9fc 48%, #f8f5fd 100%);
  border: 1px solid rgba(255, 255, 255, 0.98);
  border-bottom: 0;
  box-shadow: 0 -26px 60px -30px rgba(79, 67, 88, 0.45);
}
.grabber {
  width: 36px;
  height: 4px;
  margin: 0 auto 8px;
  border-radius: 999px;
  background: rgba(139, 124, 150, 0.22);
}
.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 20px 10px;
}
.sheet-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sheet-eyebrow {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #c08ca4;
}
.sheet-titles h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #4f4358;
}
.sheet-close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  color: #b3a2bd;
  font-size: 12px;
}
.tabs {
  display: flex;
  gap: 6px;
  padding: 0 16px 10px;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar {
  display: none;
}
.tab {
  flex: none;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  color: #a896b2;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.8);
}
.tab.active {
  color: #a85d7e;
  background: linear-gradient(135deg, #f7d7e4, #efe4f8);
  border-color: transparent;
}
.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 20px 18px;
  -webkit-overflow-scrolling: touch;
}
.panel {
  padding-top: 4px;
}
.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #9a76a5;
}
.panel-title.with-gap {
  margin-top: 22px;
}
.inline-link {
  font-size: 9.5px;
  font-weight: 600;
  color: #b26791;
  letter-spacing: 0.2px;
}
.name-grid,
.threshold-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}
.pronoun-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 4px;
}
.pronoun-row > span {
  margin-right: 2px;
  font-size: 9.5px;
  font-weight: 600;
  color: #a896b2;
}
.pronoun-chip {
  min-width: 38px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.9);
  font-size: 10px;
  font-weight: 600;
  color: #8b7c96;
}
.pronoun-chip.active {
  color: #a85d7e;
  background: linear-gradient(135deg, #f7d7e4, #efe4f8);
  border-color: transparent;
}
.layout-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.layout-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.9);
}
.layout-index {
  flex: none;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #c4aecf;
  font-variant-numeric: tabular-nums;
}
.layout-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.layout-text b {
  font-size: 11.5px;
  font-weight: 700;
  color: #4f4358;
}
.layout-text span {
  font-size: 9px;
  color: #a896b2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.layout-actions {
  flex: none;
  display: flex;
  gap: 4px;
}
.layout-actions button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.95);
  font-size: 12px;
  color: #8b7c96;
}
.layout-actions button:disabled {
  opacity: 0.3;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 9px;
}
.field > span {
  font-size: 9.5px;
  font-weight: 600;
  color: #a896b2;
  letter-spacing: 0.3px;
}
.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px 11px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.62);
  font-size: 12px;
  color: #4f4358;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: rgba(233, 143, 178, 0.6);
  background: rgba(255, 255, 255, 0.86);
}
.field textarea {
  resize: vertical;
  min-height: 110px;
  line-height: 1.7;
  font-size: 12px;
}
.textarea-field {
  margin-top: 2px;
}
.number-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.number-row input {
  flex: 1;
}
.number-row em {
  font-style: normal;
  font-size: 10px;
  color: #b3a2bd;
  flex: none;
}
.city-block {
  margin-top: 10px;
}
.city-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 9.5px;
  font-weight: 700;
  color: #8b7c96;
  letter-spacing: 0.3px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot.me {
  background: #8fb8de;
}
.dot.her {
  background: #e98fb2;
}
.hint {
  margin: 8px 0 0;
  font-size: 9.5px;
  line-height: 1.6;
  color: #b3a2bd;
}
.letter-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.letter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 11px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.9);
}
.letter-row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.letter-row-main b {
  font-size: 11.5px;
  font-weight: 700;
  color: #4f4358;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.letter-row-main span {
  font-size: 9px;
  color: #a896b2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mini-btn {
  flex: none;
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  font-size: 9px;
  font-weight: 600;
  color: #a06d86;
}
.mini-btn.danger {
  color: #b25f6f;
}
.empty-panel {
  padding: 22px 16px;
  border-radius: 16px;
  border: 1px dashed rgba(201, 163, 214, 0.4);
  text-align: center;
}
.empty-icon {
  font-size: 22px;
  color: #c9a3d6;
}
.empty-panel p {
  margin: 7px 0 12px;
  font-size: 10.5px;
  line-height: 1.6;
  color: #a896b2;
}
.soft-btn {
  padding: 8px 13px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.95);
  font-size: 10px;
  font-weight: 600;
  color: #8b7c96;
}
.soft-btn:disabled {
  opacity: 0.5;
}
.soft-btn.wide {
  width: 100%;
  margin-top: 7px;
  padding: 11px;
  font-size: 10.5px;
}
.push-status {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 10px 0 9px;
  padding: 9px 11px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.9);
}
.push-status b {
  font-size: 10.5px;
  font-weight: 700;
  color: #5b4c63;
}
.push-status span {
  font-size: 9px;
  line-height: 1.5;
  color: #a896b2;
}
.push-status.ok {
  background: rgba(238, 249, 242, 0.78);
  border-color: rgba(190, 225, 205, 0.8);
}
.push-status.ok b {
  color: #4f8a6a;
}
.push-status.warn {
  background: rgba(255, 246, 238, 0.86);
  border-color: rgba(240, 215, 190, 0.8);
}
.push-status.warn b {
  color: #a8754b;
}
.hint.push-error {
  color: #b25f6f;
}
.hint.push-ok {
  color: #4f8a6a;
}
.save-letter {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  border-radius: 13px;
  background: linear-gradient(135deg, #e9a3c0, #c9b2e8);
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 12px 22px -16px rgba(201, 106, 146, 0.7);
}
.theme-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}
.theme-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.85);
  font-size: 10px;
  font-weight: 600;
  color: #8b7c96;
  text-align: left;
}
.theme-chip.active {
  color: #a85d7e;
  border-color: rgba(233, 143, 178, 0.55);
  background: rgba(255, 246, 250, 0.9);
}
.swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex: none;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 5px rgba(79, 67, 88, 0.12);
}
.swatch.auto {
  background: conic-gradient(#fde6ee, #e7eefb, #fdf0e3, #fde6ee);
}
.swatch.dawn {
  background: linear-gradient(135deg, #ffd9cf, #e9dcfa);
}
.swatch.day {
  background: linear-gradient(135deg, #dceefb, #fdf8ef);
}
.swatch.dusk {
  background: linear-gradient(135deg, #ffcfae, #e6d5f5);
}
.swatch.rain {
  background: linear-gradient(135deg, #cfdeee, #e8edf5);
}
.swatch.snow {
  background: linear-gradient(135deg, #eaf4fd, #ffffff);
}
.swatch.night {
  background: linear-gradient(135deg, #d9dcf2, #f3f1fb);
}
.swatch.fog {
  background: linear-gradient(135deg, #e4e3ea, #f4f3f7);
}
.switch-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px dashed rgba(139, 124, 150, 0.12);
}
.switch-row span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.switch-row b {
  font-size: 11px;
  font-weight: 700;
  color: #5b4c63;
}
.switch-row em {
  font-style: normal;
  font-size: 9px;
  color: #b3a2bd;
}
.switch-row input {
  appearance: none;
  width: 38px;
  height: 22px;
  border-radius: 999px;
  background: rgba(139, 124, 150, 0.18);
  position: relative;
  transition: background 0.2s ease;
  flex: none;
}
.switch-row input::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 5px rgba(79, 67, 88, 0.2);
  transition: transform 0.2s ease;
}
.switch-row input:checked {
  background: linear-gradient(135deg, #e9a3c0, #c9b2e8);
}
.switch-row input:checked::after {
  transform: translateX(16px);
}
.about-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 15px;
  background: linear-gradient(150deg, rgba(255, 250, 252, 0.9), rgba(248, 245, 253, 0.7));
  border: 1px solid rgba(255, 255, 255, 0.95);
}
.about-mark {
  width: 38px;
  height: 38px;
  display: block;
  overflow: hidden;
  border-radius: 12px;
  flex: none;
  box-shadow: 0 6px 14px -10px rgba(201, 106, 146, 0.5);
}
.about-card b {
  font-size: 11.5px;
  color: #4f4358;
}
.about-card p {
  margin: 3px 0 0;
  font-size: 9.5px;
  color: #a896b2;
}
.about-text {
  margin: 0 0 8px;
  font-size: 10px;
  line-height: 1.7;
  color: #9b8aa5;
}
.button-row {
  display: flex;
  gap: 7px;
}
.danger-btn {
  width: 100%;
  margin-top: 10px;
  padding: 9px;
  border-radius: 10px;
  border: 1px solid rgba(178, 95, 111, 0.2);
  background: rgba(255, 244, 246, 0.6);
  font-size: 9.5px;
  font-weight: 600;
  color: #b25f6f;
}
.sheet-notice {
  margin: 12px 0 0;
  padding: 8px 10px;
  border-radius: 9px;
  background: rgba(255, 248, 235, 0.9);
  border: 1px solid rgba(240, 220, 190, 0.7);
  font-size: 9.5px;
  line-height: 1.5;
  color: #a8754b;
}
.sheet-foot {
  display: flex;
  gap: 8px;
  padding: 10px 20px calc(14px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(139, 124, 150, 0.1);
  background: rgba(255, 253, 254, 0.86);
  backdrop-filter: blur(12px);
}
.foot-ghost,
.foot-save {
  flex: 1;
  padding: 11px;
  border-radius: 13px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.foot-ghost {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.95);
  color: #8b7c96;
}
.foot-save {
  background: linear-gradient(135deg, #e9a3c0, #c9b2e8);
  color: #fff;
  box-shadow: 0 12px 22px -16px rgba(201, 106, 146, 0.7);
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.3s ease;
}
.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.4s cubic-bezier(0.22, 0.9, 0.28, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}

@media (min-width: 560px) {
  .sheet-mask {
    align-items: center;
    padding: 24px;
  }
  .sheet {
    border-radius: 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.98);
    max-height: 84dvh;
  }
  .sheet-enter-from .sheet,
  .sheet-leave-to .sheet {
    transform: translateY(18px) scale(0.98);
  }
}
</style>
