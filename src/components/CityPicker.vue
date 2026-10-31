<template>
  <div ref="root" class="city-picker">
    <div v-if="modelValue" class="selected">
      <span class="selected-dot"></span>
      <div class="selected-text">
        <b>{{ cityTitle(modelValue) }}</b>
        <span>{{ citySub(modelValue) || '已选择' }}</span>
      </div>
      <button type="button" class="selected-clear" @click="clear">更换</button>
    </div>

    <div class="search-row">
      <span class="search-mark" aria-hidden="true">⌕</span>
      <input
        v-model="query"
        type="search"
        autocomplete="off"
        :placeholder="modelValue ? '换一个城市…' : placeholder"
        @focus="focused = true"
        @keyup.enter="searchNow"
      />
      <button type="button" class="locate-btn" :disabled="locating" @click="locate">
        {{ locating ? '定位中' : '定位' }}
      </button>
    </div>

    <Transition name="drop">
      <div v-if="showResults" class="results">
        <button
          v-for="city in results"
          :key="city.id"
          type="button"
          class="result"
          @click="select(city)"
        >
          <span class="result-name">{{ city.name }}</span>
          <span class="result-sub">{{ resultSub(city) }}</span>
        </button>

        <div v-if="searching" class="result-note">正在找这个城市…</div>
        <div v-else-if="error" class="result-note error">{{ error }}</div>
        <div v-else-if="!results.length && query.trim()" class="result-note">
          没找到，换个写法试试
        </div>
        <div v-else-if="!results.length" class="result-note">
          输入城市名，或点右侧定位
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  locateCity,
  normalizeCity,
  searchCity
} from '../lib/qweather'
import { citySub, cityTitle } from '../lib/format'

const props = defineProps({
  modelValue: { type: Object, default: null },
  placeholder: { type: String, default: '搜索城市…' },
  settings: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const query = ref('')
const results = ref([])
const searching = ref(false)
const locating = ref(false)
const error = ref('')
const focused = ref(false)
let timer = null

const showResults = computed(
  () => focused.value && (Boolean(query.value.trim()) || searching.value || Boolean(error.value))
)

function resultSub(city) {
  const bits = [city.adm1, city.adm2, city.country].filter(Boolean)
  const unique = []
  bits.forEach((bit) => {
    if (!unique.includes(bit)) unique.push(bit)
  })
  return unique.join(' · ')
}

async function doSearch(keyword) {
  searching.value = true
  error.value = ''
  try {
    const list = await searchCity(keyword, props.settings)
    results.value = list.map(normalizeCity)
  } catch (err) {
    error.value = err && err.message ? err.message : '搜索失败，等会儿再试'
    results.value = []
  } finally {
    searching.value = false
  }
}

function searchNow() {
  const keyword = query.value.trim()
  if (!keyword) return
  clearTimeout(timer)
  doSearch(keyword)
}

watch(query, (value) => {
  clearTimeout(timer)
  error.value = ''
  if (!value.trim()) {
    results.value = []
    return
  }
  timer = setTimeout(() => doSearch(value.trim()), 380)
})

function select(city) {
  emit('update:modelValue', normalizeCity(city))
  query.value = ''
  results.value = []
  focused.value = false
}

function clear() {
  emit('update:modelValue', null)
  query.value = ''
  results.value = []
  focused.value = true
}

function locate() {
  if (!navigator.geolocation) {
    error.value = '这个浏览器不支持定位，直接搜城市吧'
    focused.value = true
    return
  }
  locating.value = true
  error.value = ''
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const city = await locateCity(
          position.coords.longitude,
          position.coords.latitude,
          props.settings
        )
        select(city)
      } catch (err) {
        error.value = err && err.message ? err.message : '定位到了，但没找到城市'
        focused.value = true
      } finally {
        locating.value = false
      }
    },
    (err) => {
      locating.value = false
      const code = err && err.code
      error.value =
        code === 1
          ? '定位权限没开，直接搜城市也一样'
          : code === 3
            ? '定位超时了，手动搜一下吧'
            : '暂时定位不到，手动搜一下吧'
      focused.value = true
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
  )
}

function onDocumentClick(event) {
  if (root.value && !root.value.contains(event.target)) {
    focused.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentClick)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  document.removeEventListener('pointerdown', onDocumentClick)
})
</script>

<style scoped>
.city-picker {
  position: relative;
}
.selected {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 15px;
  background: linear-gradient(150deg, rgba(255, 250, 252, 0.9), rgba(249, 245, 253, 0.72));
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}
.selected-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e98fb2, #c9a3d6);
  flex: none;
}
.selected-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.selected-text b {
  font-size: 13px;
  font-weight: 700;
  color: #4f4358;
  letter-spacing: 0.3px;
}
.selected-text span {
  font-size: 9.5px;
  color: #a896b2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.selected-clear {
  flex: none;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 600;
  color: #b26791;
  background: rgba(255, 255, 255, 0.66);
}
.search-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 7px;
  padding: 0 6px 0 11px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.92);
}
.search-mark {
  font-size: 16px;
  color: #c1b2ca;
  transform: rotate(-15deg);
  line-height: 1;
}
.search-row input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 13px;
  color: #4f4358;
}
.search-row input::placeholder {
  color: #b9a9c2;
}
.locate-btn {
  flex: none;
  padding: 6px 10px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f6dbe7, #eee3f8);
  font-size: 9.5px;
  font-weight: 700;
  color: #a85d7e;
  letter-spacing: 0.3px;
}
.locate-btn:disabled {
  opacity: 0.6;
}
.results {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 20;
  max-height: 220px;
  overflow-y: auto;
  padding: 6px;
  border-radius: 16px;
  background: rgba(255, 253, 254, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.98);
  box-shadow: 0 20px 40px -20px rgba(79, 67, 88, 0.35);
  backdrop-filter: blur(16px);
}
.result {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 10px;
  text-align: left;
}
.result:active {
  background: rgba(248, 238, 252, 0.8);
}
.result-name {
  font-size: 12px;
  font-weight: 700;
  color: #4f4358;
  white-space: nowrap;
}
.result-sub {
  font-size: 9px;
  color: #a896b2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.result-note {
  padding: 10px;
  font-size: 10.5px;
  color: #a896b2;
  text-align: center;
}
.result-note.error {
  color: #b25f6f;
}

.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
