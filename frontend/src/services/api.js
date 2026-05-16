// api.js - Centralized API Service
// All backend communication goes through this file.
// Uses axios with a base URL pointing to the FastAPI backend.

import axios from 'axios'

// Create an axios instance with shared configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',  // FastAPI backend URL
  timeout: 60000,                     // 60 second timeout (images can be large)
})

// ─── Encryption API ───────────────────────────────────────────────────────────

/**
 * Encrypt an image file.
 * @param {File} file - The image file to encrypt
 * @param {'xor'|'aes'} algorithm - Encryption algorithm
 * @param {string} key - Encryption key/password
 * @param {Function} onProgress - Optional upload progress callback
 * @returns {Promise} API response with encrypted data and stats
 */
export const encryptImage = (file, algorithm, key, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('algorithm', algorithm)
  formData.append('key', key)

  return api.post('/api/encryption/encrypt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) {
        const pct = Math.round((e.loaded * 100) / e.total)
        onProgress(pct)
      }
    },
  })
}

/**
 * Decrypt an encrypted file.
 * @param {File} file - The encrypted file
 * @param {'xor'|'aes'} algorithm - Decryption algorithm
 * @param {string} key - Decryption key/password
 * @returns {Promise} API response with decrypted image
 */
export const decryptImage = (file, algorithm, key) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('algorithm', algorithm)
  formData.append('key', key)

  return api.post('/api/encryption/decrypt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Generate a secure random key.
 * @param {number} length - Key length (default 32)
 * @returns {Promise} API response with generated key
 */
export const generateKey = (length = 32) => {
  return api.get(`/api/encryption/generate-key?length=${length}`)
}

/**
 * Check the strength of a key.
 * @param {string} key - Key to evaluate
 * @returns {Promise} API response with strength score
 */
export const checkKeyStrength = (key) => {
  const formData = new FormData()
  formData.append('key', key)
  return api.post('/api/encryption/key-strength', formData)
}

// ─── Analytics API ────────────────────────────────────────────────────────────

/**
 * Run benchmark — encrypt the same image with both XOR and AES, compare.
 * @param {File} file - Image file to benchmark with
 * @param {string} key - Key to use for both algorithms
 * @returns {Promise} Benchmark results for both algorithms
 */
export const runBenchmark = (file, key) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('key', key)

  return api.post('/api/analytics/benchmark', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Get algorithm info cards (for Dashboard and Analytics).
 * @returns {Promise} Algorithm descriptions and details
 */
export const getAlgorithmInfo = () => {
  return api.get('/api/analytics/algorithms')
}

/**
 * Check backend health.
 */
export const checkHealth = () => api.get('/api/health')

export default api
