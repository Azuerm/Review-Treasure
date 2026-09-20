<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'
import { showNotify } from 'vant'

const route = useRoute()
const router = useRouter()
const store = useLibraryStore()

const libraryId = computed(() => route.params.libraryId)
const cardId = computed(() => route.params.cardId)

const question = ref('')
const answer = ref('')

onMounted(() => {
  const cards = store.getCards(libraryId.value)
  const card = cards.find(c => c.id === cardId.value)
  if (card) {
    question.value = card.question
    answer.value = card.answer
  } else {
    showNotify({ type: 'danger', message: '卡片不存在' })
    router.back()
  }
})

function save() {
  if (!question.value.trim()) {
    showNotify({ type: 'warning', message: '题目不能为空' })
    return
  }
  store.updateCard(libraryId.value, cardId.value, {
    question: question.value.trim(),
    answer: answer.value.trim()
  })
  showNotify({ type: 'success', message: '保存成功' })
  router.back()
}
</script>

<template>
  <div class="edit-page">
    <van-nav-bar title="编辑卡片" left-arrow @click-left="router.back()" />

    <div class="edit-form">
      <div class="form-item">
        <label class="form-label">题目</label>
        <van-field
          v-model="question"
          type="textarea"
          placeholder="请输入题目"
          autosize
          rows="3"
          :border="false"
          class="form-field"
        />
      </div>

      <div class="form-item">
        <label class="form-label">答案</label>
        <van-field
          v-model="answer"
          type="textarea"
          placeholder="请输入答案"
          autosize
          rows="10"
          :border="false"
          class="form-field"
        />
      </div>
    </div>

    <div class="bottom-bar">
      <van-button type="primary" round @click="save" class="save-btn" size="small">
        保存并返回
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.edit-page {
  background: #f7f8fa;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.edit-form {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.form-item {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.form-label {
  display: block;
  padding: 12px 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.form-field {
  padding: 8px 16px 12px;
}

.form-field :deep(.van-field__control) {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.6;
}

.bottom-bar {
  flex-shrink: 0;
  padding: 6px 16px 8px;
  padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px));
  background: white;
  display: flex;
  justify-content: center;
}

.bottom-bar :deep(.van-button) {
  height: 28px;
}

.save-btn {
  min-width: 100px;
}
</style>
