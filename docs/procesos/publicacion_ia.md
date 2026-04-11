### Proceso: Publicación de Artículo Asistida por IA

**1. Paso: Inicio de Publicación**
- **Descripción**: El vendedor decide poner un artículo a la venta y accede al formulario de creación.
- **Entradas**: Intención del usuario, sesión activa.
- **Salidas**: Formulario vacío inicializado.
- **Decisiones**: N/A.
- **Excepciones**: Usuario no autenticado (redirigir a login).
- **Validaciones**: Verificar que el usuario tenga el perfil completo (mínimo email verificado).

**2. Paso: Carga de Imágenes**
- **Descripción**: El vendedor sube fotos del artículo (máximo 8).
- **Entradas**: Archivos de imagen (JPG/PNG/WebP).
- **Salidas**: Lista de imágenes cargadas y pre-visualizadas.
- **Decisiones**: N/A.
- **Excepciones**: Formato de archivo no válido, archivo demasiado pesado, límite de fotos excedido.
- **Validaciones**: Verificar calidad de imagen (resolución mínima), detectar duplicados exactos.

**3. Paso: Análisis por IA (Vision)**
- **Descripción**: El sistema envía la imagen principal a un servicio de IA para detectar atributos.
- **Entradas**: Imagen principal.
- **Salidas**: Categoría sugerida, marca detectada, color predominante, estado visual, título sugerido.
- **Decisiones**: Si la IA no está segura de la marca, deja el campo vacío para el usuario.
- **Excepciones**: Error en el servicio de IA, imagen no procesable (borrosa o inapropiada).
- **Validaciones**: Moderación automática para contenido prohibido.

**4. Paso: Sugerencia de Precio**
- **Descripción**: Basado en los atributos detectados y artículos similares vendidos, la IA sugiere un rango de precio competitivo.
- **Entradas**: Atributos del artículo, histórico de ventas de la plataforma.
- **Salidas**: Precio sugerido (Mínimo, Recomendado, Máximo).
- **Decisiones**: N/A.
- **Excepciones**: No hay suficientes datos históricos para ese tipo de artículo.
- **Validaciones**: Asegurar que el precio sugerido no sea inferior a un umbral mínimo de rentabilidad.

**5. Paso: Completado de Datos Manual/Confirmación**
- **Descripción**: El usuario revisa los campos pre-llenados por la IA y completa los detalles faltantes (talla, medidas exactas, descripción detallada).
- **Entradas**: Datos sugeridos por IA + input manual.
- **Salidas**: Objeto de producto completo ("draft" o listo).
- **Decisiones**: ¿El usuario acepta las sugerencias de la IA? (Sí/No).
- **Excepciones**: N/A.
- **Validaciones**: Campos obligatorios completos (Categoría, Talla, Precio, Condición).

**6. Paso: Publicación Final**
- **Descripción**: El artículo se hace visible en el marketplace.
- **Entradas**: Flag de "publicar".
- **Salidas**: Artículo activo con URL única.
- **Decisiones**: N/A.
- **Excepciones**: Fallo en la persistencia de datos.
- **Validaciones**: Verificar que no sea un artículo duplicado del mismo vendedor en las últimas 24h.

---

**Resumen de Decisiones Críticas:**
- Si la IA detecta marca de lujo: ¿Se requiere prueba de autenticidad adicional? (Flujo de Trust).
- Si el precio sugerido es rechazado por el usuario: ¿Se registra la desviación para re-entrenar el modelo?

**Matriz de Excepciones:**
- Fallo de Moderación: El artículo se bloquea preventivamente si la IA detecta infracciones.
- Imágenes de Baja Calidad: El proceso se detiene hasta que el usuario suba fotos nítidas.
