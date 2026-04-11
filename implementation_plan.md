# Proyecto: Marketplace de Ropa de Segunda Mano (Moda Circular)

## 📋 Visión General
Plataforma C2C premium para la compraventa de ropa usada, con enfoque en sostenibilidad, confianza y experiencia de usuario de alta gama (Depop/Vinted style).

## 🧩 Mapeo de Roles (Orquestación Antigravity)

Asumo el rol de **Agente Orquestador** y Tech Lead. He mapeado los agentes solicitados a mis habilidades y protocolos internos:

| Agente Solicitado | Ejecutor (Antigravity Role) | Skills Auxiliares |
| :--- | :--- | :--- |
| **UX/UI Designer** | Especialista Visual / Frontend Lead | `generate_image`, Design System Protocol |
| **Frontend Developer** | Senior Web Dev (Next.js 14) | Tailwind CSS, Framer Motion, TypeScript |
| **Backend Developer** | Solution Architect | `generador-modelo-erd`, `generar-contrato-api`, `evaluar-consistencia-modelo` |
| **IA / Machine Learning** | ML Integration Specialist | OpenAI Vision API, Cloudinary, Advanced Prompting |
| **Trust & Payments** | Security & Fintech Lead | `generar-matriz-rbac`, `reglas-a-validaciones`, `generar-casos-prueba-criticos` |
| **SEO & Growth** | Growth Engineer | Next.js Metadata, Schema.org |
| **Infra & DevOps** | DevOps Engineer | Docker, Vercel, Railway |

---

## 🏗️ Fase 1: Arquitectura y Diseño (Completado)

### 1.1. Análisis de Procesos de Negocio
*Mapeado el flujo de publicación asistida por IA y el flujo de compra.* ✅

### 1.2. Diseño de Datos (ERD)
*Definidas las entidades: Usuarios, Productos, Transacciones, Reseñas, Ofertas.* ✅

### 1.3. Concepto Visual
*Establecida la paleta (Verde Oliva/Terracota) e implementada la tipografía (Playfair Display/Outfit).* ✅

---

## 🚀 Fase 2: MVP Core (En Ejecución)

### 2.1. System Design & Code Base
- Inicialización de Next.js 14 + Tailwind v4. ✅
- Librería de componentes base (`Button`, `Container`, `Navbar`, `ProductCard`). ✅

### 2.2. Vistas Principales (Buyer & Seller)
- **Homepage**: Hero section con propuesta de valor y grid de categorías. ✅
- **Search Page**: Resultados con sidebar de filtros y responsive grid. ✅
- **Listing Form**: Formulario de venta con asistente de IA mockeado. ✅
- [ ] **Página de Detalle**: Galería HD, Zoom, Info de Vendedor.

---

## 🚦 Roadmap Inmediato
1. [x] Definir lógica de negocio detallada (`analista-procesos-negocio`).
2. [x] Generar Modelo ERD (`generador-modelo-erd`).
3. [x] Definir Contrato de API (`generar-contrato-api`).
4. [x] Crear Mockup Visual de la Homepage.
5. [x] Inicializar repositorio Next.js.
6. [ ] Implementar Página de Detalle de Producto.
7. [ ] Configurar Autenticación (NextAuth).
