import { createClient } from '@/lib/supabase/client'
import { createServiceClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type PromptRow = Database['public']['Tables']['prompt_history']['Row']
type PromptInsert = Database['public']['Tables']['prompt_history']['Insert']
type PromptUpdate = Database['public']['Tables']['prompt_history']['Update']

export interface PromptWithAnalytics extends PromptRow {
  total_images_generated?: number
  avg_cost_per_attempt?: number
}

export interface GenerationAttempt {
  promptId: string
  userId: string
  successful: boolean
  modelUsed: string
  parameters: Record<string, any>
  generationTime?: number
  errorMessage?: string
  cost?: number
  imagesGenerated?: number
}

export interface PromptSaveOptions {
  userId: string
  content: string
  title?: string
  enhancedContent?: string
  category?: string
  tags?: string[]
  modelUsed?: string
  parameters?: Record<string, any>
  promptType?: 'standard' | 'template' | 'suggestion'
}

export class PromptService {
  private supabase = createServiceClient()

  /**
   * Automatically save a prompt during image generation
   * Handles deduplication and analytics
   */
  async savePromptFromGeneration(options: PromptSaveOptions): Promise<string> {
    const { userId, content, ...otherOptions } = options

    try {
      // Check for similar existing prompt
      const similarPromptId = await this.findSimilarPrompt(userId, content)
      
      if (similarPromptId) {
        // Update existing prompt usage
        await this.incrementPromptUsage(similarPromptId)
        return similarPromptId
      }

      // Create new prompt
      const { data: newPrompt, error } = await this.supabase
        .from('prompts')
        .insert({
          user_id: userId,
          content: content.trim(),
          title: otherOptions.title,
          enhanced_content: otherOptions.enhancedContent,
          category: otherOptions.category || 'general',
          tags: otherOptions.tags || [],
          model_used: otherOptions.modelUsed,
          parameters: otherOptions.parameters || {},
          prompt_type: otherOptions.promptType || 'standard',
          usage_count: 1,
          total_attempts: 0, // Will be updated by trigger
          successful_generations: 0, // Will be updated by trigger
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error saving prompt:', error)
        throw new Error('Failed to save prompt')
      }

      return newPrompt.id
    } catch (error) {
      console.error('Error in savePromptFromGeneration:', error)
      throw error
    }
  }

  /**
   * Record a generation attempt for analytics
   */
  async recordGenerationAttempt(attempt: GenerationAttempt): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('prompt_attempts')
        .insert({
          prompt_id: attempt.promptId,
          user_id: attempt.userId,
          successful: attempt.successful,
          model_used: attempt.modelUsed,
          parameters: attempt.parameters,
          generation_time: attempt.generationTime,
          error_message: attempt.errorMessage,
          cost: attempt.cost,
          images_generated: attempt.imagesGenerated || 0,
        })

      if (error) {
        console.error('Error recording generation attempt:', error)
        throw new Error('Failed to record generation attempt')
      }
    } catch (error) {
      console.error('Error in recordGenerationAttempt:', error)
      throw error
    }
  }

  /**
   * Link a prompt to generated images
   */
  async linkPromptToImages(
    promptId: string, 
    imageIds: string[], 
    generationContext?: {
      successful?: boolean
      generationTime?: number
      modelUsed?: string
      parameters?: Record<string, any>
      errorMessage?: string
    }
  ): Promise<void> {
    try {
      const linkData = imageIds.map(imageId => ({
        prompt_id: promptId,
        image_id: imageId,
        generation_successful: generationContext?.successful ?? true,
        generation_time: generationContext?.generationTime,
        model_used: generationContext?.modelUsed,
        parameters_used: generationContext?.parameters || {},
        error_message: generationContext?.errorMessage,
      }))

      const { error } = await this.supabase
        .from('prompt_images')
        .insert(linkData)

      if (error) {
        console.error('Error linking prompt to images:', error)
        throw new Error('Failed to link prompt to images')
      }

      // Also update the images table with prompt reference
      for (const imageId of imageIds) {
        await this.supabase
          .from('images')
          .update({ prompt_id: promptId })
          .eq('id', imageId)
      }
    } catch (error) {
      console.error('Error in linkPromptToImages:', error)
      throw error
    }
  }

  /**
   * Find similar prompt using fuzzy matching
   */
  private async findSimilarPrompt(userId: string, content: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('find_similar_prompt', {
          p_user_id: userId,
          p_content: content.trim(),
          p_similarity_threshold: 0.85
        })

      if (error) {
        console.error('Error finding similar prompt:', error)
        return null
      }

      return data || null
    } catch (error) {
      console.error('Error in findSimilarPrompt:', error)
      return null
    }
  }

  /**
   * Increment usage count for existing prompt
   */
  private async incrementPromptUsage(promptId: string): Promise<void> {
    try {
      // For now, just log the usage - we'll implement proper usage tracking later
      console.log('Prompt usage tracked for:', promptId)
    } catch (error) {
      console.error('Error in incrementPromptUsage:', error)
      throw error
    }
  }

  /**
   * Get user's recent prompts with analytics
   */
  async getRecentPrompts(userId: string, limit: number = 10): Promise<PromptWithAnalytics[]> {
    try {
      // Try to get from analytics view first
      const { data, error } = await this.supabase
        .from('prompt_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('last_used_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.warn('Analytics view not available, falling back to basic prompts:', error.message)

        // Fallback to basic prompts table if analytics view doesn't exist
        const { data: basicData, error: basicError } = await this.supabase
          .from('prompts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (basicError) {
          console.error('Error fetching basic prompts:', basicError)
          return [] // Return empty array instead of throwing
        }

        return basicData || []
      }

      return data || []
    } catch (error) {
      console.error('Error in getRecentPrompts:', error)
      return [] // Return empty array instead of throwing
    }
  }

  /**
   * Get prompts by success rate for smart suggestions
   */
  async getTopPerformingPrompts(userId: string, limit: number = 5): Promise<PromptWithAnalytics[]> {
    try {
      const { data, error } = await this.supabase
        .from('prompt_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('total_attempts', 2) // Only prompts with multiple attempts
        .order('success_rate', { ascending: false })
        .limit(limit)

      if (error) {
        console.warn('Analytics view not available for top performing prompts:', error.message)
        return [] // Return empty array instead of throwing
      }

      return data || []
    } catch (error) {
      console.error('Error in getTopPerformingPrompts:', error)
      return [] // Return empty array instead of throwing
    }
  }

  /**
   * Search prompts with full-text search
   */
  async searchPrompts(
    userId: string,
    query: string,
    filters?: {
      category?: string
      promptType?: string
      minSuccessRate?: number
    }
  ): Promise<PromptWithAnalytics[]> {
    try {
      let queryBuilder = this.supabase
        .from('prompt_analytics')
        .select('*')
        .eq('user_id', userId)
        .textSearch('content', query)

      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category)
      }

      if (filters?.promptType) {
        queryBuilder = queryBuilder.eq('prompt_type', filters.promptType)
      }

      if (filters?.minSuccessRate) {
        queryBuilder = queryBuilder.gte('success_rate', filters.minSuccessRate)
      }

      const { data, error } = await queryBuilder
        .order('success_rate', { ascending: false })
        .limit(20)

      if (error) {
        console.warn('Analytics view not available for search:', error.message)
        return [] // Return empty array instead of throwing
      }

      return data || []
    } catch (error) {
      console.error('Error in searchPrompts:', error)
      return [] // Return empty array instead of throwing
    }
  }

  /**
   * Get prompt analytics for a specific prompt
   */
  async getPromptAnalytics(promptId: string): Promise<{
    prompt: PromptRow
    attempts: any[]
    images: any[]
    successRate: number
    avgGenerationTime: number
    totalCost: number
  } | null> {
    try {
      // Get prompt details
      const { data: prompt, error: promptError } = await this.supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single()

      if (promptError || !prompt) {
        return null
      }

      // Get attempts
      const { data: attempts } = await this.supabase
        .from('prompt_attempts')
        .select('*')
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false })

      // Get linked images
      const { data: images } = await this.supabase
        .from('prompt_images')
        .select(`
          *,
          images (*)
        `)
        .eq('prompt_id', promptId)

      // Calculate analytics
      const successfulAttempts = attempts?.filter(a => a.successful).length || 0
      const totalAttempts = attempts?.length || 0
      const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0
      
      const avgGenerationTime = attempts?.reduce((sum, a) => sum + (a.generation_time || 0), 0) / (attempts?.length || 1)
      const totalCost = attempts?.reduce((sum, a) => sum + (a.cost || 0), 0) || 0

      return {
        prompt,
        attempts: attempts || [],
        images: images || [],
        successRate,
        avgGenerationTime,
        totalCost
      }
    } catch (error) {
      console.error('Error in getPromptAnalytics:', error)
      return null
    }
  }
}
