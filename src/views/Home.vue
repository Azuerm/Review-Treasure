<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'
import { showConfirmDialog, showDialog, showNotify } from 'vant'

const router = useRouter()
const store = useLibraryStore()

const showCreateDialog = ref(false)
const newLibName = ref('')
const newLibType = ref('tech')
const dailyGoal = ref(20)
const todayLog = ref({ count: 0 })

onMounted(() => {
  dailyGoal.value = store.getDailyGoal()
  todayLog.value = store.getTodayLog()
})

const libraryStats = computed(() => {
  return store.libraries.map(lib => ({
    ...lib,
    stats: store.getLibraryStats(lib.id),
    wrongCount: store.getWrongCards(lib.id).length,
    favCount: store.getFavoriteCards(lib.id).length
  }))
})

const allStats = computed(() => store.getAllStats())
const allWrongCount = computed(() => store.getAllWrongCards().length)
const allFavCount = computed(() => store.getAllFavoriteCards().length)
const allFuzzyCount = computed(() => allStats.value.fuzzy)
const allMasteredCount = computed(() => allStats.value.learned)

const todayProgress = computed(() => {
  return Math.min(100, Math.round((todayLog.value.count / dailyGoal.value) * 100))
})

async function createLibrary() {
  if (!newLibName.value.trim()) {
    showDialog({ title: '提示', message: '请输入知识库名称' })
    return
  }
  store.createLibrary(newLibName.value.trim(), newLibType.value)
  newLibName.value = ''
  showCreateDialog.value = false
}

