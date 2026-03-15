export function formatShippingAddress(address) {
  if (!address || typeof address !== 'object' || Array.isArray(address)) return 'Non renseignee'
  return [
    address.name,
    address.line1,
    address.line2,
    [address.postal_code, address.city].filter(Boolean).join(' '),
    address.state,
    address.country,
    address.phone ? `Tel: ${address.phone}` : '',
  ].filter(Boolean).join(', ')
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
