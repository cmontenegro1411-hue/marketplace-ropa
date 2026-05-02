-- Phase 1: Ubigeo and Shipping Infrastructure

-- 1. Add ubigeo_code to users (profiles)
ALTER TABLE users ADD COLUMN IF NOT EXISTS ubigeo_code VARCHAR(6);
COMMENT ON COLUMN users.ubigeo_code IS 'Official Peru Ubigeo code (6 digits)';

-- 2. Add shipping fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_department VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_province VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_district VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_ubigeo VARCHAR(6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10, 2) DEFAULT 0;

-- 3. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews for their orders" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id
    );

-- 5. Helper view for reputation
CREATE OR REPLACE VIEW seller_reputation AS
SELECT 
    seller_id,
    COUNT(id) as total_reviews,
    AVG(rating) as average_rating,
    (SELECT COUNT(*) FROM orders WHERE seller_id = reviews.seller_id AND status = 'completed') as successful_sales
FROM reviews
GROUP BY seller_id;
