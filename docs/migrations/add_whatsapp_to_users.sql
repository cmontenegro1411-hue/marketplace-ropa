-- Añadir campo de whatsapp al usuario para habilitar el modelo de reserva contra-entrega
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number text;
