<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'

const route = useRoute()
const router = useRouter()
const store = useLibraryStore()

const libraryId = computed(() => route.params.libraryId)
const library = computed(() => store.libraries.find(l => l.id === libraryId.value))

const searchQuery = ref('')
const allCards = ref([])

const results = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return allCards.value.filter(card =>
    card.question.toLowerCase().includes(q)
  )
})

const title = computed(() => {
  return library.value?.name ? library.value.name + ' - 搜索' : '搜索'
})

onMounted(() => {
  allCards.value = store.getCards(libraryId.value)
})

function goReview(cardId) {
  router.push({
    name: 'review',
    params: { libraryId: libraryId.value },
    query: { cardId }
  })
}
</script>

<template>
  <div class="search-page">
    <van-nav-bar :title="title" left-arrow @click-left="router.back()" />

    <div class="search-input-wrap">
      <van-search
        v-model="searchQuery"
        placeholder="输入关键词搜索题目..."
        shape="round"
        autofocus
        :clearable="true"
      />
    </div>

    <div class="result-area" v-if="searchQuery.trim()">
      <div class="result-count">找到 {{ results.length }} 条相关题目</div>
      <div class="result-list">
        <div
          v-for="card in results"
          :key="card.id"
          class="result-item"
          @click="goReview(card.id)"
        >
          <div class="result-question">{{ card.question }}</div>
          <div class="result-tags">
            <van-tag v-for="tag in card.tags" :key="tag" size="small" type="primary" plain>
              {{ tag }}
            </van-tag>
          </div>
        </div>
      </div>
      <van-empty v-if="results.length === 0" description="未找到匹配的题目" />
    </div>

    <div v-else class="hint-area">
      <van-empty image="search" description="输入关键词搜索题目" />
    </div>
  </div>
</template>

<style scoped>
.search-page {
  background: #f0f2f5;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-input-wrap {
  flex-shrink: 0;
  background: white;
}

.result-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
  -webkit-overflow-scrolling: touch;
}

.result-count {
  font-size: 13px;
  color: #969799;
  padding: 8px 4px;
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
}

.result-question {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  color: #323233;
  margin-bottom: 6px;
}

.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.hint-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
