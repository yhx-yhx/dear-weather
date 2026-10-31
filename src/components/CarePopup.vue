<template>
  <Transition name="popup">
    <div v-if="event" class="popup-mask" @click.self="$emit('close')">
      <div class="popup" role="dialog" aria-modal="true" aria-label="今日关心">
        <div class="grabber"></div>
        <button type="button" class="popup-x" aria-label="关闭" @click="$emit('close')">✕</button>

        <div class="popup-icon">
          <WeatherIcon :kind="kind" :size="52" tone="her" :animated="false" />
        </div>
        <span class="popup-eyebrow">T O D A Y ' S   C A R E</span>
        <h3 class="popup-title">{{ event.title }}</h3>
        <p v-if="event.detail" class="popup-detail">{{ event.detail }}</p>
        <blockquote class="popup-phrase">「{{ phrase }}」</blockquote>

        <div class="popup-actions">
          <button type="button" class="popup-btn ghost" @click="$emit('cycle')">
            <span>✦</span> 换一句
          </button>
          <button v-if="hasLetter" type="button" class="popup-btn letter" @click="$emit('letter')">
            拆信
          </button>
          <button type="button" class="popup-btn primary" @click="$emit('share')">
            生成分享图
          </button>
        </div>

        <button type="button" class="popup-dismiss" @click="$emit('close')">
          知道了，今天会多看她一眼
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import { sceneKind } from '../lib/icons'

const props = defineProps({
  event: { type: Object, default: null },
  phrase: { type: String, default: '' },
  hasLetter: { type: Boolean, default: false }
})

defineEmits(['close', 'cycle', 'share', 'letter'])

const kind = computed(() => sceneKind(props.event && props.event.scene))
</script>

<style scoped>
.popup-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  background: rgba(79, 67, 88, 0.28);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.popup {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding: 10px 24px calc(20px + env(safe-area-inset-bottom, 0px));
  border-radius: 30px 30px 0 0;
  background:
    radial-gradient(260px 180px at 90% 0%, rgba(255, 220, 234, 0.7), rgba(255, 220, 234, 0) 72%),
    linear-gradient(165deg, #fffdfd 0%, #fff8fb 46%, #faf6fd 100%);
  border: 1px solid rgba(255, 255, 255, 0.98);
  border-bottom: 0;
  box-shadow: 0 -24px 60px -28px rgba(79, 67, 88, 0.45);
  text-align: center;
}
.grabber {
  width: 36px;
  height: 4px;
  margin: 0 auto 10px;
  border-radius: 999px;
  background: rgba(139, 124, 150, 0.22);
}
.popup-x {
  position: absolute;
  top: 14px;
  right: 18px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  color: #b3a2bd;
  font-size: 12px;
}
.popup-icon {
  width: 68px;
  height: 68px;
  margin: 2px auto 8px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 26px -18px rgba(201, 106, 146, 0.55);
}
.popup-eyebrow {
  display: block;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #c08ca4;
}
.popup-title {
  margin: 7px 0 0;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #4f4358;
}
.popup-detail {
  margin: 7px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: #8b7c96;
  letter-spacing: 0.2px;
}
.popup-phrase {
  margin: 13px 0 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.9);
  font-family: 'Songti SC', 'Noto Serif SC', 'SimSun', serif;
  font-size: 14px;
  line-height: 1.7;
  color: #7a5f6d;
  letter-spacing: 0.3px;
}
.popup-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.popup-btn {
  flex: 1;
  padding: 11px 8px;
  border-radius: 14px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.62);
  color: #8b7c96;
  transition: transform 0.2s ease;
}
.popup-btn:active {
  transform: scale(0.97);
}
.popup-btn.ghost {
  color: #a06d86;
}
.popup-btn.letter {
  background: linear-gradient(135deg, #f7d7e4, #f1e3f8);
  color: #a85d7e;
}
.popup-btn.primary {
  background: linear-gradient(135deg, #e9a3c0, #c9b2e8);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 10px 20px -12px rgba(201, 106, 146, 0.7);
}
.popup-dismiss {
  margin-top: 14px;
  font-size: 10px;
  color: #b3a2bd;
  letter-spacing: 0.3px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.3s ease;
}
.popup-enter-active .popup,
.popup-leave-active .popup {
  transition: transform 0.38s cubic-bezier(0.22, 0.9, 0.28, 1);
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}
.popup-enter-from .popup,
.popup-leave-to .popup {
  transform: translateY(100%);
}

@media (min-width: 560px) {
  .popup-mask {
    align-items: center;
    padding: 24px;
  }
  .popup {
    border-radius: 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.98);
    padding-bottom: 24px;
  }
  .popup-enter-from .popup,
  .popup-leave-to .popup {
    transform: translateY(18px) scale(0.98);
  }
}
</style>
