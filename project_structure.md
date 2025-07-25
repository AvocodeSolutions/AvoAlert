
## Gerçek Zamanlı Kripto Sinyal Platformu – Proje Tanımı

Bu doküman, TradingView UT Bot alarm tabanlı sinyal platformunuzun tüm ayrıntılarını, hem orijinal mimari taslağındaki bilgiler hem de güncel tercih kararlarınız (özellikle **Express.js kullanımı**) ışığında özetler.

---

### 1. Amaç & Hedef Kitle

Platform, kripto grafiklerinde **UT Bot indikatörünü** kullanan ve teknik bilgiye uzak son kullanıcıların, hiçbir ek kurulum yapmadan "**Buy/Sell**" sinyallerini **e-posta, SMS veya web push** şeklinde almasını sağlar. Hedef kitle, kripto piyasasında alım-satım sinyallerine ihtiyaç duyan ancak teknik kurulumlarla uğraşmak istemeyen bireylerdir. **Public-beta'da 50-100 kullanıcı**, üretimde ise kademeli büyüme hedeflenmektedir.

---

### 2. Yüksek Seviye Akış

1.  **Admin Paneli Üzerinden Yapılandırma:** Yönetici, **coin-timeframe** ve **UT Bot parametrelerini (EMA, ATR, Multiplier)** admin paneli üzerinden kaydeder.
2.  **Pine Script ve Webhook Üretimi:** Panel, kaydedilen parametrelere göre TradingView'de kurulacak alarm için örnek bir **Pine Script** kodu ve ilişkili **webhook URL'i** üretir.
3.  **Manuel Alarm Kurulumu:** Kullanıcı, üretilen Pine Script kodunu kullanarak TradingView'e alarmı **manuel olarak ekler** ("once-per-bar" önerilir).
4.  **Sinyal Tetiklenmesi ve İşlenmesi:**
    * TradingView alarmı tetiklendiğinde, bir **JSON payload** (veri paketi) `signal-engine`'in webhook'una **POST** edilir.
    * Bu payload **doğrulanır** ve `signals` kuyruğuna bir "iş" (job) olarak düşer.
    * `alarm-dispatcher` bu işi kuyruktan tüketir.
    * Veritabanındaki eşleşen aktif alarmları bulur, kullanıcının **kredisini kontrol eder**.
    * Yeterli kredi varsa bildirimi gönderir; kredi yoksa bildirim atlanır.
5.  **Bildirim Katmanı:** Bildirimler, **Resend** (e-posta), **Netgsm** (Türkiye SMS) / **Twilio** (uluslararası SMS) ve **OneSignal** (web push) aracılığıyla gönderilir.
6.  **API Yetkilendirme ve Yönetim:** `api-gateway` tüm istemci/uygulama çağrılarını **Supabase JWT** ile yetkilendirir ve alarm & abonelik **CRUD (Oluşturma, Okuma, Güncelleme, Silme)** işlemlerini sunar.
7.  **Abonelik ve Kredi Takibi:** `subscription-service` kullanıcı **kredilerini ve plan limitlerini** takip eder. Bu servis, **Stripe webhook'ları** aracılığıyla güncellenir.

---

### 3. Mikroservis Katmanları

| Servis              | Rol                                                                 | Çekirdek Teknoloji                                         |
| :------------------ | :------------------------------------------------------------------ | :--------------------------------------------------------- |
| **signal-engine** | TradingView webhook listener → BullMQ job producer                  | **Express.js** · BullMQ · Upstash Redis                    |
| **alarm-dispatcher** | Kuyruk tüketimi, kullanıcı eşleştirme, kredi düşme, bildirim tetikleme | **Express.js** · BullMQ · Prisma                           |
| **api-gateway** | REST & Auth gateway, kullanıcı/alarm/abonelik CRUD                  | **Express.js** · Prisma · Supabase JWT                     |
| **subscription-service** | Plan/kredi kontrolü, Stripe webhook işleme                       | **Express.js** · Prisma                                    |
| **admin-panel** | UT Bot parametre yönetimi, queue monitor, istatistikler             | Next.js · Shadcn/ui · Tailwind                             |
| **web-client** | Son kullanıcı portalı (alarm yönetimi, bakiye, geçmiş)             | Next.js · Tailwind · Supabase SDK                          |

*Admin paneli parametre yönetimi detayları ve kuyruk izleyicisi ayrıca belgelenmiştir.*

