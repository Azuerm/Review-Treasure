<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'
import { showNotify } from 'vant'

const props = defineProps({
  allMode: { type: Boolean, default: false }
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

const currentCard = computed(() => allCards.value[currentIndex.value])
const progress = computed(() => {
  if (allCards.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / allCards.value.length) * 100)
})

const title = computed(() => {
  if (props.allMode) return '全部收藏'
  return (library.value?.name || '') + ' - 收藏'
})

const scoreLabels = ['不会', '模糊', '掌握']
const scoreTypes = ['danger', 'warning', 'success']

onMounted(() => {
  loadCards()
})

function loadCards() {
  let cards
  if (props.allMode) {
    cards = store.getAllFavoriteCards()
  } else {
    cards = store.getFavoriteCards(libraryId.value)
  }
  allCards.value = cards
  showAnswer.value = false
  finished.value = false
  currentIndex.value = 0
}

function toggleAnswer() {
  showAnswer.value = !showAnswer.value
}

function rateScore(score) {
  if (!currentCard.value) return
  const libId = currentCard.value.libraryId || libraryId.value
  store.updateCardScore(libId, currentCard.value.id, score)
  nextCard()
}

function removeFavorite() {
  if (!currentCard.value) return
  const libId = currentCard.value.libraryId || libraryId.value
  store.toggleFavorite(libId, currentCard.value.id)
  showNotify({ type: 'success', message: '已取消收藏' })
  allCards.value.splice(currentIndex.value, 1)
  if (currentIndex.value >= allCards.value.length) {
    finished.value = allCards.value.length === 0
  }
}

function nextCard() {
  if (currentIndex.value < allCards.value.length - 1) {
    currentIndex.value++
    showAnswer.value = false
  } else {
    finished.value = true
  }
}

function prevCard() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showAnswer.value = false
  }
}

function restart() {
  loadCards()
}

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
      <template #right>
        <van-tag type="warning" size="medium">{{ allCards.length }} 题</van-tag>
      </template>
    </van-nav-bar>

    <div class="progress-bar">
      <van-progress :percentage="progress" stroke-width="4" :show-pivot="false" color="#ff976a" />
      <span class="progress-text">{{ currentIndex + 1 }} / {{ allCards.length }}</span>
    </div>

    <div v-if="finished" class="finish-screen">
      <van-empty image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png" description="收藏列表已清空">
        <van-button round type="primary" @click="restart" style="margin-right: 8px;">刷新</van-button>
        <van-button round @click="router.back()">返回</van-button>
      </van-empty>
    </div>

    <template v-else-if="currentCard">
      <div class="top-section">
        <div class="question-text">{{ currentCard.question }}</div>

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

        <div class="action-row">
          <van-button
            v-if="!showAnswer"
            type="primary"
            block
            round
            @click="toggleAnswer"
            class="reveal-btn"
          >
            查看答案
          </van-button>
          <van-button
            v-if="!showAnswer"
            icon="star-o"
            round
            size="small"
            @click="removeFavorite"
            class="fav-btn"
          />
        </div>

        <div v-if="showAnswer" class="score-panel">
          <van-button type="danger" round size="small" @click="rateScore(0)" class="score-btn">不会</van-button>
          <van-button type="warning" round size="small" @click="rateScore(1)" class="score-btn">模糊</van-button>
          <van-button type="success" round size="small" @click="rateScore(2)" class="score-btn">掌握</van-button>
        </div>
      </div>

      <div v-if="showAnswer" class="answer-scroll">
        <div class="answer-content" v-html="renderMarkdown(currentCard.answer)"></div>
      </div>
      <div v-else class="flex-spacer"></div>
    </template>

    <div v-else class="empty-state">
      <van-empty description="还没有收藏的题目" />
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
  margin-bottom: 8px;
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

.action-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.reveal-btn {
  flex: 1;
}

.fav-btn {
  flex-shrink: 0;
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
