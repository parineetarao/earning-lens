export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2)
    .filter(t => !STOPWORDS.has(t))
}

const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of',
  'with','by','from','as','is','was','are','were','be','been',
  'have','has','had','do','does','did','will','would','could',
  'that','this','these','those','it','its','we','our','us',
  'you','they','their','he','she','i','my','not','no','so',
  'said','also','about','than','such','when','which','who','how',
  'all','any','more','over','after','before','during','into',
])

export function scoreSentence(sentence, questionTokens) {
  const sentenceTokens = tokenize(sentence.text || sentence)
  const sentenceSet = new Set(sentenceTokens)
  
  let score = 0
  
  for (const qToken of questionTokens) {
    if (sentenceSet.has(qToken)) {
      score += 2
    }
    for (const sToken of sentenceTokens) {
      if (sToken.includes(qToken) || qToken.includes(sToken)) {
        if (sToken !== qToken) score += 0.5
      }
    }
  }
  
  // Boost sentences that are negative (often contain concerns)
  if (sentence.sentiment === 'negative') score *= 1.2
  
  // Boost longer sentences (more content)
  const wordCount = sentenceTokens.length
  if (wordCount > 15) score *= 1.1
  
  return score
}

export function findRelevantSentences(sentences, question, topN = 15) {
  if (!sentences?.length || !question?.trim()) return []
  
  const questionTokens = tokenize(question)
  if (questionTokens.length === 0) return []
  
  const scored = sentences
    .map((sentence, originalIndex) => ({
      sentence,
      originalIndex,
      score: scoreSentence(sentence, questionTokens),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
  
  // Sort by original position for context
  return scored.sort((a, b) => a.originalIndex - b.originalIndex)
}
