/**
 * Automatic Prompt Management Service
 * 
 * This service handles the core automatic prompt capture, deduplication,
 * and intelligent organization that eliminates manual prompt management.
 */

import { createClient } from '@/lib/supabase/client'

export interface AutoPromptData {
  content: string
  category: 'image' | 'video' | 'edit_instruction' | 'enhancement'
  modelUsed: string
  parameters?: Record<string, any>
  sourceType?: 'generation' | 'enhancement' | 'editing' | 'manual'
  userId?: string
}

export interface PromptAnalytics {
  id: string
  content: string
  category: string
  usageCount: number
  successRate: number
  avgGenerationTime: number
  totalCost: number
  lastUsedAt: string
  createdAt: string
  isSuccessful: boolean
  modelUsed: string
}

export interface PromptSuggestion {
  id: string
  content: string
  reason: string
  confidence: number
  category: string
  estimatedSuccess: number
}

class AutomaticPromptService {
  private supabase = createClient()
  private readonly SIMILARITY_THRESHOLD = 0.85 // 85% similarity for deduplication
  private readonly MIN_PROMPT_LENGTH = 10
  private readonly MAX_PROMPT_LENGTH = 2000

  /**
   * Automatically save a prompt from generation/editing activity
   * This is the core function that captures ALL prompts automatically
   */
  async savePromptFromGeneration(data: AutoPromptData): Promise<string | null> {
    try {
      // Validate input
      if (!this.isValidPrompt(data.content)) {
        console.log('Prompt validation failed:', data.content.substring(0, 50))
        return null
      }

      // Get user ID (optional for dev mode)
      let userId = data.userId
      if (!userId) {
        try {
          const { data: { user } } = await this.supabase.auth.getUser()
          userId = user?.id || undefined
        } catch (authError) {
          console.log('Auth not available, proceeding without user')
          return null
        }
      }

      if (!userId) {
        console.log('No user ID available for prompt saving')
        return null
      }

      const cleanContent = this.cleanPromptContent(data.content)

      // Check for existing similar prompts (smart deduplication)
      const existingPrompt = await this.findSimilarPrompt(userId, cleanContent, data.category)

      if (existingPrompt) {
        // Update existing prompt usage
        await this.updatePromptUsage(existingPrompt.id, data)
        console.log('Updated existing prompt usage:', existingPrompt.id)
        return existingPrompt.id
      }

      // Create new prompt record
      const { data: newPrompt, error } = await this.supabase
        .from('prompts')
        .insert({
          user_id: userId,
          content: cleanContent,
          category: data.category,
          model_used: data.modelUsed,
          parameters: data.parameters || {},
          source_type: data.sourceType || 'generation',
          usage_count: 1,
          last_used_at: new Date().toISOString(),
          // Initialize analytics
          total_generations: 1,
          successful_generations: 0, // Will be updated when we know the result
          total_cost: 0,
          avg_generation_time: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving prompt:', error)
        return null
      }

      console.log('Automatically saved new prompt:', {
        id: newPrompt.id,
        content: cleanContent.substring(0, 50) + '...',
        category: data.category
      })

      return newPrompt.id

    } catch (error) {
      console.error('Error in savePromptFromGeneration:', error)
      return null
    }
  }

  /**
   * Update prompt analytics after generation completion
   */
  async updatePromptSuccess(
    promptId: string, 
    success: boolean, 
    generationTime?: number, 
    cost?: number
  ): Promise<void> {
    try {
      // Get current prompt data
      const { data: prompt, error: fetchError } = await this.supabase
        .from('prompts')
        .select('total_generations, successful_generations, total_cost, avg_generation_time')
        .eq('id', promptId)
        .single()

      if (fetchError || !prompt) {
        console.error('Error fetching prompt for update:', fetchError)
        return
      }

      // Calculate new analytics
      const newTotalGenerations = prompt.total_generations + 1
      const newSuccessfulGenerations = prompt.successful_generations + (success ? 1 : 0)
      const newTotalCost = prompt.total_cost + (cost || 0)
      
      let newAvgGenerationTime = prompt.avg_generation_time
      if (generationTime) {
        newAvgGenerationTime = (prompt.avg_generation_time * prompt.total_generations + generationTime) / newTotalGenerations
      }

      // Update prompt with new analytics
      const { error: updateError } = await this.supabase
        .from('prompts')
        .update({
          total_generations: newTotalGenerations,
          successful_generations: newSuccessfulGenerations,
          total_cost: newTotalCost,
          avg_generation_time: newAvgGenerationTime,
          last_used_at: new Date().toISOString()
        })
        .eq('id', promptId)

      if (updateError) {
        console.error('Error updating prompt analytics:', updateError)
      } else {
        console.log('Updated prompt analytics:', {
          promptId,
          successRate: `${Math.round((newSuccessfulGenerations / newTotalGenerations) * 100)}%`,
          totalCost: `$${newTotalCost.toFixed(2)}`
        })
      }

    } catch (error) {
      console.error('Error in updatePromptSuccess:', error)
    }
  }

  /**
   * Get intelligent prompt suggestions based on user history
   */
  async getPromptSuggestions(
    userId: string, 
    category?: string, 
    limit: number = 10
  ): Promise<PromptSuggestion[]> {
    try {
      let query = this.supabase
        .from('prompts')
        .select('*')
        .eq('user_id', userId)
        .gt('usage_count', 1) // Only suggest prompts that have been used multiple times
        .order('successful_generations', { ascending: false })
        .order('usage_count', { ascending: false })
        .limit(limit * 2) // Get more to filter

      if (category) {
        query = query.eq('category', category)
      }

      const { data: prompts, error } = await query

      if (error) {
        console.error('Error fetching prompt suggestions:', error)
        return []
      }

      // Convert to suggestions with intelligence
      const suggestions: PromptSuggestion[] = prompts
        .filter(prompt => prompt.total_generations > 0) // Only prompts with results
        .map(prompt => {
          const successRate = prompt.successful_generations / prompt.total_generations
          const usageScore = Math.min(prompt.usage_count / 10, 1) // Normalize usage count
          const confidence = (successRate * 0.7) + (usageScore * 0.3) // Weighted confidence

          return {
            id: prompt.id,
            content: prompt.content,
            reason: this.generateSuggestionReason(prompt, successRate),
            confidence: Math.round(confidence * 100),
            category: prompt.category,
            estimatedSuccess: Math.round(successRate * 100)
          }
        })
        .filter(suggestion => suggestion.confidence > 50) // Only confident suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit)

      return suggestions

    } catch (error) {
      console.error('Error in getPromptSuggestions:', error)
      return []
    }
  }

  /**
   * Get prompt analytics for user insights
   */
  async getPromptAnalytics(userId: string, category?: string): Promise<PromptAnalytics[]> {
    try {
      let query = this.supabase
        .from('prompts')
        .select('*')
        .eq('user_id', userId)
        .order('last_used_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data: prompts, error } = await query

      if (error) {
        console.error('Error fetching prompt analytics:', error)
        return []
      }

      return prompts.map(prompt => ({
        id: prompt.id,
        content: prompt.content,
        category: prompt.category,
        usageCount: prompt.usage_count,
        successRate: prompt.total_generations > 0 
          ? Math.round((prompt.successful_generations / prompt.total_generations) * 100)
          : 0,
        avgGenerationTime: prompt.avg_generation_time,
        totalCost: prompt.total_cost,
        lastUsedAt: prompt.last_used_at,
        createdAt: prompt.created_at,
        isSuccessful: prompt.successful_generations > 0,
        modelUsed: prompt.model_used
      }))

    } catch (error) {
      console.error('Error in getPromptAnalytics:', error)
      return []
    }
  }

  /**
   * Private helper methods
   */

  private isValidPrompt(content: string): boolean {
    if (!content || typeof content !== 'string') return false
    const trimmed = content.trim()
    return trimmed.length >= this.MIN_PROMPT_LENGTH && trimmed.length <= this.MAX_PROMPT_LENGTH
  }

  private cleanPromptContent(content: string): string {
    return content
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
  }

  private async findSimilarPrompt(
    userId: string, 
    content: string, 
    category: string
  ): Promise<any | null> {
    try {
      // Simple similarity check - in production, this could use vector similarity
      const { data: prompts, error } = await this.supabase
        .from('prompts')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .limit(50) // Check recent prompts

      if (error || !prompts) return null

      // Find similar prompts using simple string similarity
      for (const prompt of prompts) {
        const similarity = this.calculateStringSimilarity(content, prompt.content)
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          return prompt
        }
      }

      return null

    } catch (error) {
      console.error('Error finding similar prompt:', error)
      return null
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity for demonstration
    // In production, use more sophisticated similarity algorithms
    const set1 = new Set(str1.toLowerCase().split(' '))
    const set2 = new Set(str2.toLowerCase().split(' '))
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size
  }

  private async updatePromptUsage(promptId: string, data: AutoPromptData): Promise<void> {
    try {
      // First get current usage count
      const { data: currentPrompt, error: fetchError } = await this.supabase
        .from('prompts')
        .select('usage_count')
        .eq('id', promptId)
        .single()

      if (fetchError || !currentPrompt) {
        console.error('Error fetching current prompt usage:', fetchError)
        return
      }

      // Update with incremented usage count
      const { error } = await this.supabase
        .from('prompts')
        .update({
          usage_count: currentPrompt.usage_count + 1,
          last_used_at: new Date().toISOString(),
          model_used: data.modelUsed, // Update to latest model used
          parameters: data.parameters || {}
        })
        .eq('id', promptId)

      if (error) {
        console.error('Error updating prompt usage:', error)
      }
    } catch (error) {
      console.error('Error in updatePromptUsage:', error)
    }
  }

  private generateSuggestionReason(prompt: any, successRate: number): string {
    if (successRate >= 0.9) {
      return `High success rate (${Math.round(successRate * 100)}%) - consistently great results`
    } else if (prompt.usage_count >= 5) {
      return `Frequently used (${prompt.usage_count} times) - one of your favorites`
    } else if (successRate >= 0.7) {
      return `Good success rate (${Math.round(successRate * 100)}%) - reliable choice`
    } else {
      return `Recently used - might work well again`
    }
  }
}

// Export singleton instance
export const automaticPromptService = new AutomaticPromptService()

// Export helper functions for easy use
export const savePromptFromGeneration = (data: AutoPromptData) => 
  automaticPromptService.savePromptFromGeneration(data)

export const updatePromptSuccess = (promptId: string, success: boolean, generationTime?: number, cost?: number) =>
  automaticPromptService.updatePromptSuccess(promptId, success, generationTime, cost)

export const getPromptSuggestions = (userId: string, category?: string, limit?: number) =>
  automaticPromptService.getPromptSuggestions(userId, category, limit)

export const getPromptAnalytics = (userId: string, category?: string) =>
  automaticPromptService.getPromptAnalytics(userId, category)
