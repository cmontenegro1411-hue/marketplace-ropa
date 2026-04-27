# 🧠 CEREBRO CENTRAL - Marketplace Moda Circular

## 0. METADATA Y ESTADO DEL SISTEMA

- **Versión Actual:** 1.8.1
- **Fase de Desarrollo:** Marketplace Filter Optimization, Categorización Dual y Despliegue en Producción.
- **Directiva del Orquestador:** Este documento es la única fuente de verdad absoluta. Se prohíbe cualquier implementación que contradiga este flujo.

## 1. ARQUITECTURA Y REGLAS GLOBALES (Actualizado v1.8.1)

- **Stack:** Next.js 14/16 (App Router), Supabase (PostgreSQL), Mercado Pago SDK, NextAuth v5, Brevo, Vercel.
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

- **Categorización Dual (`Segment | Type`):** Los productos utilizan un formato de cadena separada por pipes en la columna `category` (ej: `Mujer | Ropa`, `Unisex | Calzado`). Esto permite búsquedas granulares sin necesidad de múltiples columnas de categorías.
- **Saldos:** NUNCA alterar `balance_pending` o `balance_available` manualmente vía queries simples (`.update()`). Siempre usar las funciones RPC (`capture_escrow_funds`, `release_escrow_funds`) para garantizar que se genere el registro de auditoría en `wallet_transactions`.
- **Créditos:** Gestionados en la tabla `listing_credits`. Nunca buscar la columna `ia_credits` dentro de `users`.
- **Mercado Pago:** Nunca buscar `mp_access_token` en `users` ya que la plataforma usa Escrow Centralizado (solo se usa el token global del `.env`).

### 3.2 Frontend (Next.js App Router)

- **Lógica de Filtros (Segmentos vs Tipos):** 
  - Las búsquedas por segmento desde el Navbar (Mujer, Hombre, Niños) son **estrictas** para mantener la UI limpia.
  - Las búsquedas combinadas (ej. `Hombre + Calzado`) utilizan inclusión dinámica de `Unisex` para no ocultar opciones válidas (como zapatillas unisex).
  - Los accesorios puramente femeninos (Aretes, Bolsos de mano) deben estar categorizados como `Mujer` para evitar ruido en filtros masculinos.
- **Caché:** Next.js es muy agresivo cacheando peticiones `fetch`. Dashboards y Perfiles deben usar `export const fetchCache = 'force-no-store'` o `revalidatePath`.
- **UI de Billetera:** Las transacciones se agrupan por `order_item_id`. La vista fusiona `capture` y `release` en un solo registro con columnas de estado financiero.
- **UI de Productos:** Listones de "Reservado" y "Vendido" automáticos basados en el `status`. La sección **"Recién Llegados"** (Home) debe filtrar estrictamente por `status: 'available'` para no mostrar artículos ya vendidos.
- **Enlaces de Email:** Uso obligatorio de `base64url` para tokens.

## 4. DICCIONARIO DE DATOS ESTRATÉGICOS

- **`users`:** `{ id, email, balance_pending, balance_available, role }`.
- **`wallet_transactions`:** `{ id, user_id, type, amount, balance_after_pending, balance_after_available, created_at }`.
- **`listing_credits`:** `{ id, user_id, plan, credits_total, credits_used }`.
- **`products`:** `{ id, status ('available', 'reserved', 'sold', 'shipped'), price, category ('Segment | Type'), conformity_token }`.
- **`order_items`:** `{ id, order_id, product_id, seller_id, payout_amount, status }`.

## 5. CHANGELOG

- **[27-04-2026] - v1.8.1:** Optimización de visibilidad en Home. Se implementó filtro estricto de artículos disponibles para la sección de 'Recién Llegados', eliminando ruido visual de productos ya vendidos.
- **[25-04-2026] - v1.8.0:** Marketplace Optimization & Deployment. Migración masiva de productos al nuevo sistema de categorías dual (`Segment | Type`). Refactorización de la lógica de búsqueda en `SearchPage` para manejar inclusión inteligente de productos Unisex. Corrección de clasificación de accesorios femeninos (Aretes/Bolsos). Despliegue exitoso en producción vía Vercel con configuración completa de variables de entorno.
- **[24-04-2026] - v1.7.7:** Optimización final de UX en Checkout: Eliminación de mensajes de carga redundantes. Se simplificó el fallback de Suspense a un indicador visual minimalista.
- **[24-04-2026] - v1.7.6:** Mejora de UX en Checkout: Implementación de soft navigation (`useRouter`) para eliminar parpadeos.
- **[24-04-2026] - v1.7.5:** Optimización del Dashboard CRM Admin. Ajuste en cálculo de ventas reales y estados de actividad reciente.
- **[24-04-2026] - v1.7.4:** Lógica de reembolso híbrida para entornos de prueba (modo "Bypass").
- **[23-04-2026] - v1.7.3:** Estabilización de notificaciones por correo en producción. Configuración de variables Brevo en Vercel.
- **[22-04-2026] - v1.7.2:** Actualización del modelo Escrow a **Centralizado**. Eliminación de integraciones MP individuales. RPCs atómicos.
- **[22-04-2026] - v1.7.0:** Reestructuración profunda. Registro gratuito. Créditos IA. Escrow a 72h.
- **[Previo]:** Eliminación flujos Pay-First.
