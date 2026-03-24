/**
 * MediReach — Database Migration Script
 *
 * Creates all application tables: users, refresh_tokens, password_reset_tokens,
 * medicines, prescriptions, carts, cart_items, orders, order_items, payments.
 * Run with: npm run migrate
 */

const { pool } = require('./db');

const migrate = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Enable uuid-ossp extension for uuid_generate_v4()
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // ── Users table ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name          VARCHAR(100)  NOT NULL,
        email         VARCHAR(255)  NOT NULL UNIQUE,
        password      VARCHAR(255),
        role          VARCHAR(20)   NOT NULL DEFAULT 'customer'
                        CHECK (role IN ('customer', 'pharmacist', 'admin')),
        status        VARCHAR(20)   NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'blocked')),
        phone         VARCHAR(20),
        address       TEXT,
        auth_provider VARCHAR(20)   NOT NULL DEFAULT 'local'
                        CHECK (auth_provider IN ('local', 'google', 'apple')),
        provider_id   VARCHAR(255),
        avatar_url    TEXT,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    // Index on email for fast lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);

    // ── Refresh Tokens table ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token         TEXT          NOT NULL UNIQUE,
        expires_at    TIMESTAMPTZ   NOT NULL,
        revoked       BOOLEAN       NOT NULL DEFAULT FALSE,
        replaced_by   UUID          REFERENCES refresh_tokens(id),
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        ip_address    VARCHAR(50),
        user_agent    TEXT
      );
    `);

    // Index on token for fast lookups during refresh
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens (token);
    `);

    // Index on user_id to quickly find all tokens for a user
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
    `);

    // ── Password Reset Tokens table ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token         TEXT          NOT NULL UNIQUE,
        code          VARCHAR(6),
        expires_at    TIMESTAMPTZ   NOT NULL,
        used          BOOLEAN       NOT NULL DEFAULT FALSE,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens (token);
    `);

    // Add code column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS code VARCHAR(6);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // ── Medicines table ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name                  VARCHAR(200)  NOT NULL,
        generic_name          VARCHAR(200)  NOT NULL,
        category              VARCHAR(50)   NOT NULL,
        manufacturer          VARCHAR(200)  NOT NULL,
        requires_prescription BOOLEAN       NOT NULL DEFAULT FALSE,
        price                 DECIMAL(10,2) NOT NULL,
        stock                 INTEGER       NOT NULL DEFAULT 0,
        description           TEXT,
        image_url             TEXT,
        expiry_date           DATE,
        sold_count            INTEGER       NOT NULL DEFAULT 0,
        created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines (category);
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_medicines_name ON medicines (name);
    `);

    // ── Auto-update updated_at trigger ───────────────────────────────
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_users_updated_at ON users;
      CREATE TRIGGER set_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_medicines_updated_at ON medicines;
      CREATE TRIGGER set_medicines_updated_at
        BEFORE UPDATE ON medicines
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // ── Prescriptions table ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        image_url     TEXT          NOT NULL,
        status        VARCHAR(20)   NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
        notes         TEXT,
        reviewed_by   UUID          REFERENCES users(id),
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions (user_id);
    `);

    // Add used column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS used BOOLEAN NOT NULL DEFAULT FALSE;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_prescriptions_updated_at ON prescriptions;
      CREATE TRIGGER set_prescriptions_updated_at
        BEFORE UPDATE ON prescriptions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // ── Carts table (one per customer) ───────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id       UUID          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_carts_updated_at ON carts;
      CREATE TRIGGER set_carts_updated_at
        BEFORE UPDATE ON carts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // ── Cart Items table ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cart_id       UUID          NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        medicine_id   UUID          NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
        quantity      INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        UNIQUE (cart_id, medicine_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items (cart_id);
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_cart_items_updated_at ON cart_items;
      CREATE TRIGGER set_cart_items_updated_at
        BEFORE UPDATE ON cart_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // ── Orders table ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id          UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_number     VARCHAR(30)     NOT NULL UNIQUE,
        status           VARCHAR(30)     NOT NULL DEFAULT 'pending'
                           CHECK (status IN (
                             'pending', 'prescription_review', 'verified',
                             'packed', 'shipped', 'delivered', 'cancelled'
                           )),
        subtotal         DECIMAL(12,2)   NOT NULL DEFAULT 0,
        tax              DECIMAL(12,2)   NOT NULL DEFAULT 0,
        delivery_fee     DECIMAL(12,2)   NOT NULL DEFAULT 0,
        grand_total      DECIMAL(12,2)   NOT NULL DEFAULT 0,
        payment_method   VARCHAR(20)     NOT NULL DEFAULT 'cod'
                           CHECK (payment_method IN ('cod', 'esewa')),
        payment_status   VARCHAR(20)     NOT NULL DEFAULT 'pending'
                           CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        shipping_address TEXT,
        shipping_phone   VARCHAR(20),
        notes            TEXT,
        prescription_id  UUID            REFERENCES prescriptions(id),
        created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
    `);

    // Add delivery tracking columns if they don't exist (for existing databases)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS destination_lng DOUBLE PRECISION;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
      CREATE TRIGGER set_orders_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // ── Order Items table ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id      UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        medicine_id   UUID          NOT NULL REFERENCES medicines(id),
        medicine_name VARCHAR(200)  NOT NULL,
        quantity      INTEGER       NOT NULL CHECK (quantity > 0),
        unit_price    DECIMAL(10,2) NOT NULL,
        total_price   DECIMAL(12,2) NOT NULL,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
    `);

    // ── Payments table ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id          UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        method            VARCHAR(20)     NOT NULL
                            CHECK (method IN ('cod', 'esewa')),
        amount            DECIMAL(12,2)   NOT NULL,
        status            VARCHAR(20)     NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
        transaction_id    VARCHAR(255),
        provider_ref      TEXT,
        provider_response JSONB,
        idempotency_key   VARCHAR(100)    UNIQUE,
        created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments (transaction_id);
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_payments_updated_at ON payments;
      CREATE TRIGGER set_payments_updated_at
        BEFORE UPDATE ON payments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // ── Payment Webhook Events table (idempotency + audit) ──────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_webhook_events (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider          VARCHAR(30)     NOT NULL,
        provider_event_id VARCHAR(255)    NOT NULL UNIQUE,
        event_type        VARCHAR(120)    NOT NULL,
        status            VARCHAR(20)     NOT NULL DEFAULT 'received'
                            CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
        payload           JSONB,
        error_message     TEXT,
        processed_at      TIMESTAMPTZ,
        created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_provider_event
      ON payment_webhook_events (provider, provider_event_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status
      ON payment_webhook_events (status);
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_payment_webhook_events_updated_at ON payment_webhook_events;
      CREATE TRIGGER set_payment_webhook_events_updated_at
        BEFORE UPDATE ON payment_webhook_events
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // ── Wishlists table ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        medicine_id   UUID          NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, medicine_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists (user_id);
    `);

    // --- Patch existing constraints for payment method updates ---
    await client.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
      ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cod', 'esewa'));
      
      ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
      ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method IN ('cod', 'esewa'));
    `);

    // ── Contact Messages table ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name          VARCHAR(150)  NOT NULL,
        email         VARCHAR(255)  NOT NULL,
        message       TEXT          NOT NULL,
        status        VARCHAR(20)   NOT NULL DEFAULT 'unread'
                        CHECK (status IN ('unread', 'read', 'resolved')),
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at DESC);
    `);

    await client.query('COMMIT');
    console.log('✅  Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch(() => process.exit(1));
