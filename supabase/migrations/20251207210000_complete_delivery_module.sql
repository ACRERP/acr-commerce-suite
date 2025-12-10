-- =====================================================
-- MÓDULO DELIVERY - COMPLETAR (60% → 100%)
-- Data: 07/12/2025
-- Objetivo: Adicionar entregadores, Kanban, reserva de estoque e performance
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR TABELA DE ENTREGADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS delivery_men (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    vehicle VARCHAR(50), -- Moto, Carro, Bicicleta
    plate VARCHAR(10),
    contract_type VARCHAR(20) DEFAULT 'avulso' CHECK (contract_type IN ('fixo', 'avulso')),
    commission_per_delivery DECIMAL(10,2) DEFAULT 0,
    commission_percentage DECIMAL(5,2) DEFAULT 0, -- % sobre valor da entrega
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'busy')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_delivery_men_status ON delivery_men(status);
CREATE INDEX IF NOT EXISTS idx_delivery_men_name ON delivery_men(name);

-- =====================================================
-- PARTE 2: EXPANDIR TABELA DELIVERY_ORDERS
-- =====================================================

-- Adicionar campos faltantes
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS delivery_man_id INTEGER REFERENCES delivery_men(id);
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS estimated_time INTEGER; -- em minutos
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS preparation_time INTEGER; -- tempo de preparo
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS delivery_time TIMESTAMP WITH TIME ZONE; -- quando foi entregue
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent'));
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid'));
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS change_for DECIMAL(10,2); -- troco para quanto
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE; -- quando foi atribuído
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE; -- quando saiu para entrega
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5); -- avaliação do cliente

-- Índices
CREATE INDEX IF NOT EXISTS idx_delivery_orders_delivery_man ON delivery_orders(delivery_man_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_priority ON delivery_orders(priority);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_payment_status ON delivery_orders(payment_status);

-- =====================================================
-- PARTE 3: VIEWS DE PERFORMANCE E STATUS
-- =====================================================

-- View: Deliveries por Status (Hoje)
CREATE OR REPLACE VIEW vw_delivery_by_status AS
SELECT 
    status,
    COUNT(*) as quantity,
    SUM(total_amount) as total_value,
    AVG(delivery_fee) as avg_delivery_fee,
    AVG(CASE 
        WHEN delivery_time IS NOT NULL AND created_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (delivery_time - created_at))/60 
    END) as avg_delivery_time_minutes
FROM delivery_orders
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'preparing' THEN 2
        WHEN 'ready' THEN 3
        WHEN 'in_transit' THEN 4
        WHEN 'delivered' THEN 5
        WHEN 'cancelled' THEN 6
    END;

-- View: Performance de Entregadores (Hoje)
CREATE OR REPLACE VIEW vw_delivery_performance_today AS
SELECT 
    dm.id,
    dm.name,
    dm.vehicle,
    dm.status,
    COUNT(d.id) as total_deliveries,
    COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed_deliveries,
    COUNT(CASE WHEN d.status IN ('in_transit', 'ready') THEN 1 END) as active_deliveries,
    SUM(CASE WHEN d.status = 'delivered' THEN d.total_amount ELSE 0 END) as total_value,
    SUM(CASE WHEN d.status = 'delivered' THEN d.delivery_fee ELSE 0 END) as total_fees,
    SUM(CASE WHEN d.status = 'delivered' THEN dm.commission_per_delivery ELSE 0 END) as total_commission_fixed,
    SUM(CASE WHEN d.status = 'delivered' THEN (d.total_amount * dm.commission_percentage / 100) ELSE 0 END) as total_commission_percentage,
    AVG(CASE 
        WHEN d.status = 'delivered' AND d.delivery_time IS NOT NULL AND d.started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (d.delivery_time - d.started_at))/60 
    END) as avg_delivery_time_minutes,
    AVG(CASE WHEN d.status = 'delivered' THEN d.rating END) as avg_rating
FROM delivery_men dm
LEFT JOIN delivery_orders d ON dm.id = d.delivery_man_id AND DATE(d.created_at) = CURRENT_DATE
GROUP BY dm.id, dm.name, dm.vehicle, dm.status
ORDER BY completed_deliveries DESC;

