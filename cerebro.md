# 🧠 Proyecto: Marketplace Moda Circular - Cerebro de Desarrollo

Este documento mantiene el estado actual, decisiones técnicas y próximos pasos de la plataforma Antigravity "Venta de Ropa de Segunda".

## 📋 Estado Actual del Proyecto
- **Frontend**: Full Next.js 16 (Turbopack) con sistema de diseño premium (Verde Oliva/Crema/Terracota).
- **Moneda**: Sol Peruano (S/) en todo el sistema.
- **Home**: Banner hero con categorías y sección de "Novedades".
- **Búsqueda**: Grid interactivo con filtros laterales.
- **Detalle de Producto**: Vista enfocada en la prenda con badges de confianza.
- **Venta IA (Magic Listing)**: Formulario con botón de regreso, "multi-upload" y previsualización.
- **Perfil de Usuario**: Dashboard con métricas de ventas reales (via Supabase), interfaz de edición de perfil (vía Server Actions) y navegación entre pestañas.
- **Auth**: Sistema NextAuth v5 (Beta) activo con Credentials Provider funcional. Sesión persistente estable.
- **Checkout**: Flujo completo conectado a Supabase — marca los productos como `sold` al confirmar.
- **Ciclo de vida del producto**: `available` → `sold`. Bloqueado a nivel UI y server action.

## 🔑 Credenciales de Prueba
- **Email**: `demo@modacircular.com`
- **Password**: `password123`
- **Nota**: El sistema redirige automáticamente a `/search` tras el login.

## ⚙️ Infraestructura y Backend
- **Server Actions**: `user-actions.ts` y `product-actions.ts` con las funciones:
  - `createListing` — crea un producto en Supabase.
  - `deleteListing` — elimina con validación de propiedad.
  - `updateListing` — actualiza con validación de propiedad.
  - `completePurchase` — **[NUEVO]** marca `status='sold'` en Supabase, con validación previa de disponibilidad para prevenir compras dobles.
- **Supabase**:
  - Cliente configurado en `lib/supabase.ts`.
  - Storage Setup en `supabase_storage_setup.sql`.
  - **Migración aplicada**: columna `status TEXT DEFAULT 'available'` + índice `idx_products_status` en tabla `products`.

## 🛠️ Decisiones Técnicas y Arquitectura Clave
1. **Direct-to-Storage**: Imágenes directo a Supabase Storage.
2. **Arquitectura de Pagos (Marketplace Escrow)**: Se estructuró a nivel procedimental cómo se retendrá y dividirá el dinero utilizando herramientas modernas. **-> [Ver Documento Detallado de Pagos](docs/ARQUITECTURA_PAGOS.md)**.
3. **Optimización de UI del Perfil**: Interfaces que impactan mediante placeholders enriquecidos con métricas simuladas mientras no haya BD productiva.
4. **CI/CD Implementado**: Despliegue automatizado y exitoso hacia Vercel, conectado directamente a GitHub.
5. **Decisiones de UX (Lujo Minimalista)**: Retirado el botón redundante de "Registro" del menú de navegación.
6. **Defense in Depth — Compra Doble**: El bloqueo de re-compra opera en dos capas: (1) UI deshabilita el botón si `status === 'sold'`; (2) el server action re-verifica disponibilidad en Supabase antes de ejecutar el UPDATE.
7. **CTAs Contextuales Post-Compra**: Pantalla de éxito del checkout muestra "Ver Mi Closet" para usuarios logueados e "Ir al Inicio" para guests anónimos, usando `useSession()`.

## 🎨 Componentes Clave
| Componente | Archivo | Función |
|---|---|---|
| `AddToCartButton` | `components/product/AddToCartButton.tsx` | Añade al carrito. Muestra estado "Vendido" con lock icon si `status=sold` |
| `CheckoutPage` | `app/checkout/page.tsx` | Flujo completo. Llama a `completePurchase` y muestra pantalla de éxito |
| `CartContext` | `context/CartContext.tsx` | Persistencia en `localStorage`. Evita duplicados |

## 🗂️ Migraciones de BD Aplicadas
| Fecha | Archivo | Descripción |
|---|---|---|
| 2026-04-11 | `docs/migrations/add_status_to_products.sql` | Agrega columna `status` + índice a tabla `products` |

## 🚀 Próximos Pasos (Pendientes)
1. **Conexión Pasarela**: Integrar la capa Escrow mencionada en la arquitectura de pagos (Mercado Pago o Stripe).
2. **Sistema de Favoritos**: Tabla de `likes` y vista en el perfil.
3. **Mensajería**: Implementar chat en tiempo real entre comprador y vendedor.
4. **Historial de Compras**: Vista para el comprador de sus pedidos pasados.
5. **Filtro de productos vendidos en catálogo**: Opcionalmente ocultar o mostrar al final los productos `sold`.

## 🗄️ Historial de Logros Críticos

- **[11 de Abril, 2026] - Ciclo de Vida de Producto Completo**:
  - Checkout conectado a Supabase — `completePurchase()` server action marca `status='sold'`.
  - Migración `add_status_to_products.sql` ejecutada en producción vía SQL Editor de Supabase.
  - Bloqueo de re-compra en dos capas: UI (`AddToCartButton`) + validación server action.
  - Pantalla de éxito post-compra con CTAs contextuales (guest vs. usuario logueado).
  - Aviso "Esta prenda ya encontró dueño" con diseño premium (ícono candado, terracota, CTA a búsqueda).
  - Eliminado el `alert()` ficticio — reemplazado por pantalla de confirmación real.

- **[10 de Abril, 2026] - Fase MVP Online**:
  - Limpieza de entorno y preparación de la base de código.
  - Creación del Repositorio en GitHub (`marketplace-ropa`).
  - Resolución en caliente (hotfixes) para Next.js 16/15:
    - Se agregó `dotenv` a dependencias y se envolvió el `useSearchParams` de `/login/page.tsx` en un *Suspense Boundary* para burlar la nueva restricción `prerender-error` de Vercel.
  - **Despliegue a Producción Completo:** El MVP ya sirve tráfico web bajo la arquitectura Serverless de Vercel 🚀.

---
*Última actualización: 11 de Abril, 2026 — Ciclo de vida de producto: compra real conectada a Supabase*
