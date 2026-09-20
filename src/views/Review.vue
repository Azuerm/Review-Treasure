<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'
import { showNotify } from 'vant'

const props = defineProps({
  reviewAll: { type: Boolean, default: false }
})

const route = useRoute()
const router = useRouter()
const store = useLibraryStore()

const libraryId = computed(() => route.params.libraryId)
const library = computed(() => store.libraries.find(l => l.id === libraryId.value))

const allCards = ref([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const finished = ref(false)
const shuffleMode = ref(false)
const isFavorite = ref(false)

const filteredCards = computed(() => allCards.value)

const currentCard = computed(() => filteredCards.value[currentIndex.value])
const progress = computed(() => {
  if (filteredCards.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / filteredCards.value.length) * 100)
})

const title = computed(() => {
  if (props.reviewAll) return '混合复习'
  return library.value?.name || '复习'
})

const scoreLabels = ['不会', '模糊', '掌握', '完全掌握']
const scoreTypes = ['danger', 'warning', 'success', 'primary']

let startTime = 0
let reviewCount = 0

onMounted(() => {
  startTime = Date.now()
  loadCards()
})

onUnmounted(() => {
  const duration = Math.round((Date.now() - startTime) / 1000)
  if (reviewCount > 0 && duration > 5) {
    const today = new Date().toISOString().slice(0, 10)
    store.addStudyLog(today, reviewCount, duration)
  }
})

function loadCards() {
  let cards
  if (props.reviewAll) {
    cards = store.getAllDueCards()
    if (cards.length === 0) cards = store.getAllCards()
  } else {
    cards = store.getDueCards(libraryId.value)
    if (cards.length === 0) cards = store.getCards(libraryId.value)
  }
  allCards.value = shuffleMode.value ? shuffle([...cards]) : cards
  showAnswer.value = false
  finished.value = false
  isFavorite.value = currentCard.value?.favorite || false

  const cardId = route.query.cardId
  if (cardId) {
    const idx = allCards.value.findIndex(c => c.id === cardId)
    if (idx !== -1) {
      currentIndex.value = idx
      return
    }
  }
  currentIndex.value = 0
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function toggleShuffle() {
  shuffleMode.value = !shuffleMode.value
  loadCards()
  showNotify({ type: 'success', message: shuffleMode.value ? '随机模式已开启' : '顺序模式' })
}

function toggleAnswer() {
  showAnswer.value = !showAnswer.value
}

function rateScore(score) {
  if (!currentCard.value) return
  const libId = currentCard.value.libraryId || libraryId.value
  store.updateCardScore(libId, currentCard.value.id, score)
  reviewCount++
  nextCard()
}

function nextCard() {
  if (currentIndex.value < filteredCards.value.length - 1) {
    currentIndex.value++
    showAnswer.value = false
    isFavorite.value = currentCard.value?.favorite || false
  } else {
    finished.value = true
  }
}

function prevCard() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showAnswer.value = false
    isFavorite.value = currentCard.value?.favorite || false
  }
}

function restart() {
  currentIndex.value = 0
  showAnswer.value = false
  finished.value = false
  isFavorite.value = currentCard.value?.favorite || false
}

function goSearch() {
  router.push({ name: 'search', params: { libraryId: libraryId.value } })
}

function toggleFavorite() {
  if (!currentCard.value) return
  const libId = currentCard.value.libraryId || libraryId.value
  store.toggleFavorite(libId, currentCard.value.id)
  isFavorite.value = !isFavorite.value
  showNotify({ type: 'success', message: isFavorite.value ? '已收藏' : '已取消收藏' })
}

function goEdit() {
  if (!currentCard.value) return
  const libId = currentCard.value.libraryId || libraryId.value
  router.push({ name: 'editCard', params: { libraryId: libId, cardId: currentCard.value.id } })
}

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>')
}

function getScoreLabel(score) {
  return scoreLabels[score] || '不会'
}

function getScoreType(score) {
  return scoreTypes[score] || 'danger'
}
</script>

