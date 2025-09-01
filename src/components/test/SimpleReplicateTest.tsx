'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MODELS = {
  'flux-schnell': 'FLUX Schnell (Fast)',
  'flux-dev': 'FLUX Dev (Balanced)', 
  'flux-pro': 'FLUX Pro (High Quality)',
  'flux-kontext-max': 'FLUX Kontext Max (Premium)',
  'seedream-3': 'Seedream 3 (2K Native)',
}

export function SimpleReplicateTest() {
  const [prompt, setPrompt] = useState('a beautiful sunset over mountains')
  const [modelId, setModelId] = useState('flux-schnell')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testAPI = async () => {
    try {
      const response = await fetch('/api/replicate-simple')
      const data = await response.json()
      console.log('API Test:', data)
      setResult(data)
      setError(null)
    } catch (err) {
      console.error('API Test Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      console.log('Generating with:', { modelId, prompt })
      
      const response = await fetch('/api/replicate-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          prompt,
          aspect_ratio: '1:1',
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 20
        })
      })

      const data = await response.json()
      console.log('Generation result:', data)

      if (data.success) {
        setResult(data)
        setError(null)
      } else {
        setError(data.error || 'Generation failed')
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simple Replicate API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Test */}
          <div>
            <Button onClick={testAPI} variant="outline">
              Test API Connection
            </Button>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODELS).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateImage} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800 mb-2">Result:</h3>
              <pre className="text-xs text-green-700 overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
              
              {/* Display generated images */}
              {result.output && Array.isArray(result.output) && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Generated Images:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.output.map((url: string, index: number) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-auto rounded-md border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
