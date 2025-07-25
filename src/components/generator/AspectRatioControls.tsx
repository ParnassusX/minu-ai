'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface AspectRatioControlsProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', icon: '⬜' },
  { label: '4:3', value: '4:3', icon: '▭' },
  { label: '3:4', value: '3:4', icon: '▯' },
  { label: '16:9', value: '16:9', icon: '▬' },
  { label: '9:16', value: '9:16', icon: '▮' },
  { label: '3:2', value: '3:2', icon: '▭' },
  { label: '2:3', value: '2:3', icon: '▯' }
]

export function AspectRatioControls({ value, onChange, className = '' }: AspectRatioControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedRatio = ASPECT_RATIOS.find(r => r.value === value) || ASPECT_RATIOS[0]
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Compact Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/20 transition-all duration-200 min-w-[80px]"
      >
        <span className="text-base">{selectedRatio.icon}</span>
        <span className="text-xs">{selectedRatio.label}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-xs ml-1"
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/20 rounded-lg shadow-lg z-50 min-w-[120px]">
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = value === ratio.value

            return (
              <button
                key={ratio.value}
                onClick={() => {
                  onChange(ratio.value)
                  setIsOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-blue-500/10
                  ${isSelected
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <span className="text-base">{ratio.icon}</span>
                <span className="text-xs font-medium">{ratio.label}</span>
                {isSelected && <span className="ml-auto text-blue-500">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
