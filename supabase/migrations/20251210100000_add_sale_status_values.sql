-- Migration: Adicionar valores ao ENUM sale_status
-- Data: 10/12/2025
-- Objetivo: Adicionar valores 'orcamento', 'aprovado', 'producao', 'entregue' ao ENUM
-- IMPORTANTE: Executar cada ALTER TYPE separadamente no SQL Editor

-- ============ ADICIONAR VALORES AO ENUM ============
-- Executar um por vez, aguardando commit entre cada um:

ALTER TYPE sale_status ADD VALUE IF NOT EXISTS 'orcamento';
-- COMMIT; (executar próximo após commit)

ALTER TYPE sale_status ADD VALUE IF NOT EXISTS 'aprovado';
-- COMMIT; (executar próximo após commit)

ALTER TYPE sale_status ADD VALUE IF NOT EXISTS 'producao';
-- COMMIT; (executar próximo após commit)

ALTER TYPE sale_status ADD VALUE IF NOT EXISTS 'entregue';

-- ============ VERIFICAÇÃO ============
SELECT enum_range(NULL::sale_status) as valores_disponiveis;
