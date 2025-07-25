/**
 * Comprehensive logging utility for debugging application startup and runtime issues
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
  error?: Error
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private currentLevel = LogLevel.DEBUG

  setLevel(level: LogLevel) {
    this.currentLevel = level
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel
  }

  private createEntry(level: LogLevel, component: string, message: string, data?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      error
    }
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output
    const levelName = LogLevel[entry.level]
    const prefix = `[${entry.timestamp}] [${levelName}] [${entry.component}]`
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data || '')
        break
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data || '')
        break
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data || '', entry.error || '')
        break
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.data || '', entry.error || '')
        break
    }
  }

  debug(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(this.createEntry(LogLevel.DEBUG, component, message, data))
    }
  }

  info(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(this.createEntry(LogLevel.INFO, component, message, data))
    }
  }

  warn(component: string, message: string, data?: any, error?: Error) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(this.createEntry(LogLevel.WARN, component, message, data, error))
    }
  }

  error(component: string, message: string, data?: any, error?: Error) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(this.createEntry(LogLevel.ERROR, component, message, data, error))
    }
  }

  // Specialized logging methods
  startup(component: string, message: string, data?: any) {
    this.info(`STARTUP:${component}`, message, data)
  }

  apiCall(component: string, endpoint: string, method: string = 'GET', data?: any) {
    this.debug(`API:${component}`, `${method} ${endpoint}`, data)
  }

  apiError(component: string, endpoint: string, error: Error, data?: any) {
    this.error(`API:${component}`, `Failed ${endpoint}`, data, error)
  }

  componentMount(component: string, props?: any) {
    this.debug(`COMPONENT:${component}`, 'Mounting', props)
  }

  componentError(component: string, error: Error, props?: any) {
    this.error(`COMPONENT:${component}`, 'Error occurred', props, error)
  }

  // Get logs for debugging
  getLogs(level?: LogLevel, component?: string): LogEntry[] {
    let filteredLogs = this.logs

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level)
    }

    if (component) {
      filteredLogs = filteredLogs.filter(log => 
        log.component.toLowerCase().includes(component.toLowerCase())
      )
    }

    return filteredLogs
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Clear logs
  clearLogs() {
    this.logs = []
  }

  // Get summary of recent issues
  getRecentIssues(minutes: number = 5): LogEntry[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.logs.filter(log => 
      (log.level === LogLevel.WARN || log.level === LogLevel.ERROR) &&
      new Date(log.timestamp) > cutoff
    )
  }
}

// Singleton logger instance
export const logger = new Logger()

// Convenience functions
export function logStartup(component: string, message: string, data?: any) {
  logger.startup(component, message, data)
}

export function logError(component: string, message: string, error?: Error, data?: any) {
  logger.error(component, message, data, error)
}

export function logWarning(component: string, message: string, data?: any, error?: Error) {
  logger.warn(component, message, data, error)
}

export function logInfo(component: string, message: string, data?: any) {
  logger.info(component, message, data)
}

export function logDebug(component: string, message: string, data?: any) {
  logger.debug(component, message, data)
}

export function logApiCall(component: string, endpoint: string, method?: string, data?: any) {
  logger.apiCall(component, endpoint, method, data)
}

export function logApiError(component: string, endpoint: string, error: Error, data?: any) {
  logger.apiError(component, endpoint, error, data)
}

export function logComponentMount(component: string, props?: any) {
  logger.componentMount(component, props)
}

export function logComponentError(component: string, error: Error, props?: any) {
  logger.componentError(component, error, props)
}

// Initialize logging
if (typeof window !== 'undefined') {
  // Browser environment
  logger.setLevel(process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO)
  
  // Add global error handler
  window.addEventListener('error', (event) => {
    logger.error('GLOBAL', 'Unhandled error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }, event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('GLOBAL', 'Unhandled promise rejection', {
      reason: event.reason
    })
  })
} else {
  // Server environment
  logger.setLevel(LogLevel.INFO)
}

// Export logger for advanced usage
export { logger as default }
