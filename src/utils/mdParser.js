import { detectTags, generateId } from './tags'

export function parseMarkdown(mdContent, libraryType = 'tech') {
  const lines = mdContent.split('\n')
  const cards = []
  let currentQuestion = null
  let currentAnswerLines = []

  function flushCard() {
    if (currentQuestion) {
      const answer = currentAnswerLines
        .filter(l => l.trim())
        .join('\n')
        .trim()
      const tags = libraryType === 'tech'
        ? detectTags(currentQuestion + ' ' + answer)
        : detectTags(currentQuestion + ' ' + answer)
      cards.push({
        id: generateId(currentQuestion),
        question: currentQuestion.trim(),
        answer: answer || '',
        tags,
        score: 0,
        reviewCount: 0,
        lastReview: null,
        favorite: false
      })
    }
    currentQuestion = null
    currentAnswerLines = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('![') || trimmed.startsWith('```')) {
      if (trimmed.startsWith('```')) {
        const codeLine = []
        i++
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLine.push(lines[i])
          i++
        }
        if (currentQuestion) {
          currentAnswerLines.push('```\n' + codeLine.join('\n') + '\n```')
        }
      }
      continue
    }

    const topMatch = trimmed.match(/^(\d+)[.、]\s*(.+)/)
    if (topMatch && !trimmed.match(/^(\d+)[.、]\s+[-*]\s/) && !trimmed.match(/^(\d+)[.、]\s+\d+[.、]/)) {
      const potentialQuestion = topMatch[2].trim()
      const hasQuestionMark = potentialQuestion.includes('？') || potentialQuestion.includes('?')
      const isIndentedAsAnswer = line.match(/^\s{2,}/)

      if (hasQuestionMark || !isIndentedAsAnswer) {
        flushCard()

        if (hasQuestionMark) {
          const qIdx = potentialQuestion.indexOf('？') !== -1
            ? potentialQuestion.indexOf('？')
            : potentialQuestion.indexOf('?')
          const afterQuestion = potentialQuestion.substring(qIdx + 1).trim()
          if (afterQuestion.length > 0) {
            currentQuestion = potentialQuestion.substring(0, qIdx + 1).trim()
            currentAnswerLines.push(afterQuestion)
          } else {
            currentQuestion = potentialQuestion
          }
        } else {
          currentQuestion = potentialQuestion
        }
        continue
      }
    }

    if (currentQuestion) {
      const bulletMatch = trimmed.match(/^[-*]\s+(.+)/)
      const subNumMatch = trimmed.match(/^(\d+)[.、]\s+(.+)/)

      if (bulletMatch) {
        currentAnswerLines.push('- ' + bulletMatch[1])
      } else if (subNumMatch) {
        currentAnswerLines.push(subNumMatch[1] + '. ' + subNumMatch[2])
      } else if (trimmed.match(/^#{1,3}\s/)) {
        continue
      } else {
        currentAnswerLines.push(trimmed)
      }
    }
  }

  flushCard()
  return cards
}

export function parseMultipleMarkdown(files) {
  const allCards = []
  for (const file of files) {
    const cards = parseMarkdown(file.content, file.type || 'tech')
    allCards.push(...cards)
  }
  return allCards
}
