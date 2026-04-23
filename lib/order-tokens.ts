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
  
  // Retornamos el payload + la firma codificado en Base64URL para usarlo en la URL
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

export function verifyConfirmToken(token: string): { itemId: string; orderId: string } | null {
  try {
    if (!token) {
      console.error('[Token] Token vacío');
      return null;
    }

    // Aceptamos base64url. Si por si acaso llega un base64 normal, base64url también lo lee bien en Node.
    let decoded = '';
    try {
      decoded = Buffer.from(token, 'base64url').toString('utf8');
    } catch (e) {
      console.error('[Token] Error decodificando base64url', e);
      return null;
    }

    const parts = decoded.split('.');
    if (parts.length !== 2) {
      console.error(`[Token] Formato inválido tras decode. Esperado 2 partes, obtuve ${parts.length}. Decoded: ${decoded.substring(0, 20)}...`);
      return null;
    }

    const [payload, signature] = parts;
    const payloadParts = payload.split(':');
    
    if (payloadParts.length !== 3) {
      console.error(`[Token] Payload inválido. Esperado 3 partes, obtuve ${payloadParts.length}. Payload: ${payload}`);
      return null;
    }

    const [itemId, orderId, timestamp] = payloadParts;
    
    // Validar firma
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error(`[Token] Firma no coincide. Esperada: ${expectedSignature}, recibida: ${signature}`);
      return null;
    }

    // Opcional: Validar expiración (ej. 30 días)
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(timestamp) > thirtyDays) {
      console.error('[Token] Token expirado');
      return null;
    }

    return { itemId, orderId };
  } catch (err: any) {
    console.error('[Token] Excepción inesperada en verifyConfirmToken:', err.message);
    return null;
  }
}
