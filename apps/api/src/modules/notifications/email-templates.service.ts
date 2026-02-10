import { Injectable } from '@nestjs/common';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  sku?: string;
}

interface OrderDetails {
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

@Injectable()
export class EmailTemplatesService {
  // Brand palette: feminine science-elegant
  private readonly bone = '#f7f2ec';
  private readonly rose = '#e3a7a1';
  private readonly sage = '#b9cbb6';
  private readonly powder = '#c7d7e6';
  private readonly ink = '#1f2a36';

  private readonly logoUrl = 'https://sciencebasedbody.com/logo.png';
  private readonly supportEmail = 'support@sciencebasedbody.com';

  private baseTemplate(content: string, preheader?: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Science Based Body</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  ${preheader ? `<span style="display:none;font-size:1px;color:#f7f2ec;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:${this.bone};font-family:Georgia,'Times New Roman',Times,serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:${this.bone};">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" style="width:600px;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(31,42,54,0.08);">

          <!-- ============ HEADER with gradient + bubbles ============ -->
          <tr>
            <td style="padding:0;background:linear-gradient(135deg, ${this.rose} 0%, ${this.powder} 100%);text-align:center;position:relative;">
              <!--[if mso]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:140px;">
              <v:fill type="gradient" color="${this.rose}" color2="${this.powder}" angle="135"/>
              <v:textbox inset="0,0,0,0"><![endif]-->
              <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
                <tr>
                  <td style="height:140px;text-align:center;vertical-align:middle;position:relative;">
                    <!-- Decorative bubble: top-left -->
                    <div style="position:absolute;top:-18px;left:24px;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.18);"></div>
                    <!-- Decorative bubble: top-left small -->
                    <div style="position:absolute;top:30px;left:72px;width:24px;height:24px;border-radius:50%;background:rgba(185,203,182,0.30);"></div>
                    <!-- Decorative bubble: right -->
                    <div style="position:absolute;top:10px;right:36px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);"></div>
                    <!-- Decorative bubble: bottom-right -->
                    <div style="position:absolute;bottom:8px;right:80px;width:32px;height:32px;border-radius:50%;background:rgba(199,215,230,0.35);"></div>
                    <!-- Decorative bubble: bottom-left -->
                    <div style="position:absolute;bottom:-10px;left:140px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.12);"></div>

                    <!-- Brand name in elegant serif -->
                    <h1 style="margin:0;padding:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:30px;font-weight:400;letter-spacing:2px;color:#ffffff;text-shadow:0 1px 4px rgba(31,42,54,0.10);">
                      Science Based Body
                    </h1>
                    <p style="margin:6px 0 0 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.85);">
                      Research &middot; Purity &middot; Elegance
                    </p>
                  </td>
                </tr>
              </table>
              <!--[if mso]></v:textbox></v:rect><![endif]-->
            </td>
          </tr>

          <!-- Sage accent line below header -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg, ${this.sage}, ${this.powder}, ${this.sage});font-size:1px;line-height:1px;">&nbsp;</td>
          </tr>

          <!-- ============ CONTENT ============ -->
          <tr>
            <td style="padding:44px 40px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${this.ink};font-size:16px;line-height:1.6;">
              ${content}
            </td>
          </tr>

          <!-- ============ FOOTER ============ -->
          <tr>
            <td style="padding:0;background:${this.bone};">
              <!-- Sage separator -->
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="height:1px;background:${this.sage};font-size:1px;line-height:1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Footer content with decorative bubbles -->
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:30px 40px;position:relative;">
                    <!-- Footer decorative bubbles -->
                    <div style="position:absolute;top:10px;right:30px;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg, rgba(227,167,161,0.15), rgba(199,215,230,0.15));"></div>
                    <div style="position:absolute;bottom:16px;left:24px;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg, rgba(185,203,182,0.18), rgba(199,215,230,0.12));"></div>
                    <div style="position:absolute;bottom:40px;right:100px;width:18px;height:18px;border-radius:50%;background:rgba(227,167,161,0.12);"></div>

                    <!-- Compliance disclaimer -->
                    <p style="margin:0 0 14px 0;font-size:11px;color:#7a7a7a;text-align:center;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      All products sold by Science Based Body are intended strictly for research, laboratory, or analytical purposes only.
                      Products are NOT intended for human or veterinary consumption, therapeutic use, or diagnostic purposes.
                    </p>
                    <p style="margin:0 0 16px 0;font-size:11px;color:#7a7a7a;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Research Use Only (RUO) &ndash; 21 CFR 809.10(c)
                    </p>

                    <!-- Decorative sage divider dots -->
                    <p style="margin:0 0 16px 0;text-align:center;line-height:1;">
                      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${this.sage};margin:0 4px;"></span>
                      <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:${this.rose};margin:0 4px;opacity:0.5;"></span>
                      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${this.powder};margin:0 4px;opacity:0.6;"></span>
                      <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:${this.sage};margin:0 4px;opacity:0.5;"></span>
                      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${this.rose};margin:0 4px;opacity:0.35;"></span>
                    </p>

                    <!-- Brand wordmark -->
                    <p style="margin:0 0 10px 0;text-align:center;font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;letter-spacing:1.5px;color:${this.ink};">
                      Science Based Body
                    </p>

                    <!-- Legal links -->
                    <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      &copy; ${new Date().getFullYear()} Science Based Body LLC. All rights reserved.<br>
                      <a href="https://sciencebasedbody.com/policies/privacy" style="color:${this.rose};text-decoration:none;">Privacy Policy</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://sciencebasedbody.com/policies/terms" style="color:${this.rose};text-decoration:none;">Terms of Service</a>
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
</body>
</html>`;
  }

  private button(text: string, url: string): string {
    return `<a href="${url}" style="display:inline-block;padding:14px 32px;background:${this.rose};color:#ffffff;text-decoration:none;border-radius:25px;font-weight:600;font-size:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:0.5px;mso-padding-alt:0;text-align:center;"><!--[if mso]><i style="letter-spacing:32px;mso-font-width:-100%;mso-text-raise:24pt;">&nbsp;</i><![endif]--><span style="mso-text-raise:12pt;">${text}</span><!--[if mso]><i style="letter-spacing:32px;mso-font-width:-100%;">&nbsp;</i><![endif]--></a>`;
  }

  // ===========================================================================
  // ACCOUNT EMAILS
  // ===========================================================================

  welcomeEmail(firstName: string): { subject: string; html: string; text: string } {
    const subject = 'Welcome to Science Based Body';
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Welcome, ${firstName}!</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        Thank you for creating an account with Science Based Body. You now have access to:
      </p>
      <ul style="margin:0 0 25px 0;padding-left:20px;font-size:16px;color:${this.ink};line-height:1.8;">
        <li>Order tracking and history</li>
        <li>Saved addresses for faster checkout</li>
        <li>SBB Rewards points on every purchase</li>
        <li>Exclusive member offers</li>
      </ul>
      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('Start Shopping', 'https://sciencebasedbody.com/shop')}
      </p>
      <p style="margin:0;font-size:14px;color:#6b7280;">
        Questions? Contact us at <a href="mailto:${this.supportEmail}" style="color:${this.rose};text-decoration:none;">${this.supportEmail}</a>
      </p>
    `, 'Welcome to Science Based Body - Your account is ready');

    const text = `Welcome, ${firstName}!\n\nThank you for creating an account with Science Based Body.\n\nVisit: https://sciencebasedbody.com/shop`;
    return { subject, html, text };
  }

