<template>
  <Transition name="poster">
    <div v-if="open" class="poster-mask" @click.self="$emit('close')">
      <div class="poster-panel" role="dialog" aria-modal="true" aria-label="分享卡">
        <div class="poster-head">
          <div class="poster-titles">
            <span class="poster-eyebrow">S H A R E</span>
            <h3>今日关心卡</h3>
          </div>
          <button type="button" class="poster-close" aria-label="关闭" @click="$emit('close')">✕</button>
        </div>

        <div class="poster-preview">
          <img v-if="dataUrl" :src="dataUrl" alt="Dear Weather 分享卡" />
          <div v-else class="poster-loading">
            <span class="loading-spark">✦</span>
            正在写这张卡片…
          </div>
        </div>

        <div class="poster-actions">
          <button type="button" class="poster-btn ghost" :disabled="!dataUrl" @click="save">
            保存图片
          </button>
          <button type="button" class="poster-btn primary" :disabled="!dataUrl" @click="share">
            分享图片
          </button>
        </div>
        <p class="poster-hint">微信里可以长按图片保存，再发给 TA。</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  buildPoster,
  posterDataUrl,
  savePoster,
  sharePoster
} from '../lib/poster'

const props = defineProps({
  open: { type: Boolean, default: false },
  me: { type: Object, default: null },
  her: { type: Object, default: null },
  settings: { type: Object, required: true },
  event: { type: Object, default: null },
  phrase: { type: String, default: '' }
})

const emit = defineEmits(['close', 'notice'])

const CANONICAL = 'https://yhx-yhx.github.io/dear-weather/'
const canvas = ref(null)
const dataUrl = ref('')

const siteUrl = computed(() => {
  try {
    const { hostname, protocol, origin, pathname } = window.location
    if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
      return CANONICAL
    }
    return `${origin}${pathname}`.replace(/index\.html$/, '')
  } catch (e) {
    return CANONICAL
  }
})

const fileName = computed(() => {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`
  return `dear-weather-${stamp}.png`
})

function build() {
  if (!props.me || !props.her) return
  canvas.value = buildPoster({
    me: props.me,
    her: props.her,
    settings: props.settings,
    event: props.event,
    phrase: props.phrase,
    siteUrl: siteUrl.value
  })
  dataUrl.value = posterDataUrl(canvas.value)
}

async function save() {
  if (!canvas.value) return
  const ok = await savePoster(canvas.value, fileName.value)
  emit('notice', ok ? '图片已保存，去相册看看' : '保存失败，再试一次')
}

async function share() {
  if (!canvas.value) return
  const result = await sharePoster(canvas.value, fileName.value)
  if (result === 'shared') emit('notice', '已打开系统分享')
  if (result === 'downloaded') emit('notice', '这个浏览器不支持直接分享，图片已保存')
  if (result === 'failed') emit('notice', '生成图片失败，再试一次')
}

watch(
  () => props.open,
  (open) => {
    if (open) build()
  }
)

watch(
  () => [props.event && props.event.key, props.phrase, props.me && props.me.updatedAt, props.her && props.her.updatedAt],
  () => {
    if (props.open) build()
  }
)
</script>

<style scoped>
.poster-mask {
  position: fixed;
  inset: 0;
  z-index: 65;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(79, 67, 88, 0.34);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.poster-panel {
  width: 100%;
  max-width: 420px;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  padding: 18px 18px calc(16px + env(safe-area-inset-bottom, 0px));
  border-radius: 26px;
  background:
    radial-gradient(260px 180px at 90% 0%, rgba(255, 224, 236, 0.6), rgba(255, 224, 236, 0) 72%),
    linear-gradient(165deg, #fffdfd 0%, #fdf9fc 50%, #f8f5fd 100%);
  border: 1px solid rgba(255, 255, 255, 0.98);
  box-shadow: 0 30px 80px -34px rgba(79, 67, 88, 0.5);
}
.poster-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}
.poster-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.poster-eyebrow {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #c08ca4;
}
.poster-titles h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: #4f4358;
}
.poster-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  color: #b3a2bd;
  font-size: 12px;
}
.poster-preview {
  flex: 1;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.9);
}
.poster-preview img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 58dvh;
  object-fit: contain;
}
.poster-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #a896b2;
}
.loading-spark {
  color: #d99ab6;
  animation: spark 1.4s ease-in-out infinite;
}
.poster-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.poster-btn {
  flex: 1;
  padding: 11px;
  border-radius: 13px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.poster-btn:disabled {
  opacity: 0.45;
}
.poster-btn.ghost {
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.95);
  color: #8b7c96;
}
.poster-btn.primary {
  background: linear-gradient(135deg, #e9a3c0, #c9b2e8);
  color: #fff;
  box-shadow: 0 12px 22px -16px rgba(201, 106, 146, 0.7);
}
.poster-hint {
  margin: 9px 0 0;
  text-align: center;
  font-size: 9px;
  color: #b3a2bd;
  letter-spacing: 0.2px;
}

.poster-enter-active,
.poster-leave-active {
  transition: opacity 0.3s ease;
}
.poster-enter-active .poster-panel,
.poster-leave-active .poster-panel {
  transition: transform 0.4s cubic-bezier(0.22, 0.9, 0.28, 1);
}
.poster-enter-from,
.poster-leave-to {
  opacity: 0;
}
.poster-enter-from .poster-panel,
.poster-leave-to .poster-panel {
  transform: translateY(14px) scale(0.98);
}

@keyframes spark {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spark {
    animation: none;
  }
}
</style>
