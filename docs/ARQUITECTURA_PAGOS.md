# 💰 Arquitectura de Pagos (Escrow Centralizado)

Este documento define la estructura financiera de la plataforma, basada en un modelo de **Fideicomiso Centralizado (Escrow)**.

## 🏛️ Modelo de Negocio: Marketplace de Confianza

A diferencia de modelos directos C2C, la plataforma actúa como intermediario financiero para garantizar la seguridad de ambas partes.

### 1. Flujo de Fondos (Escrow)
*   **Cuenta Maestra**: Todo el dinero de las compras entra a la cuenta maestra de Mercado Pago de la plataforma.
*   **Billetera Virtual**: Se lleva un registro virtual de saldos para cada vendedor en la base de datos (Supabase).
    *   `balance_pending`: Fondos retenidos mientras el comprador recibe el producto.
    *   `balance_available`: Fondos liberados que el vendedor puede retirar.
*   **Auditoría**: Cada movimiento genera un registro inmutable en `wallet_transactions`.

### 2. Ciclo de Vida de la Venta
1.  **Pago**: El comprador paga. La prenda pasa a `reserved`. Los fondos se suman al `balance_pending` del vendedor.
2.  **Entrega**: El vendedor entrega el producto.
3.  **Confirmación**: El comprador confirma recepción vía email. Los fondos pasan de `balance_pending` a `balance_available`.
4.  **Devolución**: Si hay disputa, los fondos se mantienen en `balance_pending` hasta que el vendedor confirme el retorno de la prenda, momento en el cual se dispara el reembolso vía Mercado Pago.

### 3. Monetización vía IA (Créditos)
*   **Servicios de Valor Agregado**: La creación de anuncios (listings) mediante IA consume créditos.
*   **Compra de Créditos**: Integrada mediante Mercado Pago Checkout Pro.

---

## 🛠️ Detalles Técnicos de Implementación

### Funciones de Base de Datos (RPC)
Para garantizar la integridad, los saldos solo se modifican mediante funciones RPC atómicas:
*   `capture_escrow_funds`: Registra el ingreso de dinero.
*   `release_escrow_funds`: Libera el dinero tras la confirmación.
*   `revert_escrow_funds`: Reubica los fondos en caso de devolución.

### Seguridad y Bypass de Pruebas
El sistema permite un modo **Bypass** para pruebas internas donde se omiten los pagos reales pero se simula todo el flujo de billetera virtual, permitiendo validaciones completas de extremo a extremo sin transacciones financieras reales.

---
*Documento actualizado por Antigravity AI - v1.7.4*
