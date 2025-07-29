-- JáPede Cardápio - Dados Iniciais (Seed Data)
-- Este arquivo popula o banco com dados básicos necessários para o funcionamento do sistema

-- ======================================
-- INSERIR CATEGORIAS BÁSICAS
-- ======================================
INSERT INTO categories (id, name) VALUES 
    (gen_random_uuid(), 'Pizzas Tradicionais'),
    (gen_random_uuid(), 'Pizzas Especiais'),
    (gen_random_uuid(), 'Pizzas Doces'),
    (gen_random_uuid(), 'Bebidas'),
    (gen_random_uuid(), 'Refrigerantes'),
    (gen_random_uuid(), 'Sucos'),
    (gen_random_uuid(), 'Porções'),
    (gen_random_uuid(), 'Sobremesas'),
    (gen_random_uuid(), 'Lanches'),
    (gen_random_uuid(), 'Saladas')
ON CONFLICT (name) DO NOTHING;

-- ======================================
-- INSERIR ALGUNS ITENS BÁSICOS DO CARDÁPIO
-- ======================================

-- Obter IDs das categorias para usar nas inserções
DO $$
DECLARE
    cat_pizza_trad UUID;
    cat_pizza_esp UUID;
    cat_pizza_doce UUID;
    cat_bebidas UUID;
    cat_refri UUID;
    cat_sucos UUID;
    cat_porcoes UUID;
    cat_sobremesas UUID;
    cat_lanches UUID;
    cat_saladas UUID;
    
    item_margherita UUID;
    item_calabresa UUID;
    item_portuguesa UUID;
    item_frango_catupiry UUID;
    item_quatro_queijos UUID;
    item_chocolate UUID;
    
    size_pequena UUID;
    size_media UUID;
    size_grande UUID;
    size_familia UUID;
