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
  private readonly brandColor = '#1a1a2e';
  private readonly accentColor = '#4ade80';
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
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" style="width:600px;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding:30px 40px;background:${this.brandColor};text-align:center;">
              <img src="${this.logoUrl}" alt="Science Based Body" style="max-width:200px;height:auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:30px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 15px 0;font-size:12px;color:#6b7280;text-align:center;">
                All products sold by Science Based Body are intended strictly for research, laboratory, or analytical purposes only.
                Products are NOT intended for human or veterinary consumption, therapeutic use, or diagnostic purposes.
              </p>
              <p style="margin:0 0 10px 0;font-size:12px;color:#6b7280;text-align:center;">
                Research Use Only (RUO) - 21 CFR 809.10(c)
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                © ${new Date().getFullYear()} Science Based Body LLC. All rights reserved.<br>
                <a href="https://sciencebasedbody.com/policies/privacy" style="color:#6b7280;">Privacy Policy</a> |
                <a href="https://sciencebasedbody.com/policies/terms" style="color:#6b7280;">Terms of Service</a>
              </p>
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
    return `<a href="${url}" style="display:inline-block;padding:14px 32px;background:${this.accentColor};color:#000000;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">${text}</a>`;
  }

  // ===========================================================================
  // ACCOUNT EMAILS
  // ===========================================================================

  welcomeEmail(firstName: string): { subject: string; html: string; text: string } {
    const subject = 'Welcome to Science Based Body';
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.brandColor};">Welcome, ${firstName}!</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
        Thank you for creating an account with Science Based Body. You now have access to:
      </p>
      <ul style="margin:0 0 25px 0;padding-left:20px;font-size:16px;color:#374151;line-height:1.8;">
        <li>Order tracking and history</li>
        <li>Saved addresses for faster checkout</li>
        <li>SBB Rewards points on every purchase</li>
        <li>Exclusive member offers</li>
      </ul>
      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('Start Shopping', 'https://sciencebasedbody.com/shop')}
      </p>
      <p style="margin:0;font-size:14px;color:#6b7280;">
        Questions? Contact us at <a href="mailto:${this.supportEmail}" style="color:${this.accentColor};">${this.supportEmail}</a>
      </p>
    `, 'Welcome to Science Based Body - Your account is ready');

    const text = `Welcome, ${firstName}!\n\nThank you for creating an account with Science Based Body.\n\nVisit: https://sciencebasedbody.com/shop`;
    return { subject, html, text };
  }

  emailVerification(firstName: string, verificationUrl: string): { subject: string; html: string; text: string } {
    const subject = 'Verify Your Email - Science Based Body';
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.brandColor};">Verify Your Email</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
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
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.brandColor};">Reset Your Password</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
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
    const subject = `Order Confirmed - #${order.orderNumber}`;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
          <strong style="color:#111827;">${item.name}</strong>
          ${item.sku ? `<br><span style="font-size:12px;color:#6b7280;">SKU: ${item.sku}</span>` : ''}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = this.baseTemplate(`
      <h1 style="margin:0 0 10px 0;font-size:28px;color:${this.brandColor};">Order Confirmed!</h1>
      <p style="margin:0 0 25px 0;font-size:16px;color:#374151;">
        Hi ${firstName}, thank you for your order. We're preparing it now.
      </p>

      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:25px;">
        <p style="margin:0 0 5px 0;font-size:14px;color:#6b7280;">Order Number</p>
        <p style="margin:0;font-size:20px;font-weight:600;color:${this.brandColor};">#${order.orderNumber}</p>
      </div>

      <h2 style="margin:0 0 15px 0;font-size:18px;color:${this.brandColor};">Order Summary</h2>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:25px;">
        <tr style="background:#f9fafb;">
          <th style="padding:12px 0;text-align:left;font-size:14px;color:#6b7280;font-weight:500;">Item</th>
          <th style="padding:12px 0;text-align:center;font-size:14px;color:#6b7280;font-weight:500;">Qty</th>
          <th style="padding:12px 0;text-align:right;font-size:14px;color:#6b7280;font-weight:500;">Price</th>
        </tr>
        ${itemsHtml}
      </table>

      <table role="presentation" style="width:100%;margin-bottom:25px;">
        <tr>
          <td style="padding:5px 0;color:#6b7280;">Subtotal</td>
          <td style="padding:5px 0;text-align:right;color:#374151;">$${order.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#6b7280;">Shipping</td>
          <td style="padding:5px 0;text-align:right;color:#374151;">${order.shipping === 0 ? 'FREE' : '$' + order.shipping.toFixed(2)}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr>
          <td style="padding:5px 0;color:#059669;">Discount</td>
          <td style="padding:5px 0;text-align:right;color:#059669;">-$${order.discount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding:5px 0;color:#6b7280;">Tax</td>
          <td style="padding:5px 0;text-align:right;color:#374151;">$${order.tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:2px solid #e5e7eb;font-weight:600;color:${this.brandColor};">Total</td>
          <td style="padding:12px 0;border-top:2px solid #e5e7eb;text-align:right;font-weight:600;font-size:18px;color:${this.brandColor};">$${order.total.toFixed(2)}</td>
        </tr>
      </table>

      <h2 style="margin:0 0 15px 0;font-size:18px;color:${this.brandColor};">Shipping To</h2>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:25px;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
          ${order.shippingAddress.name}<br>
          ${order.shippingAddress.street1}<br>
          ${order.shippingAddress.street2 ? order.shippingAddress.street2 + '<br>' : ''}
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
        </p>
      </div>

      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('View Order', `https://sciencebasedbody.com/account/orders/${order.orderNumber}`)}
      </p>
    `, `Order #${order.orderNumber} confirmed - We're preparing your order`);

    const text = `Order Confirmed - #${order.orderNumber}\n\nTotal: $${order.total.toFixed(2)}\n\nView order: https://sciencebasedbody.com/account/orders/${order.orderNumber}`;
    return { subject, html, text };
  }

  orderShipped(firstName: string, orderNumber: string, trackingNumber: string, trackingUrl: string, carrier: string): { subject: string; html: string; text: string } {
    const subject = `Your Order Has Shipped - #${orderNumber}`;
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 10px 0;font-size:28px;color:${this.brandColor};">Your Order Has Shipped!</h1>
      <p style="margin:0 0 25px 0;font-size:16px;color:#374151;">
        Hi ${firstName}, great news! Your order is on its way.
      </p>

      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:25px;">
        <table role="presentation" style="width:100%;">
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Order Number</span><br>
              <strong style="color:${this.brandColor};">#${orderNumber}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Carrier</span><br>
              <strong style="color:${this.brandColor};">${carrier}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Tracking Number</span><br>
              <strong style="color:${this.brandColor};">${trackingNumber}</strong>
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
      <h1 style="margin:0 0 10px 0;font-size:28px;color:${this.brandColor};">Your Order Has Been Delivered!</h1>
      <p style="margin:0 0 25px 0;font-size:16px;color:#374151;">
        Hi ${firstName}, your order #${orderNumber} has been delivered.
      </p>

      <p style="margin:0 0 25px 0;font-size:16px;color:#374151;">
        Thank you for shopping with Science Based Body. We hope you're satisfied with your purchase.
      </p>

      <p style="margin:0 0 30px 0;text-align:center;">
        ${this.button('Shop Again', 'https://sciencebasedbody.com/shop')}
      </p>

      <p style="margin:0;font-size:14px;color:#6b7280;">
        Questions about your order? Contact us at <a href="mailto:${this.supportEmail}" style="color:${this.accentColor};">${this.supportEmail}</a>
      </p>
    `, `Order #${orderNumber} delivered`);

    const text = `Order Delivered - #${orderNumber}\n\nThank you for shopping with Science Based Body.`;
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
      <h1 style="margin:0 0 20px 0;font-size:24px;color:${this.brandColor};">New Order Received</h1>

      <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:15px;margin-bottom:20px;">
        <strong style="color:#047857;">Order #${order.orderNumber}</strong><br>
        <span style="color:#065f46;">Total: $${order.total.toFixed(2)}</span>
      </div>

      <p style="margin:0 0 10px 0;"><strong>Customer:</strong> ${customerEmail}</p>
      <p style="margin:0 0 20px 0;"><strong>Ship To:</strong> ${order.shippingAddress.city}, ${order.shippingAddress.state}</p>

      <h3 style="margin:0 0 10px 0;font-size:16px;">Items:</h3>
      <pre style="background:#f9fafb;padding:15px;border-radius:6px;font-size:14px;overflow:auto;">${itemsList}</pre>

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
      <h1 style="margin:0 0 20px 0;font-size:24px;color:#dc2626;">Low Stock Alert</h1>

      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:15px;margin-bottom:20px;">
        <strong style="color:#991b1b;">${productName}</strong><br>
        <span style="color:#7f1d1d;">SKU: ${sku}</span>
      </div>

      <p style="margin:0 0 10px 0;font-size:16px;">
        <strong>Current Stock:</strong> <span style="color:#dc2626;font-weight:600;">${currentStock} units</span>
      </p>
      <p style="margin:0 0 20px 0;font-size:16px;">
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
      <h1 style="margin:0 0 20px 0;font-size:24px;color:#f59e0b;">New Return Request</h1>

      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:15px;margin-bottom:20px;">
        <strong style="color:#b45309;">Order #${orderNumber}</strong><br>
        <span style="color:#92400e;">Customer: ${customerEmail}</span>
      </div>

      <h3 style="margin:0 0 10px 0;font-size:16px;color:${this.brandColor};">Return Reason:</h3>
      <p style="margin:0 0 20px 0;font-size:14px;color:#374151;background:#f9fafb;padding:15px;border-radius:6px;">${reason}</p>

      <h3 style="margin:0 0 10px 0;font-size:16px;color:${this.brandColor};">Items Requested for Return:</h3>
      <ul style="margin:0 0 25px 0;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
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
      <h1 style="margin:0 0 20px 0;font-size:24px;color:${this.brandColor};">New Contact Form Submission</h1>

      ${type ? `<p style="margin:0 0 15px 0;"><strong>Type:</strong> ${type}</p>` : ''}
      <p style="margin:0 0 15px 0;"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p style="margin:0 0 15px 0;"><strong>Subject:</strong> ${subject}</p>

      <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-top:20px;">
        <h3 style="margin:0 0 10px 0;font-size:16px;color:#6b7280;">Message:</h3>
        <p style="margin:0;color:#374151;white-space:pre-wrap;">${message}</p>
      </div>

      <p style="margin:25px 0 0 0;">
        <a href="mailto:${email}" style="color:${this.accentColor};">Reply to ${email}</a>
      </p>
    `);

    const text = `New Contact Form\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\nMessage:\n${message}`;
    return { subject: emailSubject, html, text };
  }

  contactFormConfirmation(firstName: string): { subject: string; html: string; text: string } {
    const subject = 'We Received Your Message - Science Based Body';
    const html = this.baseTemplate(`
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.brandColor};">Message Received</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
        Hi ${firstName}, thank you for contacting Science Based Body. We've received your message and will respond within 1-2 business days.
      </p>
      <p style="margin:0;font-size:14px;color:#6b7280;">
        For urgent inquiries, please email us directly at <a href="mailto:${this.supportEmail}" style="color:${this.accentColor};">${this.supportEmail}</a>
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
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.brandColor};">You're Subscribed!</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
        Thank you for subscribing to the Science Based Body newsletter. You'll receive:
      </p>
      <ul style="margin:0 0 25px 0;padding-left:20px;font-size:16px;color:#374151;line-height:1.8;">
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
      <h1 style="margin:0 0 20px 0;font-size:28px;color:#059669;">Return Approved!</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
        Hi ${firstName}, your return request for order <strong>#${orderNumber}</strong> has been approved.
      </p>

      <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 10px 0;font-size:14px;color:#065f46;font-weight:600;">Refund Amount</p>
        <p style="margin:0;font-size:24px;color:#047857;font-weight:700;">${formattedAmount}</p>
      </div>

      <h3 style="margin:25px 0 10px 0;font-size:16px;color:${this.brandColor};">Next Steps:</h3>
      <ol style="margin:0 0 25px 0;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
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
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.brandColor};">Return Request Update</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
        Hi ${firstName}, we've reviewed your return request for order <strong>#${orderNumber}</strong>.
      </p>

      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 10px 0;font-size:14px;color:#991b1b;font-weight:600;">Unable to Process Return</p>
        <p style="margin:0;font-size:14px;color:#7f1d1d;">${reason}</p>
      </div>

      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
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
      <h1 style="margin:0 0 20px 0;font-size:28px;color:#059669;">Refund Processed!</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
        Hi ${firstName}, your refund for order <strong>#${orderNumber}</strong> has been processed.
      </p>

      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;">
        <table role="presentation" style="width:100%;">
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Refund Amount</span><br>
              <strong style="color:#059669;font-size:20px;">${formattedAmount}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;">
              <span style="color:#6b7280;font-size:14px;">Refund Method</span><br>
              <strong style="color:${this.brandColor};">${refundMethod}</strong>
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
      <h1 style="margin:0 0 20px 0;font-size:28px;color:${this.brandColor};">Return Received</h1>
      <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
        Hi ${firstName}, we've received your return for order <strong>#${orderNumber}</strong>.
      </p>

      <div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;color:#0369a1;">
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
