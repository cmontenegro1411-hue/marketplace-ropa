# 🧠 CEREBRO CENTRAL - Marketplace Moda Circular

## 0. METADATA Y ESTADO DEL SISTEMA

- **Versión Actual:** 1.7.0
- **Fase de Desarrollo:** Implementación de Registro Gratuito (Req. MP), Venta de Créditos IA y Flujo Escrow (72h).
- **Directiva del Orquestador:** Este documento es la única fuente de verdad absoluta. Se prohíbe cualquier implementación que contradiga este flujo.

## 1. ARQUITECTURA Y REGLAS GLOBALES

- **Stack:** Next.js 16, Supabase, Mercado Pago SDK, NextAuth v5, Brevo.
- **Modelo de Negocio:** 
  1. **Registro Vendedor:** Gratuito. **REQUISITO INDISPENSABLE:** Tener cuenta de Mercado Pago vinculada. Si no tiene, se redirecciona a MP para crearla. Sin MP no hay usuario.
  2. **Monetización:** Venta de Paquetes de Créditos IA. El registro otorga 2 créditos gratis. Agotados estos, el vendedor puede subir prendas manualmente o comprar más créditos vía MP.
  3. **Fideicomiso (Escrow):** Retención del 100% del pago.
- **Moneda:** Sol Peruano (S/).

## 2. FLUJOS OPERATIVOS (Inmutables)

### 2.1 Registro y Onboarding
- **Validación:** El formulario de registro debe validar el `access_token` o vinculación de MP del vendedor.
- **Créditos Iniciales:** 2 créditos IA automáticos al crear la cuenta.

### 2.2 Ciclo de Venta y Pago (Escrow)
- **Compra:** La plataforma reserva la prenda y notifica a ambos (Comprador/Vendedor).
- **Confirmación de Recibido:** Botón en el correo del comprador. Al pulsar: MP transfiere al vendedor (Descuento: 10% plataforma + comisión MP).
- **Auto-Pago (72h):** Si el comprador no responde en 72 horas tras la compra, el sistema libera los fondos automáticamente al vendedor.

### 2.3 Proceso de Devolución
- **Solicitud:** Botón "Solicitar Devolución" en el correo del comprador.
- **Seguridad:** El dinero NO se devuelve automáticamente. El vendedor debe confirmar que recibió la prenda de regreso antes de que el sistema procese el reembolso al comprador.

## 3. ESTADOS DE DOMINIO (Responsabilidades del Equipo)

### 3.1 Product Owner (Negocio)
- **Estado:** Definiendo paquetes de créditos (ej: 10, 50, 100 créditos).
- **Regla:** Sin cuenta de MP vinculada, el botón "Subir Prenda" debe estar bloqueado o redirigir a configuración.

### 3.2 Arquitecto (Estructura)
- **Estado:** Diseñando la tabla `ia_credit_packages` y el cron job para el auto-pago de 72h.
- **Seguridad:** Asegurar que el webhook de MP solo procese pagos de la plataforma central (Escrow).

### 3.3 Tech Lead Backend (Lógica)
- **Estado:** 
  - Refactorizar `signup` para exigir vinculación de MP.
  - Implementar `confirm-receipt` (Action) que dispara el desembolso.
  - Implementar `request-return` (Action) que congela fondos hasta conformidad del vendedor.

### 3.4 Tech Lead Frontend (UX/UI)
- **Estado:** 
  - UI de "Comprar Créditos IA".
  - Pantalla de "Mis Ventas" con estados: `Enviado`, `Recibido`, `En Disputa`, `Pagado`.

### 3.5 QA Lead (Calidad)
- **Prueba Crítica:** Validar que el dinero no se mueva sin el trigger de 72h o el botón de confirmación.

## 4. DICCIONARIO DE DATOS (Actualizado)

- **Users:** `{ id, email, mp_seller_id, credits_ia, is_active }`
- **Orders:** `{ id, product_id, buyer_id, seller_id, total_amount, status ('pending', 'received', 'returning', 'completed'), created_at, delivery_confirmed_at }`

## 5. CHANGELOG

- **[22-04-2026] - v1.7.0:** **REESTRUCTURACIÓN FINAL DEL MODELO**. Registro gratuito con MP obligatorio. Créditos IA como producto. Escrow con liberación a las 72h o confirmación. Devolución sujeta a conformidad del vendedor.
- **[Previo]:** Se eliminan flujos de Pay-First para registro.
- **[10-04-2026]:** Despliegue inicial exitoso en Vercel (Fase MVP Online).