-- View: Performance de Entregadores (Mensal)
CREATE OR REPLACE VIEW vw_delivery_performance_monthly AS
SELECT 
    dm.id,
    dm.name,
    DATE_TRUNC('month', d.created_at) as month,
    COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as total_deliveries,
    SUM(CASE WHEN d.status = 'delivered' THEN d.total_amount ELSE 0 END) as total_value,
    SUM(CASE WHEN d.status = 'delivered' THEN d.delivery_fee ELSE 0 END) as total_fees,
    SUM(CASE WHEN d.status = 'delivered' THEN dm.commission_per_delivery ELSE 0 END) +
    SUM(CASE WHEN d.status = 'delivered' THEN (d.total_amount * dm.commission_percentage / 100) ELSE 0 END) as total_commission,
    AVG(CASE 
        WHEN d.status = 'delivered' AND d.delivery_time IS NOT NULL AND d.started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (d.delivery_time - d.started_at))/60 
    END) as avg_delivery_time_minutes,
    AVG(CASE WHEN d.status = 'delivered' THEN d.rating END) as avg_rating
FROM delivery_men dm
LEFT JOIN delivery_orders d ON dm.id = d.delivery_man_id
WHERE d.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY dm.id, dm.name, DATE_TRUNC('month', d.created_at)
ORDER BY month DESC, total_deliveries DESC;

-- View: Deliveries Pendentes (Kanban)
CREATE OR REPLACE VIEW vw_delivery_kanban AS
SELECT 
    d.id,
    d.created_at,
    d.status,
    d.priority,
    d.customer_name,
    d.customer_phone,
    d.address,
    d.total_amount,
    d.delivery_fee,
    d.payment_method,
    d.payment_status,
    d.observations,
    d.estimated_time,
    dm.name as delivery_man_name,
    dm.vehicle,
    dm.phone as delivery_man_phone,
    c.name as client_name,
    EXTRACT(EPOCH FROM (NOW() - d.created_at))/60 as minutes_since_created
FROM delivery_orders d
LEFT JOIN delivery_men dm ON d.delivery_man_id = dm.id
LEFT JOIN clients c ON d.client_id = c.id
WHERE d.status IN ('pending', 'preparing', 'ready', 'in_transit')
ORDER BY 
    CASE d.priority WHEN 'urgent' THEN 1 ELSE 2 END,
    d.created_at ASC;

-- =====================================================
-- PARTE 4: FUNÇÕES DE CONTROLE
-- =====================================================

