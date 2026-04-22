import crypto from 'node:crypto';

/**
 * Utilidad simple para manejar tokens de confirmación de pedido sin dependencias externas.
 * Usa Hmac con SHA256 y una secret key para asegurar que los links no sean manipulables.
 */

const SECRET = process.env.AUTH_SECRET || 'fallback-secret-for-order-tokens';

export function generateConfirmToken(itemId: string, orderId: string): string {
  const payload = `${itemId}:${orderId}:${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');
  
  // Retornamos el payload + la firma codificado en Base64 para usarlo en la URL
  return Buffer.from(`${payload}.${signature}`).toString('base64');
}

export function verifyConfirmToken(token: string): { itemId: string; orderId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [payload, signature] = decoded.split('.');
    
    const [itemId, orderId, timestamp] = payload.split(':');
    
    // Validar firma
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) return null;

    // Opcional: Validar expiración (ej. 30 días)
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(timestamp) > thirtyDays) return null;

    return { itemId, orderId };
  } catch (_err) {
    return null;
  }
}
