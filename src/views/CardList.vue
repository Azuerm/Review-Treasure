<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'

const props = defineProps({
  allMode: { type: Boolean, default: false }
})

const route = useRoute()
const router = useRouter()
const store = useLibraryStore()

const libraryId = computed(() => route.params.libraryId)
const library = computed(() => store.libraries.find(l => l.id === libraryId.value))
const listType = computed(() => route.params.listType)

const allCards = ref([])

const typeConfig = {
  wrong: { label: '错题本', emptyText: '没有错题，继续保持！', tagType: 'danger' },
  fuzzy: { label: '模糊', emptyText: '没有模糊的卡片', tagType: 'warning' },
  mastered: { label: '掌握', emptyText: '还没有掌握的卡片', tagType: 'success' },
  favorites: { label: '收藏', emptyText: '还没有收藏的卡片', tagType: 'warning' }
}

const config = computed(() => typeConfig[listType.value] || typeConfig.wrong)

const title = computed(() => {
  const libName = library.value?.name || ''
  if (props.allMode) return '全部' + config.value.label
  return libName ? libName + ' - ' + config.value.label : config.value.label
})

onMounted(() => {
  loadCards()
})

function loadCards() {
  const type = listType.value
  if (props.allMode) {
    switch (type) {
      case 'wrong':
        allCards.value = store.getAllWrongCards()
        break
      case 'fuzzy':
        allCards.value = store.getAllCardsByScore(1)
        break
      case 'mastered':
        allCards.value = store.getAllCardsByScore(2)
        break
      case 'favorites':
        allCards.value = store.getAllFavoriteCards()
        break
    }
  } else {
    const libId = libraryId.value
    switch (type) {
      case 'wrong':
        allCards.value = store.getWrongCards(libId)
        break
      case 'fuzzy':
        allCards.value = store.getCardsByScore(libId, 1)
        break
      case 'mastered':
        allCards.value = store.getCardsByScore(libId, 2)
        break
      case 'favorites':
        allCards.value = store.getFavoriteCards(libId)
        break
    }
  }
}

function goReview(cardId) {
  if (props.allMode) {
    router.push({ name: 'reviewAll', query: { cardId } })
  } else {
    router.push({ name: 'review', params: { libraryId: libraryId.value }, query: { cardId } })
  }
}

function getScoreLabel(score) {
  const labels = { 0: '未学', 1: '模糊', 2: '掌握' }
  return labels[score] || '未学'
}

function getScoreType(score) {
  const types = { 0: 'danger', 1: 'warning', 2: 'success' }
  return types[score] || 'danger'
}
</script>

<template>
  <div class="card-list-page">
    <van-nav-bar :title="title" left-arrow @click-left="router.back()">
      <template #right>
        <van-tag :type="config.tagType" size="medium">{{ allCards.length }} 题</van-tag>
      </template>
    </van-nav-bar>

    <div class="result-area">
      <div v-if="allCards.length > 0" class="result-list">
        <div
          v-for="card in allCards"
          :key="card.id"
          class="result-item"
          @click="goReview(card.id)"
        >
          <div class="result-question">{{ card.question }}</div>
          <div class="result-meta">
            <div class="result-tags">
              <van-tag v-for="tag in card.tags" :key="tag" size="small" type="primary" plain>
                {{ tag }}
              </van-tag>
            </div>
            <van-tag :type="getScoreType(card.score)" size="small">
              {{ getScoreLabel(card.score) }}
            </van-tag>
          </div>
        </div>
      </div>
      <van-empty v-else :description="config.emptyText" />
    </div>
  </div>
</template>

<style scoped>
.card-list-page {
  background: #f0f2f5;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  cursor: pointer;
}

.result-question {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  color: #323233;
  margin-bottom: 8px;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