<template>
  <div class="review-page">
    <van-nav-bar :title="title" left-arrow @click-left="router.back()">
      <template #left>
        <van-icon name="arrow-left" size="20" />
      </template>
      <template #right>
        <van-icon :name="shuffleMode ? 'shuffle' : 'bars'" size="20" @click="toggleShuffle" style="margin-right: 12px;" />
        <van-icon name="search" size="20" @click="goSearch" />
      </template>
    </van-nav-bar>

    <div class="progress-bar">
      <van-progress :percentage="progress" stroke-width="4" :show-pivot="false" color="#1989fa" />
      <span class="progress-text">{{ currentIndex + 1 }} / {{ filteredCards.length }}</span>
    </div>

    <div v-if="finished" class="finish-screen">
      <van-empty image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png" description="本批次复习完成！">
        <van-button round type="primary" @click="restart" style="margin-right: 8px;">再来一轮</van-button>
        <van-button round @click="router.back()">返回</van-button>
      </van-empty>
    </div>

    <template v-else-if="currentCard">
      <div class="top-section">
        <div class="question-header">
          <div class="question-text">{{ currentCard.question }}</div>
          <van-icon :name="isFavorite ? 'star' : 'star-o'" :color="isFavorite ? '#ff976a' : '#969799'" size="20" @click="toggleFavorite" />
        </div>

        <div class="card-tags">
          <van-tag v-for="tag in currentCard.tags" :key="tag" size="medium" type="primary" plain>
            {{ tag }}
          </van-tag>
        </div>

        <div class="mastery-row">
          <span class="mastery-label">熟练度：</span>
          <van-tag :type="getScoreType(currentCard.score)" size="medium">
            {{ getScoreLabel(currentCard.score) }}
          </van-tag>
        </div>

        <van-button
          v-if="!showAnswer"
          type="primary"
          block
          round
          @click="toggleAnswer"
          class="reveal-btn"
        >
          点击查看答案
        </van-button>

        <div v-if="showAnswer" class="score-panel">
          <van-button type="danger" round size="small" @click="rateScore(0)" class="score-btn">不会</van-button>
          <van-button type="warning" round size="small" @click="rateScore(1)" class="score-btn">模糊</van-button>
          <van-button type="success" round size="small" @click="rateScore(2)" class="score-btn">掌握</van-button>
          <van-button type="primary" round size="small" @click="rateScore(3)" class="score-btn">精通</van-button>
        </div>
      </div>

      <div v-if="showAnswer" class="answer-scroll">
        <div class="answer-header">
          <span class="answer-title">答案</span>
          <van-icon name="edit" size="16" color="#1989fa" @click="goEdit" />
        </div>
        <div class="answer-content" v-html="renderMarkdown(currentCard.answer)"></div>
      </div>
      <div v-else class="flex-spacer"></div>
    </template>

    <div v-else class="empty-state">
      <van-empty description="没有可复习的卡片" />
    </div>

    <div class="bottom-section" v-if="!finished && currentCard">
      <div class="nav-row">
        <van-button icon="arrow-left" :disabled="currentIndex === 0" @click="prevCard" round size="small" />
        <van-button type="primary" round @click="nextCard" class="next-btn" size="small">
          下一题
        </van-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-page {
  background: #f0f2f5;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 8px;
}

.progress-bar {
  padding: 0px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.progress-text {
  font-size: 13px;
  color: #969799;
  white-space: nowrap;
}

.top-section {
  flex-shrink: 0;
  padding: 10px 16px;
  background: white;
  margin: 0 12px;
  border-radius: 12px;
}

.question-text {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: #323233;
  flex: 1;
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.question-header .van-icon {
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.mastery-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.mastery-label {
  font-size: 13px;
  color: #969799;
  line-height: 1.6;
}

.reveal-btn {
  margin-top: 0;
}

.score-panel {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.score-btn {
  flex: 1;
}

.answer-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
  -webkit-overflow-scrolling: touch;
}

.flex-spacer {
  flex: 1;
}

.answer-content {
  background: white;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.7;
  color: #323233;
  overflow: hidden;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.answer-title {
  font-size: 13px;
  color: #969799;
  font-weight: 500;
}

.answer-header .van-icon {
  cursor: pointer;
}

.answer-content :deep(h1),
.answer-content :deep(h2),
.answer-content :deep(h3) {
  margin: 4px 0;
  line-height: 1.5;
}

.answer-content :deep(li) {
  margin-bottom: 4px;
  line-height: 1.6;
}

.answer-content :deep(ul),
.answer-content :deep(ol) {
  list-style: disc;
  padding-left: 20px;
  margin: 0;
}

.answer-content :deep(br) {
  display: block;
  content: '';
  margin-top: 2px;
}

.bottom-section {
  flex-shrink: 0;
  padding: 6px 16px 8px;
  padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px));
  background: white;
}

.nav-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.nav-row :deep(.van-button) {
  height: 28px;
}

.next-btn {
  min-width: 100px;
}

.finish-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
