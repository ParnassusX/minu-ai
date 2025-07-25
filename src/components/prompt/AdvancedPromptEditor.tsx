'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { GlassCard, GlassPanel } from '@/components/ui/glass'
import { Typography, Spacing } from '@/components/ui/typography'
import { toastHelpers } from '@/lib/hooks/useToast'
import { useDebounce } from '@/lib/hooks/usePerformance'
import { Suggestion } from '@/types/suggestion'
import { 
  Wand2, 
  Copy, 
  Save, 
  History, 
  Sparkles, 
  FileText, 
  Tag,
  Palette,
  Zap,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptVariable {
  name: string
  value: string
  type: 'text' | 'select' | 'number'
  options?: string[]
  placeholder?: string
}

interface PromptEditorProps {
  prompt: string
  onPromptChange: (prompt: string) => void
  onEnhance?: () => Promise<void>
  onSave?: (prompt: string, metadata: any) => Promise<void>
  isEnhancing?: boolean
  className?: string
  maxLength?: number
}

export function AdvancedPromptEditor({
  prompt,
  onPromptChange,
  onEnhance,
  onSave,
  isEnhancing = false,
  className,
  maxLength = 2000
}: PromptEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [variables, setVariables] = useState<PromptVariable[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [category, setCategory] = useState('General')
  const [notes, setNotes] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [syntaxHighlights, setSyntaxHighlights] = useState<Array<{start: number, end: number, type: string}>>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Drop zone for suggestions
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: 'prompt-drop-zone',
    data: {
      accepts: ['suggestion']
    }
  })

  const handleSuggestionDrop = useCallback((suggestion: Suggestion) => {
    const cursorPosition = textareaRef.current?.selectionStart || prompt.length
    const beforeCursor = prompt.slice(0, cursorPosition)
    const afterCursor = prompt.slice(cursorPosition)

    // Add suggestion text with proper spacing
    const suggestionText = suggestion.text
    const needsSpaceBefore = beforeCursor.length > 0 && !beforeCursor.endsWith(' ')
    const needsSpaceAfter = afterCursor.length > 0 && !afterCursor.startsWith(' ')

    const newPrompt = beforeCursor +
      (needsSpaceBefore ? ' ' : '') +
      suggestionText +
      (needsSpaceAfter ? ' ' : '') +
      afterCursor

    onPromptChange(newPrompt)
    toastHelpers.success('Added!', `"${suggestion.title}" added to prompt`)

    // Focus back to textarea and position cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = cursorPosition + suggestionText.length +
          (needsSpaceBefore ? 1 : 0) + (needsSpaceAfter ? 1 : 0)
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newPosition, newPosition)
      }
    }, 100)
  }, [prompt, onPromptChange])

  // Debounced syntax highlighting
  const debouncedSyntaxHighlight = useDebounce((text: string) => {
    const highlights = analyzeSyntax(text)
    setSyntaxHighlights(highlights)
  }, 300)

  // Update word count and syntax highlighting
  useEffect(() => {
    const words = prompt.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
    debouncedSyntaxHighlight(prompt)
    
    // Extract variables from prompt
    const variableMatches = prompt.match(/\{([^}]+)\}/g) || []
    const extractedVars = variableMatches.map(match => {
      const name = match.slice(1, -1)
      const existing = variables.find(v => v.name === name)
      return existing || {
        name,
        value: '',
        type: 'text' as const,
        placeholder: `Enter ${name}...`
      }
    })
    
    if (JSON.stringify(extractedVars) !== JSON.stringify(variables)) {
      setVariables(extractedVars)
    }
  }, [prompt, debouncedSyntaxHighlight])

  // Syntax analysis for highlighting
  const analyzeSyntax = (text: string) => {
    const highlights: Array<{start: number, end: number, type: string}> = []
    
    // Highlight variables {variable}
    const variableRegex = /\{([^}]+)\}/g
    let match
    while ((match = variableRegex.exec(text)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'variable'
      })
    }
    
    // Highlight style keywords
    const styleKeywords = ['photorealistic', 'artistic', 'cinematic', 'portrait', 'landscape', 'abstract', 'minimalist', 'vintage', 'modern']
    styleKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      while ((match = regex.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'style'
        })
      }
    })
    
    // Highlight technical terms
    const techTerms = ['4K', '8K', 'HDR', 'bokeh', 'depth of field', 'macro', 'wide angle', 'telephoto']
    techTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi')
      while ((match = regex.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'technical'
        })
      }
    })
    
    return highlights
  }

  // Process prompt with variables
  const processedPrompt = useCallback(() => {
    let processed = prompt
    variables.forEach(variable => {
      if (variable.value) {
        processed = processed.replace(
          new RegExp(`\\{${variable.name}\\}`, 'g'),
          variable.value
        )
      }
    })
    return processed
  }, [prompt, variables])

  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => prev.map(v => 
      v.name === name ? { ...v, value } : v
    ))
  }

  const handleCopy = async () => {
    const textToCopy = showPreview ? processedPrompt() : prompt
    await navigator.clipboard.writeText(textToCopy)
    toastHelpers.success('Copied!', 'Prompt copied to clipboard')
  }

  const handleSave = async () => {
    if (!onSave) return
    
    const metadata = {
      variables,
      tags,
      category,
      notes,
      wordCount,
      processedPrompt: processedPrompt()
    }
    
    await onSave(prompt, metadata)
    toastHelpers.success('Saved!', 'Prompt saved successfully')
  }

  const handleEnhance = async () => {
    if (!onEnhance) return
    await onEnhance()
  }

  const handleReset = () => {
    onPromptChange('')
    setVariables([])
    setTags([])
    setNotes('')
    setCategory('General')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          try {
            const data = JSON.parse(content)
            onPromptChange(data.prompt || content)
            if (data.variables) setVariables(data.variables)
            if (data.tags) setTags(data.tags)
            if (data.category) setCategory(data.category)
            if (data.notes) setNotes(data.notes)
          } catch {
            onPromptChange(content)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExport = () => {
    const data = {
      prompt,
      variables,
      tags,
      category,
      notes,
      processedPrompt: processedPrompt(),
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const progressPercentage = Math.min((prompt.length / maxLength) * 100, 100)
  const isNearLimit = progressPercentage > 80

  return (
    <GlassCard variant="premium" className={cn("overflow-hidden shadow-glass-xl", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/20">
              <Wand2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <Typography variant="h4" color="high-contrast">
                Advanced Prompt Editor
              </Typography>
              <Typography variant="body-sm" color="muted">
                {wordCount} words • {prompt.length}/{maxLength} characters
              </Typography>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Editor */}
        <div className="relative">
          <div
            ref={setDropRef}
            className={cn(
              "relative border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200",
              "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
              isFocused && "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20",
              isEnhancing && "bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80",
              isOver && "border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/20 bg-purple-50/80 dark:bg-purple-900/20"
            )}
          >
            {/* Drop Zone Indicator */}
            {isOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-purple-100/80 dark:bg-purple-900/40 rounded-xl z-10 pointer-events-none">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                  <Sparkles className="h-5 w-5" />
                  Drop suggestion here to add to prompt
                </div>
              </div>
            )}

            {!showPreview ? (
              <Textarea
                ref={textareaRef}
                placeholder="Describe your image in detail... Use {variables} for dynamic content. Drag suggestions here!"
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={6}
                maxLength={maxLength}
                className={cn(
                  "resize-none border-0 bg-transparent p-4 text-base leading-relaxed",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  "focus:ring-0 focus:outline-none",
                  isOver && "opacity-50"
                )}
              />
            ) : (
              <div
                ref={previewRef}
                className="p-4 min-h-[150px] text-base leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                {processedPrompt() || (
                  <span className="text-gray-400 dark:text-gray-500">
                    Preview will appear here...
                  </span>
                )}
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  isNearLimit ? "bg-red-500" : "bg-indigo-500"
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Variables Section */}
        {variables.length > 0 && (
          <GlassPanel variant="subtle" className="p-4 space-y-3">
            <Typography variant="h6" color="medium-contrast">
              Variables ({variables.length})
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {variables.map((variable) => (
                <div key={variable.name} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {variable.name}
                  </label>
                  <input
                    type="text"
                    placeholder={variable.placeholder}
                    value={variable.value}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleEnhance}
            disabled={!prompt.trim() || isEnhancing}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            {isEnhancing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Enhance
              </>
            )}
          </Button>
          
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          
          <Button
            onClick={handleSave}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button
            onClick={handleImport}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          
          <Button
            onClick={handleExport}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardContent>
    </GlassCard>
  )
}
