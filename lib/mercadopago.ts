import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';

if (!process.env.MP_ACCESS_TOKEN) {
  console.warn('[MercadoPago] MP_ACCESS_TOKEN no configurada en variables de entorno.');
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  }
});

export const preference = new Preference(client);
export const payment = new Payment(client);
export const refund = new PaymentRefund(client);

/**
 * Realiza un reembolso parcial (o total) de un pago de Mercado Pago.
 * @param paymentId El ID del pago original.
 * @param amount El monto a devolver al comprador.
 */
export async function processPartialRefund(paymentId: string | number, amount: number) {
  try {
    const result = await refund.create({
      payment_id: paymentId,
      body: {
        amount: amount
      }
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('[MP Refund Error]:', error);
    return { success: false, error: error.message };
  }
}
