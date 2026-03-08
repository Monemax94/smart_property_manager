interface OTPEmailProps {
  recipientName: string;
  otp: string;
  expirationMinutes: number;
  subject: string;
  description: string;
}

interface WelcomeEmailProps {
  recipientName: string;
  ctaText: string;
  ctaUrl: string;
}

interface OrderConfirmationProps {
  recipientName: string;
  orderNumber: string;
  supportEmail: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  shippingFee: number;
  serviceFee: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
}

interface StatusEmailProps {
  recipientName: string;
  status: "suspended" | "revoked" | "rejected";
  suspensionDays?: number;
}

// Helper function to generate email header
function emailHeader(): string {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <title>Smart Home</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0; padding: 0;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; background-color: #ffffff; max-width: 600px;">
              
              <!-- Header -->
              <tr>
                <td style="padding: 32px 24px; border-bottom: 1px solid #e5e7eb;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -1px;">
                    <span style="color: #DC143C;">SMART</span><span style="color: #1a1a1a;">HOME</span>
                    <span style="display: inline-block; width: 8px; height: 8px; background: #DC143C; border-radius: 50%; margin-left: 3px; vertical-align: middle;"></span>
                  </p>
                </td>
              </tr>
              
              <!-- Main Content Start -->
              <tr>
                <td style="padding: 32px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">`;
}

// Helper function to generate email footer
function emailFooter({
  company = "Smart Home",
  year = new Date().getFullYear(),
  message = "You are receiving this mail because you registered to join the Smart Home platform as a user.",
  socialLinks = {
    twitter: "https://x.com/smarthome_prop",
    tiktok: "https://tiktok.com/@smarthome.prop",
    instagram: "https://instagram.com/smarthome.prop",
    facebook: "https://facebook.com/smarthome.prop",
  },
  links = {
    privacy: "#",
    terms: "#",
    help: "#",
    unsubscribe: "#",
  },
} = {}): string {
  return `
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #DC143C 0%, #8B0000 100%); padding: 32px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    
                    <!-- Top Section with Message and Social Icons -->
                    <tr>
                      <td style="padding-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="vertical-align: top; padding-right: 20px; width: 70%;">
                              <p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; color: rgba(255, 255, 255, 0.95); margin: 0;">
                                ${message}
                              </p>
                            </td>
                            <td align="right" style="vertical-align: top; width: 30%;">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="padding: 0 8px;">
                                    <a href="${socialLinks.twitter}" target="_blank" rel="noopener noreferrer" style="display: inline-block; width: 24px; height: 24px; opacity: 0.8; text-decoration: none;">
                                      <span style="color: #ffffff; font-size: 16px; font-weight: 700;">𝕏</span>
                                    </a>
                                  </td>
                                  <td style="padding: 0 8px;">
                                    <a href="${socialLinks.tiktok}" target="_blank" rel="noopener noreferrer" style="display: inline-block; width: 24px; height: 24px; opacity: 0.8; text-decoration: none;">
                                      <span style="color: #ffffff; font-size: 14px; font-weight: 700;">TT</span>
                                    </a>
                                  </td>
                                  <td style="padding: 0 8px;">
                                    <a href="${socialLinks.instagram}" target="_blank" rel="noopener noreferrer" style="display: inline-block; width: 24px; height: 24px; opacity: 0.8; text-decoration: none;">
                                      <span style="color: #ffffff; font-size: 14px; font-weight: 700;">IG</span>
                                    </a>
                                  </td>
                                  <td style="padding: 0 8px;">
                                    <a href="${socialLinks.facebook}" target="_blank" rel="noopener noreferrer" style="display: inline-block; width: 24px; height: 24px; opacity: 0.8; text-decoration: none;">
                                      <span style="color: #ffffff; font-size: 14px; font-weight: 700;">FB</span>
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Bottom Section with Copyright and Links -->
                    <tr>
                      <td style="padding-top: 24px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <p style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: rgba(255, 255, 255, 0.7); margin: 0 0 8px 0;">
                                © ${year} ${company}. All rights reserved.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; margin: 0; line-height: 1.8;">
                                <a href="${links.privacy}" style="color: rgba(255, 255, 255, 0.8); text-decoration: none;" target="_blank" rel="noopener noreferrer">Privacy policy</a>
                                <span style="color: rgba(255, 255, 255, 0.5); padding: 0 5px;">•</span>
                                <a href="${links.terms}" style="color: rgba(255, 255, 255, 0.8); text-decoration: none;" target="_blank" rel="noopener noreferrer">Terms of service</a>
                                <span style="color: rgba(255, 255, 255, 0.5); padding: 0 5px;">•</span>
                                <a href="${links.help}" style="color: rgba(255, 255, 255, 0.8); text-decoration: none;" target="_blank" rel="noopener noreferrer">Help center</a>
                                <span style="color: rgba(255, 255, 255, 0.5); padding: 0 5px;">•</span>
                                <a href="${links.unsubscribe}" style="color: rgba(255, 255, 255, 0.8); text-decoration: none;" target="_blank" rel="noopener noreferrer">Unsubscribe</a>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

// Helper function for OTP display
export function otpDisplay(otp: string): string {
  return `
      <tr>
        <td align="center" style="padding: 24px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; background-color: #f9fafb;">
                <p style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 600; letter-spacing: 8px; color: #1f2937; margin: 0; text-align: center;">
                  ${otp}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
}

// Export all templates
export const emailTemplates = {
  emailVerification: (props: OTPEmailProps): string => {
    const header = emailHeader();

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Verify your email.
            </h1>
          </td>
        </tr>
        
        <!-- Message -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              Here is your One Time Password (OTP).<br/>
              Please enter this code to verify your email address for Smart Home.
            </p>
          </td>
        </tr>
        
        ${otpDisplay(props.otp)}
        
        <!-- Expiry -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              OTP will expire in <strong>${props.expirationMinutes} minutes</strong>.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  },

  passwordReset: (props: OTPEmailProps): string => {
    const header = emailHeader();

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Reset your password.
            </h1>
          </td>
        </tr>
        
        <!-- Message -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              Here is your One Time Password (OTP).<br/>
              Please enter this code to reset your password for Smart Home.
            </p>
          </td>
        </tr>
        
        ${otpDisplay(props.otp)}
        
        <!-- Expiry -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              OTP will expire in <strong>${props.expirationMinutes} minutes</strong>.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  },

  accountRecovery: (props: OTPEmailProps): string => {
    const header = emailHeader();

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Recover Your Smart Home Account
            </h1>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #6b7280; margin: 0;">
              Hi, ${props.recipientName}.
            </p>
          </td>
        </tr>
        
        <!-- Message -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              We received a request to recover your Smart Home account using this email. Use the verification code below to confirm your identity and regain access:
            </p>
          </td>
        </tr>
        
        ${otpDisplay(props.otp)}
        
        <!-- Warning -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              OTP will expire in <strong>${props.expirationMinutes} minutes</strong>.<br/>
              If you didn't request this change, please secure your account immediately by changing your password.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  },

  recoveryEmailVerification: (props: OTPEmailProps): string => {
    const header = emailHeader();

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Verify your recovery email
            </h1>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #6b7280; margin: 0;">
              Hi, ${props.recipientName}.
            </p>
          </td>
        </tr>
        
        <!-- Message -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              A request was made to add your email as a recovery email. Kindly use the token below to set this as your recovery email.
            </p>
          </td>
        </tr>
        
        ${otpDisplay(props.otp)}
        
        <!-- Expiry -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              OTP will expire in <strong>${props.expirationMinutes} minutes</strong>.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  },

  welcomeVendor: (props: WelcomeEmailProps): string => {
    const header = emailHeader();

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Welcome to Smart Home!
            </h1>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #6b7280; margin: 0;">
              Hi, ${props.recipientName}!
            </p>
          </td>
        </tr>
        
        <!-- Message 1 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              You're now part of a growing network of trusted property owners and managers on Smart Home.
            </p>
          </td>
        </tr>
        
        <!-- Message 2 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              Smart Home helps you list properties, manage tenants, track payments, and grow your portfolio — all in one place.
            </p>
          </td>
        </tr>
         
        <!-- Closing -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              List your properties, connect with tenants, and take full control of your real estate business.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  },

  welcomeBuyer: (props: WelcomeEmailProps): string => {
    const header = emailHeader();

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Welcome to Smart Home!
            </h1>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #6b7280; margin: 0;">
              Hi, ${props.recipientName}!
            </p>
          </td>
        </tr>
        
        <!-- Message 1 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              We're thrilled to have you join a growing community of property seekers discovering their dream homes on Smart Home.
            </p>
          </td>
        </tr>
        
        <!-- Message 2 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              From apartments and studios to luxury villas — Smart Home brings your perfect home closer than ever.
            </p>
          </td>
        </tr>
        
        <!-- CTA Button -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color: #DC143C; border-radius: 6px; padding: 0;">
                  <a href="${props.ctaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;">
                    ${props.ctaText}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Features Title -->
        <tr>
          <td style="padding-bottom: 12px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; font-weight: 600; margin: 0;">
              Enjoy:
            </p>
          </td>
        </tr>
        
        <!-- Features List -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom: 12px;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
                    🏠 <strong>Browse Properties:</strong> Discover verified listings from trusted landlords.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 12px;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
                    📋 <strong>Easy Applications:</strong> Apply for rental properties with just a few clicks.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 24px;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
                    🔒 <strong>Pay Securely:</strong> Rent payments handled safely through our secure platform.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Closing -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              Your next home is just a search away — we're excited to help you find it.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  },

  orderConfirmation: (props: OrderConfirmationProps): string => {
    const total = props.subtotal + props.shippingFee + props.serviceFee;
    const header = emailHeader();

    const itemsHTML = props.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width: 70%;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; font-weight: 500; margin: 0 0 4px 0;">
                    ${item.name}
                  </p>
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #6b7280; margin: 0;">
                    Quantity: ${item.quantity}
                  </p>
                </td>
                <td align="right" style="width: 30%;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; font-weight: 600; margin: 0;">
                    ₦${item.price.toLocaleString()}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      )
      .join("");

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Your order has been placed!
            </h1>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #6b7280; margin: 0;">
              Hi, ${props.recipientName}.
            </p>
          </td>
        </tr>
        
        <!-- Message -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              Thank you for your order on Smart Home! Your purchase has been successfully placed and sent to the vendor for confirmation.
            </p>
          </td>
        </tr>
        
        <!-- CTA Button -->
        <tr>
          <td style="padding-bottom: 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color: #DC143C; border-radius: 6px; padding: 0;">
                  <a href="#" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;">
                    Track your order
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Order Details Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h2 style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; color: #000; margin: 0;">
              Order details
            </h2>
          </td>
        </tr>
        
        <!-- Order Number -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #6b7280; margin: 0;">
              Order No.: ${props.orderNumber}
            </p>
          </td>
        </tr>
        
        <!-- Order Items Table -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 6px;">
              ${itemsHTML}
              
              <!-- Subtotal -->
              <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0;">Subtotal</p>
                      </td>
                      <td align="right">
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0;">₦${props.subtotal.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Shipping Fee -->
              <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0;">Shipping Fee</p>
                      </td>
                      <td align="right">
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0;">₦${props.shippingFee.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Service Fee -->
              <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0;">Service Fee</p>
                      </td>
                      <td align="right">
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0;">₦${props.serviceFee.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Total -->
              <tr>
                <td style="padding: 16px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; font-weight: 600; margin: 0;">Total</p>
                      </td>
                      <td align="right">
                        <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; font-weight: 600; margin: 0;">₦${total.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Customer Information Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h2 style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; color: #000; margin: 0;">
              Customer information
            </h2>
          </td>
        </tr>
        
        <!-- Customer Info -->
        <tr>
          <td style="padding-bottom: 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align: top; padding-right: 32px; width: 50%;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #6b7280; font-weight: 600; margin: 0 0 8px 0;">
                    Shipping Address
                  </p>
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0 0 4px 0;">
                    ${props.shippingAddress.name}
                  </p>
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0 0 4px 0;">
                    ${props.shippingAddress.street}
                  </p>
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0 0 4px 0;">
                    ${props.shippingAddress.city}, ${props.shippingAddress.state} ${props.shippingAddress.zip}
                  </p>
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0;">
                    ${props.shippingAddress.country}
                  </p>
                </td>
                <td style="vertical-align: top; width: 50%;">
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #6b7280; font-weight: 600; margin: 0 0 8px 0;">
                    Payment Method
                  </p>
                  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000; margin: 0;">
                    ${props.paymentMethod}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Help Section Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h2 style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; color: #000; margin: 0;">
              Need help?
            </h2>
          </td>
        </tr>
        
        <!-- Help Message -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              If you have any questions about your delivery, contact us anytime at <a href="mailto:${props.supportEmail}" style="color: #DC143C; text-decoration: none;">${props.supportEmail}</a>, and we'll make sure your issue is resolved as quickly as possible.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  },

  accountSuspended: (props: StatusEmailProps): string => {
    const header = emailHeader();

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Your account has been suspended
            </h1>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #6b7280; margin: 0;">
              Hi, ${props.recipientName}.
            </p>
          </td>
        </tr>
        
        <!-- Message 1 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              We're writing to inform you that your Smart Home account has been temporarily suspended for ${props.suspensionDays} days due to a violation of our platform policies.
            </p>
          </td>
        </tr>
        
        <!-- Message 2 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              During this period, access to selling and payout features will be restricted.
            </p>
          </td>
        </tr>
        
        <!-- Contact -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              If you believe this action was taken in error or you'd like to resolve the issue, please <a href="#" style="color: #DC143C; text-decoration: none;">contact</a> our support team.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  },

  verificationRevoked: (props: StatusEmailProps): string => {
    const header = emailHeader();

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Your verification was not approved
            </h1>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #6b7280; margin: 0;">
              Hi, ${props.recipientName}.
            </p>
          </td>
        </tr>
        
        <!-- Message 1 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              We regret to inform you that your business verification on Smart Home has been revoked following a recent review of your account activity.
            </p>
          </td>
        </tr>
        
        <!-- Message 2 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              As a result, your store is no longer visible to buyers, and selling features have been temporarily disabled, but you may update your details and reapply for verification at any time from your business profile.
            </p>
          </td>
        </tr>
        
        <!-- Contact -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              If you believe this action was taken in error or would like more details, please <a href="#" style="color: #DC143C; text-decoration: none;">contact</a> our support team.
            </p>
          </td>
        </tr>
        
        <!-- Closing -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              We're committed to keeping Smart Home safe and trustworthy for everyone.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  },

  verificationRejected: (props: StatusEmailProps): string => {
    const header = emailHeader();

    const content = `
        <!-- Title -->
        <tr>
          <td style="padding-bottom: 16px;">
            <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; color: #000; margin: 0; line-height: 1.3;">
              Your verification was not approved
            </h1>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #6b7280; margin: 0;">
              Hi, ${props.recipientName}.
            </p>
          </td>
        </tr>
        
        <!-- Message 1 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              Thank you for submitting your business details for verification on Smart Home.
            </p>
          </td>
        </tr>
        
        <!-- Message 2 -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              After reviewing your application, we're unable to approve it at this time due to incomplete or invalid information.
            </p>
          </td>
        </tr>
        
        <!-- Reapply Info -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              You can update your details and reapply for verification anytime from your profile.
            </p>
          </td>
        </tr>
        
        <!-- Closing -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; line-height: 1.6; margin: 0;">
              We appreciate your interest in selling on Smart Home and look forward to reviewing your updated submission.
            </p>
          </td>
        </tr>
        
        <!-- Signature -->
        <tr>
          <td>
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #374151; margin: 0;">
              Best Regards,<br/>
              <strong style="color: #DC143C;">Smart Home team.</strong>
            </p>
          </td>
        </tr>`;

    return header + content + emailFooter();
  }
};