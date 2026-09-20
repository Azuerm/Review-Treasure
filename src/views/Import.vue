<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '../stores/library'
import { parseMarkdown } from '../utils/mdParser'
import { showNotify, showDialog } from 'vant'

const route = useRoute()
const router = useRouter()
const store = useLibraryStore()

const libraryId = computed(() => route.params.libraryId)
const library = computed(() => store.libraries.find(l => l.id === libraryId.value))

const importMode = ref('paste')
const mdContent = ref('')
const previewCards = ref([])
const selectedLibId = ref('')
const importing = ref(false)
const uploadedFileName = ref('')
const showPicker = ref(false)
const pickerColumns = computed(() => store.libraries.map(l => ({ text: l.name, value: l.id })))
const selectedLibName = computed(() => {
  const lib = store.libraries.find(l => l.id === selectedLibId.value)
  return lib?.name || ''
})

onMounted(() => {
  if (libraryId.value) {
    selectedLibId.value = libraryId.value
  } else if (store.libraries.length === 1) {
    selectedLibId.value = store.libraries[0].id
  }
})

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
    showDialog({ title: '提示', message: '请上传 .md 或 .txt 文件' })
    return
  }
  uploadedFileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    mdContent.value = e.target.result
    previewParsed()
  }
  reader.readAsText(file)
}

function onPickerConfirm({ selectedValues }) {
  selectedLibId.value = selectedValues[0]
  showPicker.value = false
}

function previewParsed() {
  if (!mdContent.value.trim()) {
    showNotify({ type: 'warning', message: '请先输入或上传内容' })
    return
  }
  if (!selectedLibId.value) {
    showNotify({ type: 'warning', message: '请选择目标知识库' })
    return
  }
  const targetLib = store.libraries.find(l => l.id === selectedLibId.value)
  const type = targetLib?.type || 'tech'
  previewCards.value = parseMarkdown(mdContent.value, type)
  if (previewCards.value.length === 0) {
    showNotify({ type: 'warning', message: '未解析到任何卡片，请检查格式' })
  }
}

function doImport() {
  if (previewCards.value.length === 0) {
    showNotify({ type: 'warning', message: '没有可导入的卡片' })
    return
  }
  if (!selectedLibId.value) {
    showNotify({ type: 'warning', message: '请选择目标知识库' })
    return
  }
  importing.value = true
  const added = store.addCardsToLibrary(selectedLibId.value, previewCards.value)
  importing.value = false
  showNotify({ type: 'success', message: `成功导入 ${added} 张新卡片` })
  mdContent.value = ''
  previewCards.value = []
  uploadedFileName.value = ''
}

function getTagType(tag) {
  const map = {
    'Vue': 'primary', 'React': 'success', 'JavaScript': 'warning',
    'CSS': 'danger', '浏览器': 'primary', '网络': 'success',
    '性能': 'warning', '工程化': 'danger', 'Node': 'primary', '其他': 'default'
  }
  return map[tag] || 'default'
}
</script>

