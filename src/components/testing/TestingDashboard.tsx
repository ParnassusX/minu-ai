'use client'

// Testing Dashboard Component
// Provides comprehensive testing interface for Minu.AI infrastructure

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react'

interface TestResult {
  service?: string
  test?: string
  status: 'pass' | 'fail' | 'warning' | 'skip'
  message: string
  details?: any
  duration?: number
  timestamp: number
}

interface TestReport {
  overall: 'pass' | 'fail' | 'warning' | 'partial'
  results: TestResult[]
  summary: {
    passed: number
    failed: number
    warnings?: number
    skipped?: number
    total: number
  }
  totalDuration?: number
  timestamp: number
}

export function TestingDashboard() {
  const [infrastructureReport, setInfrastructureReport] = useState<TestReport | null>(null)
  const [profileReport, setProfileReport] = useState<TestReport | null>(null)
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})

  const runInfrastructureTests = async () => {
    setLoading(prev => ({ ...prev, infrastructure: true }))
    
    try {
      const response = await fetch('/api/test-infrastructure')
      const data = await response.json()
      
      if (data.success) {
        setInfrastructureReport(data.report)
      } else {
        console.error('Infrastructure test failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to run infrastructure tests:', error)
    } finally {
      setLoading(prev => ({ ...prev, infrastructure: false }))
    }
  }

  const runProfileTests = async () => {
    setLoading(prev => ({ ...prev, profile: true }))
    
    try {
      const response = await fetch('/api/test-profile')
      const data = await response.json()
      
      if (data.success) {
        setProfileReport(data.report)
      } else {
        console.error('Profile test failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to run profile tests:', error)
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'skip':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === 'pass' ? 'default' : 
                   status === 'fail' ? 'destructive' : 
                   status === 'warning' ? 'secondary' : 'outline'
    
    return (
      <Badge variant={variant} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    )
  }

  const renderTestReport = (report: TestReport, title: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {getStatusBadge(report.overall)}
        </CardTitle>
        <CardDescription>
          {report.summary.passed} passed, {report.summary.failed} failed
          {report.summary.warnings && `, ${report.summary.warnings} warnings`}
          {report.summary.skipped && `, ${report.summary.skipped} skipped`}
          {report.totalDuration && ` • ${report.totalDuration}ms`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {report.results.map((result, index) => (
            <div key={index} className="flex items-start space-x-2 p-2 rounded-lg bg-muted/50">
              {getStatusIcon(result.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {result.service || result.test}
                  </p>
                  {result.duration && (
                    <span className="text-xs text-muted-foreground">
                      {result.duration}ms
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.message}
                </p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-800">
                      View Details
                    </summary>
                    <pre className="text-xs mt-1 p-2 bg-background rounded border overflow-auto max-h-32">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Testing Dashboard</h2>
        <p className="text-muted-foreground">
          Comprehensive testing suite for Minu.AI infrastructure and functionality
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Tests</CardTitle>
            <CardDescription>
              Test database, APIs, caching, and core services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runInfrastructureTests}
              disabled={loading.infrastructure}
              className="w-full"
            >
              {loading.infrastructure ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Infrastructure Tests
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Generation Tests</CardTitle>
            <CardDescription>
              Test user workflows and profile generation functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runProfileTests}
              disabled={loading.profile}
              className="w-full"
            >
              {loading.profile ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Profile Tests
            </Button>
          </CardContent>
        </Card>
      </div>

      {(infrastructureReport || profileReport) && <Separator />}

      <div className="space-y-6">
        {infrastructureReport && renderTestReport(infrastructureReport, 'Infrastructure Test Results')}
        {profileReport && renderTestReport(profileReport, 'Profile Generation Test Results')}
      </div>
    </div>
  )
}
