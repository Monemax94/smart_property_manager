import { injectable } from 'inversify';
import sendMail from '../utils/mailer';
import { emailTemplates, otpDisplay } from '../utils/mails.template';
import { TOKEN_EXPIRY_MINUTES } from '../secrets';
import { IProfile } from '../models/Profile';


@injectable()
export class MailService {

  async sendVerification(email: string, token: number) {

    const html = otpDisplay(token.toString())
    await sendMail(
      email,
      'Verify Your Email Address',
      html,
    )

  }
  async vendorWelcome(email: string,  recipientName: string, ctaText: string, ctaUrl: string) {

    const html = emailTemplates.welcomeVendor({
      recipientName,
      ctaText,
      ctaUrl,
    })
    await sendMail(
      email,
     'Welcome to Smart Home',
      html,
    )

  }
  async WelcomeBuyer(email: string,  recipientName: string, ctaText: string, ctaUrl: string) {

    const html = emailTemplates.welcomeBuyer({
      recipientName,
      ctaText,
      ctaUrl,
    })
    await sendMail(
      email,
      'Welcome to Smart Home',
      html,
    )
  }

  async sendPasswordReset(email: string, token: number, profile: Partial<IProfile>) {
    
    const html = emailTemplates.passwordReset({
      otp: token.toString(),
      subject: 'Password Reset Code',
      description: 'Password Reset Code',
      recipientName: profile.firstName || 'Anonymous',
      expirationMinutes: Number(TOKEN_EXPIRY_MINUTES || 10)
    })
    // const html = `
    //   <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    //     <h2 style="color: #ff5722;">Password Reset Request</h2>
    //     <p>Hello,</p>
    //     <p>We received a request to reset your password. Use the code below to proceed:</p>
    //     <div style="font-size: 24px; font-weight: bold; background: #fbe9e7; padding: 10px; width: fit-content; border-radius: 6px; margin: 10px 0;">
    //       ${token}
    //     </div>
    //     <p>If you did not request a password reset, no further action is required.</p>
    //     <p>This code will expire in 10 minutes.</p>
    //     <hr style="margin: 20px 0;">
    //     <p style="font-size: 12px; color: #888;">© ${new Date().getFullYear()} Smart Home. All rights reserved.</p>
    //   </div>
    // `;
    await sendMail(
      email,
      'Password Reset Code',
      html
    )
  }
  async accountRecovery(email: string, token: number, firstName?: string) {
    const html = emailTemplates.accountRecovery(
      {
        recipientName: firstName || 'Anonymous',
        otp: token.toString(),
        subject: "Account Recovery",
        description: "Account Recovery",
        expirationMinutes: Number(TOKEN_EXPIRY_MINUTES || 10)
      }
    )

    await sendMail(
      email,
      'Account Recovery',
      html,
    )
  }

    /**
   * Send credentials to a newly created admin
   */
    async sendAdminCredentials(email: string, password: string, loginUrl: string) {
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 20px; background: #f9f9f9;">
          <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 20px 30px;">
              <h2 style="margin: 0;">🎉 Admin Account Created</h2>
            </div>
  
            <div style="padding: 30px;">
              <p>Hello,</p>
              <p>You have been granted <strong>Admin Access</strong> to the <b>SmartHome Management Portal</b>.</p>
  
              <div style="background: #f1f1f1; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Login Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
              </div>
  
              <p style="margin-top: 15px;">Please log in using the button below and change your password immediately for security reasons.</p>
  
              <a href="${loginUrl}" style="display: inline-block; margin-top: 20px; background: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">Login to Dashboard</a>
  
              <p style="margin-top: 30px; color: #777; font-size: 14px;">
                If you didn’t expect this email, please ignore it.
              </p>
            </div>
  
            <div style="background: #fafafa; padding: 15px; text-align: center; font-size: 12px; color: #999;">
              © ${new Date().getFullYear()} Smart Home. All rights reserved.
            </div>
          </div>
        </div>
      `;
  
      await sendMail(
        email,
        'Your Admin Account Credentials',
        html
      );
    }

    async sendTransactionPinToken(email: string, token: number) {
      const html = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #4CAF50;">Transaction PIN Setup</h2>
    
          <p>Hello,</p>
          <p>You requested to <strong>create or update your transaction PIN</strong>.</p>
    
          <p>Please use the verification code below to continue:</p>
    
          <div style="
            font-size: 24px;
            font-weight: bold;
            background: #f1f1f1;
            padding: 10px;
            width: fit-content;
            border-radius: 6px;
            margin: 10px 0;
          ">
            ${token}
          </div>
    
          <p>This code will expire in <strong>10 minutes</strong>.  
          Do not share this code with anyone.</p>
    
          <p>If you did not request to set or modify your transaction PIN, please ignore this message.</p>
    
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} YourApp. All rights reserved.
          </p>
        </div>
      `;
    
      await sendMail(
        email,
        'Transaction PIN Verification Code',
        html,
      );
    }
    
}
