// EncryptionPage.jsx - Main Encryption/Decryption Tool Page

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  Upload, Lock, Unlock, Key, Copy, RefreshCw,
  Download, Image as ImageIcon, CheckCircle, Loader2,
  Eye, EyeOff, Zap, Shield
} from 'lucide-react'
import { encryptImage, decryptImage, generateKey, checkKeyStrength } from '../services/api'

// ─── Drag & Drop Upload Zone ───────────────────────────────────────────────
function DropZone({ onFile, file, accept, hint, dropText, id = 'dropzone' }) {
  const resolvedAccept = accept ?? { 'image/png': [], 'image/jpeg': [], 'image/bmp': [] }
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: resolvedAccept,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  })

  return (
    <div
      {...getRootProps()}
      id={id}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-300
        ${isDragActive
          ? 'border-cyber-cyan bg-cyber-cyan/5 shadow-glow-cyan'
          : file
            ? 'border-cyber-green/40 bg-cyber-green/5'
            : 'border-cyber-border hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5'
        }`}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="space-y-2">
          <CheckCircle size={36} className="text-cyber-green mx-auto" />
          <p className="text-cyber-text font-medium">{file.name}</p>
          <p className="text-cyber-muted text-sm">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full border border-cyber-border flex items-center justify-center">
            <Upload size={24} className="text-cyber-muted" />
          </div>
          <p className="text-cyber-text font-medium">
            {isDragActive ? 'Drop the file here...' : (dropText ?? 'Drag & drop an image')}
          </p>
          <p className="text-cyber-muted text-sm">{hint ?? 'PNG, JPG, BMP · Max 50MB'}</p>
        </div>
      )}
    </div>
  )
}

// ─── Image Preview Panel ────────────────────────────────────────────────────
function PreviewPanel({ src, label, badge, badgeColor = 'cyan', placeholder }) {
  const colorMap = {
    cyan:   'text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/10',
    green:  'text-cyber-green border-cyber-green/30 bg-cyber-green/10',
    purple: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    muted:  'text-cyber-muted border-cyber-border bg-cyber-border/20',
  }
  return (
    <div className="space-y-2 min-w-0 w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-cyber-muted font-medium uppercase tracking-wider truncate">{label}</span>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full border font-mono shrink-0 whitespace-nowrap ${colorMap[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="image-preview-container w-full h-40 flex items-center justify-center">
        {src ? (
          <img src={src} alt={label} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-center text-cyber-muted p-4">
            <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">{placeholder || 'No image'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Progress Bar ───────────────────────────────────────────────────────────
function ProgressBar({ value, label }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-cyber-muted">
        <span>{label}</span>
        <span className="terminal-text">{value}%</span>
      </div>
      <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
        <div
          className="progress-bar-glow h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ─── Key Strength Meter ─────────────────────────────────────────────────────
function KeyStrengthBar({ score, label, color }) {
  const barColor = color === 'green' ? 'bg-cyber-green' : color === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
  const textColor = color === 'green' ? 'text-cyber-green' : color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-cyber-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-16 text-right ${textColor}`}>
        {label} ({score})
      </span>
    </div>
  )
}

