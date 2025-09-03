/**
 * Generator Component - Minu.AI Generator V2
 * Main generator interface with stable error handling and testing compatibility
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react'
import { useGenerator } from '../hooks/useGenerator'
import { GenerationMode } from '../types/models'
import { cn } from '../lib/utils'
import { ModelSelector } from './ModelSelector'
import { PromptInput } from './PromptInput'
import { ParameterControls } from './ParameterControls'
import { ResultsDisplay } from './ResultsDisplay'

interface GeneratorProps {
  initialMode?: GenerationMode
  className?: string
}

export const Generator: React.FC<GeneratorProps> = ({ 
  initialMode = 'images',
  className 
}) => {
  const { state, actions, utils } = useGenerator(initialMode)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState<number>(0)
  
  // Update cost estimate when parameters change
  useEffect(() => {
    const updateCost = async () => {
      try {
        const cost = await utils.estimateCost()
        setEstimatedCost(cost)
      } catch (error) {
        console.warn('Failed to estimate cost:', error)
      }
    }
    
    if (state.selectedModel) {
      updateCost()
    }
  }, [state.selectedModel, state.parameters, utils])
  
  // Handle generation
  const handleGenerate = useCallback(async () => {
    try {
      await actions.generate()
    } catch (error: any) {
      console.error('Generation failed:', error)
      // Error is handled by the hook and stored in state.error
    }
  }, [actions])
  
  // Handle mode change
  const handleModeChange = useCallback((newMode: GenerationMode) => {
    actions.setMode(newMode)
  }, [actions])
  
  // Validate current input
  const validationErrors = utils.validateInput()
  const hasErrors = validationErrors.length > 0
  const canGenerate = Boolean(
    !hasErrors &&
    !state.isGenerating &&
    !!state.selectedModel &&
    state.prompt.trim().length > 0
  )

  // Debug logging for validation state
  useEffect(() => {
    console.log('🎯 Generator validation state:', {
      prompt: state.prompt,
      promptLength: state.prompt.length,
      promptTrimmed: state.prompt.trim(),
      selectedModel: state.selectedModel?.name || 'None',
      selectedModelId: state.selectedModel?.id || 'None',
      isGenerating: state.isGenerating,
      validationErrors: validationErrors.map(e => e.message),
      hasErrors,
      canGenerate
    })
  }, [state.prompt, state.selectedModel, state.isGenerating, validationErrors, hasErrors, canGenerate])
  
  return (
    <div className={cn(
      'w-full h-full min-h-screen p-4 space-y-6',
      'bg-gradient-to-br from-slate-50/50 via-blue-50/20 to-indigo-50/30',
      'dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50',
      className
    )} data-testid="generator-v2">
      {/* Header with Mode Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Minu.AI Generator V2
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stable, reliable AI content generation
          </p>
        </div>
        
        {/* Mode Selection */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1" data-testid="mode-selector">
          {(['images', 'video', 'enhance'] as GenerationMode[]).map((mode) => (
            <Button
              key={mode}
              variant={state.mode === mode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange(mode)}
              className="capitalize"
              disabled={state.isGenerating}
              data-testid={`mode-${mode}`}
            >
              {mode}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {state.error}
            <Button
              variant="ghost"
              size="sm"
              onClick={actions.clearError}
              className="ml-2 h-auto p-1"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Warnings Display */}
      {state.warnings.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {state.warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={actions.clearWarnings}
              className="ml-2 h-auto p-1"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Model & Settings */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Model & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model Selection */}
              <ModelSelector
                models={state.availableModels}
                selectedModel={state.selectedModel}
                onModelSelect={actions.selectModel}
                disabled={state.isGenerating}
              />
              
              {/* Cost Estimate */}
              {state.selectedModel && estimatedCost > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated cost: ${estimatedCost.toFixed(3)}
                </div>
              )}
              
              {/* Advanced Parameters Toggle */}
              {state.selectedModel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                  disabled={state.isGenerating}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Parameter Controls */}
          {state.selectedModel && (
            <ParameterControls
              model={state.selectedModel}
              parameters={state.parameters}
              onParameterChange={actions.setParameter}
              showAdvanced={showAdvanced}
              disabled={state.isGenerating}
              uploadedImages={state.uploadedImages}
              onImageUpload={actions.uploadImage}
              onImageRemove={actions.removeImage}
            />
          )}
        </div>
        
        {/* Center Panel - Prompt & Generation */}
        <div className="lg:col-span-6 space-y-4">
          {/* Prompt Input */}
          <PromptInput
            prompt={state.prompt}
            onPromptChange={actions.setPrompt}
            disabled={state.isGenerating}
            placeholder={`Enter your ${state.mode} prompt...`}
          />

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 p-2 bg-gray-800 rounded">
              Debug: Current prompt length = {state.prompt.length} chars
            </div>
          )}
          
          {/* Generation Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="flex-1 h-12"
              size="lg"
              data-testid="generate-button"
            >
              {state.isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate ${state.mode === 'images' ? 'Image' : state.mode === 'video' ? 'Video' : 'Enhanced Image'}`
              )}
            </Button>
            
            {state.isGenerating && (
              <Button
                variant="outline"
                onClick={actions.cancelGeneration}
                className="h-12"
              >
                Cancel
              </Button>
            )}
          </div>
          
          {/* Validation Errors */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cannot Generate</AlertTitle>
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={`error-${index}`}>
                      <strong>{error.code}:</strong> {error.message}
                      {error.field && <span className="text-xs"> (Field: {error.field})</span>}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Debug Info for Validation */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 p-2 bg-gray-800 rounded space-y-1">
              <div>🔍 Debug Validation:</div>
              <div>• Prompt: "{state.prompt}" (length: {state.prompt.length})</div>
              <div>• Model: {state.selectedModel?.name || 'None selected'}</div>
              <div>• Errors: {validationErrors.length}</div>
              <div>• Can Generate: {canGenerate ? 'Yes' : 'No'}</div>
              <div>• Is Generating: {state.isGenerating ? 'Yes' : 'No'}</div>
            </div>
          )}
          
          {/* Current Generation Status */}
          {state.currentGeneration && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {state.currentGeneration.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  )}
                  <span className="font-medium capitalize">
                    {state.currentGeneration.status}
                  </span>
                  {state.currentGeneration.progress && (
                    <span className="text-sm text-gray-600">
                      ({Math.round(state.currentGeneration.progress)}%)
                    </span>
                  )}
                </div>
                
                {state.currentGeneration.estimatedTime && (
                  <div className="text-sm text-gray-600 mt-1">
                    Estimated time: {Math.round(state.currentGeneration.estimatedTime)}s
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right Panel - Results & History */}
        <div className="lg:col-span-3">
          <ResultsDisplay
            currentResult={state.currentGeneration}
            history={state.generationHistory}
            onRemoveFromHistory={actions.removeFromHistory}
            onClearHistory={actions.clearHistory}
          />
        </div>
      </div>
      
      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}
    </div>
  )
}