BEGIN
    -- Buscar IDs das categorias
    SELECT id INTO cat_pizza_trad FROM categories WHERE name = 'Pizzas Tradicionais';
    SELECT id INTO cat_pizza_esp FROM categories WHERE name = 'Pizzas Especiais';
    SELECT id INTO cat_pizza_doce FROM categories WHERE name = 'Pizzas Doces';
    SELECT id INTO cat_bebidas FROM categories WHERE name = 'Bebidas';
    SELECT id INTO cat_refri FROM categories WHERE name = 'Refrigerantes';
    SELECT id INTO cat_sucos FROM categories WHERE name = 'Sucos';
    SELECT id INTO cat_porcoes FROM categories WHERE name = 'Porções';
    SELECT id INTO cat_sobremesas FROM categories WHERE name = 'Sobremesas';
    SELECT id INTO cat_lanches FROM categories WHERE name = 'Lanches';
    SELECT id INTO cat_saladas FROM categories WHERE name = 'Saladas';

    -- PIZZAS TRADICIONAIS
    INSERT INTO menu_items (id, category_id, name, description, price, item_type, allow_half_and_half, available) VALUES
        (gen_random_uuid(), cat_pizza_trad, 'Pizza Margherita', 'Molho de tomate, mussarela, manjericão fresco e orégano', 0.00, 'pizza', true, true),
        (gen_random_uuid(), cat_pizza_trad, 'Pizza Calabresa', 'Molho de tomate, mussarela, calabresa, cebola e orégano', 0.00, 'pizza', true, true),
        (gen_random_uuid(), cat_pizza_trad, 'Pizza Portuguesa', 'Molho de tomate, mussarela, presunto, ovos, cebola, azeitona e orégano', 0.00, 'pizza', true, true),
        (gen_random_uuid(), cat_pizza_trad, 'Pizza Napolitana', 'Molho de tomate, mussarela, tomate, alho, manjericão e orégano', 0.00, 'pizza', true, true),
        (gen_random_uuid(), cat_pizza_trad, 'Pizza Pepperoni', 'Molho de tomate, mussarela, pepperoni e orégano', 0.00, 'pizza', true, true)
    ON CONFLICT DO NOTHING;
    
    -- PIZZAS ESPECIAIS
    INSERT INTO menu_items (id, category_id, name, description, price, item_type, allow_half_and_half, available) VALUES
        (gen_random_uuid(), cat_pizza_esp, 'Pizza Frango com Catupiry', 'Molho de tomate, mussarela, frango desfiado, catupiry e orégano', 0.00, 'pizza', true, true),
        (gen_random_uuid(), cat_pizza_esp, 'Pizza Quatro Queijos', 'Molho branco, mussarela, provolone, parmesão, gorgonzola e orégano', 0.00, 'pizza', true, true),
        (gen_random_uuid(), cat_pizza_esp, 'Pizza Bacon', 'Molho de tomate, mussarela, bacon crocante, cebola e orégano', 0.00, 'pizza', true, true),
        (gen_random_uuid(), cat_pizza_esp, 'Pizza Toscana', 'Molho de tomate, mussarela, calabresa especial, alho e pimenta', 0.00, 'pizza', true, true)
    ON CONFLICT DO NOTHING;
    
    -- PIZZAS DOCES
    INSERT INTO menu_items (id, category_id, name, description, price, item_type, allow_half_and_half, available) VALUES
        (gen_random_uuid(), cat_pizza_doce, 'Pizza de Chocolate', 'Massa doce, chocolate ao leite e granulado', 0.00, 'pizza', true, true),
        (gen_random_uuid(), cat_pizza_doce, 'Pizza Romeu e Julieta', 'Massa doce, goiabada e queijo minas', 0.00, 'pizza', true, true),
        (gen_random_uuid(), cat_pizza_doce, 'Pizza Banana com Canela', 'Massa doce, banana, canela e açúcar cristal', 0.00, 'pizza', false, true)
    ON CONFLICT DO NOTHING;
    
    -- BEBIDAS E REFRIGERANTES
    INSERT INTO menu_items (category_id, name, description, price, item_type, send_to_kitchen, available) VALUES
        (cat_refri, 'Coca-Cola 350ml', 'Refrigerante Coca-Cola lata 350ml', 5.50, 'standard', false, true),
        (cat_refri, 'Guaraná Antarctica 350ml', 'Refrigerante Guaraná Antarctica lata 350ml', 5.50, 'standard', false, true),
        (cat_refri, 'Fanta Laranja 350ml', 'Refrigerante Fanta Laranja lata 350ml', 5.50, 'standard', false, true),
        (cat_refri, 'Coca-Cola 2L', 'Refrigerante Coca-Cola garrafa 2L', 12.90, 'standard', false, true),
        (cat_sucos, 'Suco de Laranja Natural', 'Suco de laranja natural 500ml', 8.90, 'standard', false, true),
        (cat_sucos, 'Suco de Limão', 'Suco de limão natural 500ml', 7.90, 'standard', false, true),
        (cat_bebidas, 'Água Mineral 500ml', 'Água mineral sem gás 500ml', 3.50, 'standard', false, true)
    ON CONFLICT DO NOTHING;
    
    -- PORÇÕES
    INSERT INTO menu_items (category_id, name, description, price, item_type, available) VALUES
        (cat_porcoes, 'Batata Frita', 'Porção de batata frita crocante (serve 2-3 pessoas)', 18.90, 'standard', true),
        (cat_porcoes, 'Calabresa Acebolada', 'Porção de calabresa acebolada (serve 2-3 pessoas)', 24.90, 'standard', true),
        (cat_porcoes, 'Mandioca Frita', 'Porção de mandioca frita (serve 2-3 pessoas)', 16.90, 'standard', true),
        (cat_porcoes, 'Polenta Frita', 'Porção de polenta frita (serve 2-3 pessoas)', 15.90, 'standard', true)
    ON CONFLICT DO NOTHING;
    
    -- LANCHES
    INSERT INTO menu_items (category_id, name, description, price, item_type, available) VALUES
        (cat_lanches, 'X-Burger', 'Hambúrguer, queijo, alface, tomate, maionese', 16.90, 'standard', true),
        (cat_lanches, 'X-Bacon', 'Hambúrguer, queijo, bacon, alface, tomate, maionese', 19.90, 'standard', true),
        (cat_lanches, 'X-Tudo', 'Hambúrguer, queijo, bacon, ovo, presunto, alface, tomate, maionese', 22.90, 'standard', true)
    ON CONFLICT DO NOTHING;
    
    -- SOBREMESAS
    INSERT INTO menu_items (category_id, name, description, price, item_type, send_to_kitchen, available) VALUES
        (cat_sobremesas, 'Pudim de Leite', 'Pudim de leite condensado caseiro', 8.90, 'standard', false, true),
        (cat_sobremesas, 'Brigadeiro', 'Brigadeiro gourmet (unidade)', 3.50, 'standard', false, true),
        (cat_sobremesas, 'Sorvete 2 Bolas', 'Sorvete de sua escolha (2 bolas)', 7.90, 'standard', false, true)
    ON CONFLICT DO NOTHING;

    -- Agora vamos adicionar tamanhos e massas para as pizzas
    -- Primeiro, pegar alguns IDs de pizzas para usar como exemplo
    SELECT id INTO item_margherita FROM menu_items WHERE name = 'Pizza Margherita' LIMIT 1;
    SELECT id INTO item_calabresa FROM menu_items WHERE name = 'Pizza Calabresa' LIMIT 1;
    SELECT id INTO item_portuguesa FROM menu_items WHERE name = 'Pizza Portuguesa' LIMIT 1;
    SELECT id INTO item_frango_catupiry FROM menu_items WHERE name = 'Pizza Frango com Catupiry' LIMIT 1;
    SELECT id INTO item_quatro_queijos FROM menu_items WHERE name = 'Pizza Quatro Queijos' LIMIT 1;
    SELECT id INTO item_chocolate FROM menu_items WHERE name = 'Pizza de Chocolate' LIMIT 1;

    -- TAMANHOS DE PIZZA (vamos criar para algumas pizzas como exemplo)
    IF item_margherita IS NOT NULL THEN
        INSERT INTO pizza_sizes (id, menu_item_id, name, price) VALUES
            (gen_random_uuid(), item_margherita, 'Pequena (4 fatias)', 22.90),
            (gen_random_uuid(), item_margherita, 'Média (6 fatias)', 32.90),
            (gen_random_uuid(), item_margherita, 'Grande (8 fatias)', 42.90),
            (gen_random_uuid(), item_margherita, 'Família (12 fatias)', 52.90);
            
        -- Buscar IDs dos tamanhos recém-criados
        SELECT id INTO size_pequena FROM pizza_sizes WHERE menu_item_id = item_margherita AND name = 'Pequena (4 fatias)';
        SELECT id INTO size_media FROM pizza_sizes WHERE menu_item_id = item_margherita AND name = 'Média (6 fatias)';
        SELECT id INTO size_grande FROM pizza_sizes WHERE menu_item_id = item_margherita AND name = 'Grande (8 fatias)';
        SELECT id INTO size_familia FROM pizza_sizes WHERE menu_item_id = item_margherita AND name = 'Família (12 fatias)';
        
        -- MASSAS PARA OS TAMANHOS (exemplo para alguns tamanhos)
        IF size_media IS NOT NULL THEN
            INSERT INTO pizza_crusts (pizza_size_id, name, additional_price) VALUES
                (size_media, 'Tradicional', 0.00),
                (size_media, 'Fina', 0.00),
                (size_media, 'Grossa', 2.00),
                (size_media, 'Integral', 3.00);
        END IF;
        
        IF size_grande IS NOT NULL THEN
            INSERT INTO pizza_crusts (pizza_size_id, name, additional_price) VALUES
                (size_grande, 'Tradicional', 0.00),
                (size_grande, 'Fina', 0.00),
                (size_grande, 'Grossa', 3.00),
                (size_grande, 'Integral', 4.00);
        END IF;
    END IF;

    -- Repetir para Calabresa
    IF item_calabresa IS NOT NULL THEN
        INSERT INTO pizza_sizes (menu_item_id, name, price) VALUES
            (item_calabresa, 'Pequena (4 fatias)', 25.90),
            (item_calabresa, 'Média (6 fatias)', 35.90),
            (item_calabresa, 'Grande (8 fatias)', 45.90),
            (item_calabresa, 'Família (12 fatias)', 55.90);
    END IF;

    -- Frango com Catupiry
    IF item_frango_catupiry IS NOT NULL THEN
        INSERT INTO pizza_sizes (menu_item_id, name, price) VALUES
            (item_frango_catupiry, 'Pequena (4 fatias)', 28.90),
            (item_frango_catupiry, 'Média (6 fatias)', 38.90),
            (item_frango_catupiry, 'Grande (8 fatias)', 48.90),
            (item_frango_catupiry, 'Família (12 fatias)', 58.90);
    END IF;

