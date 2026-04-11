# 💰 Arquitectura de Pagos (Marketplace Escrow)

Este documento define la arquitectura procedimental y técnica diseñada para manejar el flujo de dinero entre compradores, vendedores y la plataforma (Antigravity Marketplace), asegurando total transparencia, confianza y cumplimiento legal.

## 🏛️ Modelo de Negocio Técnico: Escrow + Split Payments

En un ecosistema de marketplace (Compraventa de segunda mano), el dinero nunca va de C2C (Cliente a Cliente) directamente, ni se deposita completo en las cuentas de la empresa para luego hacer transferencias manuales. Se usa un modelo de **Fideicomiso (Escrow)**.

### 1. Actores Involucrados
*   **Comprador**: Quien pasa su tarjeta.
*   **Vendedor**: Quien provee la prenda.
*   **Plataforma (Nosotros)**: Facilitador tecnológico que cobra una comisión.
*   **Pasarela / Proveedor de Pagos (Ej: Mercado Pago, Stripe Connect)**: Entidad financiera que retiene y distribuye el flujo automáticamente.

## 🔄 El Flujo (Paso a Paso)

### Fase 1: Onboarding del Vendedor (KYC)
Antes de que un usuario pueda vender su primera prenda y recibir dinero:
1. El usuario entra a su Panel de Control -> **Métodos de Cobro**.
2. El sistema redirige al usuario a un flujo seguro del Proveedor de Pagos (Onboarding).
3. El vendedor registra sus datos fiscales (DNI/RUC) y su número de cuenta bancaria.
4. El Proveedor de Pagos nos devuelve un `Seller_ID` o `Connected_Account_ID` encriptado.
   * *Regla de Seguridad*: Nuestra base de datos JAMÁS guarda números de cuenta bancaria.

### Fase 2: Captura del Dinero (Hold)
1. El comprador entra a Checkout y paga S/ 100 por una prenda.
2. El dinero es descontado de la tarjeta del comprador y se dirige a una "bóveda virtual" administrada por la Pasarela de Pagos.
3. El status en la base de datos se marca como `pagado_y_retenido`.
4. El vendedor recibe la orden de despachar el producto.

### Fase 3: Resolución y Solución (El "Candado")
*   La pasarela mantendrá el dinero bloqueado. Esto previene estafas: si el vendedor no envía nada, la pasarela le devuelve los S/ 100 al comprador.

### Fase 4: Desembargo y Pago Dividido (Split)
1. El comprador recibe el producto y confirma en la app "Pedido Recibido OK" (O el sistema hace auto-compleción después de 48h tras confirmación del courier).
2. El backend de Next.js ejecuta un Server Action que contacta a la API de la Pasarela.
3. El comando indica a la Pasarela: *Libera los fondos del pago X*.
4. Se ejecuta el **Split** en los servidores bancarios:
   * **85% (S/ 85.00)** se transfiere directo de la pasarela al banco del Vendedor.
   * **15% (S/ 15.00)** se transfiere a la cuenta bancaria de la startup como ingreso (Revenue).

## 🛠️ Opciones Tecnológicas Evaluadas
Al estar operando exclusivamente en **Soles (S/)**, la recomendación de pasarelas para integrar este flujo vía API es:
1. **Mercado Pago (Marketplace Connect)**: Soporta split, escrow, moneda local (S/) y tiene fuerte presencia en Perú.
2. **Culqi / Niubiz**: Verificar APIs modernas para pago a terceros.
3. **Stripe Connect**: El estándar de oro, requiriendo validación si el negocio se incorpora en un hub soportado (Ej: Atlas USA) pero cobrando en moneda local en Perú.

---
*Documento estructurado por Antigravity AI - Arquitectura Business/Tech.*
