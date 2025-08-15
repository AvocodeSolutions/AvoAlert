import { loadEnv } from '../shared/load-env'
loadEnv()
import { createEmailService } from '../modules/notification/infrastructure/email-service'

async function testEmail() {
  try {
    console.log('🧪 Email entegrasyonu test ediliyor...')
    
    const emailService = createEmailService()
    
    const result = await emailService.sendAlarmTriggeredEmail({
      email: 'emrecanergin12@hotmail.com',
      coinSymbol: 'BTCUSDT',
      action: 'buy',
      timeframe: '4h',
      signalTime: '2025-08-15T18:00:00.000Z', // Simulated signal time
      notificationTime: new Date().toISOString() // Current time as notification time
    })

    if (result.success) {
      console.log('✅ Email başarıyla gönderildi!')
      console.log('📧 Gönderen: AvoAlert <onboarding@resend.dev>')
      console.log('📬 Alıcı: emrecanergin12@hotmail.com')
      console.log('🆔 Message ID:', result.messageId)
      console.log('\n🎉 Test BAŞARILI! Email kutunuzu kontrol edin.')
    } else {
      console.log('❌ Email gönderilemedi!')
      console.log('🐛 Hata:', result.error)
    }

  } catch (error) {
    console.error('💥 Test sırasında hata oluştu:', error)
  }
}

testEmail()