// ─── Stats Grid ─────────────────────────────────────────────────────────────
function StatsGrid({ stats }) {
  if (!stats) return null
  const items = [
    { label: 'Encryption Time', value: `${stats.encryption_time_ms} ms` },
    { label: 'Original Size',   value: `${(stats.original_size_bytes / 1024).toFixed(1)} KB` },
    { label: 'Encrypted Size',  value: `${(stats.encrypted_size_bytes / 1024).toFixed(1)} KB` },
    stats.pixel_change_pct != null
      ? { label: 'Pixel Changed', value: `${stats.pixel_change_pct}%` }
      : { label: 'Key Size',      value: `${stats.key_size_bits} bits` },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-cyber-bg/60 border border-cyber-border rounded-lg p-3">
          <div className="text-xs text-cyber-muted">{label}</div>
          <div className="text-sm font-bold text-cyber-cyan terminal-text mt-0.5">{value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Encryption Page ────────────────────────────────────────────────────
function EncryptionPage() {
  // File state
  const [imageFile, setImageFile]             = useState(null)
  const [originalPreview, setOriginalPreview] = useState(null)
  // Encryption state
  const [algorithm, setAlgorithm] = useState('xor')
  const [key, setKey]             = useState('')
  const [showKey, setShowKey]     = useState(false)
  const [keyStrength, setKeyStrength] = useState(null)
  // Results
  const [encryptedPreview, setEncryptedPreview]   = useState(null)
  const [encryptedData, setEncryptedData]         = useState(null)
  const [decryptedPreview, setDecryptedPreview]   = useState(null)
  const [encryptStats, setEncryptStats]           = useState(null)
  const [decryptStats, setDecryptStats]           = useState(null)
  // Loading
  const [encrypting, setEncrypting] = useState(false)
  const [decrypting, setDecrypting] = useState(false)
  const [progress, setProgress]     = useState(0)
  // Log
  const [logs, setLogs] = useState([])

  const addLog = (msg, type = 'info') => {
    const colors = { info: 'text-cyber-cyan', success: 'text-cyber-green', error: 'text-red-400', warn: 'text-yellow-400' }
    setLogs(prev => [...prev.slice(-19), {
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      msg, color: colors[type] || 'text-cyber-muted'
    }])
  }

  // Handle file selection
  const handleFile = (file) => {
    setImageFile(file)
    setEncryptedPreview(null)
    setDecryptedPreview(null)
    setEncryptedData(null)
    setEncryptStats(null)
    setDecryptStats(null)
    setLogs([])
    const url = URL.createObjectURL(file)
    setOriginalPreview(url)
    addLog(`Image loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info')
  }

  // Generate random key
  const handleGenerateKey = async () => {
    try {
      const res = await generateKey(32)
      setKey(res.data.key)
      addLog('Secure random key generated (256-bit entropy)', 'success')
      toast.success('Key generated!')
      evalStrength(res.data.key)
    } catch {
      toast.error('Failed to generate key')
    }
  }

  // Copy key to clipboard
  const handleCopyKey = () => {
    if (!key) return
    navigator.clipboard.writeText(key)
    toast.success('Key copied!')
    addLog('Key copied to clipboard', 'info')
  }

  // Evaluate key strength (debounced on change)
  const evalStrength = async (k) => {
    if (!k || k.length < 2) { setKeyStrength(null); return }
    try {
      const res = await checkKeyStrength(k)
      setKeyStrength(res.data)
    } catch { /* silent */ }
  }

  // Encrypt
  const handleEncrypt = async () => {
    if (!imageFile) { toast.error('Please upload an image first'); return }
    if (!key)       { toast.error('Please enter an encryption key'); return }

    setEncrypting(true)
    setProgress(0)
    setEncryptedPreview(null)
    setDecryptedPreview(null)
    setEncryptStats(null)
    addLog(`Starting ${algorithm.toUpperCase()} encryption...`, 'info')

    try {
      // Simulate progress stages
      setProgress(20); addLog('Reading image data...', 'info')
      const res = await encryptImage(imageFile, algorithm, key, (pct) => {
        setProgress(20 + Math.round(pct * 0.5))
      })
      setProgress(80); addLog('Applying encryption algorithm...', 'info')
      await new Promise(r => setTimeout(r, 400))
      setProgress(100)

      setEncryptedPreview(res.data.encrypted_preview)
      setEncryptedData(res.data.encrypted_data)
      setEncryptStats(res.data.stats)
      addLog(`✓ Encryption complete — ${res.data.algorithm}`, 'success')
      addLog(`  Time: ${res.data.stats.encryption_time_ms}ms`, 'success')
      toast.success('Image encrypted successfully!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Encryption failed'
      addLog(`✗ Error: ${msg}`, 'error')
      toast.error(msg)
    } finally {
      setEncrypting(false)
    }
  }

  // Decrypt — uses the uploaded imageFile directly (it can be an already-encrypted file)
  const handleDecrypt = async () => {
    if (!imageFile) { toast.error('Please upload a file first'); return }
    if (!key)       { toast.error('Enter the decryption key'); return }

    setDecrypting(true)
    addLog(`Starting ${algorithm.toUpperCase()} decryption...`, 'info')

    try {
      addLog(`Source: ${imageFile.name}`, 'info')
      const res = await decryptImage(imageFile, algorithm, key)
      setDecryptedPreview(res.data.decrypted_image)
      setDecryptStats(res.data.stats)
      addLog(`✓ Decryption complete — ${res.data.stats.decryption_time_ms}ms`, 'success')
      toast.success('Image decrypted successfully!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Decryption failed (wrong key?)'
      addLog(`✗ Error: ${msg}`, 'error')
      toast.error(msg)
    } finally {
      setDecrypting(false)
    }
  }

  // Download helper
  const downloadFile = (dataUrl, filename) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    a.click()
  }

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyber-blue/20 border border-cyber-blue/30">
          <Lock size={20} className="text-cyber-cyan" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-cyber-text">Encrypt / Decrypt</h1>
          <p className="text-sm text-cyber-muted">Apply XOR or AES-256 encryption to your images</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">

        {/* ── LEFT PANEL: Controls ──────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Upload */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Upload size={14} className="text-cyber-cyan" /> Upload Image
            </h2>
            <DropZone onFile={handleFile} file={imageFile} />
          </div>

          {/* Algorithm Selector */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Shield size={14} className="text-cyber-cyan" /> Algorithm
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'xor', label: 'XOR', sub: 'Pixel-level · Fast', icon: Zap },
                { id: 'aes', label: 'AES-256', sub: 'CBC Mode · Secure', icon: Shield },
              ].map(({ id, label, sub, icon: Icon }) => (
                <button
                  key={id}
                  id={`algo-${id}`}
                  onClick={() => setAlgorithm(id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200
                    ${algorithm === id
                      ? 'border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan'
                      : 'border-cyber-border text-cyber-muted hover:border-cyber-border/80'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon size={14} />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  <div className="text-xs opacity-70">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Key Input */}
          <div className="glass-card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
              <Key size={14} className="text-cyber-cyan" /> Encryption Key
            </h2>

            <div className="relative">
              <input
                id="key-input"
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => { setKey(e.target.value); evalStrength(e.target.value) }}
                placeholder="Enter key / password..."
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2.5
                  text-cyber-text text-sm pr-10 font-mono
                  focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/20
                  placeholder-cyber-muted/50 transition-all"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-text"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Key Strength */}
            {keyStrength && (
              <KeyStrengthBar
                score={keyStrength.score}
                label={keyStrength.label}
                color={keyStrength.color}
              />
            )}

            {/* Key action buttons */}
            <div className="flex gap-2">
              <button
                id="generate-key-btn"
                onClick={handleGenerateKey}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                  border border-cyber-border text-cyber-muted text-xs font-medium
                  hover:border-cyber-cyan/40 hover:text-cyber-cyan transition-all"
              >
                <RefreshCw size={13} /> Auto-Generate
              </button>
              <button
                id="copy-key-btn"
                onClick={handleCopyKey}
                disabled={!key}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                  border border-cyber-border text-cyber-muted text-xs font-medium
                  hover:border-cyber-cyan/40 hover:text-cyber-cyan transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Copy size={13} /> Copy Key
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              id="encrypt-btn"
              onClick={handleEncrypt}
              disabled={encrypting || !imageFile || !key}
              className="w-full btn-cyber flex items-center justify-center gap-2 py-3
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {encrypting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {encrypting ? 'Encrypting...' : 'Encrypt Image'}
            </button>

            <button
              id="decrypt-btn"
              onClick={handleDecrypt}
              disabled={decrypting || !imageFile || !key}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg
                border border-cyber-green/30 text-cyber-green text-sm font-semibold
                hover:bg-cyber-green/10 transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {decrypting ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
              {decrypting ? 'Decrypting...' : 'Decrypt Image'}
            </button>
          </div>

          {/* Progress */}
          {encrypting && (
            <div className="glass-card p-4 space-y-2">
              <ProgressBar value={progress} label="Encryption progress" />
            </div>
          )}

          {/* Encryption Stats */}
          {encryptStats && (
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider">Encryption Stats</h3>
              <StatsGrid stats={encryptStats} />
              <button
                id="download-encrypted"
                onClick={() => downloadFile(encryptedData, `encrypted_${algorithm}.png`)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
                  border border-cyber-border text-cyber-muted text-xs
                  hover:border-cyber-cyan/30 hover:text-cyber-cyan transition-all"
              >
                <Download size={13} /> Download Encrypted File
              </button>
            </div>
          )}

          {/* Decryption Stats + Download */}
          {decryptStats && decryptedPreview && (
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-cyber-muted uppercase tracking-wider">Decryption Stats</h3>
              <div className="bg-cyber-bg/60 border border-cyber-border rounded-lg p-3">
                <div className="text-xs text-cyber-muted">Decryption Time</div>
                <div className="text-sm font-bold text-cyber-green terminal-text">{decryptStats.decryption_time_ms} ms</div>
              </div>
              <button
                id="download-decrypted"
                onClick={() => downloadFile(decryptedPreview, 'decrypted_image.png')}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
                  border border-cyber-green/30 text-cyber-green text-xs
                  hover:bg-cyber-green/10 transition-all"
              >
                <Download size={13} /> Download Decrypted Image
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Previews + Log ──────────────────────────────── */}
        <div className="space-y-5">

          {/* Image Previews */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-cyber-text mb-4">Image Previews</h2>
            <div className="grid md:grid-cols-3 gap-4 overflow-hidden">
              <PreviewPanel
                src={originalPreview}
                label="Original"
                badge="INPUT"
                badgeColor="muted"
                placeholder="Upload an image"
              />
              <PreviewPanel
                src={encryptedPreview}
                label="Encrypted Preview"
                badge={algorithm === 'aes' ? 'SIMULATED' : 'REAL XOR'}
                badgeColor={algorithm === 'aes' ? 'purple' : 'cyan'}
                placeholder="Encrypt to preview"
              />
              <PreviewPanel
                src={decryptedPreview}
                label="Decrypted Output"
                badge={decryptedPreview ? 'RESTORED' : undefined}
                badgeColor="green"
                placeholder="Decrypt to preview"
              />
            </div>

            {algorithm === 'aes' && encryptedPreview && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <Shield size={13} className="text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-300/80">
                  <strong>AES Steganography:</strong> The downloaded file is a valid image with the real AES-256 ciphertext hidden inside it. You can safely upload it later to decrypt.
                </p>
              </div>
            )}
          </div>

          {/* Terminal Log */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyber-green shadow-[0_0_6px_#10b981]" />
              Process Log
            </h2>
            <div className="bg-cyber-bg rounded-lg border border-cyber-border p-4 h-44 overflow-y-auto font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <span className="text-cyber-muted">Waiting for operation...</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`flex gap-2 ${log.color}`}>
                    <span className="text-cyber-muted opacity-60">[{log.time}]</span>
                    <span>{log.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EncryptionPage
