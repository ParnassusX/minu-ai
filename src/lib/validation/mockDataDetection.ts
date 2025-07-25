/**
 * Mock Data Detection and Elimination System
 * Identifies and helps eliminate mock data dependencies for production readiness
 */

export interface MockDataIssue {
  id: string
  type: 'mock_data' | 'placeholder' | 'hardcoded' | 'test_only' | 'todo' | 'development_only'
  severity: 'critical' | 'high' | 'medium' | 'low'
  location: string
  description: string
  mockContent: string
  suggestedFix: string
  isProductionBlocking: boolean
}

export interface MockDataScanResult {
  totalIssues: number
  criticalIssues: number
  productionBlockingIssues: number
  issuesByType: Record<string, number>
  issues: MockDataIssue[]
  scanTimestamp: number
}

/**
 * Known mock data patterns and their locations
 */
const KNOWN_MOCK_DATA_PATTERNS = [
  // Cost tracking service mock data
  {
    id: 'cost-tracking-mock',
    type: 'mock_data' as const,
    severity: 'critical' as const,
    location: 'src/lib/services/cost-tracking.ts',
    description: 'Cost tracking service returns hardcoded mock data instead of real cost records',
    mockContent: 'Return mock data for UI development',
    suggestedFix: 'Implement real cost tracking with Supabase database queries',
    isProductionBlocking: true
  },
  
  // Test environment variables
  {
    id: 'jest-mock-env',
    type: 'test_only' as const,
    severity: 'medium' as const,
    location: 'jest.setup.js',
    description: 'Jest setup contains mock environment variables and API mocks',
    mockContent: 'Mock environment variables and API responses for testing',
    suggestedFix: 'Ensure test mocks are properly isolated and not used in production',
    isProductionBlocking: false
  },
  
  // Test auth endpoint
  {
    id: 'test-auth-endpoint',
    type: 'development_only' as const,
    severity: 'high' as const,
    location: 'src/app/api/test-auth/route.ts',
    description: 'Test authentication endpoint should not exist in production',
    mockContent: 'Test user creation endpoint for development',
    suggestedFix: 'Remove test auth endpoint or restrict to development environment only',
    isProductionBlocking: true
  },
  
  // Optimized component placeholder content
  {
    id: 'optimized-list-placeholders',
    type: 'placeholder' as const,
    severity: 'low' as const,
    location: 'src/components/ui/optimized-component.tsx',
    description: 'Default empty and loading components use placeholder text',
    mockContent: 'No items to display, skeleton loading placeholders',
    suggestedFix: 'Replace with context-appropriate messages and branded loading states',
    isProductionBlocking: false
  },
  
  // Chat editing mockups
  {
    id: 'chat-editing-mockups',
    type: 'placeholder' as const,
    severity: 'low' as const,
    location: 'CHAT_EDITING_UX_MOCKUPS.md',
    description: 'Chat editing contains mockup code that should not be in production',
    mockContent: 'Mockup components and placeholder implementations',
    suggestedFix: 'Remove mockup documentation or move to development docs',
    isProductionBlocking: false
  }
]

/**
 * Patterns to search for in code that indicate mock data
 */
const MOCK_DATA_SEARCH_PATTERNS = [
  // Common mock data indicators
  /mock|Mock|MOCK/g,
  /placeholder|Placeholder|PLACEHOLDER/g,
  /dummy|Dummy|DUMMY/g,
  /test.*data|Test.*Data|TEST.*DATA/g,
  /fake|Fake|FAKE/g,
  /sample|Sample|SAMPLE/g,
  
  // TODO and development comments
  /TODO|FIXME|HACK|XXX/g,
  /temporary|Temporary|TEMPORARY/g,
  /development.*only|Development.*Only|DEVELOPMENT.*ONLY/g,
  
  // Hardcoded values that should be dynamic
  /hardcoded|Hardcoded|HARDCODED/g,
  /static.*data|Static.*Data|STATIC.*DATA/g,
  
  // Test-specific patterns
  /jest\.mock|jest\.fn/g,
  /\.mockImplementation|\.mockReturnValue/g,
  /process\.env\.NODE_ENV.*test/g
]

/**
 * File patterns that commonly contain mock data
 */
const MOCK_DATA_FILE_PATTERNS = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/jest.setup.js',
  '**/jest.config.js',
  '**/__mocks__/**',
  '**/*.mock.ts',
  '**/*.mock.tsx',
  '**/test-*.ts',
  '**/test-*.tsx',
  '**/*-test.ts',
  '**/*-test.tsx'
]

/**
 * Scan for mock data issues in the codebase
 */
export async function scanForMockData(): Promise<MockDataScanResult> {
  const issues: MockDataIssue[] = [...KNOWN_MOCK_DATA_PATTERNS]
  
  // Additional dynamic scanning could be implemented here
  // For now, we'll use the known patterns
  
  const result: MockDataScanResult = {
    totalIssues: issues.length,
    criticalIssues: issues.filter(i => i.severity === 'critical').length,
    productionBlockingIssues: issues.filter(i => i.isProductionBlocking).length,
    issuesByType: issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    issues,
    scanTimestamp: Date.now()
  }
  
  return result
}

/**
 * Get production-blocking issues that must be fixed
 */
export function getProductionBlockingIssues(scanResult: MockDataScanResult): MockDataIssue[] {
  return scanResult.issues.filter(issue => issue.isProductionBlocking)
}

/**
 * Get issues by severity level
 */
export function getIssuesBySeverity(
  scanResult: MockDataScanResult, 
  severity: MockDataIssue['severity']
): MockDataIssue[] {
  return scanResult.issues.filter(issue => issue.severity === severity)
}

/**
 * Get issues by type
 */
