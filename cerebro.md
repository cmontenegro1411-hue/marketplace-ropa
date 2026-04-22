# 🧠 CEREBRO CENTRAL - Marketplace Moda Circular

## 0. METADATA Y ESTADO DEL SISTEMA

- **Versión Actual:** 1.4.0
- **Fase de Desarrollo:** Refactorización de pasarela de pagos y UI (Modelo Escrow).
- **Directiva del Orquestador:** Este documento es la única fuente de verdad. Antes de que un Agente actúe, debe leer sus responsabilidades y el estado actual de su dominio. Todo cambio debe ser consolidado aquí.

## 1. ARQUITECTURA Y REGLAS GLOBALES

*Las decisiones aquí son inmutables a menos que el Arquitecto Principal las modifique.*

- **Stack Tecnológico:** Next.js 16 (Turbopack), Supabase (PostgreSQL), MercadoPago SDK, NextAuth v5 (Beta).
- **Regla de Estilo:** Componentes funcionales. Tailwind CSS para UI premium (Verde Oliva/Crema/Terracota).
- **Directiva Cero Alucinaciones:** Prohibido sugerir librerías fuera del stack sin justificación de costo/beneficio aprobada.
- **Moneda:** Sol Peruano (S/) como estándar único.

## 2. DICCIONARIO DE DATOS (Core Entities)

*Definiciones centrales para la integridad del sistema.*

- **Entidad `Prenda` (Products):** `{ id, estado_uso (1-5), precio, id_vendedor, fotos[], status ('available' | 'sold') }`
- **Entidad `Transaccion`:** `{ id, id_comprador, id_prenda, estado_pago, fee_plataforma, status_escrow }`
- **Entidad `Usuario`:** `{ id, credits_ia (saldo actual), status_auth, role ('admin' | 'seller') }`
- **Entidad `PendingRegistration`:** `{ id, user_data, package_purchased, mp_preference_id }`

## 3. ESTADOS DE DOMINIO (El Equipo Lean de 5 Agentes)

### 3.1 Product Owner Senior (Negocio)

- **Responsabilidad:** Definir flujos funcionales, reglas de negocio y criterios de aceptación.
- **Estado Actual:**
  - Diseñando el flujo de **Retención de Pagos (Escrow)** y resolución de disputas C2C.
  - Validando el modelo de monetización basado exclusivamente en eficiencia (IA) tras eliminar las membresías.
- **Regla Maestra:** Si el flujo funcional no está claro aquí, el código resultante será basura.

### 3.2 Arquitecto Principal Enterprise (Estructura y Datos)

- **Responsabilidad:** Diseño de sistemas, seguridad (RLS), integraciones externas y consistencia de datos.
- **Estado Actual:**
  - Priorizando la configuración segura de `MP_ACCESS_TOKEN` y otros secretos de integración.
  - Supervisando la arquitectura **Direct-to-Storage** para imágenes y el **Supabase Dual Client**.
  - Validando soporte para flujo Escrow sin duplicidad transaccional.
- **Regla Maestra:** Si el sistema no escala o el dato no es íntegro, la arquitectura ha fallado.

### 3.3 Tech Lead Backend & DevOps (Lógica y Servidor)

- **Responsabilidad:** Server Actions, Máquinas de Estado, APIs, DB y CI/CD (Vercel).
- **Estado Actual:**
  - Implementando la máquina de estados en `product-actions.ts`.
  - Refactorizando `signup-callback` para asegurar la creación de usuarios post-pago.
  - Simplificación de endpoints de IA (`analyze` y `recalculate-price`) para enfocarse solo en estimación de **Precio Retail (P.R.)**, eliminando lógica matemática del servidor.
- **Regla Maestra:** El servidor debe impedir estados inválidos; si el sistema falla sin logs, la operación es deficiente.

### 3.4 Tech Lead Frontend & UX/UI (Interfaz)

- **Responsabilidad:** Vistas, componentes reutilizables, manejo de estado global (UI) y performance.
- **Estado Actual:**
  - Despliegue de **Motor de Tasación Híbrido**: La IA estima el Precio Retail (P.R.) y el Frontend aplica multiplicadores determinísticos (75%, 55%, 40%, 25%).
  - Implementación de **Campo Retail Editable**: El usuario puede ajustar manualmente el P.R. para corregir la base de tasación.
  - Aplicación de **Regla Tier 1 (Techo S/35)** para asegurar veracidad en artículos de bajo costo.
  - Asegurando despliegue dinámico (`force-dynamic`) para evitar desincronización de créditos en la UI.
- **Regla Maestra:** Si el usuario duda o la app parece congelada sin feedback, la interfaz ha fallado.

### 3.5 QA Lead (Calidad)

- **Responsabilidad:** Escenarios de prueba rigurosos, Happy Paths, Edge Cases y prevención de regresiones.
- **Estado Actual:**
  - Validando el ciclo de vida: `available` → `sold`.
  - Preparando pruebas E2E para el flujo de registro completo: `signup` → `pago` → `callback` → `login`.
- **Regla Maestra:** Lo que no tiene prueba validada en un entorno similar a producción, se asume que está roto.

## 4. REGISTRO DE DEPRECACIONES Y ANTI-PATRONES (Cuarentena)

- **[DEPRECADO v1.3.5]:** Pago directo al vendedor. El modelo de negocio ahora es **Retención (Escrow)**. Prohibido usar lógica de transferencia anterior.
- **[DEPRECADO v1.4.0]:** Planes de membresía (Impulso, Crecimiento, Escala). El registro es libre e ilimitado; se monetizan solo los créditos de IA.
- **[ERROR COMÚN]:** Mezclar correcciones visuales con lógica de negocio. Las tareas deben ser atómicas.
- **[ALERTA]:** No usar `alert()` nativo; usar el sistema de pantallas de éxito/error diseñado en Next.js.

## 5. CHANGELOG RECENTE

- **[21-04-2026] - v1.5.0:** Implementación del **Motor de Tasación Híbrido Determinístico**. El cálculo matemático (75%, 55%, 40%, 25%) se movió al Frontend para eliminar volatilidad. Se añadió el campo **Precio Retail (P.R.)** editable por el usuario. Desplegado en Vercel.
- **[20-04-2026] - v1.4.0:** Consolidación del equipo de agentes a modelo Lean (5 roles) y reestructuración del Cerebro.
- **[18-04-2026]:** Implementación de bloqueo absoluto de créditos IA y corrección de caché en `CreditsCounter`.
- **[17-04-2026]:** Pivot de modelo de negocio: Libertad total de vendedores + monetización vía eficiencia (IA).
- **[15-04-2026]:** Implementación de Admin Dashboard interno para seguimiento de vendedores registrados.
- **[10-04-2026]:** Despliegue inicial exitoso en Vercel (Fase MVP Online).
