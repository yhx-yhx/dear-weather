<template>
  <section class="letter-card">
    <div class="section-head">
      <div class="section-title">
        <span class="section-spark">✉</span>
        <span>写给{{ personName }}的信</span>
        <span class="section-sub">{{ unlockedCount }} 封待拆</span>
      </div>
      <button type="button" class="write-link" @click="$emit('write')">写一封</button>
    </div>

    <div v-if="letters.length" class="letter-scroll">
      <button
        v-for="letter in letters"
        :key="letter.id"
        type="button"
        class="envelope"
        :class="{
          locked: !isUnlocked(letter),
          opened: Boolean(letter.lastOpenedAt),
          hot: isUnlocked(letter) && !letter.lastOpenedAt
        }"
        @click="onOpen(letter)"
      >
        <span class="env-shape">
          <span class="env-body"></span>
          <span class="env-flap"></span>
          <span class="env-seal">♥</span>
        </span>
        <span class="env-title">{{ letter.title || '未命名' }}</span>
        <span class="env-meta">{{ statusText(letter) }}</span>
      </button>

      <button type="button" class="envelope add" @click="$emit('write')">
        <span class="add-shape">＋</span>
        <span class="env-title">写一封</span>
        <span class="env-meta">等一个合适的日子</span>
      </button>
    </div>

    <div v-else class="letter-empty">
      <span class="empty-mark">✉</span>
      <p>还没有信。写一封，等降温的时候替你说。</p>
      <button type="button" class="empty-btn" @click="$emit('write')">写第一封</button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { formatShortDate } from '../lib/format'
import { letterUnlocked, triggerLabel } from '../lib/rules'

const props = defineProps({
  letters: { type: Array, default: () => [] },
  personName: { type: String, default: '她' },
  me: { type: Object, default: null },
  her: { type: Object, default: null },
  settings: { type: Object, required: true },
  event: { type: Object, default: null }
})

const emit = defineEmits(['open', 'write', 'hint'])

const unlockedCount = computed(
  () => props.letters.filter((letter) => isUnlocked(letter) && !letter.lastOpenedAt).length
)

function isUnlocked(letter) {
  return letterUnlocked(letter, {
    me: props.me,
    her: props.her,
    settings: props.settings,
    event: props.event
  })
}

function statusText(letter) {
  if (letter.lastOpenedAt) {
    const iso = new Date(letter.lastOpenedAt).toISOString().slice(0, 10)
    return `已拆 · ${formatShortDate(iso)}`
  }
  if (isUnlocked(letter)) return '可以拆了'
  return triggerLabel(letter, props.settings)
}

function onOpen(letter) {
  if (!isUnlocked(letter)) {
    emit('hint', `这封信要等：${triggerLabel(letter, props.settings)}`)
    return
  }
  emit('open', letter)
}
</script>

<style scoped>
.letter-card {
  margin-top: 14px;
  padding: 16px 0 14px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.92);
  background: linear-gradient(158deg, rgba(255, 255, 255, 0.74), rgba(250, 247, 253, 0.54));
  box-shadow: 0 14px 32px -28px rgba(79, 67, 88, 0.4);
  overflow: hidden;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 10px;
}
.section-title {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #7c6888;
}
.section-spark {
  color: #c9a3d6;
  font-size: 11px;
}
.section-sub {
  font-size: 10px;
  font-weight: 500;
  color: #b3a2bd;
}
.write-link {
  font-size: 10px;
  font-weight: 600;
  color: #b26791;
  letter-spacing: 0.3px;
}
.letter-scroll {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding: 2px 14px 4px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.letter-scroll::-webkit-scrollbar {
  display: none;
}
.envelope {
  flex: none;
  width: 104px;
  padding: 9px 8px 8px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  text-align: left;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.72);
  scroll-snap-align: start;
  transition: transform 0.2s ease, background 0.2s ease;
}
.envelope:active {
  transform: scale(0.97);
}
.envelope.hot {
  background: linear-gradient(160deg, rgba(255, 246, 250, 0.96), rgba(255, 252, 247, 0.82));
  border-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8px 18px -14px rgba(201, 106, 146, 0.6);
}
.envelope.locked {
  opacity: 0.66;
}
.envelope.opened {
  opacity: 0.72;
}
.env-shape {
  position: relative;
  display: block;
  width: 100%;
  height: 42px;
  margin-bottom: 2px;
}
.env-body {
  position: absolute;
  left: 4px;
  right: 4px;
  top: 10px;
  bottom: 0;
  border-radius: 6px;
  background: linear-gradient(160deg, #fdf3f7, #f3e8f7);
  border: 1px solid rgba(201, 163, 214, 0.45);
}
.env-flap {
  position: absolute;
  left: 5px;
  right: 5px;
  top: 10px;
  height: 22px;
  background: linear-gradient(160deg, #fbe6ef, #eee0f6);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  border-radius: 5px 5px 0 0;
}
.env-seal {
  position: absolute;
  left: 50%;
  top: 20px;
  width: 17px;
  height: 17px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: linear-gradient(135deg, #e98fb2, #c9a3d6);
  color: #fff;
  font-size: 9px;
  line-height: 17px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(201, 106, 146, 0.35);
}
.envelope.locked .env-seal {
  background: #d6c9dd;
  color: #fff;
}
.env-title {
  width: 100%;
  font-size: 10.5px;
  font-weight: 700;
  color: #5b4c63;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.env-meta {
  width: 100%;
  font-size: 8.5px;
  color: #a896b2;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.envelope.add {
  align-items: center;
  justify-content: center;
  text-align: center;
  border-style: dashed;
  background: rgba(255, 255, 255, 0.28);
}
.add-shape {
  font-size: 20px;
  font-weight: 300;
  color: #c9a3d6;
  line-height: 1;
  margin-bottom: 2px;
}
.envelope.add .env-title {
  text-align: center;
  color: #a896b2;
}
.envelope.add .env-meta {
  text-align: center;
  color: #c1b2ca;
}
.letter-empty {
  margin: 2px 16px 0;
  padding: 14px 12px;
  border-radius: 16px;
  border: 1px dashed rgba(201, 163, 214, 0.4);
  text-align: center;
  background: rgba(255, 255, 255, 0.3);
}
.empty-mark {
  font-size: 20px;
  color: #c9a3d6;
}
.letter-empty p {
  margin: 6px 0 10px;
  font-size: 11px;
  line-height: 1.6;
  color: #a896b2;
}
.empty-btn {
  padding: 7px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f3d5e3, #e9ddf7);
  font-size: 10.5px;
  font-weight: 600;
  color: #a85d7e;
}
</style>