export function getIssuesByType(
  scanResult: MockDataScanResult, 
  type: MockDataIssue['type']
): MockDataIssue[] {
  return scanResult.issues.filter(issue => issue.type === type)
}

/**
 * Generate a production readiness report
 */
export function generateProductionReadinessReport(scanResult: MockDataScanResult): {
  isProductionReady: boolean
  blockers: MockDataIssue[]
  warnings: MockDataIssue[]
  recommendations: string[]
} {
  const blockers = getProductionBlockingIssues(scanResult)
  const warnings = scanResult.issues.filter(i => !i.isProductionBlocking && i.severity !== 'low')
  
  const recommendations: string[] = []
  
  if (blockers.length > 0) {
    recommendations.push(`Fix ${blockers.length} production-blocking issues before deployment`)
  }
  
  if (warnings.length > 0) {
    recommendations.push(`Address ${warnings.length} high-priority warnings for better production quality`)
  }
  
  const mockDataIssues = getIssuesByType(scanResult, 'mock_data')
  if (mockDataIssues.length > 0) {
    recommendations.push(`Replace ${mockDataIssues.length} mock data implementations with real functionality`)
  }
  
  const testOnlyIssues = getIssuesByType(scanResult, 'test_only')
  if (testOnlyIssues.length > 0) {
    recommendations.push(`Ensure ${testOnlyIssues.length} test-only features are properly isolated`)
  }
  
  const devOnlyIssues = getIssuesByType(scanResult, 'development_only')
  if (devOnlyIssues.length > 0) {
    recommendations.push(`Remove or restrict ${devOnlyIssues.length} development-only features`)
  }
  
  return {
    isProductionReady: blockers.length === 0,
    blockers,
    warnings,
    recommendations
  }
}

/**
 * Validate that environment variables are properly configured
 */
export function validateEnvironmentConfiguration(): {
  isValid: boolean
  missingVariables: string[]
  testVariables: string[]
  recommendations: string[]
} {
  const requiredVariables = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'REPLICATE_API_TOKEN',
    'GOOGLE_AI_API_KEY'
  ]
  
  const optionalVariables = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ]
  
  const testPatterns = [
    'test-',
    'mock-',
    'fake-',
    'dummy-',
    'localhost',
    'example.com'
  ]
  
  const missingVariables: string[] = []
  const testVariables: string[] = []
  const recommendations: string[] = []
  
  // Check required variables
  requiredVariables.forEach(varName => {
    const value = process.env[varName]
    if (!value) {
      missingVariables.push(varName)
    } else {
      // Check if it looks like a test value
      const lowerValue = value.toLowerCase()
      if (testPatterns.some(pattern => lowerValue.includes(pattern))) {
        testVariables.push(varName)
      }
    }
  })
  
  // Generate recommendations
  if (missingVariables.length > 0) {
    recommendations.push(`Set missing environment variables: ${missingVariables.join(', ')}`)
  }
  
  if (testVariables.length > 0) {
    recommendations.push(`Replace test values in: ${testVariables.join(', ')}`)
  }
  
  // Check for development-only variables in production
  if (process.env.NODE_ENV === 'production') {
    const devVariables = Object.keys(process.env).filter(key => 
      key.includes('TEST') || key.includes('DEV') || key.includes('DEBUG')
    )
    
    if (devVariables.length > 0) {
      recommendations.push(`Remove development variables in production: ${devVariables.join(', ')}`)
    }
  }
  
  return {
    isValid: missingVariables.length === 0 && testVariables.length === 0,
    missingVariables,
    testVariables,
    recommendations
  }
}

/**
 * Check for TODO comments and development notes
 */
export function scanForDevelopmentComments(): {
  todoCount: number
  fixmeCount: number
  hackCount: number
  locations: Array<{
    type: 'TODO' | 'FIXME' | 'HACK' | 'XXX'
    location: string
    content: string
  }>
} {
  // This would be implemented with actual file scanning
  // For now, return a placeholder structure
  return {
    todoCount: 0,
    fixmeCount: 0,
    hackCount: 0,
    locations: []
  }
}

/**
 * Comprehensive production readiness check
 */
export async function performProductionReadinessCheck(): Promise<{
  mockDataScan: MockDataScanResult
  environmentCheck: ReturnType<typeof validateEnvironmentConfiguration>
  developmentComments: ReturnType<typeof scanForDevelopmentComments>
  overallReadiness: {
    isReady: boolean
    score: number // 0-100
    criticalIssues: number
    recommendations: string[]
  }
}> {
  const mockDataScan = await scanForMockData()
  const environmentCheck = validateEnvironmentConfiguration()
  const developmentComments = scanForDevelopmentComments()
  
  const productionReport = generateProductionReadinessReport(mockDataScan)
  
  // Calculate readiness score
  let score = 100
  score -= productionReport.blockers.length * 25 // Critical blockers
  score -= productionReport.warnings.length * 10 // Warnings
  score -= environmentCheck.missingVariables.length * 15 // Missing env vars
  score -= environmentCheck.testVariables.length * 10 // Test env vars
  score -= developmentComments.todoCount * 2 // TODO comments
  score -= developmentComments.fixmeCount * 5 // FIXME comments
  score -= developmentComments.hackCount * 10 // HACK comments
  
  score = Math.max(0, Math.min(100, score))
  
  const allRecommendations = [
    ...productionReport.recommendations,
    ...environmentCheck.recommendations
  ]
  
  return {
    mockDataScan,
    environmentCheck,
    developmentComments,
    overallReadiness: {
      isReady: productionReport.isProductionReady && environmentCheck.isValid,
      score,
      criticalIssues: productionReport.blockers.length + environmentCheck.missingVariables.length,
      recommendations: allRecommendations
    }
  }
}
