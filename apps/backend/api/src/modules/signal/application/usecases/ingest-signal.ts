import { TradingSignal } from '../../domain/entities'
import { SignalIngestUseCase } from '../ports'

export class IngestSignalUseCase implements SignalIngestUseCase {
  async execute(payload: unknown): Promise<TradingSignal> {
    // Minimal validation placeholder
    const body = payload as Partial<TradingSignal>
    if (!body?.symbol || !body?.timeframe || !body?.action || !body?.timestamp) {
      throw new Error('Invalid signal payload')
    }
    
    // Default price if not provided (for backward compatibility)
    const price = typeof body.price === 'number' ? body.price : 0
    
    return {
      ...body,
      price,
    } as TradingSignal
  }
}

