import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

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
