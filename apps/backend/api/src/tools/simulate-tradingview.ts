import { loadEnv } from '../shared/load-env'
loadEnv()

type Args = {
  url: string
  symbol: string
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  action: 'buy' | 'sell'
  timestamp?: string
  count: number
  intervalMs: number
}

function parseArgs(): Args {
  const defaults: Args = {
    url: process.env.SIMULATE_TV_URL || 'http://localhost:4000/signals/tradingview',
    symbol: process.env.SIMULATE_TV_SYMBOL || 'BINANCE:BTCUSDT',
    timeframe: (process.env.SIMULATE_TV_TIMEFRAME as Args['timeframe']) || '15m',
    action: (process.env.SIMULATE_TV_ACTION as Args['action']) || 'buy',
    timestamp: process.env.SIMULATE_TV_TIMESTAMP,
    count: process.env.SIMULATE_TV_COUNT ? Number(process.env.SIMULATE_TV_COUNT) : 1,
    intervalMs: process.env.SIMULATE_TV_INTERVAL ? Number(process.env.SIMULATE_TV_INTERVAL) : 500,
  }

  const argv = process.argv.slice(2)
  
  // Handle positional args: npm run simulate -- SYMBOL ACTION
  if (argv.length >= 2 && !argv[0].startsWith('--')) {
    defaults.symbol = argv[0]
    defaults.action = argv[1] as Args['action']
  }
  
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]
    const val = argv[i + 1]
    if (!val) continue
    switch (key) {
      case '--url':
        defaults.url = val
        i++
        break
      case '--symbol':
        defaults.symbol = val
        i++
        break
      case '--timeframe':
        defaults.timeframe = val as Args['timeframe']
        i++
        break
      case '--action':
        defaults.action = val as Args['action']
        i++
        break
      case '--timestamp':
        defaults.timestamp = val
        i++
        break
      case '--count':
        defaults.count = Number(val)
        i++
        break
      case '--interval':
        defaults.intervalMs = Number(val)
        i++
        break
      default:
        break
    }
  }
  return defaults
}

function nowIso(): string {
  return new Date().toISOString()
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postWithRetry(url: string, body: unknown, retries = 10, delayMs = 500) {
  let lastErr: unknown
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      return { status: res.status, json }
    } catch (err) {
      lastErr = err
      await sleep(delayMs)
    }
  }
  throw lastErr
}

async function main() {
  const args = parseArgs()
  const secret = process.env.TRADINGVIEW_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('TRADINGVIEW_WEBHOOK_SECRET is not set in environment')
  }

  for (let i = 0; i < args.count; i++) {
    const payload = {
      symbol: args.symbol,
      timeframe: args.timeframe,
      action: args.action,
      timestamp: args.timestamp || nowIso(),
      secret,
      source: 'tradingview',
    }

    const result = await postWithRetry(args.url, payload)
    console.log(`[simulate] #${i + 1}/${args.count} ->`, result.status, result.json)
    if (i < args.count - 1) {
      await sleep(args.intervalMs)
    }
  }
}

main().catch((e) => {
  console.error('simulation failed:', e)
  process.exit(1)
})


