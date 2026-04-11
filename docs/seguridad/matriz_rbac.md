# Entidad: Matriz de Roles y Permisos (RBAC)

## Roles Definidos
1. **GUEST**: Usuario no autenticado.
2. **USER (Comprador/Vendedor)**: Usuario básico.
3. **MODERATOR**: Staff que revisa listados reportados.
4. **ADMIN**: Control total del sistema.

## Matriz de Permisos

| Módulo | Acción | GUEST | USER | MOD | ADM |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Listings** | Ver productos | ✅ | ✅ | ✅ | ✅ |
| | Publicar artículo | ❌ | ✅ | ✅ | ✅ |
| | Editar propio | ❌ | ✅ | ✅ | ✅ |
| | Moderar ajenos | ❌ | ❌ | ✅ | ✅ |
| **Orders** | Crear orden | ❌ | ✅ | ❌ | ✅ |
| | Cancelar orden | ❌ | ⚠️¹ | ✅ | ✅ |
| **Financials** | Ver propias ganancias | ❌ | ✅ | ❌ | ✅ |
| | Reembolsar | ❌ | ❌ | ✅ | ✅ |
| **Users** | Ver perfil público | ✅ | ✅ | ✅ | ✅ |
| | Bloquear usuario | ❌ | ❌ | ✅ | ✅ |

---

## Reglas de Validación Críticas
1. **Protección al Comprador (Escrow)**:
   - El pago entra en estado `PENDING_LIBERATION` al capturar el fondo.
   - Solo se libera al vendedor 24h después de que el tracking marque `DELIVERED`, a menos que haya una disputa.
2. **Segregación de Funciones**:
   - Un usuario no puede calificar su propio artículo.
   - Un moderador no puede aprobar sus propios artículos en revisión.

---

## Notas de Seguridad
- **Políticas de CORS**: Solo permitir dominios de la plataforma.
- **Sanitización**: Todo input de IA (títulos sugeridos) debe ser sanitizado antes de persistir para evitar XSS.
- **PCI-DSS**: No almacenar números de tarjeta; usar tokens de Stripe.

---
*1: Sujeto a ventana de cancelación (ej: antes de que el vendedor marque como enviado).*
