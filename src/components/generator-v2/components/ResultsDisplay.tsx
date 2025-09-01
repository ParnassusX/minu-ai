/**
 * Results Display Component - Minu.AI Generator V2
 * Display generation results and history
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Trash2, ExternalLink } from 'lucide-react'
import { GenerationResult } from '../types/api'
import { formatDate, formatCost } from '../lib/utils'

interface ResultsDisplayProps {
  currentResult: GenerationResult | null
  history: GenerationResult[]
  onRemoveFromHistory: (resultId: string) => void
  onClearHistory: () => void
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  currentResult,
  history,
  onRemoveFromHistory,
  onClearHistory
}) => {
  const handleDownload = (result: GenerationResult) => {
    if (result.output?.urls?.[0]) {
      const link = document.createElement('a')
      link.href = result.output.urls[0]
      link.download = `minu-ai-${result.id}.${result.output.metadata.format}`
      link.click()
    }
  }
  
  const handleOpenInNewTab = (result: GenerationResult) => {
    if (result.output?.urls?.[0]) {
      window.open(result.output.urls[0], '_blank')
    }
  }
  
  const renderResult = (result: GenerationResult, isCurrent = false) => (
    <div className="border rounded-lg p-3 space-y-3">
      {/* Result Image/Video */}
      {result.output?.urls?.[0] && (
        <div className="relative group">
          {result.mode === 'video' ? (
            <video
              src={result.output.urls[0]}
              className="w-full h-32 object-cover rounded"
              controls
              muted
            />
          ) : (
            <img
              src={result.output.urls[0]}
              alt="Generated content"
              className="w-full h-32 object-cover rounded cursor-pointer"
              onClick={() => handleOpenInNewTab(result)}
            />
          )}

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDownload(result)}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleOpenInNewTab(result)}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Result Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
            {result.status}
          </Badge>
          {result.cost && (
            <span className="text-xs text-gray-500">
              {formatCost(result.cost)}
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600 line-clamp-2">
          {result.input?.prompt || result.prompt || 'No prompt available'}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(result.createdAt)}</span>
          {!isCurrent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFromHistory(result.id)}
              className="h-auto p-1"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
  
  return (
    <div className="space-y-4">
      {/* Current Result */}
      {currentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Result</CardTitle>
          </CardHeader>
          <CardContent>
            {renderResult(currentResult, true)}
          </CardContent>
        </Card>
      )}
      
      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Results</CardTitle>
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearHistory}
              >
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No previous results
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((result) => (
                <React.Fragment key={result.id}>
                  {renderResult(result)}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
