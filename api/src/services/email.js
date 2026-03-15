import { escapeHtml, formatShippingAddress } from '../lib/format.js'

export function createEmailService({ supabase, resend, emailTo, fromEmail }) {
  async function sendOrderRecapEmail(orderId) {
    try {
      const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single()
      if (orderError || !order) {
        console.error('Failed to fetch order for email:', orderError)
        return
      }

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          items:item_id (name),
          item_variants:variant_id (size, sku)
        `)
        .eq('order_id', orderId)

      if (itemsError) {
        console.error('Failed to fetch order items for email:', itemsError)
      }

      const { data: customer } = await supabase.from('users').select('email').eq('id', order.user_id).single()
      const customerEmail = customer?.email || 'Non renseigné'
      const customerName = order.shipping_address?.name || customerEmail.split('@')[0] || 'Client'
      const shippingAddress = formatShippingAddress(order.shipping_address)

      const itemsHtml = (orderItems || []).map(item => {
        const productName = escapeHtml(item.items?.name || `Produit #${item.item_id}`)
        const size = escapeHtml(item.item_variants?.size || '-')
        const sku = escapeHtml(item.item_variants?.sku || '-')
        const hookType = escapeHtml(item.customization?.hook_type || '-')

        return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${productName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${size}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${sku}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${hookType}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${(item.unit_price * item.quantity).toFixed(2)} €</td>
        </tr>`
      }).join('')

      const orderDate = new Date(order.created_at).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B7355 0%, #A0522D 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; }
          .order-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-info p { margin: 8px 0; }
          .address-block { white-space: pre-line; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; }
          .total { font-size: 1.2em; font-weight: bold; text-align: right; padding: 20px 0; border-top: 2px solid #8B7355; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Nouvelle Commande!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sabbels Handmade</p>
          </div>
          <div class="content">
            <h2>Commande #${escapeHtml(orderId)}</h2>
            <p>Une nouvelle commande vient d'être passée et payée.</p>
            <div class="order-info">
              <p><strong>Date:</strong> ${orderDate}</p>
              <p><strong>Client:</strong> ${escapeHtml(customerName)}</p>
              <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
              <p><strong>Statut:</strong> <span style="color: #22c55e; font-weight: bold;">Payée ✓</span></p>
              <p><strong>PaymentIntent:</strong> ${escapeHtml(order.payment_intent_id || 'Non renseigné')}</p>
              <p><strong>Livraison:</strong></p>
              <p class="address-block">${escapeHtml(shippingAddress)}</p>
            </div>
            <h3>Articles commandés</h3>
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Taille</th>
                  <th>SKU</th>
                  <th>Crochet</th>
                  <th style="text-align: center;">Qté</th>
                  <th style="text-align: right;">Prix</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="total">Total: ${order.total?.toFixed(2) || '0.00'} €</div>
          </div>
          <div class="footer"><p>Cet email a été envoyé automatiquement par votre boutique Sabbels Handmade.</p></div>
        </div>
      </body>
      </html>`

      if (!resend) {
        console.log('RESEND_API_KEY not configured, skipping order email')
        return
      }

      await resend.emails.send({
        from: fromEmail,
        to: emailTo,
        subject: `[Sabbels Handmade] Nouvelle commande #${orderId} - ${order.total?.toFixed(2) || '0.00'} €`,
        html,
      })
    } catch (err) {
      console.error('Failed to send order recap email:', err)
    }
  }

  async function sendContactEmail({ name, email, subject, message, attachment }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B7355 0%, #A0522D 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; }
          .info-block { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-block p { margin: 8px 0; }
          .message-block { background: #fff; border-left: 4px solid #8B7355; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
          .attachment-notice { background: #e3f2fd; padding: 10px 15px; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Nouveau Message</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Formulaire de Contact</p>
          </div>
          <div class="content">
            <div class="info-block">
              <p><strong>De:</strong> ${escapeHtml(name)}</p>
              <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
              <p><strong>Sujet:</strong> ${escapeHtml(subject)}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</p>
            </div>
            <h3>Message</h3>
            <div class="message-block">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
            ${attachment ? `<div class="attachment-notice">Pièce jointe: ${escapeHtml(attachment.originalname)} (${(attachment.size / 1024).toFixed(1)} KB)</div>` : ''}
          </div>
          <div class="footer"><p>Pour répondre, utilisez directement l'adresse email du client ci-dessus.</p></div>
        </div>
      </body>
      </html>`

    const payload = {
      from: fromEmail,
      to: emailTo,
      replyTo: email,
      subject: `📬 ${subject} - de ${name}`,
      html,
    }

    if (attachment) {
      payload.attachments = [{
        filename: attachment.originalname,
        content: attachment.buffer,
      }]
    }

    if (!resend) {
      console.log('RESEND_API_KEY not configured, contact form submission logged only')
      console.log({ name, email, subject, message, hasAttachment: !!attachment })
      return { success: true, message: 'Message reçu (mode test)' }
    }

    await resend.emails.send(payload)
    return { success: true, message: 'Message envoyé avec succès' }
  }

  return {
    sendContactEmail,
    sendOrderRecapEmail,
  }
}