  emailVerification(firstName: string, verificationUrl: string): { subject: string; html: string; text: string } {
    const subject = 'Verify Your Email - Science Based Body';
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Verify Your Email</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        Hi ${firstName}, please verify your email address to complete your account setup.
      </p>
      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('Verify Email', verificationUrl)}
      </p>
      <p style="margin:0 0 15px 0;font-size:14px;color:#6b7280;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    `, 'Please verify your email address');

    const text = `Hi ${firstName},\n\nPlease verify your email: ${verificationUrl}\n\nThis link expires in 24 hours.`;
    return { subject, html, text };
  }

  passwordReset(firstName: string, resetUrl: string): { subject: string; html: string; text: string } {
    const subject = 'Reset Your Password - Science Based Body';
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Reset Your Password</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        Hi ${firstName}, we received a request to reset your password.
      </p>
      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('Reset Password', resetUrl)}
      </p>
      <p style="margin:0 0 15px 0;font-size:14px;color:#6b7280;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    `, 'Reset your password');

    const text = `Hi ${firstName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`;
    return { subject, html, text };
  }

  // ===========================================================================
  // ORDER EMAILS
  // ===========================================================================

  orderConfirmation(firstName: string, order: OrderDetails): { subject: string; html: string; text: string } {
    const subject = `Order Received - #${order.orderNumber} - Action Required`;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${this.sage};">
          <strong style="color:${this.ink};">${item.name}</strong>
          ${item.sku ? `<br><span style="font-size:12px;color:#6b7280;">SKU: ${item.sku}</span>` : ''}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${this.sage};text-align:center;color:${this.ink};">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${this.sage};text-align:right;color:${this.ink};">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = this.baseTemplate(`
      <h1 style="margin:0 0 10px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Thank You for Your Order!</h1>
      <p style="margin:0 0 25px 0;font-size:16px;color:${this.ink};">
        Hi ${firstName}, we've received your order and it's ready for processing. Please complete payment using one of the options below to get your order shipped.
      </p>

      <div style="background:${this.bone};border-radius:8px;padding:20px;margin-bottom:25px;border:1px solid ${this.sage};">
        <p style="margin:0 0 5px 0;font-size:14px;color:#6b7280;">Invoice Number</p>
        <p style="margin:0;font-size:20px;font-weight:600;color:${this.ink};">#${order.orderNumber}</p>
      </div>

      <!-- ============ PAYMENT INSTRUCTIONS ============ -->
      <h2 style="margin:0 0 15px 0;font-size:20px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Payment Instructions</h2>
      <p style="margin:0 0 15px 0;font-size:15px;color:${this.ink};line-height:1.6;">
        Please send <strong style="font-size:18px;">$${order.total.toFixed(2)}</strong> via any of the following methods:
      </p>

      <div style="background:linear-gradient(135deg, rgba(227,167,161,0.08), rgba(199,215,230,0.08));border-radius:10px;padding:24px;margin-bottom:20px;border:1px solid rgba(185,203,182,0.3);">
        <!-- Zelle -->
        <table role="presentation" style="width:100%;margin-bottom:18px;">
          <tr>
            <td style="width:36px;vertical-align:top;padding-top:2px;">
              <div style="width:32px;height:32px;border-radius:8px;background:${this.powder};text-align:center;line-height:32px;font-weight:700;font-size:14px;color:${this.ink};">Z</div>
            </td>
            <td style="padding-left:12px;">
              <strong style="color:${this.ink};font-size:15px;">Zelle</strong><br>
              <span style="color:${this.ink};font-size:14px;">Recipient: <strong>HEALTH SBB</strong></span><br>
              <span style="color:${this.ink};font-size:14px;">Phone: <strong>702-686-5343</strong></span>
            </td>
          </tr>
        </table>

        <!-- Venmo -->
        <table role="presentation" style="width:100%;margin-bottom:18px;">
          <tr>
            <td style="width:36px;vertical-align:top;padding-top:2px;">
              <div style="width:32px;height:32px;border-radius:8px;background:${this.sage};text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#ffffff;">V</div>
            </td>
            <td style="padding-left:12px;">
              <strong style="color:${this.ink};font-size:15px;">Venmo</strong><br>
              <span style="color:${this.ink};font-size:14px;">Username: <strong>@healthsbb</strong></span><br>
              <span style="color:${this.ink};font-size:14px;">Phone: <strong>702-686-5343</strong></span>
            </td>
          </tr>
        </table>

        <!-- CashApp -->
        <table role="presentation" style="width:100%;">
          <tr>
            <td style="width:36px;vertical-align:top;padding-top:2px;">
              <div style="width:32px;height:32px;border-radius:8px;background:${this.rose};text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#ffffff;">$</div>
            </td>
            <td style="padding-left:12px;">
              <strong style="color:${this.ink};font-size:15px;">CashApp</strong><br>
              <span style="color:${this.ink};font-size:14px;">Tag: <strong>$ScienceBasedBody</strong></span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Important note -->
      <div style="background:${this.bone};border-left:4px solid ${this.rose};padding:16px 20px;margin-bottom:25px;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;color:${this.ink};line-height:1.6;">
          <strong>Important:</strong> Please include your invoice number <strong>#${order.orderNumber}</strong> in the payment note or memo so we can match your payment to your order.
        </p>
      </div>

      <p style="margin:0 0 25px 0;font-size:15px;color:${this.ink};line-height:1.6;">
        Once payment is received, your order will be processed and shipped. You'll receive a shipping confirmation email with tracking information.
      </p>

      <!-- ============ ORDER SUMMARY ============ -->
      <h2 style="margin:0 0 15px 0;font-size:18px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Order Summary</h2>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:25px;">
        <tr style="background:${this.bone};">
          <th style="padding:12px 0;text-align:left;font-size:14px;color:#6b7280;font-weight:500;">Item</th>
          <th style="padding:12px 0;text-align:center;font-size:14px;color:#6b7280;font-weight:500;">Qty</th>
          <th style="padding:12px 0;text-align:right;font-size:14px;color:#6b7280;font-weight:500;">Price</th>
        </tr>
        ${itemsHtml}
      </table>

      <table role="presentation" style="width:100%;margin-bottom:25px;">
        <tr>
          <td style="padding:5px 0;color:#6b7280;">Subtotal</td>
          <td style="padding:5px 0;text-align:right;color:${this.ink};">$${order.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#6b7280;">Shipping</td>
          <td style="padding:5px 0;text-align:right;color:${this.ink};">${order.shipping === 0 ? 'FREE' : '$' + order.shipping.toFixed(2)}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr>
          <td style="padding:5px 0;color:${this.sage};">Discount</td>
          <td style="padding:5px 0;text-align:right;color:${this.sage};">-$${order.discount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding:5px 0;color:#6b7280;">Tax</td>
          <td style="padding:5px 0;text-align:right;color:${this.ink};">$${order.tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:2px solid ${this.sage};font-weight:600;color:${this.ink};">Total Due</td>
          <td style="padding:12px 0;border-top:2px solid ${this.sage};text-align:right;font-weight:600;font-size:18px;color:${this.ink};">$${order.total.toFixed(2)}</td>
        </tr>
      </table>

      <h2 style="margin:0 0 15px 0;font-size:18px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Shipping To</h2>
      <div style="background:${this.bone};border-radius:8px;padding:20px;margin-bottom:25px;border:1px solid ${this.sage};">
        <p style="margin:0;font-size:14px;color:${this.ink};line-height:1.6;">
          ${order.shippingAddress.name}<br>
          ${order.shippingAddress.street1}<br>
          ${order.shippingAddress.street2 ? order.shippingAddress.street2 + '<br>' : ''}
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
        </p>
      </div>

      <p style="margin:0 0 15px 0;font-size:14px;color:#6b7280;line-height:1.6;">
        Questions about your order or payment? Contact us at <a href="mailto:sales@sbbpeptides.com" style="color:${this.rose};text-decoration:none;">sales@sbbpeptides.com</a>
      </p>

      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('View Order', `https://sciencebasedbody.com/account/orders/${order.orderNumber}`)}
      </p>
    `, `Order #${order.orderNumber} received - Please complete payment`);

    const text = `Thank You for Your Order - #${order.orderNumber}\n\nTotal Due: $${order.total.toFixed(2)}\n\nPlease send payment via one of the following:\n\nZelle: HEALTH SBB - 702-686-5343\nVenmo: @healthsbb - 702-686-5343\nCashApp: $ScienceBasedBody\n\nIMPORTANT: Include invoice #${order.orderNumber} in the payment note.\n\nOnce payment is received, your order will be processed and shipped.\n\nView order: https://sciencebasedbody.com/account/orders/${order.orderNumber}`;
    return { subject, html, text };
  }

  orderShipped(firstName: string, orderNumber: string, trackingNumber: string, trackingUrl: string, carrier: string): { subject: string; html: string; text: string } {
    const subject = `Your Order Has Shipped - #${orderNumber}`;
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 10px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Your Order Has Shipped!</h1>
      <p style="margin:0 0 25px 0;font-size:16px;color:${this.ink};">
        Hi ${firstName}, great news! Your order is on its way.
      </p>

      <div style="background:${this.bone};border-radius:8px;padding:20px;margin-bottom:25px;border:1px solid ${this.sage};">
        <table role="presentation" style="width:100%;">
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Order Number</span><br>
              <strong style="color:${this.ink};">#${orderNumber}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Carrier</span><br>
              <strong style="color:${this.ink};">${carrier}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Tracking Number</span><br>
              <strong style="color:${this.ink};">${trackingNumber}</strong>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('Track Package', trackingUrl)}
      </p>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        Tracking information may take up to 24 hours to update after shipment.
      </p>
    `, `Your order #${orderNumber} is on its way`);

    const text = `Your Order Has Shipped - #${orderNumber}\n\nCarrier: ${carrier}\nTracking: ${trackingNumber}\n\nTrack: ${trackingUrl}`;
    return { subject, html, text };
  }

  orderDelivered(firstName: string, orderNumber: string): { subject: string; html: string; text: string } {
    const subject = `Order Delivered - #${orderNumber}`;
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 10px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Your Order Has Been Delivered!</h1>
      <p style="margin:0 0 25px 0;font-size:16px;color:${this.ink};">
        Hi ${firstName}, your order #${orderNumber} has been delivered.
      </p>

      <p style="margin:0 0 25px 0;font-size:16px;color:${this.ink};">
        Thank you for shopping with Science Based Body. We hope you're satisfied with your purchase.
      </p>

      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('Shop Again', 'https://sciencebasedbody.com/shop')}
      </p>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        Questions about your order? Contact us at <a href="mailto:${this.supportEmail}" style="color:${this.rose};text-decoration:none;">${this.supportEmail}</a>
      </p>
    `, `Order #${orderNumber} delivered`);

    const text = `Order Delivered - #${orderNumber}\n\nThank you for shopping with Science Based Body.`;
    return { subject, html, text };
  }

  paymentConfirmed(firstName: string, orderNumber: string, amount: number): { subject: string; html: string; text: string } {
    const subject = `Payment Received - Order #${orderNumber}`;
    const formattedAmount = `$${amount.toFixed(2)}`;

    const html = this.baseTemplate(`
      <h1 style="margin:0 0 10px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Payment Confirmed!</h1>
      <p style="margin:0 0 25px 0;font-size:16px;color:${this.ink};">
        Hi ${firstName}, we've received and verified your payment of <strong>${formattedAmount}</strong> for order <strong>#${orderNumber}</strong>.
      </p>

      <div style="background:${this.bone};border-left:4px solid ${this.sage};padding:20px;margin-bottom:25px;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:16px;color:${this.ink};line-height:1.6;">
          Your order is now being prepared for shipment. You'll receive a shipping confirmation email with tracking information once your order ships.
        </p>
      </div>

      <div style="background:${this.bone};border-radius:8px;padding:20px;margin-bottom:25px;border:1px solid ${this.sage};">
        <table role="presentation" style="width:100%;">
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Order Number</span><br>
              <strong style="color:${this.ink};">#${orderNumber}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Amount Paid</span><br>
              <strong style="color:${this.ink};font-size:18px;">${formattedAmount}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Status</span><br>
              <strong style="color:${this.sage};">Payment Received - Preparing to Ship</strong>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('View Order', `https://sciencebasedbody.com/account/orders/${orderNumber}`)}
      </p>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        Questions? Contact us at <a href="mailto:sales@sbbpeptides.com" style="color:${this.rose};text-decoration:none;">sales@sbbpeptides.com</a>
      </p>
    `, `Payment confirmed for order #${orderNumber}`);

    const text = `Payment Confirmed!\n\nHi ${firstName},\n\nWe've received your payment of ${formattedAmount} for order #${orderNumber}.\n\nYour order is now being prepared for shipment. You'll receive a tracking email once it ships.\n\nView order: https://sciencebasedbody.com/account/orders/${orderNumber}`;
    return { subject, html, text };
  }

  // ===========================================================================
  // ADMIN NOTIFICATIONS
  // ===========================================================================

  adminNewOrder(order: OrderDetails, customerEmail: string): { subject: string; html: string; text: string } {
    const subject = `[SBB] New Order - #${order.orderNumber} - $${order.total.toFixed(2)}`;

    const itemsList = order.items.map(item =>
      `• ${item.name} x${item.quantity} - $${item.price.toFixed(2)}`
    ).join('\n');

    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:24px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">New Order Received</h1>

      <div style="background:${this.bone};border-left:4px solid ${this.sage};padding:15px;margin-bottom:20px;border-radius:0 8px 8px 0;">
        <strong style="color:${this.ink};">Order #${order.orderNumber}</strong><br>
        <span style="color:${this.ink};">Total: $${order.total.toFixed(2)}</span>
      </div>

      <p style="margin:0 0 10px 0;color:${this.ink};"><strong>Customer:</strong> ${customerEmail}</p>
      <p style="margin:0 0 20px 0;color:${this.ink};"><strong>Ship To:</strong> ${order.shippingAddress.city}, ${order.shippingAddress.state}</p>

      <h3 style="margin:0 0 10px 0;font-size:16px;color:${this.ink};">Items:</h3>
      <pre style="background:${this.bone};padding:15px;border-radius:6px;font-size:14px;overflow:auto;color:${this.ink};border:1px solid ${this.sage};">${itemsList}</pre>

      <p style="margin:25px 0 0 0;text-align:center;">
        ${this.button('View in Admin', `https://sciencebasedbody.com/admin/orders/${order.orderNumber}`)}
      </p>
    `);

    const text = `New Order #${order.orderNumber}\nTotal: $${order.total.toFixed(2)}\nCustomer: ${customerEmail}\n\n${itemsList}`;
    return { subject, html, text };
  }

  adminLowStock(productName: string, sku: string, currentStock: number, threshold: number): { subject: string; html: string; text: string } {
    const subject = `[SBB] Low Stock Alert - ${productName}`;
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:24px;color:${this.rose};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Low Stock Alert</h1>

      <div style="background:${this.bone};border-left:4px solid ${this.rose};padding:15px;margin-bottom:20px;border-radius:0 8px 8px 0;">
        <strong style="color:${this.ink};">${productName}</strong><br>
        <span style="color:#6b7280;">SKU: ${sku}</span>
      </div>

      <p style="margin:0 0 10px 0;font-size:16px;color:${this.ink};">
        <strong>Current Stock:</strong> <span style="color:${this.rose};font-weight:600;">${currentStock} units</span>
      </p>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};">
        <strong>Threshold:</strong> ${threshold} units
      </p>

      <p style="margin:0;text-align:center;">
        ${this.button('Manage Inventory', 'https://sciencebasedbody.com/admin/inventory')}
      </p>
    `);

    const text = `Low Stock Alert\n\n${productName} (${sku})\nCurrent: ${currentStock} units\nThreshold: ${threshold} units`;
    return { subject, html, text };
  }

  adminReturnRequest(
    orderNumber: string,
    customerEmail: string,
    reason: string,
    items: Array<{ name: string; quantity: number }>,
  ): { subject: string; html: string; text: string } {
    const subject = `[SBB] Return Request - Order #${orderNumber}`;

    const itemsList = items.map(item => `• ${item.name} x${item.quantity}`).join('\n');
    const itemsHtml = items.map(item => `<li>${item.name} x${item.quantity}</li>`).join('');

    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:24px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">New Return Request</h1>

      <div style="background:${this.bone};border-left:4px solid ${this.powder};padding:15px;margin-bottom:20px;border-radius:0 8px 8px 0;">
        <strong style="color:${this.ink};">Order #${orderNumber}</strong><br>
        <span style="color:#6b7280;">Customer: ${customerEmail}</span>
      </div>

      <h3 style="margin:0 0 10px 0;font-size:16px;color:${this.ink};">Return Reason:</h3>
      <p style="margin:0 0 20px 0;font-size:14px;color:${this.ink};background:${this.bone};padding:15px;border-radius:6px;border:1px solid ${this.sage};">${reason}</p>

      <h3 style="margin:0 0 10px 0;font-size:16px;color:${this.ink};">Items Requested for Return:</h3>
      <ul style="margin:0 0 25px 0;padding-left:20px;font-size:14px;color:${this.ink};line-height:1.8;">
        ${itemsHtml}
      </ul>

      <p style="margin:0;text-align:center;">
        ${this.button('Review Return', `https://sciencebasedbody.com/admin/orders/${orderNumber}`)}
      </p>
    `);

    const text = `New Return Request\n\nOrder: #${orderNumber}\nCustomer: ${customerEmail}\n\nReason: ${reason}\n\nItems:\n${itemsList}`;
    return { subject, html, text };
  }

  // ===========================================================================
  // CONTACT & SUPPORT
  // ===========================================================================

  contactFormReceived(name: string, email: string, subject: string, message: string, type?: string): { subject: string; html: string; text: string } {
    const emailSubject = `[SBB Contact] ${type ? `[${type}] ` : ''}${subject}`;
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:24px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">New Contact Form Submission</h1>

      ${type ? `<p style="margin:0 0 15px 0;color:${this.ink};"><strong>Type:</strong> ${type}</p>` : ''}
      <p style="margin:0 0 15px 0;color:${this.ink};"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p style="margin:0 0 15px 0;color:${this.ink};"><strong>Subject:</strong> ${subject}</p>

      <div style="background:${this.bone};padding:20px;border-radius:8px;margin-top:20px;border:1px solid ${this.sage};">
        <h3 style="margin:0 0 10px 0;font-size:16px;color:#6b7280;">Message:</h3>
        <p style="margin:0;color:${this.ink};white-space:pre-wrap;">${message}</p>
      </div>

      <p style="margin:25px 0 0 0;">
        <a href="mailto:${email}" style="color:${this.rose};text-decoration:none;">Reply to ${email}</a>
      </p>
    `);

    const text = `New Contact Form\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\nMessage:\n${message}`;
    return { subject: emailSubject, html, text };
  }

  contactFormConfirmation(firstName: string): { subject: string; html: string; text: string } {
    const subject = 'We Received Your Message - Science Based Body';
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Message Received</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        Hi ${firstName}, thank you for contacting Science Based Body. We've received your message and will respond within 1-2 business days.
      </p>
      <p style="margin:0;font-size:14px;color:#6b7280;">
        For urgent inquiries, please email us directly at <a href="mailto:${this.supportEmail}" style="color:${this.rose};text-decoration:none;">${this.supportEmail}</a>
      </p>
    `, 'We received your message and will respond soon');

    const text = `Hi ${firstName},\n\nThank you for contacting us. We'll respond within 1-2 business days.\n\nScience Based Body`;
    return { subject, html, text };
  }

  // ===========================================================================
  // NEWSLETTER
  // ===========================================================================

  newsletterWelcome(email: string): { subject: string; html: string; text: string } {
    const subject = 'Welcome to the SBB Newsletter';
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">You're Subscribed!</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        Thank you for subscribing to the Science Based Body newsletter. You'll receive:
      </p>
      <ul style="margin:0 0 25px 0;padding-left:20px;font-size:16px;color:${this.ink};line-height:1.8;">
        <li>Research updates and scientific insights</li>
        <li>New product announcements</li>
        <li>Exclusive subscriber offers</li>
      </ul>
      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('Shop Now', 'https://sciencebasedbody.com/shop')}
      </p>
      <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
        <a href="https://sciencebasedbody.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:#6b7280;">Unsubscribe</a>
      </p>
    `, 'Welcome to the Science Based Body newsletter');

    const text = `You're subscribed to the SBB newsletter!\n\nVisit: https://sciencebasedbody.com/shop`;
    return { subject, html, text };
  }

  // ===========================================================================
  // RETURNS & REFUNDS
  // ===========================================================================

  returnApproved(firstName: string, orderNumber: string, refundAmount: number): { subject: string; html: string; text: string } {
    const subject = `Return Approved - Order #${orderNumber}`;
    const formattedAmount = `$${refundAmount.toFixed(2)}`;

    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Return Approved!</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        Hi ${firstName}, your return request for order <strong>#${orderNumber}</strong> has been approved.
      </p>

      <div style="background:${this.bone};border-left:4px solid ${this.sage};padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 10px 0;font-size:14px;color:#6b7280;font-weight:600;">Refund Amount</p>
        <p style="margin:0;font-size:24px;color:${this.ink};font-weight:700;">${formattedAmount}</p>
      </div>

      <h3 style="margin:25px 0 10px 0;font-size:16px;color:${this.ink};">Next Steps:</h3>
      <ol style="margin:0 0 25px 0;padding-left:20px;font-size:14px;color:${this.ink};line-height:1.8;">
        <li>Pack the item(s) securely in original packaging if available</li>
        <li>Include a copy of this email or your order number</li>
        <li>Ship to the return address provided</li>
        <li>Once received and inspected, your refund will be processed within 5-7 business days</li>
      </ol>

      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('View Return Details', `https://sciencebasedbody.com/account/orders/${orderNumber}`)}
      </p>
    `, `Your return for order #${orderNumber} has been approved`);

    const text = `Return Approved!\n\nHi ${firstName},\n\nYour return request for order #${orderNumber} has been approved.\n\nRefund Amount: ${formattedAmount}\n\nPlease pack and ship the items back. Once received, your refund will be processed within 5-7 business days.`;
    return { subject, html, text };
  }

  returnRejected(firstName: string, orderNumber: string, reason: string): { subject: string; html: string; text: string } {
    const subject = `Return Request Update - Order #${orderNumber}`;

    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Return Request Update</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        Hi ${firstName}, we've reviewed your return request for order <strong>#${orderNumber}</strong>.
      </p>

      <div style="background:${this.bone};border-left:4px solid ${this.rose};padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 10px 0;font-size:14px;color:${this.rose};font-weight:600;">Unable to Process Return</p>
        <p style="margin:0;font-size:14px;color:${this.ink};">${reason}</p>
      </div>

      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        If you believe this decision was made in error or have additional information to provide, please contact our support team.
      </p>

      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('Contact Support', 'https://sciencebasedbody.com/contact')}
      </p>
    `, `Update on your return request for order #${orderNumber}`);

    const text = `Return Request Update\n\nHi ${firstName},\n\nWe've reviewed your return request for order #${orderNumber}.\n\nUnfortunately, we are unable to process this return:\n${reason}\n\nIf you have questions, please contact our support team.`;
    return { subject, html, text };
  }

  refundIssued(firstName: string, orderNumber: string, refundAmount: number, refundMethod: string): { subject: string; html: string; text: string } {
    const subject = `Refund Issued - Order #${orderNumber}`;
    const formattedAmount = `$${refundAmount.toFixed(2)}`;

    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Refund Processed!</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        Hi ${firstName}, your refund for order <strong>#${orderNumber}</strong> has been processed.
      </p>

      <div style="background:${this.bone};border-radius:8px;padding:20px;margin:20px 0;border:1px solid ${this.sage};">
        <table role="presentation" style="width:100%;">
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Refund Amount</span><br>
              <strong style="color:${this.ink};font-size:20px;">${formattedAmount}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Refund Method</span><br>
              <strong style="color:${this.ink};">${refundMethod}</strong>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;line-height:1.6;">
        Please allow 5-10 business days for the refund to appear in your account, depending on your financial institution.
      </p>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        Thank you for shopping with Science Based Body. We hope to serve you again.
      </p>
    `, `Your refund of ${formattedAmount} has been processed`);

    const text = `Refund Processed!\n\nHi ${firstName},\n\nYour refund for order #${orderNumber} has been processed.\n\nRefund Amount: ${formattedAmount}\nRefund Method: ${refundMethod}\n\nPlease allow 5-10 business days for the refund to appear in your account.`;
    return { subject, html, text };
  }

  returnReceived(firstName: string, orderNumber: string): { subject: string; html: string; text: string } {
    const subject = `Return Received - Order #${orderNumber}`;

    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.ink};font-family:Georgia,'Times New Roman',Times,serif;font-weight:400;">Return Received</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:${this.ink};line-height:1.6;">
        Hi ${firstName}, we've received your return for order <strong>#${orderNumber}</strong>.
      </p>

      <div style="background:${this.bone};border-left:4px solid ${this.powder};padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;color:${this.ink};">
          Our team is now inspecting the returned items. Once the inspection is complete, your refund will be processed within 5-7 business days.
        </p>
      </div>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        We'll send you another email once your refund has been issued. Thank you for your patience.
      </p>
    `, `We've received your return for order #${orderNumber}`);

    const text = `Return Received\n\nHi ${firstName},\n\nWe've received your return for order #${orderNumber}.\n\nOur team is inspecting the items. Your refund will be processed within 5-7 business days after inspection.\n\nThank you for your patience.`;
    return { subject, html, text };
  }
}
