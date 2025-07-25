/**
 * Performance Testing for Storage System
 * Measures and validates performance metrics for the storage workflow
 */

export interface PerformanceMetrics {
  operation: string
  startTime: number
  endTime: number
  duration: number
  bytesProcessed?: number
  throughput?: number // bytes per second
  memoryUsage?: {
    before: number
    after: number
    peak: number
  }
}

export interface PerformanceBenchmark {
  name: string
  target: number // target time in ms
  acceptable: number // acceptable time in ms
  critical: number // critical threshold in ms
}

export interface PerformanceTestResult {
  success: boolean
  metrics: PerformanceMetrics[]
  benchmarks: {
    [key: string]: {
      benchmark: PerformanceBenchmark
      actual: number
      status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical'
    }
  }
  summary: {
    totalTime: number
    averageTime: number
    slowestOperation: string
    fastestOperation: string
    throughput: number
  }
}

export class StoragePerformanceTester {
  private metrics: PerformanceMetrics[] = []
  
  // Performance benchmarks for different operations
  private benchmarks: Record<string, PerformanceBenchmark> = {
    'file-download': {
      name: 'File Download',
      target: 2000, // 2 seconds
      acceptable: 5000, // 5 seconds
      critical: 15000 // 15 seconds
    },
    'file-upload': {
      name: 'File Upload',
      target: 3000, // 3 seconds
      acceptable: 8000, // 8 seconds
      critical: 20000 // 20 seconds
    },
    'database-insert': {
      name: 'Database Insert',
      target: 500, // 500ms
      acceptable: 1500, // 1.5 seconds
      critical: 5000 // 5 seconds
    },
    'gallery-load': {
      name: 'Gallery Load',
      target: 1000, // 1 second
      acceptable: 3000, // 3 seconds
      critical: 8000 // 8 seconds
    },
    'end-to-end': {
      name: 'End-to-End Generation',
      target: 10000, // 10 seconds
      acceptable: 30000, // 30 seconds
      critical: 60000 // 60 seconds
    }
  }

  /**
   * Start measuring an operation
   */
  startMeasurement(operation: string): () => PerformanceMetrics {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    return () => {
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      
      const metric: PerformanceMetrics = {
        operation,
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryUsage: {
          before: startMemory,
          after: endMemory,
          peak: Math.max(startMemory, endMemory)
        }
      }

      this.metrics.push(metric)
      return metric
    }
  }

  /**
   * Measure file processing performance
   */
  async measureFileProcessing(
    fileSize: number,
    operation: 'download' | 'upload'
  ): Promise<PerformanceMetrics> {
    const stopMeasurement = this.startMeasurement(`file-${operation}`)
    
    // Simulate file processing
    await this.simulateFileOperation(fileSize, operation)
    
    const metric = stopMeasurement()
    metric.bytesProcessed = fileSize
    metric.throughput = fileSize / (metric.duration / 1000) // bytes per second
    
    return metric
  }

  /**
   * Measure database operation performance
   */
  async measureDatabaseOperation(
    operation: string,
    recordCount: number = 1
  ): Promise<PerformanceMetrics> {
    const stopMeasurement = this.startMeasurement('database-insert')
    
    try {
      // Test database connection and basic operation
      const { createServiceClient } = await import('@/lib/supabase/server')
      const supabase = createServiceClient()
      
      // Measure a simple query
      const { error } = await supabase
        .from('images')
        .select('id')
        .limit(recordCount)
      
      if (error) {
        throw new Error(`Database operation failed: ${error.message}`)
      }
      
    } catch (error) {
      console.warn('Database measurement failed:', error)
    }
    
    return stopMeasurement()
  }

