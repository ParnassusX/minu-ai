import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Check which tables exist
    const tableChecks = [
      { name: 'prompts', required: true },
      { name: 'prompt_images', required: false },
      { name: 'prompt_attempts', required: false }
    ]

    const results = []

    for (const table of tableChecks) {
      const { error } = await supabase
        .from(table.name)
        .select('id')
        .limit(1)

      results.push({
        table: table.name,
        exists: !error || !error.message.includes('does not exist'),
        required: table.required,
        error: error?.message
      })
    }

    // Check if find_similar_prompt function exists
    const { error: functionError } = await supabase
      .rpc('find_similar_prompt', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_content: 'test'
      })

    const functionExists = !functionError || !functionError.message.includes('does not exist')

    return NextResponse.json({
      status: 'database_check_complete',
      tables: results,
      functions: {
        find_similar_prompt: {
          exists: functionExists,
          error: functionError?.message
        }
      },
      migration_needed: results.some(r => r.required && !r.exists) || !functionExists
    })

  } catch (error) {
    console.error('Error checking database:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  const migrationSQL = `-- Missing Prompt System Migration
-- Run this SQL in your Supabase SQL Editor

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  prompt_type TEXT DEFAULT 'standard' CHECK (prompt_type IN ('standard', 'template', 'enhanced', 'generated')),
  category TEXT DEFAULT 'general',

  -- Analytics and usage tracking
  usage_count INTEGER DEFAULT 1,
  successful_generations INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  success_rate DECIMAL GENERATED ALWAYS AS (
    CASE WHEN total_attempts > 0
    THEN (successful_generations::DECIMAL / total_attempts::DECIMAL) * 100
    ELSE 0 END
  ) STORED,
  avg_generation_time INTEGER, -- milliseconds
  avg_cost DECIMAL(10,4), -- USD

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create find_similar_prompt function
CREATE OR REPLACE FUNCTION find_similar_prompt(
  p_user_id UUID,
  p_content TEXT,
  p_similarity_threshold DECIMAL DEFAULT 0.85
)
RETURNS UUID AS $$
DECLARE
  similar_prompt_id UUID;
BEGIN
  -- Simple similarity check using trigram similarity
  SELECT id INTO similar_prompt_id
  FROM prompts
  WHERE user_id = p_user_id
    AND similarity(content, p_content) > p_similarity_threshold
  ORDER BY similarity(content, p_content) DESC
  LIMIT 1;

  RETURN similar_prompt_id;
END;
$$ LANGUAGE plpgsql;

-- Enable trigram extension for similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_content_gin ON prompts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_prompts_success_rate ON prompts(success_rate DESC) WHERE success_rate > 0;
CREATE INDEX IF NOT EXISTS idx_prompts_usage_count ON prompts(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_last_used ON prompts(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_type ON prompts(prompt_type);

-- Enable RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own prompts"
  ON prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
  ON prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON prompts FOR DELETE
  USING (auth.uid() = user_id);

-- Create prompt_analytics view
CREATE OR REPLACE VIEW prompt_analytics AS
SELECT
  p.id,
  p.user_id,
  p.content,
  p.usage_count,
  p.success_rate,
  p.avg_generation_time,
  p.avg_cost,
  p.last_used_at as last_used
FROM prompts p;`

  return NextResponse.json({
    message: 'Manual migration required - copy and run this SQL in Supabase SQL Editor',
    instructions: [
      '1. Go to your Supabase dashboard',
      '2. Navigate to SQL Editor',
      '3. Create a new query',
      '4. Copy and paste the SQL below',
      '5. Run the query',
      '6. Restart your development server'
    ],
    sql: migrationSQL
  })
}
