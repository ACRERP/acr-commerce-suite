-- =====================================================
-- SCRIPT DE APLICAÇÃO MANUAL DAS MIGRATIONS FISCAIS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- IMPORTANTE: Execute este script em ordem, seção por seção
-- Verifique se cada seção foi executada com sucesso antes de prosseguir

-- =====================================================
-- SEÇÃO 1: VERIFICAR SE AS TABELAS JÁ EXISTEM
-- =====================================================

-- Execute esta query primeiro para verificar o que já existe:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'company_fiscal_settings',
  'fiscal_notes',
  'fiscal_note_items',
  'fiscal_note_inutilizations'
)
ORDER BY table_name;

-- Se alguma tabela já existir, pule a criação dela nas seções seguintes

-- =====================================================
-- SEÇÃO 2: CRIAR TABELA company_fiscal_settings
-- =====================================================

CREATE TABLE IF NOT EXISTS company_fiscal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18) NOT NULL,
  inscricao_estadual VARCHAR(20),
  inscricao_municipal VARCHAR(20),
  regime_tributario VARCHAR(50) CHECK (regime_tributario IN ('simples_nacional', 'lucro_presumido', 'lucro_real')) DEFAULT 'simples_nacional',
  certificado_a1 BYTEA,
  certificado_senha VARCHAR(255),
  certificado_validade DATE,
  serie_nfce VARCHAR(10) DEFAULT '1',
  ultimo_numero_nfce INTEGER DEFAULT 0,
  csc_nfce VARCHAR(100),
  id_csc_nfce INTEGER DEFAULT 1,
  serie_nfe VARCHAR(10) DEFAULT '1',
  ultimo_numero_nfe INTEGER DEFAULT 0,
  ambiente VARCHAR(20) CHECK (ambiente IN ('producao', 'homologacao')) DEFAULT 'homologacao',
  logradouro VARCHAR(255),
  numero VARCHAR(10),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  uf VARCHAR(2),
  cep VARCHAR(9),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_fiscal_settings_company ON company_fiscal_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_fiscal_settings_cnpj ON company_fiscal_settings(cnpj);

-- =====================================================
-- SEÇÃO 3: ADICIONAR CAMPOS FISCAIS EM products
-- =====================================================

-- Execute cada ALTER TABLE separadamente
-- Se der erro "column already exists", ignore e continue

ALTER TABLE products ADD COLUMN IF NOT EXISTS ncm VARCHAR(10);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cfop_padrao VARCHAR(10) DEFAULT '5102';
ALTER TABLE products ADD COLUMN IF NOT EXISTS cst VARCHAR(10);
ALTER TABLE products ADD COLUMN IF NOT EXISTS csosn VARCHAR(10);
ALTER TABLE products ADD COLUMN IF NOT EXISTS origem VARCHAR(1) CHECK (origem IN ('0', '1', '2', '3', '4', '5', '6', '7', '8')) DEFAULT '0';
ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_aliquota DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pis_aliquota DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cofins_aliquota DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ipi_aliquota DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cest VARCHAR(10);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unidade_tributavel VARCHAR(10) DEFAULT 'UN';

CREATE INDEX IF NOT EXISTS idx_products_ncm ON products(ncm);

-- =====================================================
-- SEÇÃO 4: CRIAR TABELA fiscal_notes
-- =====================================================