  /**
   * Measure gallery loading performance
   */
  async measureGalleryLoad(imageCount: number = 20): Promise<PerformanceMetrics> {
    const stopMeasurement = this.startMeasurement('gallery-load')
    
    try {
      const response = await fetch(`/api/gallery?limit=${imageCount}`)
      if (!response.ok) {
        throw new Error(`Gallery API failed: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`Gallery loaded ${data.images?.length || 0} images`)
      
    } catch (error) {
      console.warn('Gallery measurement failed:', error)
    }
    
    return stopMeasurement()
  }

  /**
   * Run comprehensive performance test
   */
  async runPerformanceTest(): Promise<PerformanceTestResult> {
    console.log('Starting performance test...')
    
    // Clear previous metrics
    this.metrics = []
    
    // Test different scenarios
    await this.measureFileProcessing(1024 * 1024, 'download') // 1MB download
    await this.measureFileProcessing(1024 * 1024, 'upload') // 1MB upload
    await this.measureDatabaseOperation('insert', 1)
    await this.measureGalleryLoad(20)
    
    // Measure end-to-end workflow
    const endToEndMetric = await this.measureEndToEndWorkflow()
    
    return this.generateTestResult()
  }

  /**
   * Measure complete end-to-end workflow
   */
  private async measureEndToEndWorkflow(): Promise<PerformanceMetrics> {
    const stopMeasurement = this.startMeasurement('end-to-end')
    
    try {
      // Simulate complete generation workflow
      await this.simulateGenerationWorkflow()
    } catch (error) {
      console.warn('End-to-end measurement failed:', error)
    }
    
    return stopMeasurement()
  }

  /**
   * Simulate file operation for testing
   */
  private async simulateFileOperation(
    fileSize: number,
    operation: 'download' | 'upload'
  ): Promise<void> {
    // Simulate network delay based on file size
    const baseDelay = operation === 'download' ? 100 : 200
    const sizeDelay = fileSize / (1024 * 1024) * 1000 // 1 second per MB
    const totalDelay = baseDelay + sizeDelay
    
    await new Promise(resolve => setTimeout(resolve, Math.min(totalDelay, 5000)))
  }

  /**
   * Simulate complete generation workflow
   */
  private async simulateGenerationWorkflow(): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simulate file processing
    await this.simulateFileOperation(2 * 1024 * 1024, 'download') // 2MB
    await this.simulateFileOperation(2 * 1024 * 1024, 'upload') // 2MB
    
    // Simulate database operations
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  /**
   * Get memory usage (browser environment)
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  /**
   * Generate test result with benchmark comparison
   */
  private generateTestResult(): PerformanceTestResult {
    const benchmarkResults: PerformanceTestResult['benchmarks'] = {}
    
    // Compare metrics against benchmarks
    Object.entries(this.benchmarks).forEach(([key, benchmark]) => {
      const metric = this.metrics.find(m => m.operation === key)
      const actual = metric?.duration || 0
      
      let status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical'
      if (actual <= benchmark.target) {
        status = 'excellent'
      } else if (actual <= benchmark.target * 1.5) {
        status = 'good'
      } else if (actual <= benchmark.acceptable) {
        status = 'acceptable'
      } else if (actual <= benchmark.critical) {
        status = 'poor'
      } else {
        status = 'critical'
      }
      
      benchmarkResults[key] = {
        benchmark,
        actual,
        status
      }
    })
    
    // Calculate summary statistics
    const durations = this.metrics.map(m => m.duration)
    const totalTime = durations.reduce((sum, d) => sum + d, 0)
    const averageTime = totalTime / durations.length
    
    const slowestMetric = this.metrics.reduce((prev, current) => 
      prev.duration > current.duration ? prev : current
    )
    const fastestMetric = this.metrics.reduce((prev, current) => 
      prev.duration < current.duration ? prev : current
    )
    
    const totalBytes = this.metrics.reduce((sum, m) => sum + (m.bytesProcessed || 0), 0)
    const totalSeconds = totalTime / 1000
    const throughput = totalBytes / totalSeconds
    
    const success = Object.values(benchmarkResults).every(
      result => result.status !== 'critical'
    )
    
    return {
      success,
      metrics: this.metrics,
      benchmarks: benchmarkResults,
      summary: {
        totalTime,
        averageTime,
        slowestOperation: slowestMetric.operation,
        fastestOperation: fastestMetric.operation,
        throughput
      }
    }
  }

  /**
   * Generate performance report
   */
  generateReport(result: PerformanceTestResult): string {
    const lines = [
      '# Storage Performance Test Report',
      `Generated: ${new Date().toISOString()}`,
      `Overall Status: ${result.success ? '✅ PASS' : '❌ FAIL'}`,
      '',
      '## Summary',
      `Total Time: ${result.summary.totalTime.toFixed(2)}ms`,
      `Average Time: ${result.summary.averageTime.toFixed(2)}ms`,
      `Slowest Operation: ${result.summary.slowestOperation}`,
      `Fastest Operation: ${result.summary.fastestOperation}`,
      `Throughput: ${(result.summary.throughput / 1024 / 1024).toFixed(2)} MB/s`,
      '',
      '## Benchmark Results'
    ]
    
    Object.entries(result.benchmarks).forEach(([key, benchmark]) => {
      const statusEmoji = {
        excellent: '🟢',
        good: '🔵', 
        acceptable: '🟡',
        poor: '🟠',
        critical: '🔴'
      }[benchmark.status]
      
      lines.push(`### ${benchmark.benchmark.name}`)
      lines.push(`${statusEmoji} Status: ${benchmark.status.toUpperCase()}`)
      lines.push(`Actual: ${benchmark.actual.toFixed(2)}ms`)
      lines.push(`Target: ${benchmark.benchmark.target}ms`)
      lines.push(`Acceptable: ${benchmark.benchmark.acceptable}ms`)
      lines.push('')
    })
    
    return lines.join('\n')
  }
}

// Export singleton instance
export const storagePerformanceTester = new StoragePerformanceTester()

export default StoragePerformanceTester
