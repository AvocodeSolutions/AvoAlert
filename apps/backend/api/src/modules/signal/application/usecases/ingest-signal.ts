import { TradingSignal } from '../../domain/entities'
import { SignalIngestUseCase } from '../ports'

export class IngestSignalUseCase implements SignalIngestUseCase {
  async execute(payload: unknown): Promise<TradingSignal> {
    // Minimal validation placeholder
    const body = payload as Partial<TradingSignal>
    if (!body?.symbol || !body?.timeframe || !body?.action || !body?.timestamp) {
      throw new Error('Invalid signal payload')
    }
    
    // Add default price if not provided
    const price = body.price || 0
    return {
      ...body,
      price,
    } as TradingSignal
  }
}

