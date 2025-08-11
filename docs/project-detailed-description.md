## AvoAlert – Detailed Description

AvoAlert, UT Bot indikatörüne dayalı kripto alım-satım sinyallerini gerçek zamanlı işleyen ve kullanıcılara e-posta, SMS ve web push kanallarında ileten bir platform hedeflemektedir. Bu belge, mevcut kod ile README’de tarif edilen hedef mimariyi birleştirerek projenin kapsamlı bir açıklamasını sunar.

### Hedef Mimari (README bazlı)

- Backend microservisleri: signal-engine, alarm-dispatcher, api-gateway, subscription-service
- Frontend: web-client (Next.js, kullanıcı portalı + admin paneli)
- Paylaşılan paketler: shared-types, shared-config, database, auth
- Altyapı servisleri: PostgreSQL (Supabase), Redis (Upstash), Auth (Supabase JWT), Payments (Stripe), Notifications (Resend, Netgsm, OneSignal)

### Mevcut Mimari (Kod tabanı)

- Backend (modüler monolith):
  - Konum: apps/backend/api
  - Giriş: src/app.ts (Express, JSON middleware, health endpoint, modül router mount)
  - Modüller: signal (aktif), notification (health-only), billing (health-only)
  - Persistence / Queue / Dış entegrasyonlar: henüz uygulanmamış; ilgili klasörler placeholder durumunda

- Frontend (Next.js App Router):
  - Konum: apps/frontend/web-client
  - Rotalar: /, /admin, /admin/config, /admin/monitoring
  - UI: Shadcn tarzı bileşenler (badge, button, card), Tailwind tabanlı stil
  - Veri bağlama: Henüz gerçek API ile entegre edilmemiş

### Güncel İş Akışı (Signal Ingest) ve TradingView Webhook Senaryosu

1. Admin, panelde coin/çift ve timeframe bazında UT Bot parametrelerini tanımlar (dinamik).
2. Panel, TradingView üzerinde kullanılacak bir webhook payload şablonu üretir (kopyalanabilir).
3. TradingView alarmı (örn. UT Bot buy/sell) tetiklenince AvoAlert API'ye `POST /signals/tradingview` isteği gönderir.
4. API, payload'ı şema ile doğrular; `symbol` girişini normalize eder (kanonik: BTCUSDT); `symbol + timeframe` ile parametrik konfigürasyonu resolve eder.
5. (Mevcut kod) IngestSignalUseCase sinyali doğrular ve döner. (Hedef) sinyal kalıcı hale getirilir, idempotency anahtarıyla kuyruğa yazılır ve dispatch süreci tetiklenir.

### Domain Modeli

- TradingSignal
  - symbol: string
  - timeframe: string
  - action: 'buy' | 'sell'
  - price: number
  - timestamp: string

### Modül Bazında Genişleme Stratejisi

- Signal
  - Giriş doğrulama (şema), kalıcılık (Prisma + PostgreSQL), kuyruklama (BullMQ)
  - Idempotency ve tekrar işleme koruması (unique key: symbol + timeframe + timestamp)
  - TradingView özel alanları: secret doğrulama, source=tradingview işaretlemesi

- Notification
  - Kanal adapterleri (Resend, Netgsm, OneSignal)
  - Şablonlama, yerelleştirme, rate-limit ve retry politikaları

- Billing
  - Stripe webhook tüketimi ve abonelik/plân yönetimi
  - Kullanım kredisi, kota ve faturalama olaylarının izlenmesi

### Gelecek Abonelik/Limit Modeli

- Tablolar: `user_subscriptions`, `subscription_filters`, `plans`, `usage_ledger`, `webhook_events`
- Worker: aktif aboneler + filtre eşleşmesi + kredi/limit kontrolü + usage kaydı
- Stripe webhook: abonelik durum/plan güncellendiğinde tablolar senkronize edilir

### Güvenlik

- Hedef: Supabase JWT ile API kimlik doğrulama
- Öneriler: Bearer token doğrulaması, rol/kapsam kontrolleri, rate limit, giriş boyut limitleri
- Webhook güvenliği: body'de paylaşılan secret zorunlu; IP allowlist opsiyonel; imza doğrulaması ileride eklenebilir.

### Gözlemlenebilirlik

- Mevcut: Health endpoint’leri (API ve modüller)
- Eksikler: Metrikler, tracing ve merkezi loglama
- Öneriler: OpenTelemetry, Prometheus/Grafana, yapılandırılmış logger (pino/winston)

### Dağıtım ve Ortamlar (README uyumlu öneriler)

- Frontend dağıtımı: Vercel üzerinde preview/prod ortamları
- Backend dağıtımı: Render üzerinde Node 18+ ile çalıştırma (build sonrası `node dist/app.js`)
- Veritabanı: Supabase (Prisma şema ve migration yönetimi)
- Kuyruk: Upstash Redis (BullMQ işleyicileri)

### Örnek TradingView Webhook Payload (Önerilen)

```
{
  "symbol": "BTC/USDT",
  "timeframe": "15m",
  "action": "buy",
  "price": 67250.12,
  "timestamp": "2025-01-01T10:00:00Z",
  "secret": "<webhook_shared_secret>",
  "source": "tradingview"
}
```

### Riskler ve Bilinen Açıklar

- README ile kodun ayrışması: microservice paketleri ve `packages/*` altı eksik
- Kalıcılık, kuyruk ve entegrasyonların olmaması: üretim için tamamlanmalı
- Güvenlik, rate limiting ve test kapsamı şu an minimal

### Yol Haritası (Kısa)

1. Signal ingest’i üretimleştir: şema doğrulama + DB + queue
2. En az bir bildirim kanalıyla uçtan uca teslimat
3. Admin panelinde gerçek metrikler ve konfigürasyon CRUD
4. Stripe ile billing ve plan yönetimi
5. CI/CD ve gözlemlenebilirlik bileşenlerini tamamla


