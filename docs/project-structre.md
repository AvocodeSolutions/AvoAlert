## AvoAlert Project Structre (Mevcut Durum)

Bu dosya, depodaki gerçek kodlar üzerinden AvoAlert monorepo yapısını, teknolojileri, giriş noktalarını ve mevcut endpoint'leri belgelemek için hazırlanmıştır.

### Monorepo ve Araçlar

- Çalışma alanı: npm workspaces + Turborepo
- Kök script'ler (`package.json`):
  - `dev`: Tüm projelerde geliştirme süreçlerini başlatır (turbo)
  - `dev:api`: Sadece API geliştirme (`@avoalert/api`)
  - `build`, `test`, `lint`, `type-check`, `clean`

### Kök Düzeyi Dosyalar

- `package.json`: Workspaces tanımları ve ortak script'ler
- `package-lock.json`: Kilitli bağımlılık ağacı
- `turbo.json`: Monorepo pipeline konfigürasyonu
- `README.md`: Üst düzey açıklama (not: planlanan bazı bileşenler henüz kod tabanında yok)

### Dizin Yapısı (Özet)

```
apps/
  backend/
    api/
      package.json
      tsconfig.json
      src/
        app.ts
        infrastructure/
          db/                    # placeholder
        modules/
          signal/
            application/
              ports.ts
              usecases/
                ingest-signal.ts
            domain/
              entities.ts
            index.ts
            infrastructure/      # placeholder
            interface/
              http/
                router.ts
          notification/
            index.ts              # health endpoint
            application/          # placeholder
            domain/               # placeholder
            infrastructure/       # placeholder
            interface/            # placeholder
          billing/
            index.ts              # health endpoint
            application/          # placeholder
            domain/               # placeholder
            infrastructure/       # placeholder
            interface/            # placeholder
        shared/                   # placeholder
  frontend/
    web-client/                   # Next.js 15 (React 19)
      package.json
      next.config.ts
      eslint.config.mjs
      postcss.config.mjs
      components.json
      public/
      src/
        app/
          layout.tsx              # Root layout
          page.tsx                # Landing page
          admin/
            layout.tsx            # Admin layout
            page.tsx              # Admin dashboard
            config/page.tsx       # UT Bot config placeholder
            monitoring/page.tsx   # Monitoring placeholder
        components/ui/            # UI primitives (badge, button, card)
        lib/utils.ts
```

Not: Kök `README.md` içinde `packages/` altında ek paylaşılan paketler (ör. `shared-types`, `shared-config`, `database`, `auth`) ve çoklu backend servisleri (microservice) planı yer alıyor. Mevcut kodda ise backend tek bir API içinde modüler domain klasörleri ile temsil ediliyor.

### Backend API (Express + TypeScript)

- Giriş: `apps/backend/api/src/app.ts`
- Port: `process.env.PORT || 4000`
- Middleware: `express.json()`
- Mount edilen router'lar:
  - `/signals` → `modules/signal/interface/http/router.ts`
  - `/notifications` → `modules/notification/index.ts`
  - `/billing` → `modules/billing/index.ts`

#### Uç Noktalar (gerçekte var olanlar)

- `GET /health` → `{ status: 'ok', service: 'api', architecture: 'modular-monolith' }`
- `GET /` → `{ message: 'AvoAlert API is running' }`
- `GET /signals/health` → `{ status: 'ok', module: 'signal' }`
- `POST /signals/ingest`
  - Body: `{ symbol: string, timeframe: string, action: 'buy'|'sell', price: number, timestamp: string }`
  - 201: `{ ok: true, signal }`, 400: `{ ok: false, error }`
  - Validasyon: Use case içinde temel şekil kontrolü
- `GET /notifications/health` → `{ status: 'ok', module: 'notification' }`
- `GET /billing/health` → `{ status: 'ok', module: 'billing' }`

#### Signal Modülü

