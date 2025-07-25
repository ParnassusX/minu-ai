import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()
    
    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables')
      .single()
    
    if (tablesError) {
      // Fallback: Try to query information_schema directly
      const { data: schemaInfo, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'public')
        .order('table_name')
      
      if (schemaError) {
        // Final fallback: Try to access known tables individually
        const knownTables = ['profiles', 'images', 'prompt_templates', 'prompt_history', 'suggestions', 'prompts', 'folders']
        const tableStatus = []
        
        for (const tableName of knownTables) {
          try {
            const { error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1)
            
            tableStatus.push({
              table_name: tableName,
              exists: !error,
              error: error?.message || null
            })
          } catch (e) {
            tableStatus.push({
              table_name: tableName,
              exists: false,
              error: e instanceof Error ? e.message : 'Unknown error'
            })
          }
        }
        
        return NextResponse.json({
          method: 'individual_table_check',
          tables: tableStatus,
          schema_error: schemaError?.message,
          tables_error: tablesError?.message
        })
      }
      
      return NextResponse.json({
        method: 'information_schema',
        tables: schemaInfo,
        tables_error: tablesError?.message
      })
    }
    
    return NextResponse.json({
      method: 'rpc_function',
      tables: tables
    })
    
  } catch (error) {
    console.error('Error checking database schema:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = createServiceClient()
    
    // Check for specific functions
    const functions = ['find_similar_prompt']
    const functionStatus = []
    
    for (const funcName of functions) {
      try {
        // Try to call the function with dummy parameters
        const { error } = await supabase
          .rpc(funcName, { 
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_content: 'test'
          })
        
        functionStatus.push({
          function_name: funcName,
          exists: !error || !error.message.includes('does not exist'),
          error: error?.message || null
        })
      } catch (e) {
        functionStatus.push({
          function_name: funcName,
          exists: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        })
      }
    }
    
    // Check for views
    const views = ['prompt_analytics']
    const viewStatus = []
    
    for (const viewName of views) {
      try {
        const { error } = await supabase
          .from(viewName)
          .select('*')
          .limit(1)
        
        viewStatus.push({
          view_name: viewName,
          exists: !error,
          error: error?.message || null
        })
      } catch (e) {
        viewStatus.push({
          view_name: viewName,
          exists: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      functions: functionStatus,
      views: viewStatus
    })
    
  } catch (error) {
    console.error('Error checking database functions/views:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
