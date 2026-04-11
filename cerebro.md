# 🧠 Proyecto: Marketplace Moda Circular - Cerebro de Desarrollo

Este documento mantiene el estado actual, decisiones técnicas y próximos pasos de la plataforma Antigravity "Venta de Ropa de Segunda".

## 📋 Estado Actual del Proyecto
- **Frontend**: Full Next.js 16 (Turbopack) con sistema de diseño premium (Verde Oliva/Crema/Terracota).
- **Moneda**: Sol Peruano (S/) en todo el sistema.
- **Home**: Banner hero con categorías y sección de "Novedades".
- **Búsqueda**: Grid interactivo con filtros laterales.
- **Detalle de Producto**: Vista enfocada en la prenda con badges de confianza.
- **Venta IA (Magic Listing)**: Formulario con botón de regreso, "multi-upload" y previsualización.
- **Perfil de Usuario**: Dashboard con métricas de ventas, interfaz de edición de perfil (vía Server Actions) y navegación entre pestañas (Configuración de Seguridad, Cobros e Historial de Ventas simulado).
- **Auth**: Sistema NextAuth v5 (Beta) activo con Credentials Provider funcional.
- **Checkout**: Flujo de compra en dos pasos (Envío/Pago).

## 🔑 Credenciales de Prueba
- **Email**: `demo@modacircular.com`
- **Password**: `password123`
- **Nota**: El sistema redirige automáticamente a `/search` tras el login.

## ⚙️ Infraestructura y Backend
- **Server Actions**: `user-actions.ts` y `product-actions.ts` operando las mutaciones de la UI.
- **Supabase (Preparado)**:
  - Cliente configurado en `lib/supabase.ts`.
  - Storage Setup en `supabase_storage_setup.sql`.

## 🛠️ Decisiones Técnicas y Arquitectura Clave
1. **Direct-to-Storage**: Imágenes directo a Supabase Storage.
2. **Arquitectura de Pagos (Marketplace Escrow)**: Se estructuró a nivel procedimental cómo se retendrá y dividirá el dinero utilizando herramientas modernas. **-> [Ver Documento Detallado de Pagos](docs/ARQUITECTURA_PAGOS.md)**.
3. **Optimización de UI del Perfil**: Interfaces que impactan mediante placeholders enriquecidos con métricas simuladas mientras no haya BD productiva.

## 🚀 Próximos Pasos (Pendientes)
1. **Conexión Pasarela**: Integrar la capa Escrow mencionada en la arquitectura de pagos (Mercado Pago o Stripe).
2. **Sistema de Favoritos**: Tabla de `likes` y vista en el perfil.
3. **Mensajería**: Implementar chat en tiempo real entre comprador y vendedor.

---
*Última actualización: 10 de Abril, 2026 (Moneda, Edición Perfil, Panel de Ventas y Documentación Arquitectónica)*
