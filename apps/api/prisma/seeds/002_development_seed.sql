-- =============================================================================
-- SCIENCE BASED BODY - DEVELOPMENT SEED DATA
-- =============================================================================
-- This seed runs ONLY in development/local environments
-- Creates test users, products, and sample orders
-- =============================================================================

-- Guard: Only run in development
DO $$
BEGIN
    IF current_setting('app.environment', TRUE) = 'production' THEN
        RAISE EXCEPTION 'Development seed cannot run in production!';
    END IF;
END $$;

-- =============================================================================
-- 1. TEST USERS
-- =============================================================================

-- Password for all test users: "TestPassword123!"
-- bcrypt hash with 12 rounds
INSERT INTO users (id, email, email_verified, email_verified_at, password_hash, auth_provider, role, status, age_verified, age_verified_at, created_at)
VALUES
    -- Admin user
    (
        '11111111-1111-1111-1111-111111111111',
        'admin@sciencebasedbody.com',
        TRUE,
        NOW(),
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.gOT1l1Z8VLBDaG',  -- TestPassword123!
        'email',
        'admin',
        'active',
        TRUE,
        NOW(),
        NOW()
    ),
    -- Regular customer
    (
        '22222222-2222-2222-2222-222222222222',
        'customer@example.com',
        TRUE,
        NOW(),
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.gOT1l1Z8VLBDaG',
        'email',
        'customer',
        'active',
        TRUE,
        NOW(),
        NOW() - INTERVAL '30 days'
    ),
    -- Wholesale customer
    (
        '33333333-3333-3333-3333-333333333333',
        'wholesale@example.com',
        TRUE,
        NOW(),
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.gOT1l1Z8VLBDaG',
        'email',
        'wholesale',
        'active',
        TRUE,
        NOW(),
        NOW() - INTERVAL '60 days'
    ),
    -- Unverified user
    (
        '44444444-4444-4444-4444-444444444444',
        'unverified@example.com',
        FALSE,
        NULL,
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.gOT1l1Z8VLBDaG',
        'email',
        'customer',
        'pending_verification',
        FALSE,
        NULL,
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- User profiles
INSERT INTO user_profiles (id, user_id, first_name, last_name, date_of_birth, utm_source, utm_campaign)
VALUES
    ('up_001', '11111111-1111-1111-1111-111111111111', 'Admin', 'User', '1990-01-01', NULL, NULL),
    ('up_002', '22222222-2222-2222-2222-222222222222', 'Jane', 'Researcher', '1985-05-15', 'google', 'brand'),
    ('up_003', '33333333-3333-3333-3333-333333333333', 'Bob', 'Wholesale', '1980-12-20', 'instagram', 'influencer'),
    ('up_004', '44444444-4444-4444-4444-444444444444', 'New', 'User', '1995-08-10', 'tiktok', 'viral_post')
ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

-- User addresses
INSERT INTO user_addresses (id, user_id, address_type, is_default, label, recipient_name, street_line_1, city, state_province, postal_code, country_code)
VALUES
    ('ua_001', '22222222-2222-2222-2222-222222222222', 'shipping', TRUE, 'Home', 'Jane Researcher', '123 Lab Street', 'Miami', 'FL', '33101', 'US'),
    ('ua_002', '22222222-2222-2222-2222-222222222222', 'billing', TRUE, 'Home', 'Jane Researcher', '123 Lab Street', 'Miami', 'FL', '33101', 'US'),
    ('ua_003', '33333333-3333-3333-3333-333333333333', 'shipping', TRUE, 'Warehouse', 'Bob Wholesale', '456 Industrial Ave', 'Los Angeles', 'CA', '90001', 'US')
ON CONFLICT (id) DO UPDATE SET
    recipient_name = EXCLUDED.recipient_name,
    street_line_1 = EXCLUDED.street_line_1,
    updated_at = NOW();

-- =============================================================================
-- 2. TEST PRODUCTS
-- =============================================================================

INSERT INTO products (id, sku, name, slug, product_type, status, price_cents, compare_at_cents, cost_cents, quantity_on_hand, short_description, requires_age_verification, current_batch_number, published_at)
VALUES
    -- Weight Management
    (
        'prod_sema_001',
        'SEM-5MG',
        'Semaglutide 5mg',
        'semaglutide-5mg',
        'peptide',
        'active',
        14999,   -- $149.99
        17999,   -- $179.99 compare
        5000,    -- $50 cost
        50,
        'GLP-1 receptor agonist for metabolic research applications.',
        TRUE,
        'BATCH-SEM-2024-001',
        NOW()
    ),
    (
        'prod_tirz_001',
        'TIR-10MG',
        'Tirzepatide 10mg',
        'tirzepatide-10mg',
        'peptide',
        'active',
        19999,
        24999,
        7500,
        35,
        'Dual GIP/GLP-1 receptor agonist compound for research.',
        TRUE,
        'BATCH-TIR-2024-001',
        NOW()
    ),
    (
        'prod_aod_001',
        'AOD-5MG',
        'AOD-9604 5mg',
        'aod-9604-5mg',
        'peptide',
        'active',
        7999,
        9999,
        2500,
        100,
        'Modified hGH fragment (177-191) for lipid metabolism research.',
        TRUE,
        'BATCH-AOD-2024-001',
        NOW()
    ),
    -- Muscle & Recovery
    (
        'prod_bpc_001',
        'BPC-5MG',
        'BPC-157 5mg',
        'bpc-157-5mg',
        'peptide',
        'active',
        4999,
        5999,
        1500,
        200,
        'Body Protection Compound for tissue repair research.',
        TRUE,
        'BATCH-BPC-2024-001',
        NOW()
    ),
    (
        'prod_tb500_001',
        'TB5-5MG',
        'TB-500 5mg',
        'tb-500-5mg',
        'peptide',
        'active',
        5999,
        6999,
        2000,
        150,
        'Thymosin Beta-4 fragment for recovery research.',
        TRUE,
        'BATCH-TB5-2024-001',
        NOW()
    ),
    -- Anti-Aging
    (
        'prod_epi_001',
        'EPI-10MG',
        'Epithalon 10mg',
        'epithalon-10mg',
        'peptide',
        'active',
        8999,
        10999,
        3000,
        75,
        'Telomerase activator for longevity research.',
        TRUE,
        'BATCH-EPI-2024-001',
        NOW()
    ),
    (
        'prod_ghk_001',
        'GHK-50MG',
        'GHK-Cu 50mg',
        'ghk-cu-50mg',
        'peptide',
        'active',
        6999,
        7999,
        2000,
        120,
        'Copper peptide for cellular regeneration research.',
        TRUE,
        'BATCH-GHK-2024-001',
        NOW()
    ),
    -- Cognitive
    (
        'prod_semax_001',
        'SMX-30MG',
        'Semax 30mg',
        'semax-30mg',
        'peptide',
        'active',
        5499,
        6499,
        1800,
        90,
        'ACTH fragment for cognitive research applications.',
        TRUE,
        'BATCH-SMX-2024-001',
        NOW()
    ),
    -- Sexual Health
    (
        'prod_pt141_001',
        'PT1-10MG',
        'PT-141 10mg',
        'pt-141-10mg',
        'peptide',
        'active',
        6499,
        7499,
        2200,
        80,
        'Melanocortin receptor agonist for research applications.',
        TRUE,
        'BATCH-PT1-2024-001',
        NOW()
    ),
    -- Kit
    (
        'prod_kit_001',
        'KIT-STARTER',
        'Researcher Starter Kit',
        'researcher-starter-kit',
        'kit',
        'active',
        2999,
        3999,
        1000,
        50,
        'Essential supplies for peptide research. Includes vials, BAC water, and syringes.',
        FALSE,
        NULL,
        NOW()
    ),
    -- Out of stock example
    (
        'prod_dsip_001',
        'DSI-5MG',
        'DSIP 5mg',
        'dsip-5mg',
        'peptide',
        'out_of_stock',
        4999,
        5999,
        1500,
        0,
        'Delta Sleep-Inducing Peptide for sleep research.',
        TRUE,
        'BATCH-DSI-2024-001',
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_cents = EXCLUDED.price_cents,
    quantity_on_hand = EXCLUDED.quantity_on_hand,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Product-Category assignments
INSERT INTO product_category_assignments (product_id, category_id, is_primary)
VALUES
    ('prod_sema_001', 'cat_weight_001', TRUE),
    ('prod_tirz_001', 'cat_weight_001', TRUE),
    ('prod_aod_001', 'cat_weight_001', TRUE),
    ('prod_bpc_001', 'cat_muscle_001', TRUE),
    ('prod_tb500_001', 'cat_muscle_001', TRUE),
    ('prod_epi_001', 'cat_aging_001', TRUE),
    ('prod_ghk_001', 'cat_aging_001', TRUE),
    ('prod_ghk_001', 'cat_skin_001', FALSE),  -- GHK-Cu in multiple categories
    ('prod_semax_001', 'cat_cognitive_001', TRUE),
    ('prod_pt141_001', 'cat_sexual_001', TRUE),
    ('prod_kit_001', 'cat_kits_001', TRUE),
    ('prod_dsip_001', 'cat_sleep_001', TRUE)
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Product batches
INSERT INTO product_batches (id, product_id, batch_number, quantity_produced, quantity_remaining, coa_file_url, coa_verified, manufactured_at, expires_at, is_active)
VALUES
    ('pb_001', 'prod_sema_001', 'BATCH-SEM-2024-001', 100, 50, 'https://r2.sciencebasedbody.com/coa/sem-2024-001.pdf', TRUE, '2024-01-15', '2025-01-15', TRUE),
    ('pb_002', 'prod_tirz_001', 'BATCH-TIR-2024-001', 75, 35, 'https://r2.sciencebasedbody.com/coa/tir-2024-001.pdf', TRUE, '2024-02-01', '2025-02-01', TRUE),
    ('pb_003', 'prod_bpc_001', 'BATCH-BPC-2024-001', 300, 200, 'https://r2.sciencebasedbody.com/coa/bpc-2024-001.pdf', TRUE, '2024-01-20', '2025-01-20', TRUE)
ON CONFLICT (product_id, batch_number) DO UPDATE SET
    quantity_remaining = EXCLUDED.quantity_remaining,
    coa_verified = EXCLUDED.coa_verified;

-- =============================================================================
-- 3. TEST ORDERS
-- =============================================================================

-- Completed order
INSERT INTO orders (id, order_number, user_id, customer_email, customer_name, status, shipping_address, billing_address, subtotal_cents, shipping_cents, tax_cents, total_cents, amount_paid_cents, compliance_acknowledged, compliance_version, compliance_acknowledged_at, utm_source, paid_at, created_at)
VALUES
    (
        'ord_001',
        'SBB-2024-0001',
        '22222222-2222-2222-2222-222222222222',
        'customer@example.com',
        'Jane Researcher',
        'shipped',
        '{"recipient_name": "Jane Researcher", "street_line_1": "123 Lab Street", "city": "Miami", "state_province": "FL", "postal_code": "33101", "country_code": "US"}'::jsonb,
        '{"recipient_name": "Jane Researcher", "street_line_1": "123 Lab Street", "city": "Miami", "state_province": "FL", "postal_code": "33101", "country_code": "US"}'::jsonb,
        19998,  -- $199.98
        999,    -- $9.99
        0,
        20997,  -- $209.97
        20997,
        TRUE,
        '1.0.0',
        NOW() - INTERVAL '5 days',
        'google',
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '5 days'
    )
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW();

INSERT INTO order_items (id, order_id, product_id, product_sku, product_name, quantity, unit_price_cents, batch_id, batch_number)
VALUES
    ('oi_001', 'ord_001', 'prod_sema_001', 'SEM-5MG', 'Semaglutide 5mg', 1, 14999, 'pb_001', 'BATCH-SEM-2024-001'),
    ('oi_002', 'ord_001', 'prod_bpc_001', 'BPC-5MG', 'BPC-157 5mg', 1, 4999, 'pb_003', 'BATCH-BPC-2024-001')
ON CONFLICT (id) DO NOTHING;

-- Pending payment order
INSERT INTO orders (id, order_number, user_id, customer_email, customer_name, status, shipping_address, billing_address, subtotal_cents, shipping_cents, tax_cents, total_cents, amount_paid_cents, compliance_acknowledged, compliance_version, compliance_acknowledged_at, created_at)
VALUES
    (
        'ord_002',
        'SBB-2024-0002',
        '22222222-2222-2222-2222-222222222222',
        'customer@example.com',
        'Jane Researcher',
        'pending_payment',
        '{"recipient_name": "Jane Researcher", "street_line_1": "123 Lab Street", "city": "Miami", "state_province": "FL", "postal_code": "33101", "country_code": "US"}'::jsonb,
        '{"recipient_name": "Jane Researcher", "street_line_1": "123 Lab Street", "city": "Miami", "state_province": "FL", "postal_code": "33101", "country_code": "US"}'::jsonb,
        8999,
        999,
        0,
        9998,
        0,
        TRUE,
        '1.0.0',
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '1 hour'
    )
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW();

INSERT INTO order_items (id, order_id, product_id, product_sku, product_name, quantity, unit_price_cents)
VALUES
    ('oi_003', 'ord_002', 'prod_epi_001', 'EPI-10MG', 'Epithalon 10mg', 1, 8999)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. TEST PAYMENTS
-- =============================================================================

-- Completed payment for ord_001
INSERT INTO payments (id, payment_reference, order_id, user_id, payment_method_id, amount_cents, status, customer_reference, verified_by, verified_at, completed_at, created_at)
VALUES
    (
        'pay_001',
        'PAY-2024-0001',
        'ord_001',
        '22222222-2222-2222-2222-222222222222',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',  -- Zelle
        20997,
        'completed',
        'Zelle-TXN-123456',
        '11111111-1111-1111-1111-111111111111',  -- Admin verified
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '5 days'
    )
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- Pending payment for ord_002
INSERT INTO payments (id, payment_reference, order_id, user_id, payment_method_id, amount_cents, status, expires_at, created_at)
VALUES
    (
        'pay_002',
        'PAY-2024-0002',
        'ord_002',
        '22222222-2222-2222-2222-222222222222',
        'f47ac10b-58cc-4372-a567-0e02b2c3d480',  -- CashApp
        9998,
        'pending',
        NOW() + INTERVAL '47 hours',
        NOW() - INTERVAL '1 hour'
    )
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- =============================================================================
-- 5. TEST DISCOUNTS
-- =============================================================================

INSERT INTO discounts (id, code, name, discount_type, value, minimum_order_cents, usage_limit, starts_at, expires_at, is_active)
VALUES
    ('disc_001', 'WELCOME10', 'Welcome 10% Off', 'percentage', 10, 5000, NULL, NOW(), NOW() + INTERVAL '1 year', TRUE),
    ('disc_002', 'FLAT20', '$20 Off $100+', 'fixed_amount', 2000, 10000, 100, NOW(), NOW() + INTERVAL '30 days', TRUE),
    ('disc_003', 'EXPIRED', 'Expired Code', 'percentage', 15, 0, NULL, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', FALSE)
ON CONFLICT (code) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =============================================================================
-- 6. SAMPLE EVENTS
-- =============================================================================

INSERT INTO events (id, event_name, event_category, user_id, session_id, page_url, utm_source, utm_campaign, product_id, properties, created_at)
VALUES
    -- Page views
    (gen_random_uuid(), 'page.view', 'page', '22222222-2222-2222-2222-222222222222', 'sess_001', '/', 'google', 'brand', NULL, '{"title": "Home"}'::jsonb, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), 'page.view', 'page', '22222222-2222-2222-2222-222222222222', 'sess_001', '/shop', 'google', 'brand', NULL, '{"title": "Shop"}'::jsonb, NOW() - INTERVAL '5 days' + INTERVAL '30 seconds'),

    -- Product views
    (gen_random_uuid(), 'product.view', 'product', '22222222-2222-2222-2222-222222222222', 'sess_001', '/product/semaglutide-5mg', 'google', 'brand', 'prod_sema_001', '{"product_name": "Semaglutide 5mg", "price": 14999}'::jsonb, NOW() - INTERVAL '5 days' + INTERVAL '1 minute'),

    -- Add to cart
    (gen_random_uuid(), 'cart.add', 'cart', '22222222-2222-2222-2222-222222222222', 'sess_001', '/product/semaglutide-5mg', 'google', 'brand', 'prod_sema_001', '{"product_name": "Semaglutide 5mg", "quantity": 1}'::jsonb, NOW() - INTERVAL '5 days' + INTERVAL '2 minutes'),

    -- Checkout
    (gen_random_uuid(), 'checkout.started', 'checkout', '22222222-2222-2222-2222-222222222222', 'sess_001', '/checkout', 'google', 'brand', NULL, '{"cart_total": 20997}'::jsonb, NOW() - INTERVAL '5 days' + INTERVAL '5 minutes'),
    (gen_random_uuid(), 'checkout.completed', 'checkout', '22222222-2222-2222-2222-222222222222', 'sess_001', '/checkout/complete', 'google', 'brand', NULL, '{"order_id": "ord_001", "order_total": 20997}'::jsonb, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE 'Development seed completed successfully';