-- Função: Atribuir Entregador
CREATE OR REPLACE FUNCTION fn_assign_deliveryman(
    p_delivery_id INTEGER,
    p_deliveryman_id INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE delivery_orders
    SET delivery_man_id = p_deliveryman_id,
        assigned_at = NOW(),
        status = CASE WHEN status = 'pending' THEN 'preparing' ELSE status END,
        updated_at = NOW()
    WHERE id = p_delivery_id;
    
    -- Atualizar status do entregador para busy se estava active
    UPDATE delivery_men
    SET status = 'busy',
        updated_at = NOW()
    WHERE id = p_deliveryman_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Função: Iniciar Entrega (Saiu para Rota)
CREATE OR REPLACE FUNCTION fn_start_delivery(p_delivery_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE delivery_orders
    SET status = 'in_transit',
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = p_delivery_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Finalizar Entrega
CREATE OR REPLACE FUNCTION fn_complete_delivery(
    p_delivery_id INTEGER,
    p_rating INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_deliveryman_id INTEGER;
BEGIN
    -- Buscar entregador
    SELECT delivery_man_id INTO v_deliveryman_id
    FROM delivery_orders
    WHERE id = p_delivery_id;
    
    -- Atualizar delivery
    UPDATE delivery_orders
    SET status = 'delivered',
        delivery_time = NOW(),
        payment_status = 'paid',
        rating = p_rating,
        updated_at = NOW()
    WHERE id = p_delivery_id;
    
    -- Liberar entregador
    IF v_deliveryman_id IS NOT NULL THEN
        UPDATE delivery_men
        SET status = 'active',
            updated_at = NOW()
        WHERE id = v_deliveryman_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função: Cancelar Delivery
CREATE OR REPLACE FUNCTION fn_cancel_delivery(
    p_delivery_id INTEGER,
    p_reason TEXT
) RETURNS VOID AS $$
DECLARE
    v_deliveryman_id INTEGER;
BEGIN
    -- Buscar entregador
    SELECT delivery_man_id INTO v_deliveryman_id
    FROM delivery_orders
    WHERE id = p_delivery_id;
    
    -- Atualizar delivery
    UPDATE delivery_orders
    SET status = 'cancelled',
        cancelled_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_delivery_id;
    
    -- Liberar entregador
    IF v_deliveryman_id IS NOT NULL THEN
        UPDATE delivery_men
        SET status = 'active',
            updated_at = NOW()
        WHERE id = v_deliveryman_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função: Calcular Tempo Estimado de Entrega
CREATE OR REPLACE FUNCTION fn_calculate_delivery_time(
    p_distance_km DECIMAL DEFAULT 5
) RETURNS INTEGER AS $$
DECLARE
    v_avg_speed_kmh DECIMAL := 30; -- Velocidade média em km/h
    v_preparation_time INTEGER := 15; -- Tempo de preparo em minutos
    v_estimated_time INTEGER;
BEGIN
    -- Tempo = (distância / velocidade) * 60 + tempo de preparo
    v_estimated_time := CEIL((p_distance_km / v_avg_speed_kmh) * 60) + v_preparation_time;
    
    RETURN v_estimated_time;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 5: TRIGGERS DE ESTOQUE
-- =====================================================

-- Trigger: Reservar Estoque ao Criar Delivery
CREATE OR REPLACE FUNCTION trg_reserve_stock_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
    -- Reservar estoque dos produtos da venda
    IF NEW.sale_id IS NOT NULL THEN
        UPDATE products p
        SET stock_quantity = stock_quantity - si.quantity
        FROM sale_items si
        WHERE si.sale_id = NEW.sale_id
        AND si.product_id = p.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reserve_stock_on_delivery ON delivery_orders;
CREATE TRIGGER trg_reserve_stock_on_delivery
AFTER INSERT ON delivery_orders
FOR EACH ROW
WHEN (NEW.sale_id IS NOT NULL)
EXECUTE FUNCTION trg_reserve_stock_on_delivery();

-- Trigger: Estornar Estoque ao Cancelar
CREATE OR REPLACE FUNCTION trg_return_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Estornar estoque
        IF NEW.sale_id IS NOT NULL THEN
            UPDATE products p
            SET stock_quantity = stock_quantity + si.quantity
            FROM sale_items si
            WHERE si.sale_id = NEW.sale_id
            AND si.product_id = p.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_return_stock_on_cancel ON delivery_orders;
CREATE TRIGGER trg_return_stock_on_cancel
AFTER UPDATE ON delivery_orders
FOR EACH ROW
EXECUTE FUNCTION trg_return_stock_on_cancel();

-- Trigger: Atualizar Status do Entregador
CREATE OR REPLACE FUNCTION trg_update_deliveryman_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Se foi atribuído um entregador
    IF NEW.delivery_man_id IS NOT NULL AND OLD.delivery_man_id IS NULL THEN
        UPDATE delivery_men
        SET status = 'busy'
        WHERE id = NEW.delivery_man_id;
    END IF;
    
    -- Se foi entregue ou cancelado, liberar entregador
    IF NEW.status IN ('delivered', 'cancelled') AND OLD.status NOT IN ('delivered', 'cancelled') THEN
        IF NEW.delivery_man_id IS NOT NULL THEN
            UPDATE delivery_men
            SET status = 'active'
            WHERE id = NEW.delivery_man_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_deliveryman_status ON delivery_orders;
CREATE TRIGGER trg_update_deliveryman_status
AFTER UPDATE ON delivery_orders
FOR EACH ROW
EXECUTE FUNCTION trg_update_deliveryman_status();

-- =====================================================
-- FIM DA MIGRATION - MÓDULO DELIVERY COMPLETO
-- =====================================================

-- VERIFICAÇÃO: Execute para confirmar
/*
SELECT 
    'Tabela delivery_men' as tipo,
    COUNT(*) as existe
FROM information_schema.tables
WHERE table_name = 'delivery_men';

SELECT 
    'Campos Adicionados em delivery_orders' as tipo,
    COUNT(*) as quantidade
FROM information_schema.columns
WHERE table_name = 'delivery_orders'
AND column_name IN ('delivery_man_id', 'estimated_time', 'priority', 'rating');

SELECT 
    'Views Criadas' as tipo,
    COUNT(*) as quantidade
FROM information_schema.views
WHERE table_name LIKE 'vw_delivery%';

SELECT 
    'Funções Criadas' as tipo,
    COUNT(*) as quantidade
FROM information_schema.routines
WHERE routine_name LIKE 'fn_%delivery%';
*/
