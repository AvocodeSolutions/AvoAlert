## AvoAlert Tasks and Roadmap

Bu belge, mevcut kod tabanına göre eksikleri tamamlamak ve projeyi üretim hazır hâle getirmek için önerilen iş kalemlerini önceliklendirilmiş şekilde listeler.

### 0) Geliştirme Ortamı ve Altyapı

- .env şablonları oluşturma (`.env.local.example` hem API hem web client)
- Ortak tip ve config paketleri için `packages/` klasörlerini kurma (isteğe bağlı, bkz. README planı)
- Hususi NPM script'leri ve Turbo pipeline adımlarını doğrulama (dev/build/test)

### 1) API: Signal Akışı (TradingView Webhook → Üretim)

- Request doğrulama: `zod` veya `yup` ile şematik doğrulama (`POST /signals/ingest` veya `/signals/tradingview`)
- Kimliklendirme: Header tabanlı bir token veya Supabase JWT doğrulaması (README uyumlu)
- Kalıcılık: Prisma + PostgreSQL (Supabase)
  - `TradingSignal` tablosu ve migration'lar
  - Repository katmanı (application → infrastructure)
- Kuyruk: Upstash Redis + BullMQ ile asenkron işleme
  - Signal ingest → queue → notification dispatch pipeline
- Hata yönetimi ve loglama: yapılandırılmış logger (pino/winston)
- Testler: unit + integration (supertest) ve CI entegrasyonu

#### TradingView Özel Gereksinimler

- Webhook güvenliği: body'de paylaşılan `secret` zorunlu; opsiyonel IP allowlist
- Idempotency: alarm tekrarlarına karşı koruma (unique key: symbol + timeframe + timestamp + action)
- Alarm şablonu üretimi: Admin panelinden kopyalanabilir JSON şablonu
- Parametre çözümleme: symbol/timeframe → UT Bot parametre seti eşlemesi


### 2) API: Notification Modülü

- Domain ve application katmanlarını genişletme
- Kanal adapterleri: Email (Resend), SMS (Netgsm), Push (OneSignal)
- Rate limit/Retry: Kuyruk ile tekrar deneme politikaları
- Gelişmiş health/metrics: `/notifications/health` çıktısını içgörüyle zenginleştirme
 - Kullanıcı hedefleme: Kullanıcı bazında tercih edilen kanallar ve abonelik planlarına göre fan-out

### 3) API: Billing Modülü

- Stripe entegrasyonu: webhook tüketimi ve abonelik durum takibi
- Kullanım kredisi yönetimi: plan/limit/kota takibi
- Faturalama olayları: deneme süresi, iptal, yükseltme/düşürme senaryoları

### 4) Frontend: Web Client

- Admin sayfalarını gerçek API verilerine bağlama
  - Config ekranı: UT Bot parametre CRUD (API endpoint'leri gerektirir)
  - Monitoring ekranı: queue metrics, system health
  - Alarm şablonları ekranı: TradingView için webhook URL ve payload üretimi
- Auth: Supabase auth (README ile uyumlu)
- UI/UX: Form doğrulama, hata durumları, yükleniyor iskeletleri
- Çevresel değişkenler: public/private ayrımı ve `next.config.ts` ayarları

### 5) Gözlemlenebilirlik ve Operasyon
### 10) Gelecek: Abonelik ve Kullanım Modeli (Billing ile entegre)

- Supabase/Postgres tabloları:
  - `user_profiles(user_id fk auth.users, email, created_at)`
  - `user_subscriptions(id, user_id, plan_id, status, valid_until)`
  - `subscription_filters(id, subscription_id, symbol, timeframe, channels)`
  - `plans(id, code, monthly_credits, max_symbols, max_channels)`
  - `usage_ledger(id, user_id, signal_id, cost, channel, status, created_at)`
  - `webhook_events(id, provider, event_type, payload, processed_at)`
- Worker akışı bu tablolara göre: aktif aboneler + filtre eşleşmesi + kredi/limit kontrolü + usage düşümü
- Stripe webhook → `user_subscriptions` güncelleme (status/plan/valid_until)
- Admin/User paneli → `subscription_filters` CRUD


- Sağlık ve canlılık prob'ları (konteyner orkestrasyonu için)
- Metrics/Tracing: OpenTelemetry + Prometheus/Grafana (opsiyonel)
- Centralized logging: Log hedefleri (Render/Vercel/Supabase ile uyum)

### 6) Güvenlik ve Uygunluk

- Rate limiting ve IP filtreleme
- Input sanitization ve payload boyut limitleri
- Secrets yönetimi: Render/Vercel/Supabase ortam değişkenleri

### 7) Dağıtım

- Frontend: Vercel pipeline (preview/prod)
- Backend: Render deploy (Dockerfile veya native buildpack)
- DB: Supabase provisioning ve bağlantı ayarları
- Queue: Upstash Redis oluşturma ve env tanımları

### 8) Dokümantasyon

- API referansı: OpenAPI/Swagger (otomatik şema üretimi önerilir)
- Geliştirici rehberi: setup, run, debug, test
- Mimari karar kayıtları: ADR formatı (opsiyonel)

### 9) Kalite ve Süreklilik

- Lint/type-check zorunlu CI kapıları
- Coverage eşiği ve quality gate
- Dependabot/renovate ile bağımlılık güncellemeleri

### Başarı Kriterleri

- `POST /signals/ingest` uç noktası doğrulama, kalıcılık ve kuyruğa bağlandı
- En az bir bildirim kanalı uçtan uca çalışır (örn. email)
- Admin paneli gerçek zamanlı metriklerle temel görünürlük sağlar
- CI’de test/lint/type-check yeşil; prod ortamına otomatik dağıtım akışı çalışır


