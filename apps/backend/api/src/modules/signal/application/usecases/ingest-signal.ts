import { TradingSignal } from '../../domain/entities'
import { SignalIngestUseCase } from '../ports'

export class IngestSignalUseCase implements SignalIngestUseCase {
  async execute(payload: unknown): Promise<TradingSignal> {
    // Minimal validation placeholder
    const body = payload as Partial<TradingSignal>
    if (!body?.symbol || !body?.timeframe || !body?.action || !body?.timestamp) {
      throw new Error('Invalid signal payload')
    }
    
    return {
      symbol: body.symbol,
      timeframe: body.timeframe,
      action: body.action,
      timestamp: body.timestamp,
    } as TradingSignal
  }
}

