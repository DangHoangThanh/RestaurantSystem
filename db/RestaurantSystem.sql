-- ============================================================
-- RestaurantSystem — PostgreSQL Setup Script
-- Run this file in psql or pgAdmin to create the entire DB
--
-- Usage:
--   psql -U postgres -d RestaurantSystem -f RestaurantSystem.sql
--
-- Note: Create the database first:
--   CREATE DATABASE "RestaurantSystem";
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Extensions
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ────────────────────────────────────────────────────────────
-- 1. USERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username   VARCHAR(50) UNIQUE NOT NULL,
  password   TEXT        NOT NULL,   -- bcrypt hash, fixed length ~60 chars
  role       VARCHAR(20) NOT NULL
             CHECK (role IN ('admin', 'manager', 'server', 'chef', 'cashier')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  users          IS 'System employee accounts';
COMMENT ON COLUMN users.role     IS 'admin | manager | server | chef | cashier';
COMMENT ON COLUMN users.password IS 'bcrypt hash — do not store plaintext';


-- ────────────────────────────────────────────────────────────
-- 2. MENU ITEMS (combos)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL,
  price        INTEGER      NOT NULL CHECK (price >= 0),  -- e.g. VND or Cents
  is_available BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE  menu_items              IS 'List of combo meals sold in the restaurant';
COMMENT ON COLUMN menu_items.price        IS 'Price as integer, no decimals';
COMMENT ON COLUMN menu_items.is_available IS 'false when ingredients are insufficient (RAW_MATERIAL_LOW)';


-- ────────────────────────────────────────────────────────────
-- 3. DISHES (individual items in a combo)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dishes (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  category       VARCHAR(50),   -- sweet / savory / asian / western
  cooking_method VARCHAR(50)    -- grill / stir-fry / fry / boil / simmer
);

COMMENT ON TABLE dishes IS 'Individual dishes — grouped into combos via combo_dishes';


-- ────────────────────────────────────────────────────────────
-- 4. COMBO → DISH mapping
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS combo_dishes (
  combo_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  dish_id  UUID REFERENCES dishes(id)     ON DELETE CASCADE,
  PRIMARY KEY (combo_id, dish_id)
);

COMMENT ON TABLE combo_dishes IS 'Many-to-many relationship: 1 combo has many dishes';


-- ────────────────────────────────────────────────────────────
-- 5. INGREDIENTS (warehouse stock)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
  id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name      VARCHAR(100)  UNIQUE NOT NULL,
  quantity  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit      VARCHAR(20)   NOT NULL,
  threshold NUMERIC(10,2) NOT NULL DEFAULT 0
            -- when quantity <= threshold → emit RAW_MATERIAL_LOW
);

COMMENT ON TABLE  ingredients           IS 'Ingredient stock — manually updated by manager';
COMMENT ON COLUMN ingredients.threshold IS 'Low stock warning threshold';


-- ────────────────────────────────────────────────────────────
-- 6. DISH → INGREDIENT mapping
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dish_ingredients (
  dish_id         UUID          REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(100)  NOT NULL,
  qty_needed      NUMERIC(10,2) NOT NULL CHECK (qty_needed > 0),
  unit            VARCHAR(20)   NOT NULL,
  PRIMARY KEY (dish_id, ingredient_name)
);

COMMENT ON TABLE dish_ingredients IS 'Amount of ingredients needed to cook 1 unit of a dish';


-- ────────────────────────────────────────────────────────────
-- 7. TABLES (dining tables)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number VARCHAR(10) UNIQUE NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'available'
               CHECK (status IN ('available', 'occupied', 'food_ready'))
);

COMMENT ON COLUMN tables.status IS
  'available = empty | occupied = guests waiting for food | food_ready = food served';


-- ────────────────────────────────────────────────────────────
-- 8. ORDERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id    VARCHAR(20)  NOT NULL,   -- table number as text e.g. "001"
  combo_id    UUID         REFERENCES menu_items(id) ON DELETE SET NULL,
  combo_name  VARCHAR(100) NOT NULL,   -- snapshot of combo name at order time
  quantity    INTEGER      NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes       TEXT         NOT NULL DEFAULT '',
  total_price INTEGER      NOT NULL CHECK (total_price >= 0),
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'cooking', 'done')),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_table_id  ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON orders(created_at DESC);

