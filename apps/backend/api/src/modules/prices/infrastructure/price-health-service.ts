/**
 * Price Health Service
 * Monitors the health of price services and provides status information
 */

import { PriceHealthService } from '../application/ports'

interface HealthMetrics {
  errorCount: number
  lastError: Date | null
  lastSuccessfulUpdate: Date | null
  startTime: Date
  totalRequests: number
  successfulRequests: number
}

export class DefaultPriceHealthService implements PriceHealthService {
  private metrics: HealthMetrics
  private errors: Error[] = []
  private maxErrorHistory = 100

  constructor() {
    this.metrics = {
      errorCount: 0,
      lastError: null,
      lastSuccessfulUpdate: null,
      startTime: new Date(),
      totalRequests: 0,
      successfulRequests: 0
    }
  }

  async getStatus(): Promise<{
    streamConnected: boolean
    lastUpdate: Date | null
    cacheHealth: boolean
    fallbackAvailable: boolean
    subscribedSymbols: string[]
    errorCount: number
  }> {
    return {
      streamConnected: false, // Will be updated by stream service
      lastUpdate: this.metrics.lastSuccessfulUpdate,
      cacheHealth: true, // Will be updated by cache health checks
      fallbackAvailable: true, // Will be updated by fallback service
      subscribedSymbols: [], // Will be updated by stream service
      errorCount: this.metrics.errorCount
    }
  }

  async resetErrors(): Promise<void> {
    this.metrics.errorCount = 0
    this.metrics.lastError = null
    this.errors = []
  }

  // Track successful operations
  recordSuccess(): void {
    this.metrics.successfulRequests++
    this.metrics.totalRequests++
    this.metrics.lastSuccessfulUpdate = new Date()
  }

  // Track errors
  recordError(error: Error): void {
    this.metrics.errorCount++
    this.metrics.totalRequests++
    this.metrics.lastError = new Date()
    
    // Keep error history with limit
    this.errors.push(error)
    if (this.errors.length > this.maxErrorHistory) {
      this.errors.shift()
    }
  }

  // Get detailed metrics
  getMetrics(): HealthMetrics & {
    successRate: number
    uptime: number
    recentErrors: Error[]
  } {
    const now = Date.now()
    const uptime = now - this.metrics.startTime.getTime()
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 100

    return {
      ...this.metrics,
      successRate,
      uptime,
      recentErrors: this.errors.slice(-10) // Last 10 errors
    }
  }

  // Check if service is healthy based on error rate
  isHealthy(): boolean {
    const metrics = this.getMetrics()
    
    // Consider unhealthy if:
    // - Success rate below 80%
    // - More than 50 errors in total
    // - Last 10 requests all failed
    
    if (metrics.successRate < 80) return false
    if (metrics.errorCount > 50) return false
    
    // Check recent error pattern
    const recentRequests = Math.min(10, metrics.totalRequests)
    const recentErrors = this.errors.slice(-recentRequests)
    if (recentRequests > 5 && recentErrors.length === recentRequests) {
      return false
    }

    return true
  }

  // Get health summary
  getHealthSummary(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    message: string
    metrics: {
      successRate: number
      errorCount: number
      uptime: string
    }
  } {
    const metrics = this.getMetrics()
    const isHealthy = this.isHealthy()
    
    let status: 'healthy' | 'degraded' | 'unhealthy'
    let message: string

    if (isHealthy) {
      status = 'healthy'
      message = 'All services operating normally'
    } else if (metrics.successRate > 50) {
      status = 'degraded'
      message = 'Some services experiencing issues'
    } else {
      status = 'unhealthy'
      message = 'Critical service failures detected'
    }

    return {
      status,
      message,
      metrics: {
        successRate: Math.round(metrics.successRate * 100) / 100,
        errorCount: metrics.errorCount,
        uptime: this.formatUptime(metrics.uptime)
      }
    }
  }

  private formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  // Get error patterns for debugging
  getErrorAnalysis(): {
    mostCommonErrors: { message: string; count: number }[]
    errorsByHour: { hour: string; count: number }[]
    recentErrorTrend: 'increasing' | 'decreasing' | 'stable'
  } {
    // Count error types
    const errorCounts = new Map<string, number>()
    this.errors.forEach(error => {
      const message = error.message
      errorCounts.set(message, (errorCounts.get(message) || 0) + 1)
    })

    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Group errors by hour
    const errorsByHour = new Map<string, number>()
    this.errors.forEach(error => {
      const hour = new Date(error.message).getHours().toString().padStart(2, '0') + ':00'
      errorsByHour.set(hour, (errorsByHour.get(hour) || 0) + 1)
    })

    // Analyze trend (simplified)
    const recentErrors = this.errors.slice(-20)
    const firstHalf = recentErrors.slice(0, 10)
    const secondHalf = recentErrors.slice(10)
    
    let recentErrorTrend: 'increasing' | 'decreasing' | 'stable'
    if (secondHalf.length > firstHalf.length * 1.2) {
      recentErrorTrend = 'increasing'
    } else if (secondHalf.length < firstHalf.length * 0.8) {
      recentErrorTrend = 'decreasing'
    } else {
      recentErrorTrend = 'stable'
    }

    return {
      mostCommonErrors,
      errorsByHour: Array.from(errorsByHour.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
      recentErrorTrend
    }
  }
}