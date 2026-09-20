import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as storage from '../utils/storage'

export const useLibraryStore = defineStore('library', () => {
  const libraries = ref(storage.getLibraries())
  const currentLibraryId = ref(null)

  // 数据迁移：将旧版 score=3（精通）统一为 score=2（掌握）
  function migrateOldScores() {
    for (const lib of libraries.value) {
      const cards = storage.getCards(lib.id)
      let changed = false
      for (const card of cards) {
        if (card.score === 3) {
          card.score = 2
          changed = true
        }
      }
      if (changed) storage.saveCards(lib.id, cards)
    }
  }
  migrateOldScores()

  const currentLibrary = computed(() =>
    libraries.value.find(l => l.id === currentLibraryId.value)
  )

  function createLibrary(name, type = 'tech') {
    const id = 'lib_' + Date.now()
    const lib = { id, name, type, createdAt: Date.now() }
    libraries.value.push(lib)
    storage.saveLibraries(libraries.value)
    return lib
  }

  function removeLibrary(id) {
    libraries.value = libraries.value.filter(l => l.id !== id)
    storage.saveLibraries(libraries.value)
  }

  function setCurrentLibrary(id) {
    currentLibraryId.value = id
  }

  function getCards(libId) {
    return storage.getCards(libId || currentLibraryId.value)
  }

  function getAllCards() {
    return storage.getAllCards()
  }

  function addCardsToLibrary(libId, cards) {
    return storage.addCards(libId, cards)
  }

  function updateCardScore(libId, cardId, score) {
    storage.updateCardScore(libId, cardId, score)
  }

  function updateCard(libId, cardId, updates) {
    storage.updateCard(libId, cardId, updates)
  }

  function toggleFavorite(libId, cardId) {
    return storage.toggleFavorite(libId, cardId)
  }

  function getWrongCards(libId) {
    return storage.getWrongCards(libId)
  }

  function getAllWrongCards() {
    return storage.getAllWrongCards()
  }

  function getFavoriteCards(libId) {
    return storage.getFavoriteCards(libId)
  }

  function getAllFavoriteCards() {
    return storage.getAllFavoriteCards()
  }

  function getCardsByScore(libId, score) {
    return storage.getCards(libId).filter(c => c.score === score)
  }

  function getAllCardsByScore(score) {
    return storage.getAllCards().filter(c => c.score === score)
  }

  function getDueCards(libId) {
    return storage.getCards(libId)
      .filter(c => c.score < 2)
      .sort((a, b) => a.score - b.score || (a.reviewCount || 0) - (b.reviewCount || 0))
  }

  function getAllDueCards() {
    return storage.getAllCards()
      .filter(c => c.score < 2)
      .sort((a, b) => a.score - b.score || (a.reviewCount || 0) - (b.reviewCount || 0))
  }

  function getLibraryStats(libId) {
    const cards = storage.getCards(libId)
    return {
      total: cards.length,
      notLearned: cards.filter(c => c.score === 0).length,
      fuzzy: cards.filter(c => c.score === 1).length,
      learned: cards.filter(c => c.score >= 2).length
    }
  }

  function getAllStats() {
    let total = 0, notLearned = 0, fuzzy = 0, learned = 0
    for (const lib of libraries.value) {
      const s = getLibraryStats(lib.id)
      total += s.total
      notLearned += s.notLearned
      fuzzy += s.fuzzy
      learned += s.learned
    }
    return { total, notLearned, fuzzy, learned }
  }

  function getTodayLog() {
    return storage.getTodayLog()
  }

  function addStudyLog(date, count, duration) {
    storage.addStudyLog(date, count, duration)
  }

  function getStudyLogs() {
    return storage.getStudyLogs()
  }

  function getDailyGoal() {
    return storage.getDailyGoal()
  }

  function setDailyGoal(target) {
    storage.setDailyGoal(target)
  }

  function exportData() {
    return storage.exportData()
  }

  function importData(data) {
    storage.importData(data)
    libraries.value = storage.getLibraries()
  }

  return {
    libraries, currentLibraryId, currentLibrary,
    createLibrary, removeLibrary, setCurrentLibrary,
    getCards, getAllCards, addCardsToLibrary,
    updateCardScore, updateCard, toggleFavorite,
    getWrongCards, getAllWrongCards,
    getFavoriteCards, getAllFavoriteCards,
    getCardsByScore, getAllCardsByScore,
    getDueCards, getAllDueCards,
    getLibraryStats, getAllStats,
    getTodayLog, addStudyLog, getStudyLogs,
    getDailyGoal, setDailyGoal,
    exportData, importData
  }
})