COMMENT ON COLUMN orders.combo_name  IS 'Combo name snapshot — unaffected if menu changes later';
COMMENT ON COLUMN orders.total_price IS 'price * quantity at order creation time';


-- ────────────────────────────────────────────────────────────
-- 9. KITCHEN TICKETS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kitchen_tickets (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID         REFERENCES orders(id) ON DELETE CASCADE,
  table_id   VARCHAR(20)  NOT NULL,
  combo_name VARCHAR(100) NOT NULL,
  quantity   INTEGER      NOT NULL CHECK (quantity > 0),
  notes      TEXT         NOT NULL DEFAULT '',
  status     VARCHAR(20)  NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'cooking', 'done')),
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status     ON kitchen_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created    ON kitchen_tickets(created_at ASC);

COMMENT ON TABLE kitchen_tickets IS
  'Automatically created on ORDER_CREATED — chef views and updates status';


-- ────────────────────────────────────────────────────────────
-- 10. BILLS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID        REFERENCES orders(id) ON DELETE SET NULL,
  table_id     VARCHAR(20) NOT NULL,
  total_amount INTEGER     NOT NULL CHECK (total_amount >= 0),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'paid')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_table_status ON bills(table_id, status);

COMMENT ON TABLE bills IS
  'Automatically created on ORDER_COMPLETED — cashier confirms payment';


-- ────────────────────────────────────────────────────────────
-- 11. REVENUES (income tracking)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenues (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id    UUID        REFERENCES bills(id) ON DELETE SET NULL,
  amount     INTEGER     NOT NULL CHECK (amount >= 0),
  date       DATE        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date DESC);

COMMENT ON TABLE revenues IS
  'Automatically recorded on PAYMENT_COMPLETED — manager views revenue reports';


-- ============================================================
-- SEED DATA
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Users (passwords are already bcrypt hashed)
-- Plaintext defaults:
--   admin    → admin123
--   manager  → manager123
--   server  → server123
--   chef    → chef123
--   cashier  → cashier123
-- ────────────────────────────────────────────────────────────
INSERT INTO users (username, password, role) VALUES
  ('admin',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'admin'),
  ('manager',
   '$2a$10$mQmHDZUVOCZEGEtbzEXJDOZBRpGkUSWk8BFGHhh/dHt4I6H0vS3d.',
   'manager'),
  ('server',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'server'),
  ('chef',
   '$2a$10$TKh8H1.PfQ0A32cv.XKDQ.6ghcSKwmvFDp7LpCixHMKFvbVXTMH.e',
   'chef'),
  ('cashier',
   '$2a$10$.DinCTJrKwh3L8cL.x2eBeD/4tGKYUWkUoDh3vra48XFkkK.CFN2.',
   'cashier')
ON CONFLICT (username) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Menu items (6 combos)
-- ────────────────────────────────────────────────────────────
INSERT INTO menu_items (id, name, price, is_available) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Korean Fried Chicken Combo', 130000, true),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Grilled Beef BBQ Combo',     180000, true),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Special Pho Combo',          95000,  true),
  ('a1b2c3d4-0000-0000-0000-000000000004', 'Kids Meal Combo',            65000,  true),
  ('a1b2c3d4-0000-0000-0000-000000000005', 'Premium Seafood Combo',      250000, true),
  ('a1b2c3d4-0000-0000-0000-000000000006', 'Healthy Vegetarian Combo',   80000,  true)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Dishes (individual dishes within each combo)
