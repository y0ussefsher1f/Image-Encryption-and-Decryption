// TopBar.jsx - Top navigation bar
// Shows current page title, status indicator, and hamburger menu.

import React from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Clock } from 'lucide-react'

// Map routes to page titles
const pageTitles = {
  '/':          { title: 'Dashboard', subtitle: 'System Overview' },
  '/encrypt':   { title: 'Encrypt / Decrypt', subtitle: 'Image Cryptography Tools' },
  '/analytics': { title: 'Analytics', subtitle: 'Benchmark & Performance' },
}

function TopBar({ onMenuClick }) {
  const { pathname } = useLocation()
  const page = pageTitles[pathname] || { title: 'CipherLens', subtitle: '' }

  // Live clock
  const [time, setTime] = React.useState(new Date())
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-3
      bg-cyber-surface/80 backdrop-blur-sm
      border-b border-cyber-border shrink-0">

      {/* Left: hamburger + page title */}
      <div className="flex items-center gap-4">
        <button
          id="hamburger-menu"
          onClick={onMenuClick}
          className="p-2 rounded-lg text-cyber-muted hover:text-cyber-cyan
            hover:bg-cyber-border/40 transition-all duration-200"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 className="text-base font-semibold text-cyber-text leading-tight">{page.title}</h2>
          <p className="text-xs text-cyber-muted leading-tight">{page.subtitle}</p>
        </div>
      </div>

      {/* Right: status + clock */}
      <div className="flex items-center gap-5">

        {/* Live clock */}
        <div className="flex items-center gap-2 text-xs text-cyber-muted terminal-text">
          <Clock size={13} />
          <span>
            {time.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>
    </header>
  )
}

export default TopBar
