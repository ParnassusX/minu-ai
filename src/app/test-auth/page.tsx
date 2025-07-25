'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { UnifiedCard, UnifiedCardHeader, UnifiedCardContent } from '@/components/ui/UnifiedCard'
import { UnifiedButton } from '@/components/ui/UnifiedButton'
import { OptimizedErrorBoundary } from '@/components/ui/OptimizedErrorHandling'
import { OptimizedLoading } from '@/components/ui/OptimizedLoading'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Key, 
  Globe,
  User,
  Shield,
  TestTube
} from 'lucide-react'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: any
}

/**
 * Comprehensive Supabase Authentication Test Page
 * Tests all aspects of Supabase configuration and authentication
 */
export default function TestAuthPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('testpassword123')
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Initialize test results
  useEffect(() => {
    setTestResults([
      { name: 'Environment Variables', status: 'pending', message: 'Checking environment configuration...' },
      { name: 'Database Connection', status: 'pending', message: 'Testing database connectivity...' },
      { name: 'Authentication Service', status: 'pending', message: 'Verifying auth service...' },
      { name: 'User Session', status: 'pending', message: 'Checking current session...' },
      { name: 'Database Schema', status: 'pending', message: 'Validating database tables...' },
      { name: 'RLS Policies', status: 'pending', message: 'Testing Row Level Security...' }
    ])
  }, [])

  const updateTestResult = (name: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, details } : test
    ))
  }

  const runComprehensiveTests = async () => {
    setIsRunning(true)
    
    try {
      // Test 1: Environment Variables
      await new Promise(resolve => setTimeout(resolve, 500))
      if (!supabaseUrl || !supabaseKey) {
        updateTestResult('Environment Variables', 'error', 'Missing Supabase environment variables')
      } else {
        updateTestResult('Environment Variables', 'success', 'All environment variables configured correctly', {
          url: supabaseUrl,
          keyLength: supabaseKey.length
        })
      }

      // Test 2: Database Connection
      await new Promise(resolve => setTimeout(resolve, 500))
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        if (error) {
          updateTestResult('Database Connection', 'error', `Database error: ${error.message}`, error)
        } else {
          updateTestResult('Database Connection', 'success', 'Database connection successful', data)
        }
      } catch (err) {
        updateTestResult('Database Connection', 'error', `Connection failed: ${err}`)
      }

      // Test 3: Authentication Service
      await new Promise(resolve => setTimeout(resolve, 500))
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          updateTestResult('Authentication Service', 'error', `Auth service error: ${error.message}`, error)
        } else {
          updateTestResult('Authentication Service', 'success', 'Authentication service is working', {
            hasSession: !!session,
            sessionDetails: session ? 'Active session found' : 'No active session'
          })
          setCurrentUser(session?.user || null)
        }
      } catch (err) {
        updateTestResult('Authentication Service', 'error', `Auth service failed: ${err}`)
      }

      // Test 4: User Session
      await new Promise(resolve => setTimeout(resolve, 500))
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          updateTestResult('User Session', 'error', `User session error: ${error.message}`, error)
        } else {
          updateTestResult('User Session', 'success', user ? 'User session active' : 'No active user session', {
            userId: user?.id,
            email: user?.email
          })
        }
      } catch (err) {
        updateTestResult('User Session', 'error', `User session check failed: ${err}`)
      }

      // Test 5: Database Schema
      await new Promise(resolve => setTimeout(resolve, 500))
      try {
        const tables = ['profiles', 'images', 'folders', 'prompts']
        const tableTests = await Promise.all(
          tables.map(async (table) => {
            const { data, error } = await supabase.from(table).select('*').limit(1)
            return { table, success: !error, error: error?.message }
          })
        )
        
        const failedTables = tableTests.filter(t => !t.success)
        if (failedTables.length > 0) {
          updateTestResult('Database Schema', 'error', `Some tables failed: ${failedTables.map(t => t.table).join(', ')}`, failedTables)
        } else {
          updateTestResult('Database Schema', 'success', 'All required tables accessible', tableTests)
        }
      } catch (err) {
        updateTestResult('Database Schema', 'error', `Schema validation failed: ${err}`)
      }

      // Test 6: RLS Policies (basic test)
      await new Promise(resolve => setTimeout(resolve, 500))
      try {
        // Test if RLS is working by trying to access data without authentication
        const { data, error } = await supabase.from('profiles').select('*').limit(1)
        if (error && error.message.includes('RLS')) {
          updateTestResult('RLS Policies', 'success', 'Row Level Security is properly configured', { rlsActive: true })
        } else if (error) {
          updateTestResult('RLS Policies', 'error', `RLS test error: ${error.message}`, error)
        } else {
          updateTestResult('RLS Policies', 'success', 'RLS policies allow access (may need authentication)', { dataAccess: true })
        }
      } catch (err) {
        updateTestResult('RLS Policies', 'error', `RLS test failed: ${err}`)
      }

    } catch (error) {
      console.error('Test suite error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const testAuthentication = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        alert(`Authentication Error: ${error.message}`)
      } else {
        alert('Authentication successful!')
        setCurrentUser(data.user)
      }
    } catch (err) {
      alert(`Authentication Exception: ${err}`)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        alert(`Sign out error: ${error.message}`)
      } else {
        alert('Signed out successfully!')
        setCurrentUser(null)
      }
    } catch (err) {
      alert(`Sign out exception: ${err}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default: return <TestTube className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      case 'error': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      case 'pending': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'
    }
  }

  return (
    <OptimizedErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Supabase Authentication Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive testing of Supabase configuration, database connectivity, and authentication system
            </p>
          </div>

          {/* Configuration Info */}
          <UnifiedCard className="mb-6">
            <UnifiedCardHeader
              title="Configuration Status"
              subtitle="Current Supabase configuration details"
            />
            
            <UnifiedCardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Supabase URL:</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {supabaseUrl || 'Not configured'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Anon Key:</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Not configured'}
                  </div>
                </div>
              </div>
            </UnifiedCardContent>
          </UnifiedCard>

          {/* Test Suite */}
          <UnifiedCard className="mb-6">
            <UnifiedCardHeader
              title="Comprehensive Test Suite"
              subtitle="Automated testing of all Supabase components"
            />
            
            <UnifiedCardContent>
              <div className="space-y-4">
                <UnifiedButton
                  variant="primary"
                  onClick={runComprehensiveTests}
                  loading={isRunning}
                  icon={<TestTube className="w-4 h-4" />}
                  className="w-full"
                >
                  {isRunning ? 'Running Tests...' : 'Run Comprehensive Tests'}
                </UnifiedButton>

                {/* Test Results */}
                <div className="space-y-3">
                  {testResults.map((test, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {test.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {test.message}
                          </div>
                        </div>
                      </div>
                      
                      {test.details && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded font-mono">
                          {JSON.stringify(test.details, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </UnifiedCardContent>
          </UnifiedCard>

          {/* Authentication Test */}
          <UnifiedCard>
            <UnifiedCardHeader
              title="Authentication Test"
              subtitle="Test user authentication with email and password"
            />
            
            <UnifiedCardContent>
              <div className="space-y-4">
                {currentUser ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Authenticated User
                      </span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Email: {currentUser.email}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      User ID: {currentUser.id}
                    </div>
                    <UnifiedButton
                      variant="secondary"
                      onClick={signOut}
                      className="mt-3"
                    >
                      Sign Out
                    </UnifiedButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Enter test email"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Enter test password"
                        />
                      </div>
                    </div>
                    
                    <UnifiedButton
                      variant="primary"
                      onClick={testAuthentication}
                      icon={<Shield className="w-4 h-4" />}
                    >
                      Test Authentication
                    </UnifiedButton>
                  </div>
                )}
              </div>
            </UnifiedCardContent>
          </UnifiedCard>
        </div>
      </div>
    </OptimizedErrorBoundary>
  )
}
