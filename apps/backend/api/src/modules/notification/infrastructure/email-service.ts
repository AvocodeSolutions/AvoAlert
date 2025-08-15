import { Resend } from 'resend'

export interface EmailService {
  sendAlarmTriggeredEmail(params: {
    email: string
    coinSymbol: string
    action: 'buy' | 'sell'
    timeframe: string
    triggeredAt: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }>
}

export class ResendEmailService implements EmailService {
  private resend: Resend

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey)
  }

  async sendAlarmTriggeredEmail(params: {
    email: string
    coinSymbol: string
    action: 'buy' | 'sell'
    timeframe: string
    triggeredAt: string
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { email, coinSymbol, action, timeframe, triggeredAt } = params
      
      // Format date
      const formattedDate = new Date(triggeredAt).toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      const actionText = action === 'buy' ? 'ALIM' : 'SATIŞ'
      const actionColor = action === 'buy' ? '#22c55e' : '#ef4444'
      const emoji = action === 'buy' ? '🟢' : '🔴'

      const subject = `${emoji} ${coinSymbol} ${actionText} Sinyali - AvoAlert`

      const htmlContent = this.generateEmailTemplate({
        coinSymbol,
        action: actionText,
        actionColor,
        timeframe,
        triggeredAt: formattedDate,
        emoji
      })

      const result = await this.resend.emails.send({
        from: 'AvoAlert <onboarding@resend.dev>', // Default Resend domain
        to: ['avocodesolutions@gmail.com'], // Resend sadece bu email'e gönderebiliyor (domain doğrulaması yapılana kadar)
        subject: `[${email}] ${subject}`, // Asıl alıcıyı subject'e yazıyoruz
        html: htmlContent,
      })

      if (result.error) {
        console.error('[EmailService] Resend error:', result.error)
        return { 
          success: false, 
          error: result.error.message || 'Unknown email error' 
        }
      }

      console.log(`[EmailService] Email sent successfully to ${email}, ID: ${result.data?.id}`)
      return { 
        success: true, 
        messageId: result.data?.id 
      }

    } catch (error) {
      console.error('[EmailService] Error sending email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  private generateEmailTemplate(params: {
    coinSymbol: string
    action: string
    actionColor: string
    timeframe: string
    triggeredAt: string
    emoji: string
  }): string {
    const { coinSymbol, action, actionColor, timeframe, triggeredAt, emoji } = params

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AvoAlert - ${coinSymbol} ${action} Sinyali</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                ${emoji} AvoAlert
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">
                Kripto Para Sinyal Sistemi
            </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">
                    Sinyal Tetiklendi!
                </h2>
                <p style="color: #666; margin: 0; font-size: 16px;">
                    Belirlediğiniz alarm koşulu gerçekleşti
                </p>
            </div>

            <!-- Signal Details Card -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 2px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #333; margin: 0; font-size: 20px; font-weight: bold;">
                        ${coinSymbol}
                    </h3>
                    <span style="background-color: ${actionColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                        ${action}
                    </span>
                </div>
                
                <div style="border-top: 1px solid #e2e8f0; padding-top: 15px;">
                    <div style="margin-bottom: 10px;">
                        <span style="color: #666; font-size: 14px;">Zaman Dilimi:</span>
                        <span style="color: #333; font-weight: bold; margin-left: 10px;">${timeframe}</span>
                    </div>
                    <div>
                        <span style="color: #666; font-size: 14px;">Tetiklenme Zamanı:</span>
                        <span style="color: #333; font-weight: bold; margin-left: 10px;">${triggeredAt}</span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="#" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                    📊 Grafikleri Görüntüle
                </a>
                <a href="#" style="display: inline-block; background-color: #48bb78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    ⚙️ Alarmları Yönet
                </a>
            </div>

            <!-- Warning -->
            <div style="background-color: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
                    ⚠️ Bu sinyal yatırım tavsiyesi değildir. Yatırım kararlarınızı alırken dikkatli olun.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
                Bu e-posta <strong>AvoAlert</strong> kripto sinyal sistemi tarafından gönderilmiştir.
            </p>
            <p style="color: #999; margin: 0; font-size: 12px;">
                © 2025 AvoAlert. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</body>
</html>
    `
  }
}

// Factory function for easy instantiation
export function createEmailService(): EmailService {
  const apiKey = process.env.RESEND_API_KEY || "re_iiH2yXuj_DfqeNo6uie6wmGX411VxRtmi"
  return new ResendEmailService(apiKey)
}