-- ────────────────────────────────────────────────────────────
INSERT INTO dishes (id, name, category, cooking_method) VALUES
  -- Korean Fried Chicken Combo
  ('d0000000-0000-0000-0000-000000000001', 'Korean Fried Chicken',               'savory', 'fry'),
  ('d0000000-0000-0000-0000-000000000002', 'Stir-fried Morning Glory w/ Garlic', 'savory', 'stir-fry'),
  ('d0000000-0000-0000-0000-000000000003', 'Steamed Rice',                       'savory', 'steam'),

  -- Grilled Beef BBQ Combo
  ('d0000000-0000-0000-0000-000000000004', 'Charcoal Grilled Beef',              'savory', 'grill'),
  ('d0000000-0000-0000-0000-000000000005', 'Green Salad',                        'sweet',  'raw'),
  ('d0000000-0000-0000-0000-000000000006', 'Steamed Rice',                       'savory', 'steam'),

  -- Special Pho Combo
  ('d0000000-0000-0000-0000-000000000007', 'Beef Pho',                           'savory', 'simmer'),
  ('d0000000-0000-0000-0000-000000000008', 'Cilantro & Scallion',                'savory', 'raw'),

  -- Kids Meal Combo
  ('d0000000-0000-0000-0000-000000000009', 'Crispy Fried Chicken',               'savory', 'fry'),
  ('d0000000-0000-0000-0000-000000000010', 'Steamed Rice',                       'savory', 'steam'),

  -- Premium Seafood Combo
  ('d0000000-0000-0000-0000-000000000011', 'Chili Salt Grilled Shrimp',          'savory', 'grill'),
  ('d0000000-0000-0000-0000-000000000012', 'Sweet & Sour Stir-fried Squid',      'savory', 'stir-fry'),
  ('d0000000-0000-0000-0000-000000000013', 'Steamed Rice',                       'savory', 'steam'),

  -- Healthy Vegetarian Combo
  ('d0000000-0000-0000-0000-000000000014', 'Fried Tofu with Lemongrass',         'savory', 'fry'),
  ('d0000000-0000-0000-0000-000000000015', 'Boiled Greens',                      'sweet',  'boil'),
  ('d0000000-0000-0000-0000-000000000016', 'Brown Rice',                         'sweet',  'steam')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Combo → Dish mapping
