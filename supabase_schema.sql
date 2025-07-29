-- JáPede Cardápio - Schema SQL para Supabase
-- Este arquivo contém todas as tabelas necessárias para o sistema

-- ======================================
-- CATEGORIAS DE PRODUTOS
-- ======================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- ITENS DO CARDÁPIO
-- ======================================
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    item_type VARCHAR(20) DEFAULT 'standard' CHECK (item_type IN ('standard', 'pizza')),
    send_to_kitchen BOOLEAN DEFAULT true,
    allow_half_and_half BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- TAMANHOS DE PIZZA
-- ======================================
CREATE TABLE IF NOT EXISTS pizza_sizes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- MASSAS DE PIZZA
-- ======================================
CREATE TABLE IF NOT EXISTS pizza_crusts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pizza_size_id UUID NOT NULL REFERENCES pizza_sizes(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    additional_price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- MESAS
-- ======================================
CREATE TABLE IF NOT EXISTS tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED')),
    capacity INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- SESSÕES DO CAIXA
-- ======================================
CREATE TABLE IF NOT EXISTS cash_register_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    calculated_sales DECIMAL(10,2) DEFAULT 0.00,
    expected_in_cash DECIMAL(10,2) DEFAULT 0.00,
    closing_balance_informed DECIMAL(10,2),
    difference DECIMAL(10,2),
    notes_opening TEXT,
    notes_closing TEXT,
    status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
    user_id_opened VARCHAR(100),
    user_id_closed VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- AJUSTES DE CAIXA
-- ======================================
CREATE TABLE IF NOT EXISTS cash_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES cash_register_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('adicionar', 'remover')),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- PEDIDOS
-- ======================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID,
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20),
    customer_address TEXT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Preparo', 'Pronto para Retirada', 'Saiu para Entrega', 'Entregue', 'Cancelado')),
    order_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    last_status_change_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_auto_transition_time TIMESTAMP WITH TIME ZONE,
    auto_progress BOOLEAN DEFAULT true,
    current_progress_percent INTEGER DEFAULT 0,
    order_type VARCHAR(20) DEFAULT 'Mesa' CHECK (order_type IN ('Mesa', 'Delivery', 'Balcão')),
    table_id UUID REFERENCES tables(id),
    payment_method VARCHAR(30) CHECK (payment_method IN ('Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX', 'Múltiplo')),
    amount_paid DECIMAL(10,2),
    change_due DECIMAL(10,2),
    cash_register_session_id UUID REFERENCES cash_register_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- ITENS DO PEDIDO
-- ======================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    selected_size_id UUID REFERENCES pizza_sizes(id),
    selected_crust_id UUID REFERENCES pizza_crusts(id),
    is_half_and_half BOOLEAN DEFAULT false,
    first_half_flavor_id UUID REFERENCES menu_items(id),
    first_half_flavor_name VARCHAR(200),
    first_half_flavor_price DECIMAL(10,2),
    second_half_flavor_id UUID REFERENCES menu_items(id),
    second_half_flavor_name VARCHAR(200),
    second_half_flavor_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- CONFIGURAÇÕES DO SISTEMA
-- ======================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- TRIGGERS PARA UPDATED_AT
-- ======================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers para todas as tabelas
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pizza_sizes_updated_at BEFORE UPDATE ON pizza_sizes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pizza_crusts_updated_at BEFORE UPDATE ON pizza_crusts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_register_sessions_updated_at BEFORE UPDATE ON cash_register_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_adjustments_updated_at BEFORE UPDATE ON cash_adjustments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- ÍNDICES PARA PERFORMANCE
-- ======================================
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_pizza_sizes_menu_item_id ON pizza_sizes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_pizza_crusts_pizza_size_id ON pizza_crusts(pizza_size_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_time ON orders(order_time);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_cash_register_session_id ON orders(cash_register_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_cash_adjustments_session_id ON cash_adjustments(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_register_sessions_status ON cash_register_sessions(status);

-- ======================================
-- MESSAGES
-- ======================================
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  username VARCHAR NOT NULL,
  text TEXT NOT NULL,
  country VARCHAR,
  is_authenticated BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups by username and timestamp
CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- ======================================
-- RLS (Row Level Security) - Desabilitado por enquanto
-- ======================================
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
-- ... (adicione conforme necessário)

COMMENT ON TABLE categories IS 'Categorias dos itens do cardápio';
COMMENT ON TABLE menu_items IS 'Itens do cardápio (pratos, bebidas, pizzas, etc.)';
COMMENT ON TABLE pizza_sizes IS 'Tamanhos disponíveis para pizzas';
COMMENT ON TABLE pizza_crusts IS 'Tipos de massa disponíveis para cada tamanho de pizza';
COMMENT ON TABLE tables IS 'Mesas do restaurante';
COMMENT ON TABLE cash_register_sessions IS 'Sessões de abertura e fechamento do caixa';
COMMENT ON TABLE cash_adjustments IS 'Ajustes de caixa (sangria, reforço, etc.)';
COMMENT ON TABLE orders IS 'Pedidos dos clientes';
COMMENT ON TABLE order_items IS 'Itens individuais de cada pedido';
COMMENT ON TABLE system_settings IS 'Configurações gerais do sistema';

