### Modelo de Datos: Marketplace Moda Segunda Mano

#### Entidad: Usuario
- **PK**: id (UUID)
- **Atributos**:
  - nombre (Texto): Nombre del perfil.
  - email (Texto): Identificador de login (Unique).
  - password_hash (Texto): Seguridad.
  - bio (Texto): Descripción del perfil de marca/vendedor.
  - avatar_url (Texto): Imagen de perfil.
  - reputacion_comprador (Numérico): Calificación promedio como comprador.
  - reputacion_vendedor (Numérico): Calificación promedio como vendedor.
  - es_verificado (Booleano): Badge de confianza.
  - fecha_registro (Fecha): Auditoría.
- **Claves Únicas**: [email]

#### Entidad: Producto (Listing)
- **PK**: id (UUID)
- **Atributos**:
  - vendedor_id (FK): Referencia al Usuario.
  - titulo (Texto): Nombre del artículo.
  - descripcion (Texto): Detalles del artículo.
  - categoria (Texto): Ejemplo: Vestidos, Sneakers, Accesorios.
  - marca (Texto): Identificación de marca.
  - talla (Texto): Talla según escala estándar.
  - condicion (Texto): Nuevo, Como nuevo, Bueno, Usado.
  - precio (Numérico): Precio de venta.
  - moneda (Texto): ISO Code (USD, PEN, etc).
  - estado_publicacion (Texto): Activo, Vendido, Archivado, En Revisión.
  - fotos_urls (Colección de Texto): Links a Cloudinary/S3.
  - impacto_sustentable (Numérico): Ahorro estimado de agua/CO2.
- **Claves Únicas**: []

#### Entidad: Orden (Transacción)
- **PK**: id (UUID)
- **Atributos**:
  - producto_id (FK): Referencia al Producto.
  - comprador_id (FK): Referencia al Usuario.
  - vendedor_id (FK): Redundancia controlada para queries.
  - monto_total (Numérico): Precio + Envío + Comisión.
  - estado_pago (Texto): Pendiente, Pagado, En Escrow, Liberado, Reembolsado.
  - estado_envio (Texto): Pendiente, Enviado, Recibido, Disputa.
  - tracking_number (Texto): Seguimiento logístico.
- **Claves Únicas**: [producto_id (un artículo solo se vende una vez)]

#### Entidad: Reseña
- **PK**: id (UUID)
- **Atributos**:
  - orden_id (FK): Contexto de la transacción.
  - emisor_id (FK): Quién califica.
  - receptor_id (FK): Quién es calificado.
  - tipo (Texto): Compra o Venta.
  - estrellas (Numérico): 1 a 5.
  - comentario (Texto): Feedback opcional.
- **Claves Únicas**: [orden_id + emisor_id]

#### Relaciones
- **Usuario - Producto**: 1:N (Un usuario vende muchos productos).
  - **FK**: vendedor_id
- **Producto - Orden**: 1:1 (Un artículo "físico" de segunda mano solo tiene una transacción exitosa).
  - **FK**: producto_id
- **Usuario - Orden**: 1:N (Un usuario compra muchos artículos).
  - **FK**: comprador_id
- **Orden - Reseña**: 1:2 (Por cada orden puede haber una reseña del comprador y una del vendedor).
  - **FK**: orden_id

#### Análisis de Integridad
- **Riesgos detectados**: Borrado de cuenta de usuario con productos activos o transacciones en curso.
- **Sugerencias de integridad**: 
  - Soft delete para Usuarios.
  - Restricción de borrado (Restrict) en Productos si hay una Orden asociada.
  - Cascade delete en fotos si el Producto se elimina físicamente (si no hay orden).
