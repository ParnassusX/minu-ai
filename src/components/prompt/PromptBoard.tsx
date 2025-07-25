'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Search,
  Grid,
  List,
  ZoomIn,
  ZoomOut,
  Edit,
  Trash2,
  Copy,
  Wand2,
  Play,
  Tag,
  Folder
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PromptBoard as PromptBoardType,
  PromptNote,
  PromptBoardState,
  PromptBoardFilters,
  createEmptyBoardState,
  createEmptyFilters,
  filterPromptNotes,
  sortPromptNotes,
  getPromptNotePreview
} from '@/types/prompt'

interface PromptBoardProps {
  board: PromptBoardType
  notes: PromptNote[]
  onNoteCreate: (note: Partial<PromptNote>) => void
  onNoteUpdate: (id: string, updates: Partial<PromptNote>) => void
  onNoteDelete: (id: string) => void
  onNoteDuplicate: (note: PromptNote) => void
  onNoteEnhance: (note: PromptNote) => void
  onNoteApplyToGenerator: (note: PromptNote) => void
  onBoardUpdate: (updates: Partial<PromptBoardType>) => void
  className?: string
}

export function PromptBoard({
  board,
  notes,
  onNoteCreate,
  onNoteUpdate,
  onNoteDelete,
  onNoteDuplicate,
  onNoteEnhance,
  onNoteApplyToGenerator,
  onBoardUpdate,
  className
}: PromptBoardProps) {
  const [state, setState] = useState<PromptBoardState>(createEmptyBoardState())
  const [filters, setFilters] = useState<PromptBoardFilters>(createEmptyFilters())
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [newNotePosition, setNewNotePosition] = useState<{ x: number; y: number } | null>(null)
  
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    isDragging: boolean
    noteId: string | null
    startPos: { x: number; y: number }
    noteStartPos: { x: number; y: number }
  }>({
    isDragging: false,
    noteId: null,
    startPos: { x: 0, y: 0 },
    noteStartPos: { x: 0, y: 0 }
  })

  // Filter and sort notes
  const filteredNotes = filterPromptNotes(notes, filters)
  const sortedNotes = sortPromptNotes(filteredNotes, 'updated')

  // Handle board click to create new note
  const handleBoardClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !dragRef.current.isDragging) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setNewNotePosition({ x, y })
    }
  }, [])

  // Handle note drag start
  const handleNoteDragStart = useCallback((e: React.MouseEvent, noteId: string) => {
    e.preventDefault()
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    dragRef.current = {
      isDragging: true,
      noteId,
      startPos: { x: e.clientX, y: e.clientY },
      noteStartPos: { x: note.position.x, y: note.position.y }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging || !dragRef.current.noteId) return

      const deltaX = e.clientX - dragRef.current.startPos.x
      const deltaY = e.clientY - dragRef.current.startPos.y

      const newX = Math.max(0, dragRef.current.noteStartPos.x + deltaX)
      const newY = Math.max(0, dragRef.current.noteStartPos.y + deltaY)

      onNoteUpdate(dragRef.current.noteId, {
        position: { x: newX, y: newY }
      })
    }

    const handleMouseUp = () => {
      dragRef.current.isDragging = false
      dragRef.current.noteId = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [notes, onNoteUpdate])

  // Create new note
  const createNewNote = useCallback((position: { x: number; y: number }) => {
    const newNote = {
      position,
      content: 'New prompt idea...'
    }
    onNoteCreate(newNote)
    setNewNotePosition(null)
  }, [onNoteCreate])

  // Handle new note creation
  useEffect(() => {
    if (newNotePosition) {
      createNewNote(newNotePosition)
    }
  }, [newNotePosition, createNewNote])

  // Note colors for categories
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      commercial: '#dbeafe', // blue
      personal: '#d1fae5',   // green
      luxury: '#e0e7ff',     // purple
      experimental: '#fef3c7', // yellow
      templates: '#fee2e2'   // red
    }
    return colors[category] || '#f3f4f6' // gray default
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Board Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">{board.name}</h2>
          <Badge variant="outline">{sortedNotes.length} notes</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search prompts..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 w-64"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={state.viewMode === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, viewMode: 'board' }))}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={state.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.1) }))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-mono w-12 text-center">
              {Math.round(state.zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, zoom: Math.min(2, prev.zoom + 0.1) }))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Note Button */}
          <Button
            onClick={() => setNewNotePosition({ x: 100, y: 100 })}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Note</span>
          </Button>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        {state.viewMode === 'board' ? (
          <div
            ref={boardRef}
            className="relative w-full h-full overflow-auto cursor-crosshair"
            style={{
              backgroundColor: board.backgroundColor,
              transform: `scale(${state.zoom})`,
              transformOrigin: 'top left'
            }}
            onClick={handleBoardClick}
          >
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />

            {/* Prompt Notes */}
            {sortedNotes.map((note) => (
              <PromptNoteCard
                key={note.id}
                note={note}
                isEditing={editingNote === note.id}
                onEdit={() => setEditingNote(note.id)}
                onSave={(updates) => {
                  onNoteUpdate(note.id, updates)
                  setEditingNote(null)
                }}
                onCancel={() => setEditingNote(null)}
                onDelete={() => onNoteDelete(note.id)}
                onDuplicate={() => onNoteDuplicate(note)}
                onEnhance={() => onNoteEnhance(note)}
                onApplyToGenerator={() => onNoteApplyToGenerator(note)}
                onDragStart={(e) => handleNoteDragStart(e, note.id)}
                categoryColor={getCategoryColor(note.category)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-2 overflow-auto">
            {sortedNotes.map((note) => (
              <PromptNoteListItem
                key={note.id}
                note={note}
                onEdit={() => setEditingNote(note.id)}
                onDelete={() => onNoteDelete(note.id)}
                onDuplicate={() => onNoteDuplicate(note)}
                onEnhance={() => onNoteEnhance(note)}
                onApplyToGenerator={() => onNoteApplyToGenerator(note)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Individual Prompt Note Card Component
interface PromptNoteCardProps {
  note: PromptNote
  isEditing: boolean
  onEdit: () => void
  onSave: (updates: Partial<PromptNote>) => void
  onCancel: () => void
  onDelete: () => void
  onDuplicate: () => void
  onEnhance: () => void
  onApplyToGenerator: () => void
  onDragStart: (e: React.MouseEvent) => void
  categoryColor: string
}

function PromptNoteCard({
  note,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
  onEnhance,
  onApplyToGenerator,
  onDragStart,
  categoryColor
}: PromptNoteCardProps) {
  const [editContent, setEditContent] = useState(note.content)
  const [editTitle, setEditTitle] = useState(note.title || '')

  const handleSave = () => {
    onSave({
      content: editContent,
      title: editTitle || undefined
    })
  }

  return (
    <Card
      className="absolute cursor-move shadow-lg hover:shadow-xl transition-shadow"
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.size.width,
        height: note.size.height,
        backgroundColor: categoryColor,
        borderColor: note.color
      }}
      onMouseDown={onDragStart}
    >
      <CardContent className="p-3 h-full flex flex-col">
        {isEditing ? (
          <>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Note title..."
              className="mb-2 text-sm"
            />
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 text-sm resize-none"
              placeholder="Enter your prompt..."
            />
            <div className="flex justify-end space-x-1 mt-2">
              <Button size="sm" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            {note.title && (
              <h4 className="font-medium text-sm mb-1 truncate">{note.title}</h4>
            )}
            <p className="text-sm flex-1 overflow-hidden">{getPromptNotePreview(note, 100)}</p>
            
            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {note.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{note.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex space-x-1">
                <Button size="sm" variant="ghost" onClick={onEdit}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onDuplicate}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onEnhance}>
                  <Wand2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex space-x-1">
                <Button size="sm" variant="ghost" onClick={onApplyToGenerator}>
                  <Play className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// List View Item Component
interface PromptNoteListItemProps {
  note: PromptNote
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onEnhance: () => void
  onApplyToGenerator: () => void
}

function PromptNoteListItem({
  note,
  onEdit,
  onDelete,
  onDuplicate,
  onEnhance,
  onApplyToGenerator
}: PromptNoteListItemProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {note.title && (
            <h4 className="font-medium mb-1">{note.title}</h4>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {getPromptNotePreview(note, 200)}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <Folder className="h-3 w-3 mr-1" />
              {note.category}
            </span>
            <span className="flex items-center">
              <Tag className="h-3 w-3 mr-1" />
              {note.tags.length} tags
            </span>
            <span>Used {note.usageCount} times</span>
          </div>
        </div>
        <div className="flex space-x-1 ml-4">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onEnhance}>
            <Wand2 className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onApplyToGenerator}>
            <Play className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
