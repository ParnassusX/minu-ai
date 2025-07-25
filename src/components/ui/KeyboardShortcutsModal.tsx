'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Keyboard, Command } from 'lucide-react'
import { useKeyboardShortcutsHelp } from '@/lib/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsModalProps {
  trigger?: React.ReactNode
}

export function KeyboardShortcutsModal({ trigger }: KeyboardShortcutsModalProps) {
  const [open, setOpen] = useState(false)
  const { shortcuts } = useKeyboardShortcutsHelp()

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Keyboard className="h-4 w-4 mr-2" />
      Shortcuts
    </Button>
  )

  const formatKey = (key: string) => {
    return key.split('+').map((part, index, array) => (
      <span key={index} className="inline-flex items-center">
        <Badge variant="secondary" className="px-2 py-1 text-xs font-mono">
          {part === 'ctrl' ? '⌘' : part === 'shift' ? '⇧' : part === 'alt' ? '⌥' : part.toUpperCase()}
        </Badge>
        {index < array.length - 1 && <span className="mx-1 text-gray-400">+</span>}
      </span>
    ))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Command className="h-5 w-5 mr-2" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Navigation Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shortcuts.navigation.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {formatKey(shortcut.key)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shortcuts.actions.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {formatKey(shortcut.key)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interface Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interface</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shortcuts.interface.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {formatKey(shortcut.key)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">💡 Pro Tips:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Press <Badge variant="secondary" className="mx-1">Ctrl+/</Badge> anytime to open this help</li>
                  <li>• Most shortcuts work globally across the app</li>
                  <li>• Form shortcuts work even when typing in inputs</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
