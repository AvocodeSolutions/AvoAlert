/**
 * Symbol Mapping Service
 * Maps between different exchange symbol formats
 */

import { SymbolMappingService } from '../application/ports'
import { SymbolMapping } from '../domain/entities'

export class DefaultSymbolMappingService implements SymbolMappingService {
  private mappings: Map<string, SymbolMapping> = new Map()

  constructor() {
    this.initializeDefaultMappings()
  }

  getMapping(symbol: string): SymbolMapping | null {
    return this.mappings.get(symbol.toUpperCase()) || null
  }

  getAllMappings(): SymbolMapping[] {
    return Array.from(this.mappings.values())
  }

  getBinanceSymbol(symbol: string): string | null {
    const mapping = this.getMapping(symbol)
    return mapping?.binanceSymbol || null
  }

  getCoinGeckoId(symbol: string): string | null {
    const mapping = this.getMapping(symbol)
    return mapping?.coinGeckoId || null
  }

  getTradingViewSymbol(symbol: string): string | null {
    const mapping = this.getMapping(symbol)
    return mapping?.tradingViewSymbol || null
  }

  validateSymbol(symbol: string): boolean {
    return this.mappings.has(symbol.toUpperCase())
  }

  // Add new mapping (useful for dynamic updates)
  addMapping(mapping: SymbolMapping): void {
    this.mappings.set(mapping.symbol.toUpperCase(), mapping)
  }

  // Remove mapping
  removeMapping(symbol: string): void {
    this.mappings.delete(symbol.toUpperCase())
  }

  // Load mappings from database (if needed)
  async loadMappingsFromDb(dbConnection: any): Promise<void> {
    try {
      // This would fetch coin symbols from your existing coins table
      // const coins = await dbConnection.query('SELECT symbol FROM coins WHERE active = true')
      // for (const coin of coins) {
      //   if (!this.mappings.has(coin.symbol)) {
      //     this.addMapping(this.createMapping(coin.symbol))
      //   }
      // }
    } catch (error) {
      console.error('Failed to load mappings from database:', error)
    }
  }

  private initializeDefaultMappings(): void {
    // Major cryptocurrencies from your coins_rows.sql
    const symbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT',
      'MATICUSDT', 'SOLUSDT', 'LTCUSDT', 'AVAXUSDT', 'TRXUSDT', 'LINKUSDT',
      'ATOMUSDT', 'XLMUSDT', 'XMRUSDT', 'ETCUSDT', 'FILUSDT', 'ICPUSDT',
      'HBARUSDT', 'APTUSDT', 'NEARUSDT', 'ARBUSDT', 'OPUSDT', 'INJUSDT',
      'SUIUSDT', 'DOTUSDT', 'UNIUSDT', 'AAVEUSDT', 'MANAUSDT', 'SANDUSDT',
      'GRTUSDT', 'CHZUSDT', 'FTMUSDT', 'ALGOUSDT', 'APEUSDT', 'CRVUSDT',
      'VETUSDT', 'ZILUSDT', 'ZECUSDT', 'ZENUSDT', 'ENJUSDT', '1INCHUSDT',
      'DASHUSDT', 'YFIUSDT', 'COMPUSDT', 'SUSHIUSDT', 'NEOUSDT', 'IOSTUSDT',
      'ONTUSDT', 'QNTUSDT', 'WAVESUSDT', 'KSMUSDT', 'OMGUSDT', 'SKLUSDT',
      'BANDUSDT', 'BALUSDT', 'KNCUSDT', 'RENUSDT', 'RUNEUSDT', 'STXUSDT',
      'KAVAUSDT', 'CELOUSDT', 'EGLDUSDT', 'FLOWUSDT', 'ANKRUSDT', 'CELRUSDT',
      'COTIUSDT', 'SXPUSDT', 'OCEANUSDT', 'ROSEUSDT', 'DYDXUSDT', 'IMXUSDT',
      'GMXUSDT', 'FETUSDT', 'MASKUSDT', 'WOOUSDT', 'TONUSDT', 'FLMUSDT',
      'ZKUSDT', 'PYTHUSDT', 'TIAUSDT', 'PIXELUSDT', 'REZUSDT', 'HOTUSDT',
      'JTOUSDT', 'BLURUSDT', 'IDUSDT', 'NEXOUSDT', 'ARKMUSDT', 'AGIXUSDT',
      'BTTCUSDT', 'JUPUSDT', 'PORTALUSDT', 'SEIUSDT', 'ENAUSDT', 'NOTUSDT',
      'STRKUSDT', 'ORDIUSDT', 'ALTUSDT', 'RNDRUSDT', 'RSRUSDT', 'LISTAUSDT',
      'OMNIUSDT', 'TNSRUSDT', 'SATSUSDT'
    ]

