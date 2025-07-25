'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { ReplicateModelSchema } from '@/lib/replicate/realModelData'

interface CompactModelSelectorProps {
  selectedModel: ReplicateModelSchema | null
  availableModels: ReplicateModelSchema[]
  onModelSelect: (model: ReplicateModelSchema) => void
}

export function CompactModelSelector({ 
  selectedModel, 
  availableModels, 
  onModelSelect 
}: CompactModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleModelSelect = (model: ReplicateModelSchema) => {
    onModelSelect(model)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Modern AI Platform Model Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-left hover:bg-white/15 hover:border-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 group"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Professional Model Icon */}
          <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
            selectedModel?.category === 'video-generation'
              ? 'bg-gradient-to-br from-purple-500 to-pink-600'
              : selectedModel?.category === 'upscaling'
              ? 'bg-gradient-to-br from-green-500 to-teal-600'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            {selectedModel?.category === 'video-generation' ? '🎬' :
             selectedModel?.category === 'upscaling' ? '✨' : '🎨'}
          </div>

          {/* Clean Model Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {selectedModel?.name || 'Choose Model'}
            </div>
            {selectedModel?.provider && (
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {selectedModel.provider}
              </div>
            )}
          </div>
        </div>

        {/* Modern Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-all duration-200 group-hover:text-gray-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Modern AI Platform Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-50 max-h-72 overflow-y-auto overflow-x-hidden"
          >
            <div className="p-1.5">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-white/10 dark:hover:bg-gray-800/50 transition-all duration-150 text-left group"
                >
                  {/* Professional Model Icon */}
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 group-hover:scale-105 transition-transform duration-150 ${
                    model.category === 'video-generation'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                      : model.category === 'upscaling'
                      ? 'bg-gradient-to-br from-green-500 to-teal-600'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {model.category === 'video-generation' ? '🎬' :
                     model.category === 'upscaling' ? '✨' : '🎨'}
                  </div>

                  {/* Clean Model Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {model.name}
                      </span>
                      {model.id === selectedModel?.id && (
                        <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {model.provider} • {model.pricing?.costPerImage ? `$${model.pricing.costPerImage}/image` : 'Pricing varies'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
