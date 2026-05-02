-- Tabla para almacenar las reseñas de los productos y vendedores
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_item_id UUID UNIQUE REFERENCES public.order_items(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Un comprador solo puede calificar una vez por producto/compra
    CONSTRAINT one_review_per_order_item UNIQUE (order_item_id)
);

-- Índices para mejorar el performance de las consultas
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON public.product_reviews(seller_id);

-- Políticas de seguridad (RLS)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de reseñas
CREATE POLICY "Reviews are viewable by everyone" 
ON public.product_reviews FOR SELECT 
USING (is_public = true);

-- El sistema (admin) puede insertar reseñas (vía Server Actions)
-- Nota: Como usaremos supabaseAdmin para insertar desde el servidor, 
-- no necesitamos políticas de inserción complejas para el rol 'authenticated' 
-- si siempre pasamos por la capa de acciones.
