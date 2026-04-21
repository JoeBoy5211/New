import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use Resend's shared test domain until you add a custom domain
const FROM_EMAIL = 'CaterConnect <onboarding@resend.dev>';
const APP_NAME = 'CaterConnect';

export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `${code} is your ${APP_NAME} verification code`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#7B2D3E;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:1px;">${APP_NAME}</p>
              <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:3px;font-weight:600;">PREMIUM CATERING SERVICES</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;font-weight:700;">Verify your email address</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#666;line-height:1.6;">
                Use the 6-digit code below to verify your email and complete your registration.
                This code expires in <strong>10 minutes</strong>.
              </p>
              <!-- Code box -->
              <div style="background:#f6f3ee;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;border:1.5px dashed #d4a756;">
                <span style="font-size:44px;font-weight:800;color:#7B2D3E;letter-spacing:12px;">${code}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
                If you didn't request this, you can safely ignore this email.
                Someone may have typed your email address by mistake.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f6f3ee;padding:20px 40px;text-align:center;border-top:1px solid #ece8e1;">
              <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
    if (error) {
        console.error('[EMAIL] Resend error:', error);
        throw new Error(error.message);
    }
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Reset your ${APP_NAME} password`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#7B2D3E;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:1px;">${APP_NAME}</p>
              <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:3px;font-weight:600;">PREMIUM CATERING SERVICES</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;font-weight:700;">Reset your password</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#666;line-height:1.6;">
                We received a request to reset the password for your ${APP_NAME} account.
                Enter the code below to set a new password. The code expires in <strong>10 minutes</strong>.
              </p>
              <!-- Code box -->
              <div style="background:#f6f3ee;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;border:1.5px dashed #d4a756;">
                <span style="font-size:44px;font-weight:800;color:#7B2D3E;letter-spacing:12px;">${code}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
                If you didn't request a password reset, please ignore this email.
                Your password will not be changed.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f6f3ee;padding:20px 40px;text-align:center;border-top:1px solid #ece8e1;">
              <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
    if (error) {
        console.error('[EMAIL] Resend error:', error);
        throw new Error(error.message);
    }
}
