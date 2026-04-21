# 💰 Arquitectura de Pagos (Visión vs Realidad Actual)

Este documento define la estructura de pagos de la plataforma. Ha sido actualizado para reflejar el pivot del modelo de negocio hacia la monetización de servicios de IA.

## 🏛️ Estado Actual: Monetización de Eficiencia (SaaS)

Actualmente, la plataforma **no interviene en la transacción de dinero entre comprador y vendedor** para las prendas de vestir. Esto reduce la complejidad legal y operativa en la etapa de lanzamiento.

### 1. Modelo C2C (Client to Client) Directo
*   **Transacción**: El comprador contacta al vendedor vía WhatsApp (datos provistos en el checkout).
*   **Pago**: Se realiza externamente (Efectivo, Yape, Plin, Transferencia) al momento de la entrega o coordinación.
*   **Comisión**: 0% por venta de producto.

### 2. Monetización vía IA (Créditos)
La plataforma monetiza el valor agregado tecnológico:
*   **Registro**: Gratis, incluye **2 créditos de IA** de regalo.
*   **Recarga**: Los usuarios pueden comprar paquetes de créditos para automatizar sus anuncios:
    *   5 Créditos: S/ 9.90
    *   15 Créditos: S/ 24.90
    *   50 Créditos: S/ 69.90
*   **Procesamiento**: Mercado Pago (Checkout Pro) integrado en `/dashboard/credits`.

---

## 🚀 Visión Futura: Marketplace Escrow (Opcional)

Si el volumen de ventas escala, se podría implementar un modelo de **Fideicomiso (Escrow)** para aumentar la confianza:

### 1. Actores y Flujo Automatizado
*   **Pasarela (Mercado Pago / Stripe Connect)**: Retiene el dinero hasta que el comprador confirme la recepción.
*   **Split Payments**: Al liberar los fondos, la pasarela envía el 85% al vendedor y el 15% (comisión) a la plataforma automáticamente.

### 2. Beneficios del Modelo Escrow
*   Garantía de devolución si el producto no llega.
*   Resolución de disputas integrada.
*   Escalabilidad sin intervención manual.

---
*Documento actualizado por Antigravity AI - Estrategia de Lanzamiento Ágil.*
