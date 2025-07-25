'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Upload, MessageSquare } from 'lucide-react'
import { UnifiedLayout } from '@/components/layout/UnifiedLayout'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  image?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with image editing, prompt enhancement, and creative guidance. How can I assist you today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !uploadedImage) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      image: uploadedImage ? URL.createObjectURL(uploadedImage) : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setUploadedImage(null)
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I understand you want to work with that image. I can help you enhance it, suggest improvements, or create variations. What specific changes would you like to make?',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedImage(file)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <UnifiedLayout variant="centered" className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="responsive-container min-h-screen flex flex-col max-w-4xl mx-auto py-4">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Assistant</h1>
              <p className="text-gray-400 text-sm">Image editing and creative guidance</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-responsive-md p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                }`}
              >
                {message.image && (
                  <div className="mb-3">
                    <img
                      src={message.image}
                      alt="Uploaded"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 tablet:p-6 border-t border-white/10 pb-safe">
          {uploadedImage && (
            <div className="mb-4 p-3 bg-white/10 rounded-lg border border-white/20">
              <div className="flex items-center gap-3">
                <img
                  src={URL.createObjectURL(uploadedImage)}
                  alt="Upload preview"
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{uploadedImage.name}</p>
                  <p className="text-gray-400 text-xs">
                    {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setUploadedImage(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-300" />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about image editing, prompt enhancement, or creative ideas..."
                className="w-full touch-target bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={1}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() && !uploadedImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              'Enhance this image',
              'Improve the prompt',
              'Create variations',
              'Remove background',
              'Change style'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputMessage(suggestion)}
                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-full border border-white/20 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  )
}
