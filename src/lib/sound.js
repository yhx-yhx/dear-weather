/* 很轻的两声提示音，默认关闭。WebAudio 合成，不加载音频文件。 */

let audioContext = null

export function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    if (!audioContext) audioContext = new Ctx()
    if (audioContext.state === 'suspended') audioContext.resume()

    const now = audioContext.currentTime
    const notes = [
      { freq: 659.25, start: 0, duration: 0.42 },
      { freq: 783.99, start: 0.12, duration: 0.5 }
    ]

    notes.forEach((note) => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.type = 'sine'
      osc.frequency.value = note.freq
      gain.gain.setValueAtTime(0.0001, now + note.start)
      gain.gain.exponentialRampToValueAtTime(0.06, now + note.start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration)
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.start(now + note.start)
      osc.stop(now + note.start + note.duration + 0.02)
    })
  } catch (e) {
    /* 音效失败不影响使用 */
  }
}
