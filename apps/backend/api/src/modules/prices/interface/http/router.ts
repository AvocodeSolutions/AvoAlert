/**
 * Prices HTTP Router
 * REST API endpoints for price data
 */

import { Router } from 'express'
import { z } from 'zod'
import { GetCurrentPricesUseCase } from '../../application/usecases/get-current-prices'
import { StartPriceStreamUseCase } from '../../application/usecases/start-price-stream'
import { GetPriceHealthUseCase } from '../../application/usecases/get-price-health'

// Request validation schemas
const GetPricesSchema = z.object({
  symbols: z.array(z.string()).min(1).max(100),
  preferCache: z.boolean().optional().default(true),
  maxCacheAge: z.number().min(1).max(3600).optional().default(600)
})

const StartStreamSchema = z.object({
  symbols: z.array(z.string()).min(1).max(100),
  enableCaching: z.boolean().optional().default(true),
  cacheTtl: z.number().min(1).max(3600).optional().default(600)
})

export function createPricesRouter(
  getCurrentPricesUseCase: GetCurrentPricesUseCase,
  startPriceStreamUseCase: StartPriceStreamUseCase,
  getPriceHealthUseCase: GetPriceHealthUseCase
): Router {
  const router = Router()

  // GET /prices/current?symbols=BTCUSDT,ETHUSDT&preferCache=true&maxCacheAge=300
  router.get('/current', async (req, res) => {
    try {
      // Parse query parameters
      const symbols = typeof req.query.symbols === 'string' 
        ? req.query.symbols.split(',').map(s => s.trim().toUpperCase())
        : []
      
      const preferCache = req.query.preferCache === 'true'
      const maxCacheAge = req.query.maxCacheAge 
        ? parseInt(req.query.maxCacheAge as string) 
        : 600

      // Validate input
      if (symbols.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No symbols provided'
        })
      }

      const validatedInput = GetPricesSchema.parse({
        symbols: symbols,
        preferCache,
        maxCacheAge
      })

      // Execute use case
      const result = await getCurrentPricesUseCase.execute({
        symbols: validatedInput.symbols,
        preferCache: validatedInput.preferCache,
        maxCacheAge: validatedInput.maxCacheAge
      })

      // Convert Map to optimized object for JSON response (reduce payload size)
      const pricesObj: { [key: string]: any } = {}
      for (const [symbol, priceData] of result.prices) {
        pricesObj[symbol] = {
          p: priceData.price, // price (shortened)
          c: priceData.change24h, // change24h (shortened)
          u: priceData.lastUpdate // lastUpdate (shortened)
          // Removed volume24h, high24h, low24h to reduce payload size
        }
      }

      res.json({
        success: true,
        data: {
          prices: pricesObj,
          // Removed metadata to reduce payload size for better performance
        }
      })

    } catch (error) {
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: error.errors
        })
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // POST /prices/current (for large symbol lists)
  router.post('/current', async (req, res) => {
    try {
      const validatedInput = GetPricesSchema.parse(req.body)
      const result = await getCurrentPricesUseCase.execute({
        symbols: validatedInput.symbols,
        preferCache: validatedInput.preferCache,
        maxCacheAge: validatedInput.maxCacheAge
      })

      // Convert Map to optimized object for JSON response (reduce payload size)
      const pricesObj: { [key: string]: any } = {}
      for (const [symbol, priceData] of result.prices) {
        pricesObj[symbol] = {
          p: priceData.price, // price (shortened)
          c: priceData.change24h, // change24h (shortened)
          u: priceData.lastUpdate // lastUpdate (shortened)
          // Removed volume24h, high24h, low24h to reduce payload size
        }
      }

      res.json({
        success: true,
        data: {
          prices: pricesObj,
          // Removed metadata to reduce payload size for better performance
        }
      })

    } catch (error) {
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: error.errors
        })
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // GET /prices/:symbol
  router.get('/:symbol', async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase()
      
      const result = await getCurrentPricesUseCase.execute({
        symbols: [symbol],
        preferCache: true,
        maxCacheAge: 600
      })

      const priceData = result.prices.get(symbol)

      if (!priceData) {
        return res.status(404).json({
          success: false,
          error: 'Price not found',
          symbol
        })
      }

      res.json({
        success: true,
        data: {
          symbol,
          price: priceData,
          metadata: {
            source: result.fromCache.includes(symbol) ? 'cache' : 'api',
            requestTime: new Date().toISOString()
          }
        }
      })

    } catch (error) {
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // POST /prices/stream/start
  router.post('/stream/start', async (req, res) => {
    try {
      const validatedInput = StartStreamSchema.parse(req.body)
      const result = await startPriceStreamUseCase.execute({
        symbols: validatedInput.symbols,
        enableCaching: validatedInput.enableCaching,
        cacheTtl: validatedInput.cacheTtl
      })

      res.json({
        success: result.success,
        data: {
          streamStatus: result.streamStatus,
          connectedSymbols: result.connectedSymbols,
          errors: result.errors,
          startTime: new Date().toISOString()
        }
      })

    } catch (error) {
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: error.errors
        })
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // POST /prices/stream/stop
  router.post('/stream/stop', async (req, res) => {
    try {
      await startPriceStreamUseCase.stop()
      
      res.json({
        success: true,
        data: {
          message: 'Price stream stopped',
          stopTime: new Date().toISOString()
        }
      })

    } catch (error) {
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // GET /prices/stream/status
  router.get('/stream/status', async (req, res) => {
    try {
      const isRunning = startPriceStreamUseCase.isStreamRunning()
      
      res.json({
        success: true,
        data: {
          isRunning,
          status: isRunning ? 'active' : 'inactive',
          checkTime: new Date().toISOString()
        }
      })

    } catch (error) {
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // GET /prices/health
  router.get('/health', async (req, res) => {
    try {
      const health = await getPriceHealthUseCase.execute()
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503

      res.status(statusCode).json({
        success: health.status !== 'unhealthy',
        data: health
      })

    } catch (error) {
      
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // GET /prices/supported-symbols
  router.get('/supported-symbols', async (req, res) => {
    try {
      // This would come from symbol mapping service
      const symbols = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT',
        'MATICUSDT', 'SOLUSDT', 'LTCUSDT', 'AVAXUSDT'
        // ... add more as needed
      ]

      res.json({
        success: true,
        data: {
          symbols,
          totalCount: symbols.length,
          lastUpdated: new Date().toISOString()
        }
      })

    } catch (error) {
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  return router
}