# 🧠 CEREBRO CENTRAL - Marketplace Moda Circular

## 0. METADATA Y ESTADO DEL SISTEMA

- **Versión Actual:** 1.7.5
- **Fase de Desarrollo:** Refinamiento de Billetera Virtual, Auditoría de Transacciones (Escrow Centralizado) y estabilización de UI.
- **Directiva del Orquestador:** Este documento es la única fuente de verdad absoluta. Se prohíbe cualquier implementación que contradiga este flujo.

## 1. ARQUITECTURA Y REGLAS GLOBALES (Actualizado v1.7.2)

- **Stack:** Next.js 14/16 (App Router), Supabase (PostgreSQL), Mercado Pago SDK, NextAuth v5, Brevo.
- **Modelo de Negocio:**
  1. **Registro Vendedor:** Gratuito.
  2. **Monetización (Créditos IA):** La IA para creación de listings se maneja con créditos. El registro otorga un paquete inicial gratis. Agotados estos, el vendedor compra más. Se manejan en la tabla independiente `listing_credits`.
  3. **Fideicomiso (Escrow Centralizado):** El dinero de TODAS las compras entra a la cuenta maestra de Mercado Pago de la plataforma. **NO se guarda `mp_access_token` individual por vendedor**. El control de saldos de cada vendedor se maneja de forma virtual en la tabla `users` mediante `balance_pending` y `balance_available`.
- **Moneda:** Sol Peruano (S/).

## 2. FLUJOS OPERATIVOS (Inmutables)

### 2.1 Ciclo de Compra y Escrow (Billetera Virtual)

- **Paso 1 (Compra):**
  - El comprador paga a la cuenta maestra de Mercado Pago.
  - La prenda cambia de estado a `reserved` (Reservado).
  - Se ejecuta un RPC de captura (`capture_escrow_funds`) que:
    1. Aumenta el `balance_pending` (En tránsito) del vendedor.
    2. Registra la acción en `wallet_transactions` para auditoría.
- **Paso 2 (Confirmación de Recibido):**
  - El comprador recibe un enlace cifrado (seguro en `base64url`) por correo.
  - Al hacer clic, se marca la prenda como `sold` (Vendido).
  - Se ejecuta el RPC de liberación (`release_escrow_funds`) que:
    1. Resta el monto de `balance_pending` y lo suma a `balance_available`.
    2. Registra la acción en `wallet_transactions`.
- **Importante:** Cualquier consulta a la base de datos para mostrar saldos (ej. en Perfil) debe realizarse con caché deshabilitada (`force-no-store`) para reflejar los montos en tiempo real.

### 2.2 Proceso de Devolución

- **Solicitud:** Botón "Solicitar Devolución" en el correo del comprador.
- **Seguridad:** El dinero NO se devuelve automáticamente. Los fondos se mantienen congelados en el Escrow central (`balance_pending`) hasta que el vendedor confirme haber recibido la prenda de regreso. Solo entonces se procesa el reembolso al comprador.

## 3. ESTADOS DE DOMINIO Y REGLAS TÉCNICAS

### 3.1 Base de Datos (Supabase)

- **Saldos:** NUNCA alterar `balance_pending` o `balance_available` manualmente vía queries simples (`.update()`). Siempre usar las funciones RPC (`capture_escrow_funds`, `release_escrow_funds`) para garantizar que se genere el registro de auditoría en `wallet_transactions`.
- **Créditos:** Gestionados en la tabla `listing_credits`. Nunca buscar la columna `ia_credits` dentro de `users`.
- **Mercado Pago:** Nunca buscar `mp_access_token` en `users` ya que la plataforma usa Escrow Centralizado (solo se usa el token global del `.env`).

### 3.2 Frontend (Next.js App Router)

- **Caché:** Next.js es muy agresivo cacheando peticiones `fetch` (método que usa Supabase internamente). Cualquier página que muestre transacciones o saldos financieros (como el Dashboard o Perfil) debe usar `export const fetchCache = 'force-no-store'` en la raíz de la ruta para garantizar datos reales, o revalidaciones rigurosas (`revalidatePath`).
- **UI de Billetera:** Las transacciones en el frontend deben agruparse por `order_item_id`. Aunque la BD tenga filas separadas para `capture` y `release`, la vista las fusiona mostrando un solo registro con columnas "Retenido" y "Liberado" para simplificar la información al vendedor.
- **UI de Productos:** Las tarjetas de producto muestran el listón de "Reservado" (full-overlay inclinado en el centro) cuando el estado es `reserved`, y cambian automáticamente al mismo formato pero con "Vendido" cuando es `sold`.
- **Enlaces de Email:** Siempre generar y decodificar los tokens de correo con `base64url` (no `base64` estándar) para evitar que caracteres inválidos como `+` o `/` rompan el link en los navegadores de los clientes de correo.

## 4. DICCIONARIO DE DATOS ESTRATÉGICOS

- **`users`:** `{ id, email, balance_pending, balance_available, role }` (Ya no existe integración MP individual).
- **`wallet_transactions`:** `{ id, user_id, type ('capture', 'release', 'withdrawal', 'refund'), amount, balance_after_pending, balance_after_available, created_at }`. Tabla inmutable para auditoría financiera de cada vendedor.
- **`listing_credits`:** `{ id, user_id, plan, credits_total, credits_used }`.
- **`products`:** `{ id, status ('available', 'reserved', 'sold', 'shipped'), price, conformity_token }`.
- **`order_items`:** `{ id, order_id, product_id, seller_id, payout_amount, status }`.

## 5. CHANGELOG

- **[24-04-2026] - v1.7.5:** Optimización del Dashboard CRM Admin. Se ajustó el cálculo de "Ventas Realizadas" para excluir explícitamente órdenes reembolsadas (`payment_status = 'refunded'`). Se mejoró la visualización de estados en la actividad reciente (Pagado, Devuelto, En Disputa, En Tránsito) para mayor precisión operativa.
- **[24-04-2026] - v1.7.4:** Implementación de lógica de reembolso híbrida. El sistema ahora detecta órdenes en modo "Bypass" (sin `mp_payment_id`) y permite completar el flujo de retorno y reversión de fondos interna (`revert_escrow_funds`) sin fallar por falta de integración con Mercado Pago. Esto estabiliza el entorno de pruebas y despliegues en Vercel para validaciones de fin de flujo.
- **[23-04-2026] - v1.7.3:** Estabilización de notificaciones por correo en producción. Configuración de variables de entorno de Brevo en Vercel. Corrección de `NEXT_PUBLIC_SITE_URL` para enlaces funcionales de confirmación y devolución. Refactorización de `completePurchase` para mayor resiliencia ante errores de base de datos.
- **[22-04-2026] - v1.7.2:** Actualización del modelo Escrow a **Centralizado con Billetera Virtual**. Se eliminan las integraciones individuales de Mercado Pago. Implementación de RPCs atómicos para control de saldos y auditoría. Corrección de caché de Next.js en el frontend. Enlaces email a `base64url`.
- **[22-04-2026] - v1.7.0:** Reestructuración profunda. Registro gratuito. Créditos IA independizados. Escrow a 72h.
- **[Previo]:** Eliminación flujos Pay-First.