---

### 4. Altyapı & DevOps

| Katman            | Seçim                      | Neden                                                                 |
| :---------------- | :------------------------- | :-------------------------------------------------------------------- |
| **Veritabanı (DB)** | Supabase Postgres (free)   | KVKK/GDPR uyumlu, Row-Level Security                                  |
| **Kuyruk/Önbellek** | Upstash Redis (free)       | Serverless, BullMQ uyumlu, düşük maliyetli                          |
| **Dağıtım (Deploy)** | Vercel (Next.js & api-gateway) · Render (background servisler) | Dakikada sıfır-idame maliyet, kolay ölçeklenebilirlik         |
| **CI/CD** | GitHub Actions             | Otomatik test & rollout, hızlı ve güvenilir dağıtım pipeline'ı         |
| **Gözlemlenebilirlik** | Grafana + Prometheus + Loki stack | Ücretsiz, self-hosted metrik & loglama, kapsamlı izleme         |
| **Yedekleme/DR** | Supabase otomatik yedek · Redis snapshot | Haftalık restore testi ile veri güvenliği ve felaket kurtarma      |

*Garanti edilen trafik: Günde $\approx 5$ alarm/indikatör $\times <100$ kullanıcı $\rightarrow$ ilk 6 ay ücretsiz kotaya sığması beklenmektedir.*

---

### 5. Bildirim Katmanı

* **E-posta:** **Resend** ($\le 3\,000$ mail/ay ücretsiz), şablonlar **Tailwind-Email** ile tasarlanacak.
* **SMS:** **Netgsm REST** API entegrasyonu, arıza durumunda **Twilio**'ya geri düşme (fallback). Modüler provider arayüzü sayesinde gelecekte farklı SMS sağlayıcıları entegre edilebilir.
* **Web Push:** **OneSignal** ($\le 10\,000$ abone ücretsiz).
* Gelecekte **Telegram/WhatsApp** entegrasyonları `dispatcher`'a birer plugin olarak eklenebilir.

---

### 6. Abonelik & Ödeme Modeli

* **Stripe Checkout + Billing** ile **aylık veya kredi-paket** planları sunulacaktır.
* Plan limitleri örneğin **Basic ($\le 10$ alarm/ay)** ve **Premium ($\le 100$ alarm/ay)** olarak belirlenebilir (bu dummy değerler dosyadaki bilgilere göre güncellenecektir).
* **Public-beta'da Stripe test modu** kullanılacak; üretim öncesi canlı anahtarlara geçiş ve gönderici doğrulama işlemleri tamamlanacaktır.

---

### 7. Güvenlik / Uyumluluk

* **Supabase JWT** ile güvenli API erişimi.
* **Rate-limit guard'ları** ile DDoS ve kötü niyetli saldırılara karşı koruma.
* **Log redaction** ile hassas verilerin loglarda görünmesi engellenecek.
* **GDPR/KVKK metinleri** ve **çerez banner'ı (Termly veya benzeri)** ile yasal uyumluluk sağlanacak.
* Her yerde **HTTPS** kullanımı.
* `.env` değişkenleri ve **Supabase kısıtlı erişim anahtarları** ile güvenli yapılandırma yönetimi.

---

### 8. Operasyonel Süreçler

* **Grafana Alert** üzerinden Slack/E-posta bildirimleri.
* **Incident run-book** ve "sessiz saat" kuralı ile kesinti yönetimi.
* Haftada $\approx 6$ gün, $1-2$ saat geliştirme.
* Her hafta mini **planning + retro** toplantıları.
* Yedekleme/restore testleri, dependency denetimi ve $2 \times$ peak load (en yoğun yük) testi üretim ortamına geçmeden önce tamamlanacaktır.

---

### 9. Gelecek Yol Haritası

* **Kendi Bot Motoru:** Phase-4'te bir **PoC (Proof of Concept)** olarak başlatılacak, BullMQ uyumlu bir adaptör üzerinde çalışılacak.
* **Native Mobil Uygulama:** $12$ ay sonrası için **DreamFlow/Capacitor** araştırılması planlanıyor.
* **Ek Paketler:** **AI sinyal filtreleri** ve **topluluk kopya-trading** entegrasyonu gibi ek özellikler gelecekte değerlendirilecektir.

### 10. Bilmen gerekenler:
Github Linki: https://github.com/AvocodeSolutions/AvoAlert.git

