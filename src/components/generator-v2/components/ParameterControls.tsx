/**
 * Parameter Controls Component - Minu.AI Generator V2
 * Dynamic parameter controls based on selected model
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import { ModelSchema } from '../types/models'
import { UploadedImage } from '../types/generator'
import { getParametersByGroup } from '../lib/models'

interface ParameterControlsProps {
  model: ModelSchema
  parameters: Record<string, any>
  onParameterChange: (name: string, value: any) => void
  showAdvanced?: boolean
  disabled?: boolean
  uploadedImages: UploadedImage[]
  onImageUpload: (file: File) => Promise<UploadedImage>
  onImageRemove: (imageId: string) => void
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  model,
  parameters,
  onParameterChange,
  showAdvanced = false,
  disabled = false,
  uploadedImages,
  onImageUpload,
  onImageRemove
}) => {
  const parameterGroups = getParametersByGroup(model)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, paramName: string) => {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) {
      event.target.value = ''
      return
    }

    const supportsMultiple = model.capabilities.supportsMultipleImages && (paramName === 'image_input' || paramName === 'images')

    try {
      if (supportsMultiple) {
        const max = model.capabilities.maxImages || 3
        const current: string[] = Array.isArray(parameters[paramName]) ? parameters[paramName] : []
        const newUrls: string[] = []
        for (let i = 0; i < fileList.length && (current.length + newUrls.length) < max; i++) {
          const f = fileList[i]!
          const uploaded = await onImageUpload(f)
          newUrls.push(uploaded.url)
        }
        const combined = [...current, ...newUrls].slice(0, max)
        onParameterChange(paramName, combined)
        console.log('✅ Images uploaded and parameter array set:', { paramName, urls: combined })
      } else {
        const file = fileList[0]!
        const uploadedImage = await onImageUpload(file)
        // Set the parameter to the uploaded image URL
        onParameterChange(paramName, uploadedImage.url)
        console.log('✅ Image uploaded and parameter set:', { paramName, url: uploadedImage.url })
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }

    // Reset the input
    event.target.value = ''
  }
  
  const renderParameter = (param: any) => {
    const value = parameters[param.name] ?? param.default
    
    switch (param.type) {
      case 'select':
        return (
          <div key={param.name} className="space-y-2">
            <Label>{param.name.replace(/_/g, ' ')}</Label>
            <Select
              value={value?.toString() || ''}
              onValueChange={(val) => onParameterChange(param.name, val)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map((option: any) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option.toString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
        
      case 'number':
        return (
          <div key={param.name} className="space-y-2">
            <Label>{param.name.replace(/_/g, ' ')}</Label>
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onParameterChange(param.name, Number(e.target.value))}
              disabled={disabled}
              min={param.min}
              max={param.max}
            />
          </div>
        )
        
      case 'boolean':
        return (
          <div key={param.name} className="flex items-center space-x-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => onParameterChange(param.name, checked)}
              disabled={disabled}
            />
            <Label>{param.name.replace(/_/g, ' ')}</Label>
          </div>
        )
        
      case 'file':
        const currentImageUrl = parameters[param.name]
        const hasImage = !!currentImageUrl

        return (
          <div key={param.name} className="space-y-2">
            <Label className="flex items-center gap-2">
              {param.name.replace(/_/g, ' ')}
              {param.required && <span className="text-red-500">*</span>}
            </Label>

            <div className="space-y-3">
              {/* Upload Button */}
              <Button
                variant="outline"
                onClick={() => document.getElementById(`file-${param.name}`)?.click()}
                disabled={disabled}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {hasImage ? 'Replace Image' : 'Upload Image'}
              </Button>

              <input
                id={`file-${param.name}`}
                type="file"
                accept="image/*"
                multiple={model.capabilities.supportsMultipleImages && (param.name === 'image_input' || param.name === 'images')}
                onChange={(e) => handleFileUpload(e, param.name)}
                className="hidden"
              />

              {/* Current Image Display */}
              {hasImage && (
                <div className="relative">
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <img
                      src={currentImageUrl}
                      alt={`${param.name} preview`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Image uploaded
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {param.description || 'Input image for generation'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onParameterChange(param.name, undefined)}
                      disabled={disabled}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Help Text */}
              {param.description && !hasImage && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {param.description}
                </p>
              )}
            </div>
          </div>
        )
        
      default:
        // Skip prompt parameter - handled by main PromptInput component
        if (param.name === 'prompt') {
          return null
        }

        return (
          <div key={param.name} className="space-y-2">
            <Label>{param.name.replace(/_/g, ' ')}</Label>
            <Input
              value={value || ''}
              onChange={(e) => onParameterChange(param.name, e.target.value)}
              disabled={disabled}
            />
          </div>
        )
    }
  }
  
  return (
    <div className="space-y-4" data-testid="parameter-controls">
      {/* Basic Parameters */}
      {parameterGroups.basic.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Basic Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parameterGroups.basic.map(renderParameter)}
          </CardContent>
        </Card>
      )}
      
      {/* Image Upload */}
      {parameterGroups.image.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Image Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parameterGroups.image.map(renderParameter)}
          </CardContent>
        </Card>
      )}
      
      {/* Advanced Parameters */}
      {showAdvanced && parameterGroups.advanced.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parameterGroups.advanced.map(renderParameter)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