CREATE TABLE IF NOT EXISTS fiscal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  serie VARCHAR(10) NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('nfce', 'nfe', 'nfse')) NOT NULL,
  modelo VARCHAR(5) DEFAULT '65',
  chave_acesso VARCHAR(44) UNIQUE,
  sale_id UUID,
  service_order_id UUID,
  client_id UUID,
  company_id UUID,
  valor_produtos DECIMAL(10,2) NOT NULL,
  valor_frete DECIMAL(10,2) DEFAULT 0,
  valor_seguro DECIMAL(10,2) DEFAULT 0,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  valor_outras_despesas DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL,
  base_calculo_icms DECIMAL(10,2) DEFAULT 0,
  valor_icms DECIMAL(10,2) DEFAULT 0,
  base_calculo_icms_st DECIMAL(10,2) DEFAULT 0,
  valor_icms_st DECIMAL(10,2) DEFAULT 0,
  valor_pis DECIMAL(10,2) DEFAULT 0,
  valor_cofins DECIMAL(10,2) DEFAULT 0,
  valor_ipi DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) CHECK (status IN ('pendente', 'processando', 'autorizada', 'cancelada', 'denegada', 'rejeitada', 'inutilizada')) DEFAULT 'pendente',
  protocolo VARCHAR(50),
  motivo_status TEXT,
  xml_envio TEXT,
  xml_retorno TEXT,
  xml_autorizado TEXT,
  pdf_url TEXT,
  danfe_url TEXT,
  motivo_cancelamento TEXT,
  protocolo_cancelamento VARCHAR(50),
  data_cancelamento TIMESTAMP,
  qr_code TEXT,
  url_consulta TEXT,
  data_emissao TIMESTAMP DEFAULT NOW(),
  data_autorizacao TIMESTAMP,
  data_saida TIMESTAMP,
  informacoes_complementares TEXT,
  informacoes_fisco TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_notes_chave ON fiscal_notes(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_fiscal_notes_sale ON fiscal_notes(sale_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_notes_client ON fiscal_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_notes_status ON fiscal_notes(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_notes_data_emissao ON fiscal_notes(data_emissao);
CREATE INDEX IF NOT EXISTS idx_fiscal_notes_tipo ON fiscal_notes(tipo);

-- =====================================================
-- SEÇÃO 5: CRIAR TABELA fiscal_note_items
-- =====================================================

CREATE TABLE IF NOT EXISTS fiscal_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_note_id UUID,
  product_id UUID,
  numero_item INTEGER NOT NULL,
  codigo_produto VARCHAR(50),
  ean VARCHAR(14),
  descricao VARCHAR(255) NOT NULL,
  ncm VARCHAR(10) NOT NULL,
  cest VARCHAR(10),
  cfop VARCHAR(10) NOT NULL,
  origem VARCHAR(1) NOT NULL,
  unidade_comercial VARCHAR(10) DEFAULT 'UN',
  quantidade_comercial DECIMAL(10,4) NOT NULL,
  valor_unitario_comercial DECIMAL(10,4) NOT NULL,
  valor_total_bruto DECIMAL(10,2) NOT NULL,
  unidade_tributavel VARCHAR(10) DEFAULT 'UN',
  quantidade_tributavel DECIMAL(10,4) NOT NULL,
  valor_unitario_tributavel DECIMAL(10,4) NOT NULL,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  valor_frete DECIMAL(10,2) DEFAULT 0,
  valor_seguro DECIMAL(10,2) DEFAULT 0,
  valor_outras_despesas DECIMAL(10,2) DEFAULT 0,
  cst_icms VARCHAR(10),
  csosn VARCHAR(10),
  modalidade_bc_icms VARCHAR(1),
  base_calculo_icms DECIMAL(10,2) DEFAULT 0,
  aliquota_icms DECIMAL(5,2) DEFAULT 0,
  valor_icms DECIMAL(10,2) DEFAULT 0,
  base_calculo_icms_st DECIMAL(10,2) DEFAULT 0,
  aliquota_icms_st DECIMAL(5,2) DEFAULT 0,
  valor_icms_st DECIMAL(10,2) DEFAULT 0,
  cst_pis VARCHAR(10),
  base_calculo_pis DECIMAL(10,2) DEFAULT 0,
  aliquota_pis DECIMAL(5,2) DEFAULT 0,
  valor_pis DECIMAL(10,2) DEFAULT 0,
  cst_cofins VARCHAR(10),
  base_calculo_cofins DECIMAL(10,2) DEFAULT 0,
  aliquota_cofins DECIMAL(5,2) DEFAULT 0,
  valor_cofins DECIMAL(10,2) DEFAULT 0,
  cst_ipi VARCHAR(10),
  base_calculo_ipi DECIMAL(10,2) DEFAULT 0,
  aliquota_ipi DECIMAL(5,2) DEFAULT 0,
  valor_ipi DECIMAL(10,2) DEFAULT 0,
  informacoes_adicionais TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_note_items_note ON fiscal_note_items(fiscal_note_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_note_items_product ON fiscal_note_items(product_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_note_items_ncm ON fiscal_note_items(ncm);

-- =====================================================
-- SEÇÃO 6: CRIAR TABELA fiscal_note_inutilizations
-- =====================================================

CREATE TABLE IF NOT EXISTS fiscal_note_inutilizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  serie VARCHAR(10) NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('nfce', 'nfe')) NOT NULL,
  numero_inicial INTEGER NOT NULL,
  numero_final INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  justificativa TEXT NOT NULL,
  status VARCHAR(50) CHECK (status IN ('pendente', 'processando', 'inutilizada', 'rejeitada')) DEFAULT 'pendente',
  protocolo VARCHAR(50),
  xml_envio TEXT,
  xml_retorno TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_inutilizations_company ON fiscal_note_inutilizations(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_inutilizations_serie ON fiscal_note_inutilizations(serie, tipo);

-- =====================================================
-- SEÇÃO 7: CRIAR FUNÇÕES
-- =====================================================

-- Função para obter próximo número de nota
CREATE OR REPLACE FUNCTION fn_get_next_fiscal_note_number(
  p_company_id UUID,
  p_tipo VARCHAR(10)
) RETURNS INTEGER AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  IF p_tipo = 'nfce' THEN
    UPDATE company_fiscal_settings
    SET ultimo_numero_nfce = ultimo_numero_nfce + 1,
        updated_at = NOW()
    WHERE company_id = p_company_id OR id = p_company_id
    RETURNING ultimo_numero_nfce INTO v_next_number;
  ELSIF p_tipo = 'nfe' THEN
    UPDATE company_fiscal_settings
    SET ultimo_numero_nfe = ultimo_numero_nfe + 1,
        updated_at = NOW()
    WHERE company_id = p_company_id OR id = p_company_id
    RETURNING ultimo_numero_nfe INTO v_next_number;
  END IF;
  
  RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;

-- Função de cálculo de impostos
CREATE OR REPLACE FUNCTION fn_calculate_taxes_for_sale(
  p_sale_id UUID
) RETURNS TABLE (
  total_produtos DECIMAL(10,2),
  total_icms DECIMAL(10,2),
  total_pis DECIMAL(10,2),
  total_cofins DECIMAL(10,2),
  total_ipi DECIMAL(10,2),
  total_impostos DECIMAL(10,2)
) AS $$
DECLARE
  v_total_produtos DECIMAL(10,2) := 0;
  v_total_icms DECIMAL(10,2) := 0;
  v_total_pis DECIMAL(10,2) := 0;
  v_total_cofins DECIMAL(10,2) := 0;
  v_total_ipi DECIMAL(10,2) := 0;
  v_regime_tributario VARCHAR(50);
BEGIN
  SELECT cfs.regime_tributario INTO v_regime_tributario
  FROM company_fiscal_settings cfs
  WHERE cfs.is_active = true
  LIMIT 1;
  
  IF v_regime_tributario IS NULL THEN
    v_regime_tributario := 'simples_nacional';
  END IF;
  
  SELECT 
    COALESCE(SUM(si.quantity * si.unit_price), 0),
    COALESCE(SUM(
      CASE 
        WHEN v_regime_tributario != 'simples_nacional' 
        THEN si.quantity * si.unit_price * (COALESCE(p.icms_aliquota, 0) / 100)
        ELSE 0
      END
    ), 0),
    COALESCE(SUM(
      CASE 
        WHEN v_regime_tributario != 'simples_nacional' 
        THEN si.quantity * si.unit_price * (COALESCE(p.pis_aliquota, 0) / 100)
        ELSE 0
      END
    ), 0),
    COALESCE(SUM(
      CASE 
        WHEN v_regime_tributario != 'simples_nacional' 
        THEN si.quantity * si.unit_price * (COALESCE(p.cofins_aliquota, 0) / 100)
        ELSE 0
      END
    ), 0),
    COALESCE(SUM(si.quantity * si.unit_price * (COALESCE(p.ipi_aliquota, 0) / 100)), 0)
  INTO v_total_produtos, v_total_icms, v_total_pis, v_total_cofins, v_total_ipi
  FROM sale_items si
  JOIN products p ON si.product_id = p.id
  WHERE si.sale_id = p_sale_id;
  
  RETURN QUERY 
  SELECT 
    ROUND(v_total_produtos, 2),
    ROUND(v_total_icms, 2),
    ROUND(v_total_pis, 2),
    ROUND(v_total_cofins, 2),
    ROUND(v_total_ipi, 2),
    ROUND(v_total_icms + v_total_pis + v_total_cofins + v_total_ipi, 2);
END;
$$ LANGUAGE plpgsql;

-- Função para gerar chave de acesso
CREATE OR REPLACE FUNCTION fn_generate_fiscal_note_key(
  p_uf VARCHAR(2),
  p_ano_mes VARCHAR(4),
  p_cnpj VARCHAR(14),
  p_modelo VARCHAR(2),
  p_serie VARCHAR(3),
  p_numero VARCHAR(9),
  p_tipo_emissao VARCHAR(1) DEFAULT '1',
  p_codigo_numerico VARCHAR(8) DEFAULT NULL
) RETURNS VARCHAR(44) AS $$
DECLARE
  v_chave VARCHAR(43);
  v_codigo_numerico VARCHAR(8);
  v_digito_verificador INTEGER;
  v_soma INTEGER := 0;
  v_peso INTEGER := 2;
  v_i INTEGER;
BEGIN
  IF p_codigo_numerico IS NULL THEN
    v_codigo_numerico := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
  ELSE
    v_codigo_numerico := p_codigo_numerico;
  END IF;
  
  v_chave := p_uf || p_ano_mes || p_cnpj || p_modelo || 
             LPAD(p_serie, 3, '0') || LPAD(p_numero, 9, '0') || 
             p_tipo_emissao || v_codigo_numerico;
  
  FOR v_i IN 1..LENGTH(v_chave) LOOP
    v_soma := v_soma + (SUBSTRING(v_chave, v_i, 1)::INTEGER * v_peso);
    v_peso := v_peso + 1;
    IF v_peso > 9 THEN
      v_peso := 2;
    END IF;
  END LOOP;
  
  v_digito_verificador := 11 - (v_soma % 11);
  IF v_digito_verificador >= 10 THEN
    v_digito_verificador := 0;
  END IF;
  
  RETURN v_chave || v_digito_verificador::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEÇÃO 8: VERIFICAÇÃO FINAL
-- =====================================================

-- Execute esta query para verificar se tudo foi criado:
SELECT 
  'Tabelas' as tipo,
  COUNT(*) as quantidade
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'company_fiscal_settings',
  'fiscal_notes',
  'fiscal_note_items',
  'fiscal_note_inutilizations'
)
UNION ALL
SELECT 
  'Funções' as tipo,
  COUNT(*) as quantidade
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'fn_get_next_fiscal_note_number',
  'fn_calculate_taxes_for_sale',
  'fn_generate_fiscal_note_key'
);

-- Resultado esperado:
-- Tabelas: 4
-- Funções: 3

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