END $$;

-- ======================================
-- INSERIR MESAS BÁSICAS
-- ======================================
INSERT INTO tables (number, capacity, status) VALUES
    (1, 4, 'AVAILABLE'),
    (2, 4, 'AVAILABLE'),
    (3, 2, 'AVAILABLE'),
    (4, 6, 'AVAILABLE'),
    (5, 4, 'AVAILABLE'),
    (6, 2, 'AVAILABLE'),
    (7, 4, 'AVAILABLE'),
    (8, 8, 'AVAILABLE'),
    (9, 4, 'AVAILABLE'),
    (10, 6, 'AVAILABLE')
ON CONFLICT (number) DO NOTHING;

-- ======================================
-- CONFIGURAÇÕES DO SISTEMA
-- ======================================
INSERT INTO system_settings (key, value, description) VALUES
    ('restaurant_name', 'JáPede Pizzaria', 'Nome do restaurante'),
    ('restaurant_phone', '(11) 99999-9999', 'Telefone do restaurante'),
    ('restaurant_address', 'Rua das Pizzas, 123 - Centro', 'Endereço do restaurante'),
    ('delivery_fee', '5.00', 'Taxa de entrega padrão'),
    ('min_delivery_order', '25.00', 'Valor mínimo para entrega'),
    ('auto_progress_enabled', 'true', 'Habilitar progressão automática de pedidos'),
    ('kitchen_display_enabled', 'true', 'Habilitar display da cozinha'),
    ('cash_register_initial_balance', '100.00', 'Saldo inicial padrão do caixa'),
    ('system_version', '1.0.0', 'Versão do sistema'),
    ('last_backup', '', 'Data do último backup realizado')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- ======================================
-- MENSAGEM DE CONFIRMAÇÃO
-- ======================================
DO $$
BEGIN
    RAISE NOTICE '✅ Dados iniciais inseridos com sucesso!';
    RAISE NOTICE '📊 Categorias: % registros', (SELECT COUNT(*) FROM categories);
    RAISE NOTICE '🍕 Itens do cardápio: % registros', (SELECT COUNT(*) FROM menu_items);
    RAISE NOTICE '📏 Tamanhos de pizza: % registros', (SELECT COUNT(*) FROM pizza_sizes);
    RAISE NOTICE '🥖 Massas de pizza: % registros', (SELECT COUNT(*) FROM pizza_crusts);
    RAISE NOTICE '🪑 Mesas: % registros', (SELECT COUNT(*) FROM tables);
    RAISE NOTICE '⚙️  Configurações: % registros', (SELECT COUNT(*) FROM system_settings);
END $$;
