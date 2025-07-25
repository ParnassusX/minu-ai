'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/ui/typography'
import { PremiumInput } from '@/components/ui/premium-glass'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info } from 'lucide-react'

import { 
  getModelSchema, 
  getParametersByLevel, 
  validateModelParameters,
  getModelDefaults,
  type ValidationResult 
} from '@/lib/validation/modelParameterValidation'
import { ModelParameter } from '@/lib/replicate/realModelData'

interface DynamicParameterControlsProps {
  modelId: string
  level: 'basic' | 'intermediate' | 'advanced'
  parameters: Record<string, any>
  onParametersChange: (params: Record<string, any>) => void
  className?: string
  showAdvanced?: boolean
  disclosureLevel?: 'basic' | 'intermediate' | 'advanced'
}

export function DynamicParameterControls({
  modelId,
  level,
  parameters,
  onParametersChange,
  className
}: DynamicParameterControlsProps) {
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] })
  
  const modelParams = getParametersByLevel(modelId, level)
  const schema = getModelSchema(modelId)

  // Validate parameters when they change
  useEffect(() => {
    const result = validateModelParameters(modelId, parameters)
    setValidation(result)
  }, [modelId, parameters])

  // Initialize with defaults when model changes
  useEffect(() => {
    const defaults = getModelDefaults(modelId)
    onParametersChange({ ...defaults, ...parameters })
  }, [modelId])

  const handleParameterChange = (paramName: string, value: any) => {
    onParametersChange({
      ...parameters,
      [paramName]: value
    })
  }

  const renderParameterControl = (param: ModelParameter) => {
    const value = parameters[param.name] ?? param.default
    const hasError = validation.errors.some(error => error.includes(param.name))

    switch (param.type) {
      case 'string':
        return (
          <div key={param.name} className="space-y-2">
            <div className="flex items-center gap-2">
              <Typography variant="body-sm" className="font-medium">
                {formatParameterName(param.name)}
              </Typography>
              {param.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
            </div>
            <PremiumInput
              value={value || ''}
              onChange={(e) => handleParameterChange(param.name, e.target.value)}
              placeholder={param.description}
              className={cn(hasError && "border-red-500")}
            />
            {param.description && (
              <Typography variant="caption" color="low-contrast">
                {param.description}
              </Typography>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={param.name} className="space-y-2">
            <div className="flex items-center gap-2">
              <Typography variant="body-sm" className="font-medium">
                {formatParameterName(param.name)}
              </Typography>
              {param.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
            </div>
            <Select
              value={value || param.default}
              onValueChange={(newValue) => handleParameterChange(param.name, newValue)}
            >
              <SelectTrigger className={cn(hasError && "border-red-500")}>
                <SelectValue placeholder={`Select ${param.name}`} />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatOptionLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {param.description && (
              <Typography variant="caption" color="low-contrast">
                {param.description}
              </Typography>
            )}
          </div>
        )

      case 'integer':
      case 'number':
        const numValue = Number(value) || param.default || 0
        const showSlider = param.min !== undefined && param.max !== undefined

        return (
          <div key={param.name} className="space-y-2">
            <div className="flex items-center gap-2">
              <Typography variant="body-sm" className="font-medium">
                {formatParameterName(param.name)}
              </Typography>
              {param.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
              <Typography variant="caption" color="low-contrast">
                {numValue}
              </Typography>
            </div>
            
            {showSlider ? (
              <Slider
                value={[numValue]}
                onValueChange={([newValue]) => handleParameterChange(param.name, newValue)}
                min={param.min}
                max={param.max}
                step={param.step || 1}
                className="w-full"
              />
            ) : (
              <PremiumInput
                type="number"
                value={numValue}
                onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
                min={param.min}
                max={param.max}
                step={param.step || 1}
                className={cn(hasError && "border-red-500")}
              />
            )}
            
            {param.description && (
              <Typography variant="caption" color="low-contrast">
                {param.description}
              </Typography>
            )}
          </div>
        )

      case 'boolean':
        return (
          <div key={param.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Typography variant="body-sm" className="font-medium">
                  {formatParameterName(param.name)}
                </Typography>
                {param.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
              </div>
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) => handleParameterChange(param.name, checked)}
              />
            </div>
            {param.description && (
              <Typography variant="caption" color="low-contrast">
                {param.description}
              </Typography>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Helper functions
  const formatParameterName = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatOptionLabel = (option: string): string => {
    return option
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  if (modelParams.length === 0) {
    return (
      <div className={cn("text-center py-4", className)}>
        <Typography variant="body-sm" color="low-contrast">
          No {level} parameters available for this model
        </Typography>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Validation Messages */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <Typography variant="caption">{error}</Typography>
            </div>
          ))}
          {validation.warnings.map((warning, index) => (
            <div key={index} className="flex items-center gap-2 text-yellow-600">
              <Info className="w-4 h-4" />
              <Typography variant="caption">{warning}</Typography>
            </div>
          ))}
        </div>
      )}

      {/* Parameter Controls */}
      {modelParams.map(renderParameterControl)}
    </div>
  )
}
