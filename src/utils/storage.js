const STORAGE_KEY = 'frontend-review-data'

export function loadData() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : null
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getLibraries() {
  const data = loadData()
  return data?.libraries || []
}

export function saveLibraries(libraries) {
  const data = loadData() || {}
  data.libraries = libraries
  saveData(data)
}

export function getCards(libraryId) {
  const data = loadData()
  return data?.cards?.[libraryId] || []
}

export function saveCards(libraryId, cards) {
  const data = loadData() || {}
  if (!data.cards) data.cards = {}
  data.cards[libraryId] = cards
  saveData(data)
}

export function addCards(libraryId, newCards) {
  const existingCards = getCards(libraryId)
  const existingIds = new Set(existingCards.map(c => c.id))
  const cardsToAdd = newCards.filter(c => !existingIds.has(c.id))
  saveCards(libraryId, [...existingCards, ...cardsToAdd])
  return cardsToAdd.length
}

export function getAllCards() {
  const data = loadData()
  if (!data?.cards) return []
  const allCards = []
  for (const [libraryId, cards] of Object.entries(data.cards)) {
    for (const card of cards) {
      allCards.push({ ...card, libraryId })
    }
  }
  return allCards
}

export function updateCardScore(libraryId, cardId, score) {
  const cards = getCards(libraryId)
  const card = cards.find(c => c.id === cardId)
  if (card) {
    card.score = score
    card.reviewCount = (card.reviewCount || 0) + 1
    card.lastReview = Date.now()
    saveCards(libraryId, cards)
  }
}

export function updateCard(libraryId, cardId, updates) {
  const cards = getCards(libraryId)
  const card = cards.find(c => c.id === cardId)
  if (card) {
    Object.assign(card, updates)
    saveCards(libraryId, cards)
  }
}

export function getWrongCards(libraryId) {
  return getCards(libraryId).filter(c => c.score < 2)
}

export function getAllWrongCards() {
  return getAllCards().filter(c => c.score < 2)
}

export function getFavoriteCards(libraryId) {
  return getCards(libraryId).filter(c => c.favorite)
}

export function getAllFavoriteCards() {
  return getAllCards().filter(c => c.favorite)
}

export function toggleFavorite(libraryId, cardId) {
  const cards = getCards(libraryId)
  const card = cards.find(c => c.id === cardId)
  if (card) {
    card.favorite = !card.favorite
    saveCards(libraryId, cards)
    return card.favorite
  }
  return false
}

export function getStudyLogs() {
  const data = loadData()
  return data?.studyLogs || []
}

export function addStudyLog(date, count, duration) {
  const data = loadData() || {}
  if (!data.studyLogs) data.studyLogs = []
  const existing = data.studyLogs.find(l => l.date === date)
  if (existing) {
    existing.count += count
    existing.duration += duration
  } else {
    data.studyLogs.push({ date, count, duration })
  }
  saveData(data)
}

export function getTodayLog() {
  const today = new Date().toISOString().slice(0, 10)
  const logs = getStudyLogs()
  return logs.find(l => l.date === today) || { date: today, count: 0, duration: 0 }
}

export function getDailyGoal() {
  const data = loadData()
  return data?.dailyGoal ?? 20
}

export function setDailyGoal(target) {
  const data = loadData() || {}
  data.dailyGoal = target
  saveData(data)
}

export function exportData() {
  return loadData()
}

export function importData(data) {
  saveData(data)
}
