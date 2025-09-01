'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wand2 } from 'lucide-react'

/**
 * Simple Enhance Test Page
 * Isolated test of the enhance functionality
 */
export default function TestEnhancePage() {
  const [prompt, setPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`🧪 ${message}`)
  }

  const handleEnhance = async () => {
    if (!prompt.trim()) {
      addLog('❌ No prompt to enhance')
      return
    }

    addLog(`🔮 Starting enhance for: "${prompt.trim()}"`)
    setIsEnhancing(true)

    try {
      addLog('📡 Making API call...')
      const response = await fetch('/api/enhance-prompt-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      addLog(`📡 Response: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`)

      if (response.ok) {
        const result = await response.json()
        addLog(`📦 Response parsed: success=${result.success}`)

        if (result.success && result.data?.enhancedPrompt) {
          const enhanced = result.data.enhancedPrompt
          addLog(`✅ Enhancement successful: ${prompt.length} → ${enhanced.length} chars`)
          addLog(`🎯 Updating prompt state...`)
          
          setPrompt(enhanced)
          addLog(`✅ Prompt state updated successfully!`)
        } else {
          addLog('❌ Invalid response format')
          addLog(`Response: ${JSON.stringify(result, null, 2)}`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        addLog(`❌ API error: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      addLog(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsEnhancing(false)
      addLog('🏁 Enhance process completed')
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const testPrompts = [
    'a cat',
    'beautiful sunset',
    'portrait of a woman',
    'futuristic city'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              🧪 Enhance Functionality Test
            </CardTitle>
            <p className="text-center text-gray-400">
              Isolated test of the prompt enhancement feature
            </p>
          </CardHeader>
        </Card>

        {/* Main Test Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Prompt Input */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Input & Enhancement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter your prompt:
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter a prompt to enhance..."
                  className="min-h-[120px]"
                />
                <div className="text-sm text-gray-400 mt-1">
                  Characters: {prompt.length}
                </div>
              </div>

              {/* Enhance Button */}
              <Button
                onClick={handleEnhance}
                disabled={!prompt.trim() || isEnhancing}
                className="w-full"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}
              </Button>

              {/* Quick Test Buttons */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Quick Tests:</div>
                <div className="grid grid-cols-2 gap-2">
                  {testPrompts.map((testPrompt) => (
                    <Button
                      key={testPrompt}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(testPrompt)}
                      disabled={isEnhancing}
                    >
                      "{testPrompt}"
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Debug Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Debug Logs</CardTitle>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Clear Logs
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg p-4 h-[400px] overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-gray-500">
                    No logs yet. Click "Enhance Prompt" to see debug output.
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Panel */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {prompt.length}
                </div>
                <div className="text-sm text-gray-400">Current Length</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {isEnhancing ? '⏳' : '✅'}
                </div>
                <div className="text-sm text-gray-400">
                  {isEnhancing ? 'Processing' : 'Ready'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {logs.length}
                </div>
                <div className="text-sm text-gray-400">Debug Messages</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Enter a prompt in the textarea (or click a quick test button)</li>
              <li>Click "Enhance Prompt" to test the enhancement</li>
              <li>Watch the debug logs to see the exact flow</li>
              <li>Check if the prompt updates in the textarea</li>
              <li>Open browser console (F12) for additional debugging</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
