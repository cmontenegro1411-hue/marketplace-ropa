# Contrato de API: Módulo de Productos (Listings)

## Referencia Base
`BASE_URL: /api/v1`

---

### 1. Crear Listado (Publish Product)
`POST /products`
**Descripción**: Crea un nuevo artículo para la venta. Incluye integración con metadatos de IA opcionales.

- **Request Body**:
```json
{
  "title": "Nike Air Max 270 - Blue",
  "description": "Used only twice, excelente condition.",
  "category": "Footwear",
  "brand": "Nike",
  "size": "10 US",
  "condition": "Like New",
  "price": 85.00,
  "currency": "USD",
  "images": ["url_1", "url_2"],
  "ai_generated": true
}
```

- **Response (201 Created)**:
```json
{
  "id": "uuid-123",
  "status": "active",
  "created_at": "2024-03-10T15:00:00Z",
  "url": "/products/nike-air-max-270-blue-123"
}
```

- **Errores**:
  - `400 Bad Request`: Faltan campos obligatorios.
  - `401 Unauthorized`: Token no válido.

---

### 2. Buscar Productos (Marketplace Search)
`GET /products`
**Descripción**: Recupera lista paginada de productos con filtros.

- **Query Params**:
  - `q`: Search term.
  - `category`, `brand`, `size`, `condition`: Filtros.
  - `min_price`, `max_price`: Rangos.
  - `sort`: `price_asc`, `price_desc`, `newest`.
  - `page`, `limit`: Paginación.

- **Response (200 OK)**:
```json
{
  "items": [...],
  "total": 1250,
  "pages": 63,
  "current_page": 1
}
```

---

### 3. Detalle de Producto
`GET /products/{id}`
**Descripción**: Información completa para la página de detalle.

- **Response (200 OK)**:
```json
{
  "id": "uuid-123",
  "seller": {
    "id": "user-uuid",
    "name": "Maria Mode",
    "rating": 4.8,
    "verified": true
  },
  "product": { ... },
  "related_items": [ ... ]
}
```

---

### 4. Sugerencia de Precio (IA Endpoint)
`POST /products/suggest-price`
**Descripción**: Basado en una imagen o descripción, devuelve el rango de precios.

- **Request Body**:
```json
{
  "category": "Dress",
  "brand": "Zara",
  "condition": "Good"
}
```

- **Response (200 OK)**:
```json
{
  "min": 25.0,
  "recommended": 35.0,
  "max": 45.0
}
```
