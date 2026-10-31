<template>
  <Transition name="letter">
    <div v-if="letter" class="letter-mask" @click.self="$emit('close')">
      <article class="letter-paper" role="dialog" aria-modal="true" aria-label="一封信">
        <div class="paper-grain"></div>
        <button type="button" class="letter-x" aria-label="关闭" @click="$emit('close')">✕</button>

        <span class="letter-eyebrow">A   L E T T E R   F O R   Y O U</span>
        <h3 class="letter-title">{{ letter.title || '未命名' }}</h3>
        <p class="letter-date">{{ dateText }}</p>

        <div class="letter-body">
          <template v-for="(line, index) in lines" :key="index">
            <p
              v-if="line"
              class="letter-line"
              :style="{ animationDelay: `${0.08 + index * 0.07}s` }"
            >{{ line }}</p>
            <span v-else class="letter-space"></span>
          </template>
        </div>

        <div class="letter-sign">
          <span class="sign-line"></span>
          <span>—— {{ personName }}</span>
        </div>

        <div class="letter-actions">
          <button type="button" class="letter-btn ghost" @click="$emit('edit', letter)">
            编辑这封信
          </button>
          <button type="button" class="letter-btn share" @click="$emit('share', letter)">
            生成图片
          </button>
          <button type="button" class="letter-btn primary" @click="$emit('close')">
            收好
          </button>
        </div>
      </article>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateCN } from '../lib/format'

const props = defineProps({
  letter: { type: Object, default: null },
  personName: { type: String, default: '我' }
})

defineEmits(['close', 'edit', 'share'])

const lines = computed(() => {
  if (!props.letter || !props.letter.body) return ['这封信还没有写内容。']
  return String(props.letter.body).split('\n')
})

const dateText = computed(() => {
  const ts = props.letter && props.letter.lastOpenedAt
  return formatDateCN(ts ? new Date(ts) : new Date())
})
</script>

<style scoped>
.letter-mask {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(79, 67, 88, 0.34);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.letter-paper {
  position: relative;
  width: 100%;
  max-width: 420px;
  max-height: 86dvh;
  overflow-y: auto;
  padding: 30px 26px 24px;
  border-radius: 24px;
  background:
    radial-gradient(220px 160px at 90% 0%, rgba(255, 236, 214, 0.55), rgba(255, 236, 214, 0) 70%),
    linear-gradient(165deg, #fffdf8 0%, #fdf8ee 52%, #fbf4e9 100%);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow:
    0 30px 80px -34px rgba(79, 67, 88, 0.5),
    inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}
.paper-grain {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0.35;
  background-image: radial-gradient(rgba(160, 130, 100, 0.16) 0.7px, transparent 0.9px);
  background-size: 6px 6px;
  pointer-events: none;
}
.letter-x {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  color: #b3a2bd;
  font-size: 12px;
}
.letter-eyebrow {
  position: relative;
  display: block;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.8px;
  color: #c08ca4;
  text-align: center;
}
.letter-title {
  position: relative;
  margin: 10px 0 0;
  font-family: 'Songti SC', 'Noto Serif SC', 'SimSun', serif;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #4f4358;
  text-align: center;
}
.letter-date {
  position: relative;
  margin: 6px 0 0;
  font-size: 10px;
  letter-spacing: 0.6px;
  color: #b3a2bd;
  text-align: center;
}
.letter-body {
  position: relative;
  margin-top: 20px;
}
.letter-line {
  margin: 0 0 9px;
  font-family: 'Songti SC', 'Noto Serif SC', 'SimSun', serif;
  font-size: 15px;
  line-height: 1.9;
  color: #5c4b52;
  letter-spacing: 0.4px;
  animation: line-in 0.6s ease both;
}
.letter-space {
  display: block;
  height: 8px;
}
.letter-sign {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
  font-family: 'Songti SC', 'Noto Serif SC', 'SimSun', serif;
  font-size: 12px;
  color: #9a7f88;
  letter-spacing: 0.5px;
}
.sign-line {
  width: 28px;
  height: 1px;
  background: rgba(154, 127, 136, 0.35);
}
.letter-actions {
  position: relative;
  display: flex;
  gap: 8px;
  margin-top: 22px;
}
.letter-btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 13px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.6);
  color: #8b7c96;
}
.letter-btn.share {
  background: linear-gradient(135deg, #f7d7e4, #f1e6f9);
  color: #a85d7e;
}
.letter-btn.primary {
  background: linear-gradient(135deg, #e9a3c0, #c9b2e8);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 10px 20px -14px rgba(201, 106, 146, 0.7);
}

.letter-enter-active,
.letter-leave-active {
  transition: opacity 0.3s ease;
}
.letter-enter-active .letter-paper,
.letter-leave-active .letter-paper {
  transition: transform 0.42s cubic-bezier(0.22, 0.9, 0.28, 1);
}
.letter-enter-from,
.letter-leave-to {
  opacity: 0;
}
.letter-enter-from .letter-paper,
.letter-leave-to .letter-paper {
  transform: translateY(16px) scale(0.97);
}

@keyframes line-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .letter-line {
    animation: none;
  }
}
</style>
