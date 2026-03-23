import { diseases } from '../data/diseases.js'

/**
 * Mock AI analyzer — deterministically picks a disease based on filename hash.
 * In production, replace with a real ML model API call.
 */
export function analyzeImage(filename) {
  // Simple hash of filename to deterministically pick a disease
  let hash = 0
  for (let i = 0; i < filename.length; i++) {
    hash = (hash * 31 + filename.charCodeAt(i)) % diseases.length
  }
  const disease = diseases[Math.abs(hash) % diseases.length]
  const confidence = Math.floor(75 + Math.random() * 20) // 75-95%
  return { disease, confidence }
}
