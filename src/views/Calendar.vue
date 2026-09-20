<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'

const router = useRouter()
const store = useLibraryStore()

const todayLog = ref({ count: 0, duration: 0 })
const dailyGoal = ref(20)
const studyLogs = ref([])
const showGoalDialog = ref(false)
const goalInput = ref(20)

const today = new Date().toISOString().slice(0, 10)

onMounted(() => {
  todayLog.value = store.getTodayLog()
  dailyGoal.value = store.getDailyGoal()
  studyLogs.value = store.getStudyLogs()
  goalInput.value = dailyGoal.value
})

const todayProgress = computed(() => {
  return Math.min(100, Math.round((todayLog.value.count / dailyGoal.value) * 100))
})

const recentLogs = computed(() => {
  return studyLogs.value
    .filter(l => l.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)
})

const totalStudyDays = computed(() => studyLogs.value.length)
const totalReviewed = computed(() => studyLogs.value.reduce((s, l) => s + l.count, 0))

const totalDurationText = computed(() => {
  const secs = studyLogs.value.reduce((s, l) => s + (l.duration || 0), 0)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? h + 'h' + m + 'm' : m + 'm'
})

const streak = computed(() => {
  const dates = studyLogs.value.map(l => l.date).sort().reverse()
  if (dates.length === 0) return 0
  let count = 0
  const d = new Date()
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().slice(0, 10)
    if (dates.includes(ds)) count++
    else if (i > 0) break
    d.setDate(d.getDate() - 1)
  }
  return count
})

function formatDuration(secs) {
  if (!secs) return '0m'
  const m = Math.floor(secs / 60)
  return m + 'm'
}

function isToday(dateStr) {
  return dateStr === today
}

function getBarHeight(count) {
  const maxC = Math.max(...recentLogs.value.map(l => l.count), 1)
  return Math.max(4, (count / maxC) * 60)
}

function saveGoal() {
  const target = parseInt(goalInput.value)
  if (target > 0) {
    dailyGoal.value = target
    store.setDailyGoal(target)
  }
  showGoalDialog.value = false
}
</script>

<template>
  <div class="calendar-page">
    <van-nav-bar title="学习打卡" left-arrow @click-left="router.back()" />

    <div class="today-card">
      <div class="today-header">
        <span class="today-date">{{ today }}</span>
        <van-tag :type="todayProgress >= 100 ? 'success' : 'warning'" size="medium">
          {{ todayProgress >= 100 ? '已完成' : '进行中' }}
        </van-tag>
      </div>
      <div class="today-stats">
        <div class="today-stat">
          <span class="today-num">{{ todayLog.count }}</span>
          <span class="today-label">已复习</span>
        </div>
        <div class="today-stat">
          <span class="today-num">{{ dailyGoal }}</span>
          <span class="today-label">目标</span>
        </div>
        <div class="today-stat">
          <span class="today-num">{{ formatDuration(todayLog.duration) }}</span>
          <span class="today-label">用时</span>
        </div>
      </div>
      <div class="goal-progress">
        <van-progress :percentage="todayProgress" stroke-width="8" :show-pivot="false"
          :color="todayProgress >= 100 ? '#07c160' : '#1989fa'" />
        <span class="goal-text" @click="showGoalDialog = true">目标 {{ dailyGoal }} 题 <van-icon name="edit" /></span>
      </div>
    </div>

    <div class="summary-row">
      <div class="summary-item">
        <span class="summary-num">{{ streak }}</span>
        <span class="summary-label">连续天数</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ totalStudyDays }}</span>
        <span class="summary-label">学习天数</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ totalReviewed }}</span>
        <span class="summary-label">总复习题数</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ totalDurationText }}</span>
        <span class="summary-label">总学习时长</span>
      </div>
    </div>

    <div class="recent-section">
      <div class="section-title">近 30 天复习记录</div>
      <div v-if="recentLogs.length === 0" class="empty-hint">
        <van-empty description="还没有学习记录" image-size="80" />
      </div>
      <div v-else class="bar-chart">
        <div v-for="log in recentLogs" :key="log.date" class="bar-item">
          <div class="bar-wrapper">
            <div class="bar" :class="{ 'bar-today': isToday(log.date), 'bar-done': log.count >= dailyGoal }"
              :style="{ height: getBarHeight(log.count) + 'px' }">
              <span class="bar-count">{{ log.count }}</span>
            </div>
          </div>
          <span class="bar-date" :class="{ 'bar-date-today': isToday(log.date) }">
            {{ log.date.slice(5) }}
          </span>
        </div>
      </div>
    </div>

    <van-dialog v-model:show="showGoalDialog" title="设置每日目标" show-cancel-button @confirm="saveGoal">
      <van-field v-model="goalInput" type="digit" label="每日目标" placeholder="请输入题数" />
    </van-dialog>
  </div>
</template>

<style scoped>
.calendar-page {
  background: #f7f8fa;
  height: 100%;
  overflow-y: auto;
  padding-bottom: 16px;
  -webkit-overflow-scrolling: touch;
}
.today-card {
  margin: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #1989fa, #07c160);
  border-radius: 12px;
  color: white;
}
.today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.today-date {
  font-size: 16px;
  font-weight: 600;
}
.today-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
}
.today-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.today-num {
  font-size: 24px;
  font-weight: bold;
}
.today-label {
  font-size: 12px;
  opacity: 0.8;
}
.goal-progress {
  position: relative;
}
.goal-text {
  display: block;
  text-align: center;
  font-size: 12px;
  margin-top: 6px;
  opacity: 0.9;
  cursor: pointer;
}
.summary-row {
  display: flex;
  justify-content: space-around;
  margin: 0 12px 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.summary-num {
  font-size: 20px;
  font-weight: bold;
  color: #323233;
}
.summary-label {
  font-size: 12px;
  color: #969799;
}
.recent-section {
  margin: 0 12px;
  background: white;
  border-radius: 12px;
  padding: 12px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
}
.empty-hint {
  padding: 20px 0;
}
.bar-chart {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
}
.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 28px;
  flex-shrink: 0;
}
.bar-wrapper {
  height: 70px;
  display: flex;
  align-items: flex-end;
}
.bar {
  width: 18px;
  background: #1989fa;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: height 0.3s;
  position: relative;
}
.bar-today {
  background: #07c160;
}
.bar-done {
  background: #07c160;
}
.bar-count {
  font-size: 9px;
  color: white;
  margin-top: 2px;
}
.bar-date {
  font-size: 9px;
  color: #969799;
  margin-top: 4px;
  white-space: nowrap;
}
.bar-date-today {
  color: #07c160;
  font-weight: 600;
}
</style>
