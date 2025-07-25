'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Settings, Zap, Sliders } from 'lucide-react'
import { ModelParameter } from '@/lib/replicate/realModelData'
import { validateParameter } from '@/lib/utils/parameterValidation'
import { cn } from '@/lib/utils'

interface ProgressiveParameterControlsProps {
  basicParams: ModelParameter[]
  intermediateParams: ModelParameter[]
  advancedParams: ModelParameter[]
  values: Record<string, any>
  onChange: (paramName: string, value: any) => void
  className?: string
}

export function ProgressiveParameterControls({
  basicParams,
  intermediateParams,
  advancedParams,
  values,
  onChange,
  className = ''
}: ProgressiveParameterControlsProps) {
  const [showIntermediate, setShowIntermediate] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Memoized parameter validation function to prevent unnecessary re-renders
  const validateParameterValue = useCallback((param: ModelParameter, value: any): boolean => {
    try {
      const validation = validateParameter(param, value, { strict: false })
      return !validation.isValid
    } catch (error) {
      console.warn('Parameter validation error:', error)
      return false
    }
  }, [])

  const renderParameterControl = useCallback((param: ModelParameter) => {
    const value = values[param.name] ?? param.default
    const hasError = validateParameterValue(param, value)

    switch (param.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(param.name, e.target.value)}
            className={cn(
              "w-full px-3 py-2 bg-white/10 backdrop-blur-md border rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 min-h-[40px]",
              hasError
                ? "border-red-500 focus:ring-red-500"
                : "border-white/20 focus:ring-blue-500"
            )}
          >
            {param.options?.map((option) => (
              <option key={option} value={option} className="bg-gray-800 text-white">
                {option}
              </option>
            ))}
          </select>
        )

      case 'number':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={param.min || 0}
              max={param.max || 100}
              step={param.step || 1}
              value={value || param.default || 0}
              onChange={(e) => onChange(param.name, parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{param.min || 0}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{value || param.default}</span>
              <span>{param.max || 100}</span>
            </div>
          </div>
        )

      case 'integer':
        return (
          <input
            type="number"
            min={param.min}
            max={param.max}
            step={1}
            value={value || param.default || ''}
            onChange={(e) => onChange(param.name, parseInt(e.target.value) || param.default)}
            className="w-full px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[40px]"
            placeholder={param.default?.toString() || ''}
          />
        )

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value ?? param.default ?? false}
              onChange={(e) => onChange(param.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {param.description}
            </span>
          </label>
        )

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(param.name, e.target.value)}
            className="w-full px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[40px]"
            placeholder={param.description}
          />
        )
    }
  }, [values, onChange, validateParameterValue])

  const ParameterSection = ({ 
    title, 
    icon: Icon, 
    params, 
    isVisible, 
    onToggle, 
    level = 'basic' 
  }: {
    title: string
    icon: React.ComponentType<any>
    params: ModelParameter[]
    isVisible: boolean
    onToggle: () => void
    level?: 'basic' | 'intermediate' | 'advanced'
  }) => {
    if (params.length === 0) return null

    const colorClasses = {
      basic: 'text-blue-500 border-blue-500/20 bg-blue-500/10',
      intermediate: 'text-orange-500 border-orange-500/20 bg-orange-500/10',
      advanced: 'text-red-500 border-red-500/20 bg-red-500/10'
    }

    return (
      <div className="space-y-2">
        {level !== 'basic' && (
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg border transition-all duration-200 hover:bg-opacity-20 hover:border-opacity-40 group",
              colorClasses[level]
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{title}</span>
                <span className="text-xs opacity-70">({params.length} parameters)</span>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-all duration-200 group-hover:scale-110",
                isVisible && "rotate-180"
              )}
            />
          </button>
        )}

        <AnimatePresence>
          {(level === 'basic' || isVisible) && (
            <motion.div
              initial={level !== 'basic' ? { opacity: 0, height: 0 } : false}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {params.map((param) => (
                <div key={param.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {param.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    {param.required && (
                      <span className="text-xs text-red-500 font-medium">Required</span>
                    )}
                  </div>
                  {renderParameterControl(param)}
                  {param.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Basic Parameters - Always Visible */}
      <ParameterSection
        title="Basic"
        icon={Zap}
        params={basicParams}
        isVisible={true}
        onToggle={() => {}}
        level="basic"
      />

      {/* Modern AI Platform Grid for Advanced Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Intermediate Parameters - Collapsible */}
        <ParameterSection
          title="Intermediate"
          icon={Settings}
          params={intermediateParams}
          isVisible={showIntermediate}
          onToggle={() => setShowIntermediate(!showIntermediate)}
          level="intermediate"
        />

        {/* Advanced Parameters - Collapsible */}
        <ParameterSection
          title="Advanced"
          icon={Sliders}
          params={advancedParams}
          isVisible={showAdvanced}
          onToggle={() => setShowAdvanced(!showAdvanced)}
          level="advanced"
        />
      </div>
    </div>
  )
}

// CSS for custom slider styling
const sliderStyles = `
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = sliderStyles
  document.head.appendChild(styleSheet)
}