async function deleteLibrary(lib) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定删除「${lib.name}」吗？所有卡片都会被删除。`
    })
    store.removeLibrary(lib.id)
  } catch {}
}

function goToImport(libId) {
  router.push({ name: 'importToLibrary', params: { libraryId: libId } })
}

function goToReview(libId) {
  router.push({ name: 'review', params: { libraryId: libId } })
}

function goToReviewAll() {
  router.push({ name: 'reviewAll' })
}

function goToWrongBook() {
  router.push({ name: 'cardListAll', params: { listType: 'wrong' } })
}

function goToWrongBookLib(libId) {
  router.push({ name: 'cardList', params: { listType: 'wrong', libraryId: libId } })
}

function goToFavorites() {
  router.push({ name: 'cardListAll', params: { listType: 'favorites' } })
}

function goToFavoritesLib(libId) {
  router.push({ name: 'cardList', params: { listType: 'favorites', libraryId: libId } })
}

function goToCalendar() {
  router.push({ name: 'calendar' })
}

function goToFuzzyList() {
  router.push({ name: 'cardListAll', params: { listType: 'fuzzy' } })
}

function goMasteredList() {
  router.push({ name: 'cardListAll', params: { listType: 'mastered' } })
}

function getScoreColor(score) {
  const colors = { 0: '#ee0a24', 1: '#ff976a', 2: '#07c160' }
  return colors[score] || '#969799'
}

function getScoreText(score) {
  const texts = { 0: '未学习', 1: '模糊', 2: '已掌握' }
  return texts[score] || '未学习'
}
</script>

<template>
  <div class="home">
    <van-nav-bar title="前端面试复习" />

    <div class="stats-banner" @click="goToReviewAll">
      <div class="stats-total">
        <span class="stats-number">{{ allStats.total }}</span>
        <span class="stats-label">总卡片数</span>
      </div>
      <div class="stats-detail">
        <van-tag type="danger" size="medium">未学习 {{ allStats.notLearned }}</van-tag>
        <van-tag type="warning" size="medium">模糊 {{ allStats.fuzzy }}</van-tag>
        <van-tag type="success" size="medium">已掌握 {{ allStats.learned }}</van-tag>
      </div>
      <div class="stats-action" v-if="allStats.total > 0">
        <van-button type="primary" size="small" round>混合复习</van-button>
      </div>
    </div>

    <div class="today-progress-card" v-if="allStats.total > 0" @click="goToCalendar">
      <div class="today-info">
        <span class="today-title">今日进度</span>
        <span class="today-num">{{ todayLog.count }} / {{ dailyGoal }}</span>
      </div>
      <van-progress :percentage="todayProgress" stroke-width="6" :show-pivot="false"
        :color="todayProgress >= 100 ? '#07c160' : '#1989fa'" />
    </div>

    <div class="quick-actions">
      <div class="action-item" @click="goToWrongBook">
        <div class="action-icon danger">!</div>
        <span class="action-label">错题本</span>
        <van-tag v-if="allWrongCount > 0" type="danger" size="mini">{{ allWrongCount }}</van-tag>
      </div>
      <div class="action-item" @click="goToFavorites">
        <div class="action-icon warning">*</div>
        <span class="action-label">收藏</span>
        <van-tag v-if="allFavCount > 0" type="warning" size="mini">{{ allFavCount }}</van-tag>
      </div>
      <div class="action-item" @click="goToFuzzyList">
        <div class="action-icon fuzzy">
          <span>~</span>
        </div>
        <span class="action-label">模糊</span>
        <van-tag v-if="allFuzzyCount > 0" type="warning" size="mini">{{ allFuzzyCount }}</van-tag>
      </div>
      <div class="action-item" @click="goMasteredList">
        <div class="action-icon success">
          <span>✓</span>
        </div>
        <span class="action-label">掌握</span>
        <van-tag v-if="allMasteredCount > 0" type="success" size="mini">{{ allMasteredCount }}</van-tag>
      </div>
    </div>

    <div class="library-list">
      <div class="section-header">
        <span>我的知识库</span>
        <van-button type="primary" size="small" icon="plus" round @click="showCreateDialog = true">
          新建
        </van-button>
      </div>

      <van-empty v-if="store.libraries.length === 0" description="还没有知识库，点击上方新建" image="search" />

      <div v-for="lib in libraryStats" :key="lib.id" class="library-card">
        <div class="library-header">
          <div class="library-info">
            <van-tag :type="lib.type === 'tech' ? 'primary' : 'success'" size="medium" style="margin-right: 6px;">
              {{ lib.type === 'tech' ? '技术' : '面试' }}
            </van-tag>
            <span class="library-name">{{ lib.name }}</span>
          </div>
          <van-icon name="delete-o" size="20" @click.stop="deleteLibrary(lib)" />
        </div>

        <div class="library-stats">
          <span class="stat-item">
            <span class="stat-num">{{ lib.stats.total }}</span> 总数
          </span>
          <span class="stat-item" :style="{ color: getScoreColor(0) }">
            <span class="stat-num">{{ lib.stats.notLearned }}</span> 未学
          </span>
          <span class="stat-item" :style="{ color: getScoreColor(1) }">
            <span class="stat-num">{{ lib.stats.fuzzy }}</span> 模糊
          </span>
          <span class="stat-item" :style="{ color: getScoreColor(2) }">
            <span class="stat-num">{{ lib.stats.learned }}</span> 掌握
          </span>
        </div>

        <div class="library-sub-actions">
          <van-button v-if="lib.wrongCount > 0" size="mini" type="danger" plain icon="warning-o" @click="goToWrongBookLib(lib.id)">
            错题 {{ lib.wrongCount }}
          </van-button>
          <van-button v-if="lib.favCount > 0" size="mini" type="warning" plain icon="star-o" @click="goToFavoritesLib(lib.id)">
            收藏 {{ lib.favCount }}
          </van-button>
        </div>

        <div class="library-actions">
          <van-button size="small" icon="upgrade" @click="goToImport(lib.id)">导入</van-button>
          <van-button size="small" type="primary" icon="play-circle-o" @click="goToReview(lib.id)">复习</van-button>
        </div>
      </div>
    </div>

    <van-dialog v-model:show="showCreateDialog" title="新建知识库" show-cancel-button @confirm="createLibrary">
      <van-field v-model="newLibName" label="名称" placeholder="例如：Vue3知识点" />
      <van-radio-group v-model="newLibType" direction="horizontal" style="padding: 12px 16px;">
        <span style="margin-right: 12px;">类型：</span>
        <van-radio name="tech">技术知识</van-radio>
        <van-radio name="interview">面试问题</van-radio>
      </van-radio-group>
    </van-dialog>
  </div>
</template>

<style scoped>
.home {
  background: #f7f8fa;
  height: 100%;
  overflow-y: auto;
  padding-bottom: calc(50px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
}

.stats-banner {
  margin: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #1989fa, #07c160);
  border-radius: 12px;
  color: white;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.stats-total {
  display: flex;
  flex-direction: column;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
}

.stats-label {
  font-size: 12px;
  opacity: 0.8;
}

.stats-detail {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.stats-action {
  margin-left: auto;
}

.library-list {
  padding: 0 12px 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.library-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.library-info {
  display: flex;
  align-items: center;
}

.library-name {
  font-size: 16px;
  font-weight: 600;
}

.library-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #969799;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-num {
  font-weight: 600;
  color: #323233;
}

.library-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.library-sub-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.today-progress-card {
  margin: 0 12px 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
}

.today-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.today-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.today-num {
  font-size: 14px;
  color: #1989fa;
  font-weight: 500;
}

.quick-actions {
  display: flex;
  justify-content: space-around;
  margin: 0 12px 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.action-icon.danger {
  background: linear-gradient(135deg, #ee0a24, #ff6034);
}

.action-icon.warning {
  background: linear-gradient(135deg, #ff976a, #ffb74d);
}

.action-icon.success {
  background: linear-gradient(135deg, #07c160, #4cd964);
}

.action-icon.fuzzy {
  background: linear-gradient(135deg, #ff976a, #ffb74d);
}

.action-label {
  font-size: 12px;
  color: #646566;
}
</style>