-- ────────────────────────────────────────────────────────────
INSERT INTO combo_dishes (combo_id, dish_id) VALUES
  -- Korean Fried Chicken Combo
  ('a1b2c3d4-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003'),

  -- Grilled Beef BBQ Combo
  ('a1b2c3d4-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006'),

  -- Special Pho Combo
  ('a1b2c3d4-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000007'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000008'),

  -- Kids Meal Combo
  ('a1b2c3d4-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000009'),
  ('a1b2c3d4-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000010'),

  -- Premium Seafood Combo
  ('a1b2c3d4-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000011'),
  ('a1b2c3d4-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000012'),
  ('a1b2c3d4-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000013'),

  -- Healthy Vegetarian Combo
  ('a1b2c3d4-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000014'),
  ('a1b2c3d4-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000015'),
  ('a1b2c3d4-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000016')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Dish → Ingredient mapping
-- ────────────────────────────────────────────────────────────
INSERT INTO dish_ingredients (dish_id, ingredient_name, qty_needed, unit) VALUES
  -- Korean Fried Chicken
  ('d0000000-0000-0000-0000-000000000001', 'Chicken',       0.5,  'kg'),
  ('d0000000-0000-0000-0000-000000000001', 'Garlic',        30,   'g'),
  ('d0000000-0000-0000-0000-000000000001', 'Fish Sauce',    50,   'ml'),

  -- Stir-fried Morning Glory w/ Garlic
  ('d0000000-0000-0000-0000-000000000002', 'Morning Glory', 1,    'bunch'),
  ('d0000000-0000-0000-0000-000000000002', 'Cooking Oil',   30,   'ml'),
  ('d0000000-0000-0000-0000-000000000002', 'Garlic',        20,   'g'),

  -- Steamed Rice (shared across multiple combos)
  ('d0000000-0000-0000-0000-000000000003', 'Rice',          0.2,  'kg'),
  ('d0000000-0000-0000-0000-000000000006', 'Rice',          0.2,  'kg'),
  ('d0000000-0000-0000-0000-000000000010', 'Rice',          0.2,  'kg'),
  ('d0000000-0000-0000-0000-000000000013', 'Rice',          0.2,  'kg'),

  -- Charcoal Grilled Beef
  ('d0000000-0000-0000-0000-000000000004', 'Beef',          0.4,  'kg'),
  ('d0000000-0000-0000-0000-000000000004', 'Scallion',      30,   'g'),
  ('d0000000-0000-0000-0000-000000000004', 'Fish Sauce',    40,   'ml'),

  -- Green Salad
  ('d0000000-0000-0000-0000-000000000005', 'Greens',        0.5,  'bunch'),
  ('d0000000-0000-0000-0000-000000000005', 'Cooking Oil',   20,   'ml'),

  -- Beef Pho
  ('d0000000-0000-0000-0000-000000000007', 'Beef',          0.3,  'kg'),
  ('d0000000-0000-0000-0000-000000000007', 'Soup Bones',    0.5,  'kg'),
  ('d0000000-0000-0000-0000-000000000007', 'Pho Noodles',   0.2,  'kg'),
  ('d0000000-0000-0000-0000-000000000007', 'Salt',          10,   'g'),

  -- Cilantro & Scallion
  ('d0000000-0000-0000-0000-000000000008', 'Scallion',      20,   'g'),

  -- Crispy Fried Chicken
  ('d0000000-0000-0000-0000-000000000009', 'Chicken',       0.4,  'kg'),
  ('d0000000-0000-0000-0000-000000000009', 'Cooking Oil',   200,  'ml'),
  ('d0000000-0000-0000-0000-000000000009', 'Salt',          5,    'g'),

  -- Chili Salt Grilled Shrimp
  ('d0000000-0000-0000-0000-000000000011', 'Shrimp',        0.3,  'kg'),
  ('d0000000-0000-0000-0000-000000000011', 'Salt',          10,   'g'),

  -- Sweet & Sour Stir-fried Squid
  ('d0000000-0000-0000-0000-000000000012', 'Squid',         0.3,  'kg'),
  ('d0000000-0000-0000-0000-000000000012', 'Cooking Oil',   30,   'ml'),
  ('d0000000-0000-0000-0000-000000000012', 'Sugar',         15,   'g'),

  -- Fried Tofu with Lemongrass
  ('d0000000-0000-0000-0000-000000000014', 'Tofu',          0.3,  'kg'),
  ('d0000000-0000-0000-0000-000000000014', 'Cooking Oil',   100,  'ml'),
  ('d0000000-0000-0000-0000-000000000014', 'Salt',          5,    'g'),

  -- Boiled Greens
  ('d0000000-0000-0000-0000-000000000015', 'Greens',        1,    'bunch'),
  ('d0000000-0000-0000-0000-000000000015', 'Salt',          5,    'g'),

  -- Brown Rice
  ('d0000000-0000-0000-0000-000000000016', 'Rice',          0.2,  'kg')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Ingredients (warehouse stock)
-- ────────────────────────────────────────────────────────────
INSERT INTO ingredients (name, quantity, unit, threshold) VALUES
  ('Chicken',       50,    'kg',     10),
  ('Beef',          30,    'kg',     8),
  ('Morning Glory', 100,   'bunch',  20),
  ('Cooking Oil',   20000, 'ml',     3000),
  ('Garlic',        5000,  'g',      500),
  ('Scallion',      3000,  'g',      400),
  ('Pho Noodles',   80,    'kg',     15),
  ('Soup Bones',    25,    'kg',     5),
  ('Shrimp',        20,    'kg',     5),
  ('Squid',         15,    'kg',     4),
  ('Greens',        60,    'bunch',  10),
  ('Tofu',          40,    'kg',     8),
  ('Fish Sauce',    10000, 'ml',     1000),
  ('Salt',          5000,  'g',      500),
  ('Sugar',         3000,  'g',      300),
  ('Rice',          100,   'kg',     20)
ON CONFLICT (name) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Tables (10 tables)
-- ────────────────────────────────────────────────────────────
INSERT INTO tables (table_number, status) VALUES
  ('001', 'available'), ('002', 'available'), ('003', 'available'),
  ('004', 'available'), ('005', 'available'), ('006', 'available'),
  ('007', 'available'), ('008', 'available'), ('009', 'available'),
  ('010', 'available')
ON CONFLICT (table_number) DO NOTHING;


-- ============================================================
-- POST-EXECUTION VERIFICATION
-- ============================================================
SELECT 'users'       AS tbl, COUNT(*) FROM users
UNION ALL
SELECT 'menu_items',          COUNT(*) FROM menu_items
UNION ALL
SELECT 'dishes',              COUNT(*) FROM dishes
UNION ALL
SELECT 'combo_dishes',        COUNT(*) FROM combo_dishes
UNION ALL
SELECT 'dish_ingredients',    COUNT(*) FROM dish_ingredients
UNION ALL
SELECT 'ingredients',         COUNT(*) FROM ingredients
UNION ALL
SELECT 'tables',              COUNT(*) FROM tables;

-- Expected Results:
-- users            | 5
-- menu_items       | 6
-- dishes           | 16
-- combo_dishes     | 16
-- dish_ingredients | 32
-- ingredients      | 16
-- tables           | 10
