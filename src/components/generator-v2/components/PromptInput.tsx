/**
 * Prompt Input Component - Minu.AI Generator V2
 * Enhanced prompt input with suggestions and validation
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wand2, Lightbulb, Plus, X } from 'lucide-react'
import { cn } from '../lib/utils'

interface PromptInputProps {
  prompt: string
  onPromptChange: (prompt: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

// Sample prompt suggestions (in a real app, these would come from an API)
const PROMPT_SUGGESTIONS = {
  style: [
    'photorealistic',
    'digital art',
    'oil painting',
    'watercolor',
    'sketch',
    'anime style',
    'cinematic',
    'minimalist'
  ],
  quality: [
    'high quality',
    '4K resolution',
    'ultra detailed',
    'sharp focus',
    'professional photography',
    'studio lighting',
    'masterpiece'
  ],
  mood: [
    'dramatic lighting',
    'soft lighting',
    'golden hour',
    'moody atmosphere',
    'vibrant colors',
    'muted tones',
    'ethereal',
    'mysterious'
  ],
  composition: [
    'close-up portrait',
    'wide angle shot',
    'bird\'s eye view',
    'macro photography',
    'symmetrical composition',
    'rule of thirds',
    'depth of field'
  ]
}

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  onPromptChange,
  disabled = false,
  placeholder = 'Enter your prompt...',
  className
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PROMPT_SUGGESTIONS>('style')
  const [forceUpdateKey, setForceUpdateKey] = useState(0)
  
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onPromptChange(e.target.value)
  }, [onPromptChange])
  
  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim() || disabled) {
      console.log('🔮 Enhance blocked:', { promptEmpty: !prompt.trim(), disabled })
      return
    }

    console.log('🔮 Starting enhance process:', { originalPrompt: prompt.trim() })
    setIsEnhancing(true)

    try {
      const response = await fetch('/api/enhance-prompt-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      console.log('🔮 API response received:', { status: response.status, ok: response.ok })

      if (response.ok) {
        const result = await response.json()
        console.log('🔮 Response parsed:', { success: result.success, hasData: !!result.data, hasEnhanced: !!result.data?.enhancedPrompt })

        if (result.success && result.data?.enhancedPrompt) {
          const enhancedPrompt = result.data.enhancedPrompt
          console.log('🔮 Calling onPromptChange:', {
            original: prompt.trim(),
            enhanced: enhancedPrompt,
            lengthChange: `${prompt.length} → ${enhancedPrompt.length}`
          })

          // Force state update with React's flushSync for immediate UI update
          try {
            onPromptChange(enhancedPrompt)
            console.log('🔮 onPromptChange called successfully')

            // Force component re-render to ensure textarea updates
            setForceUpdateKey(prev => prev + 1)

            // Additional verification - check if the change took effect
            setTimeout(() => {
              console.log('🔮 Post-update verification: prompt should now be enhanced')
            }, 100)
          } catch (stateError) {
            console.error('🔮 State update error:', stateError)
          }
        } else {
          console.error('🔮 Invalid response format:', result)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('🔮 API error:', errorData)
      }
    } catch (error) {
      console.error('🔮 Network error:', error)
    } finally {
      setIsEnhancing(false)
      console.log('🔮 Enhance process completed')
    }
  }, [prompt, onPromptChange, disabled])
  
  const handleAddSuggestion = useCallback((suggestion: string) => {
    const currentPrompt = prompt.trim()
    const newPrompt = currentPrompt 
      ? `${currentPrompt}, ${suggestion}`
      : suggestion
    onPromptChange(newPrompt)
  }, [prompt, onPromptChange])
  
  const handleClearPrompt = useCallback(() => {
    onPromptChange('')
  }, [onPromptChange])
  
  const characterCount = prompt.length
  const maxCharacters = 1000
  const isNearLimit = characterCount > maxCharacters * 0.8
  const isOverLimit = characterCount > maxCharacters
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Prompt Input */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Prompt</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
                disabled={disabled}
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Suggestions
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnhancePrompt}
                disabled={disabled || !prompt.trim() || isEnhancing}
              >
                <Wand2 className="w-4 h-4 mr-1" />
                {isEnhancing ? 'Enhancing...' : 'Enhance'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="relative">
            <Textarea
              key={forceUpdateKey}
              value={prompt}
              onChange={handlePromptChange}
              placeholder={placeholder}
              disabled={disabled}
              data-testid="prompt-input"
              className={cn(
                'min-h-[160px] max-h-[300px] resize-y',
                'text-base leading-relaxed',
                'focus:ring-2 focus:ring-blue-500/20',
                isOverLimit && 'border-red-500 focus:border-red-500'
              )}
            />
            
            {prompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearPrompt}
                className="absolute top-2 right-2 h-6 w-6 p-0"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Character Count */}
          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-500">
              {prompt.trim() ? `${prompt.trim().split(/\s+/).length} words` : '0 words'}
            </div>
            <div className={cn(
              'text-gray-500',
              isNearLimit && 'text-yellow-600',
              isOverLimit && 'text-red-600'
            )}>
              {characterCount}/{maxCharacters}
            </div>
          </div>
          
          {isOverLimit && (
            <div className="text-sm text-red-600">
              Prompt is too long. Please reduce to {maxCharacters} characters or less.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Prompt Suggestions */}
      {showSuggestions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Prompt Suggestions</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(PROMPT_SUGGESTIONS).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category as keyof typeof PROMPT_SUGGESTIONS)}
                  className="capitalize"
                  disabled={disabled}
                >
                  {category}
                </Button>
              ))}
            </div>
            
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS[selectedCategory].map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => !disabled && handleAddSuggestion(suggestion)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {suggestion}
                </Badge>
              ))}
            </div>
            
            <div className="text-xs text-gray-500">
              Click on any suggestion to add it to your prompt
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
