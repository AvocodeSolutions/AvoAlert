import { TradingSignal } from '../domain/entities'

export interface SignalIngestUseCase {
  execute(payload: unknown): Promise<TradingSignal>
}

