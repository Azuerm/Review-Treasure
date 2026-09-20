<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'

const router = useRouter()
const store = useLibraryStore()

const allStats = computed(() => store.getAllStats())

const libraryStatsList = computed(() => {
  return store.libraries.map(lib => ({
    ...lib,
    stats: store.getLibraryStats(lib.id)
  }))
})

const masteredPercent = computed(() => {
  if (allStats.value.total === 0) return 0
  return Math.round((allStats.value.learned / allStats.value.total) * 100)
})

function getTagType(score) {
  const map = { 0: '#ee0a24', 1: '#ff976a', 2: '#07c160' }
  return map[score] || '#969799'
}

function getScoreText(score) {
  const map = { 0: '未学习', 1: '模糊', 2: '已掌握' }
  return map[score] || '未学习'
}

function exportAll() {
  const data = store.exportData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `frontend-review-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importBackup(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      store.importData(data)
    } catch {
      alert('文件格式错误')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="stats-page">
    <van-nav-bar title="学习统计" />

    <div class="overview-section">
      <div class="overview-card">
        <div class="circle-stat">
          <van-circle
            v-model:current-rate="masteredPercent"
            :stroke-width="80"
            size="120px"
            layer-color="#ebedf0"
            color="#1989fa"
          >
            <div class="circle-content">
              <span class="circle-number">{{ masteredPercent }}%</span>
              <span class="circle-label">掌握率</span>
            </div>
          </van-circle>
        </div>
        <div class="overview-detail">
          <div class="detail-row">
            <span class="detail-dot" style="background: #ee0a24;"></span>
            <span>未学习</span>
            <span class="detail-num">{{ allStats.notLearned }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-dot" style="background: #ff976a;"></span>
            <span>模糊</span>
            <span class="detail-num">{{ allStats.fuzzy }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-dot" style="background: #07c160;"></span>
            <span>已掌握</span>
            <span class="detail-num">{{ allStats.learned }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="library-stats-section">
      <div class="section-title">各知识库详情</div>
      <van-empty v-if="libraryStatsList.length === 0" description="暂无数据" />

      <div v-for="lib in libraryStatsList" :key="lib.id" class="lib-stat-card">
        <div class="lib-stat-header">
          <van-tag :type="lib.type === 'tech' ? 'primary' : 'success'" size="medium">
            {{ lib.type === 'tech' ? '技术' : '面试' }}
          </van-tag>
          <span class="lib-stat-name">{{ lib.name }}</span>
          <span class="lib-stat-total">{{ lib.stats.total }} 题</span>
        </div>
        <div class="lib-stat-bar">
          <div class="bar-segment" :style="{ width: (lib.stats.learned / Math.max(lib.stats.total, 1) * 100) + '%', background: '#07c160' }"></div>
          <div class="bar-segment" :style="{ width: (lib.stats.fuzzy / Math.max(lib.stats.total, 1) * 100) + '%', background: '#ff976a' }"></div>
          <div class="bar-segment" :style="{ width: (lib.stats.notLearned / Math.max(lib.stats.total, 1) * 100) + '%', background: '#ee0a24' }"></div>
        </div>
        <div class="lib-stat-numbers">
          <span style="color: #07c160;">{{ lib.stats.learned }} 掌握</span>
          <span style="color: #ff976a;">{{ lib.stats.fuzzy }} 模糊</span>
          <span style="color: #ee0a24;">{{ lib.stats.notLearned }} 未学</span>
        </div>
      </div>
    </div>

    <div class="data-section">
      <div class="section-title">数据管理</div>
      <div class="data-card">
        <div class="data-item" @click="exportAll">
          <van-icon name="down" size="18" color="#1989fa" />
          <span class="data-label">导出备份</span>
          <van-icon name="arrow" size="14" color="#c8c9cc" />
        </div>
        <div class="data-item">
          <label class="data-upload">
            <van-icon name="upgrade" size="18" color="#1989fa" />
            <span class="data-label">导入备份</span>
            <van-icon name="arrow" size="14" color="#c8c9cc" />
            <input type="file" accept=".json" @change="importBackup" style="position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer;" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-page {
  background: #f7f8fa;
  height: 100%;
  overflow-y: auto;
  padding-bottom: calc(66px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
}

.overview-section {
  padding: 12px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.circle-stat {
  flex-shrink: 0;
}

.circle-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.circle-number {
  font-size: 22px;
  font-weight: bold;
  color: #1989fa;
}

.circle-label {
  font-size: 12px;
  color: #969799;
}

.overview-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.detail-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.detail-num {
  margin-left: auto;
  font-weight: 600;
}

.library-stats-section {
  padding: 0 12px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  padding: 12px 0;
}

.lib-stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.lib-stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.lib-stat-name {
  font-weight: 500;
  flex: 1;
}

.lib-stat-total {
  color: #969799;
  font-size: 13px;
}

.lib-stat-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.bar-segment {
  height: 100%;
  transition: width 0.3s ease;
}

.lib-stat-numbers {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.data-section {
  padding: 0 12px;
  margin-bottom: 12px;
}

.data-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.data-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
}

.data-item + .data-item {
  border-top: 1px solid #f5f5f5;
}

.data-label {
  flex: 1;
  margin-left: 10px;
  font-size: 14px;
  color: #323233;
}

.data-upload {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
</style>