- Domain: `TradingSignal` entity (`symbol`, `timeframe`, `action`, `price`, `timestamp`)
- Application:
  - Port: `SignalIngestUseCase`
  - Use case: `IngestSignalUseCase` (basit doğrulama; kalıcılık yok)
- Interface (HTTP): `POST /signals/ingest`, `GET /signals/health`
- Infrastructure: placeholder (DB/queue/entegrasyon yok)

### Frontend (Next.js)

- Geliştirme: `next dev --turbopack`
- Rotalar (App Router): `/`, `/admin`, `/admin/config`, `/admin/monitoring`
- UI: Shadcn benzeri bileşenler (`badge`, `button`, `card`)
- Stil: Tailwind CSS (v4 ekosistem paketleri mevcut)

### TradingView Webhook Akışı (Kararlaştırılmış)

- Alarm yönetimi: Admin panelindeki `UT Bot Configuration` ekranından; sembol/çift ve timeframe bazında UT Bot parametre setleri dinamik olarak tanımlanır.
- Webhook endpoint: `POST /signals/tradingview` (gerekirse `POST /signals/ingest` ile alias yapılabilir).
- Alarm şablonu: Panel, TradingView için kopyalanabilir bir JSON body üretir. Alanlar: `symbol`, `timeframe`, `action`, `price`, `timestamp`, `secret`, `source`.
- Normalizasyon: `symbol` girişleri `BINANCE:BTCUSDT`, `BTCUSDT` veya `BTC/USDT` gelebilir; kanonik form `BTCUSDT` olarak normalize edilir.
- Timeframe kümesi: `1m, 5m, 15m, 1h, 4h, 1d` (genişletilebilir).
- Zaman damgası: ISO8601 UTC beklenir (örn. `2025-01-01T10:00:00Z`).
- Güvenlik: Body'de paylaşılan `secret` zorunlu; ek olarak IP allowlist opsiyonel. Idempotency anahtarı: `symbol + timeframe + timestamp + action`.
- Parametre eşleştirme: `symbol + timeframe` ile admin'de tanımlı UT Bot parametre seti resolve edilir ve iş akışında kullanılır.
- İşleme: Doğrulama → (hedef) kalıcılık → kuyruğa yazma → bildirim fan-out (email/SMS/push).

Örnek TradingView webhook payload (karar):

```json
{
  "symbol": "BINANCE:BTCUSDT",
  "timeframe": "15m",
  "action": "buy",
  "price": 67250.12,
  "timestamp": "2025-01-01T10:00:00Z",
  "secret": "<webhook_shared_secret>",
  "source": "tradingview"
}
```

Not: Admin panelinde tanımlanan UT Bot parametreleri (örn. `keyValue`, `atrPeriod`, `factor` vb.) sembol/timeframe başına saklanır ve işleme sırasında kullanılmak üzere resolve edilir.

### Ortam Değişkenleri ve Sırlar

- Sırlar `.env.local` dosyalarında tutulur ve git tarafından yoksayılır.
- Frontend (`apps/frontend/web-client/.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Backend API (`apps/backend/api/.env.local`):
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  

### Konfigürasyon ve Araçlar

- TypeScript: API tarafında strict derleme (`tsconfig.json`)
- Lint/Format: Kökte ESLint/Prettier; web-client içinde Next ESLint konfigürasyonu
- Turborepo: `dev` cache kapalı, kalıcı süreç; `build` çıktıları `.next` ve `dist`
- Ortam değişkenleri: Depoda `.env*` yok; servis anahtarları için eklenmeli

### Öne Çıkan Gözlemler

- Backend şu an modüler monolith şeklinde; planlanan microservice ayrışımı henüz yapılmamış.
- `notification` ve `billing` modülleri sağlık son noktaları dışında boş.
- Kalıcılık (DB) ve kuyruk entegrasyonları henüz yok.
- Frontend sayfaları hazır iskelet; gerçek verilerle bağlanmamış.