    for (const symbol of symbols) {
      this.addMapping(this.createMapping(symbol))
    }
  }

  private createMapping(symbol: string): SymbolMapping {
    const upperSymbol = symbol.toUpperCase()
    
    // Extract base currency (remove USDT)
    const baseCurrency = upperSymbol.replace('USDT', '').toLowerCase()
    
    return {
      symbol: upperSymbol,
      binanceSymbol: upperSymbol, // Binance uses same format
      coinGeckoId: this.getCoinGeckoIdMapping(baseCurrency),
      tradingViewSymbol: `BINANCE:${upperSymbol}`
    }
  }

  private getCoinGeckoIdMapping(baseCurrency: string): string {
    // Map common symbols to CoinGecko IDs
    const coinGeckoMappings: { [key: string]: string } = {
      'btc': 'bitcoin',
      'eth': 'ethereum',
      'bnb': 'binancecoin',
      'xrp': 'ripple',
      'ada': 'cardano',
      'doge': 'dogecoin',
      'matic': 'matic-network',
      'sol': 'solana',
      'ltc': 'litecoin',
      'avax': 'avalanche-2',
      'trx': 'tron',
      'link': 'chainlink',
      'atom': 'cosmos',
      'xlm': 'stellar',
      'xmr': 'monero',
      'etc': 'ethereum-classic',
      'fil': 'filecoin',
      'icp': 'internet-computer',
      'hbar': 'hedera-hashgraph',
      'apt': 'aptos',
      'near': 'near',
      'arb': 'arbitrum',
      'op': 'optimism',
      'inj': 'injective-protocol',
      'sui': 'sui',
      'dot': 'polkadot',
      'uni': 'uniswap',
      'aave': 'aave',
      'mana': 'decentraland',
      'sand': 'the-sandbox',
      'grt': 'the-graph',
      'chz': 'chiliz',
      'ftm': 'fantom',
      'algo': 'algorand',
      'ape': 'apecoin',
      'crv': 'curve-dao-token',
      'vet': 'vechain',
      'zil': 'zilliqa',
      'zec': 'zcash',
      'zen': 'zencash',
      'enj': 'enjincoin',
      '1inch': '1inch',
      'dash': 'dash',
      'yfi': 'yearn-finance',
      'comp': 'compound-governance-token',
      'sushi': 'sushi',
      'neo': 'neo',
      'iost': 'iostoken',
      'ont': 'ontology',
      'qnt': 'quant-network',
      'waves': 'waves',
      'ksm': 'kusama',
      'omg': 'omisego',
      'skl': 'skale',
      'band': 'band-protocol',
      'bal': 'balancer',
      'knc': 'kyber-network-crystal',
      'ren': 'republic-protocol',
      'rune': 'thorchain',
      'stx': 'stacks',
      'kava': 'kava',
      'celo': 'celo',
      'egld': 'elrond-erd-2',
      'flow': 'flow',
      'ankr': 'ankr',
      'celr': 'celer-network',
      'coti': 'coti',
      'sxp': 'swipe',
      'ocean': 'ocean-protocol',
      'rose': 'oasis-network',
      'dydx': 'dydx',
      'imx': 'immutable-x',
      'gmx': 'gmx',
      'fet': 'fetch-ai',
      'mask': 'mask-network',
      'woo': 'woo-network',
      'ton': 'the-open-network',
      'flm': 'flamingo-finance',
      'zk': 'zkswap',
      'pyth': 'pyth-network',
      'tia': 'celestia',
      'pixel': 'pixels',
      'rez': 'renzo',
      'hot': 'holo',
      'jto': 'jito-governance-token',
      'blur': 'blur',
      'id': 'space-id',
      'nexo': 'nexo',
      'arkm': 'arkham',
      'agix': 'singularitynet',
      'bttc': 'bittorrent',
      'jup': 'jupiter-exchange-solana',
      'portal': 'portal',
      'sei': 'sei-network',
      'ena': 'ethena',
      'not': 'notcoin',
      'strk': 'starknet',
      'ordi': 'ordi',
      'alt': 'altlayer',
      'rndr': 'render-token',
      'rsr': 'reserve-rights-token',
      'lista': 'lista-dao',
      'omni': 'omni-network',
      'tnsr': 'tensor',
      'sats': 'ordinals'
    }

    return coinGeckoMappings[baseCurrency] || baseCurrency
  }

  // Utility method to validate if we support a symbol
  isSupportedSymbol(symbol: string): boolean {
    return this.validateSymbol(symbol)
  }

  // Get all supported symbols
  getSupportedSymbols(): string[] {
    return Array.from(this.mappings.keys())
  }

  // Search for symbols by pattern
  searchSymbols(pattern: string): SymbolMapping[] {
    const upperPattern = pattern.toUpperCase()
    return this.getAllMappings().filter(mapping =>
      mapping.symbol.includes(upperPattern)
    )
  }
}