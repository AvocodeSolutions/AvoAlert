import { TradingSignal } from '../../domain/entities'
import { SignalIngestUseCase } from '../ports'

export class IngestSignalUseCase implements SignalIngestUseCase {
  async execute(payload: unknown): Promise<TradingSignal> {
    // Minimal validation placeholder
    const body = payload as Partial<TradingSignal>
    if (!body?.symbol || !body?.timeframe || !body?.action || !body?.timestamp) {
      throw new Error('Invalid signal payload')
    }
    
    const price = body.price || 0
    return {
      symbol: body.symbol,
      timeframe: body.timeframe,
      action: body.action,
      price: price,
      timestamp: body.timestamp,
    } as TradingSignal
  }
}