<template>
  <div class="import-page">
    <van-nav-bar title="导入内容" left-arrow @click-left="router.back()" />

    <div class="import-section">
      <div class="target-lib">
        <span class="target-label">目标知识库：</span>
        <div class="lib-selector" @click="showPicker = true">
          <span :class="selectedLibName ? 'lib-name' : 'lib-placeholder'">
            {{ selectedLibName || '请选择知识库' }}
          </span>
          <van-icon name="arrow-down" size="14" color="#969799" />
        </div>
        <span v-if="store.libraries.length === 0" class="no-lib" @click="router.push({ name: 'home' })">请先创建</span>
      </div>

      <van-popup v-model:show="showPicker" position="bottom" round>
        <van-picker
          :columns="pickerColumns"
          @confirm="onPickerConfirm"
          @cancel="showPicker = false"
          confirm-button-text="确认"
          cancel-button-text="取消"
          title="选择目标知识库"
        />
      </van-popup>

      <van-tabs v-model:active="importMode" sticky>
        <van-tab title="粘贴内容" name="paste">
          <div class="paste-area">
            <van-field
              v-model="mdContent"
              type="textarea"
              placeholder="在此粘贴 Markdown 内容..."
              rows="10"
              autosize
              :border="false"
              class="md-input"
            />
          </div>
        </van-tab>
        <van-tab title="上传文件" name="upload">
          <div class="upload-area">
            <div v-if="uploadedFileName && mdContent" class="upload-success">
              <van-icon name="success" size="40" color="#07c160" />
              <p class="upload-filename">{{ uploadedFileName }}</p>
              <p class="upload-hint">文件已上传，共 {{ mdContent.split('\n').length }} 行</p>
              <label class="upload-re-btn">
                <van-button type="primary" size="small" round>重新上传</van-button>
                <input type="file" accept=".md,.txt" @change="handleFileUpload" style="display: none;" />
              </label>
            </div>
            <label v-else class="upload-btn">
              <van-icon name="upload" size="40" color="#1989fa" />
              <p>点击上传 .md 文件</p>
              <input type="file" accept=".md,.txt" @change="handleFileUpload" style="display: none;" />
            </label>
          </div>
        </van-tab>
      </van-tabs>

      <div class="action-bar">
        <van-button type="default" @click="previewParsed" :disabled="!selectedLibId">预览解析</van-button>
        <van-button type="primary" @click="doImport" :loading="importing" :disabled="previewCards.length === 0 || !selectedLibId">
          导入 {{ previewCards.length }} 张卡片
        </van-button>
      </div>
    </div>

    <div class="preview-section" v-if="previewCards.length > 0">
      <div class="preview-header">
        <span>解析预览（{{ previewCards.length }} 条）</span>
      </div>
      <div v-for="(card, idx) in previewCards" :key="card.id" class="preview-card">
        <div class="preview-question">
          <span class="preview-index">{{ idx + 1 }}.</span>
          {{ card.question }}
        </div>
        <div class="preview-tags">
          <van-tag v-for="tag in card.tags" :key="tag" :type="getTagType(tag)" size="medium" style="margin-right: 4px;">
            {{ tag }}
          </van-tag>
        </div>
        <div class="preview-answer">{{ card.answer.substring(0, 100) }}{{ card.answer.length > 100 ? '...' : '' }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-page {
  background: #f7f8fa;
  height: 100%;
  overflow-y: auto;
  padding-bottom: calc(50px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
}

.import-section {
  margin: 12px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.target-lib {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.target-label {
  font-size: 14px;
  color: #323233;
  white-space: nowrap;
}

.lib-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f7f8fa;
  border-radius: 8px;
  cursor: pointer;
  flex: 1;
}

.lib-name {
  font-size: 14px;
  color: #323233;
}

.lib-placeholder {
  font-size: 14px;
  color: #c8c9cc;
}

.no-lib {
  color: #1989fa;
  font-size: 13px;
  white-space: nowrap;
  margin-left: 8px;
}

.paste-area {
  padding: 12px;
}

.md-input {
  background: #f7f8fa;
  border-radius: 12px;
}

.upload-area {
  padding: 24px;
  display: flex;
  justify-content: center;
}

.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 48px;
  border: 2px dashed #dcdee0;
  border-radius: 12px;
  color: #969799;
  cursor: pointer;
}

.upload-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 48px;
  border: 2px solid #07c160;
  border-radius: 12px;
  width: 100%;
}

.upload-filename {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
}

.upload-hint {
  font-size: 13px;
  color: #969799;
}

.upload-re-btn {
  cursor: pointer;
}

.action-bar {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #f5f5f5;
}

.action-bar .van-button {
  flex: 1;
}

.preview-section {
  margin: 12px;
}

.preview-header {
  padding: 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.preview-card {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
}

.preview-question {
  font-weight: 500;
  margin-bottom: 6px;
  line-height: 1.5;
}

.preview-index {
  color: #1989fa;
  font-weight: 600;
}

.preview-tags {
  margin-bottom: 6px;
}

.preview-answer {
  font-size: 13px;
  color: #969799;
  line-height: 1.5;
}
</style>
