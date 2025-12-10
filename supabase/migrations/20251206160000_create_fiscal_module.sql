-- =====================================================
-- MÓDULO FISCAL - Estrutura de Dados
-- Criado em: 06/12/2025
-- Objetivo: Permitir emissão de NFC-e, NF-e e controle fiscal
-- =====================================================

-- =====================================================
-- 1. CONFIGURAÇÕES FISCAIS DA EMPRESA
-- =====================================================

CREATE TABLE IF NOT EXISTS company_fiscal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados da empresa
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18) NOT NULL,
  inscricao_estadual VARCHAR(20),
  inscricao_municipal VARCHAR(20),
  
  -- Regime tributário
  regime_tributario VARCHAR(50) CHECK (regime_tributario IN ('simples_nacional', 'lucro_presumido', 'lucro_real')) DEFAULT 'simples_nacional',
  
  -- Certificado digital
  certificado_a1 BYTEA, -- Arquivo .pfx do certificado
  certificado_senha VARCHAR(255), -- Senha criptografada
  certificado_validade DATE,
  
  -- Configurações NFC-e
  serie_nfce VARCHAR(10) DEFAULT '1',
  ultimo_numero_nfce INTEGER DEFAULT 0,
  csc_nfce VARCHAR(100), -- Token CSC para NFC-e
  id_csc_nfce INTEGER DEFAULT 1,
  
  -- Configurações NF-e
  serie_nfe VARCHAR(10) DEFAULT '1',
  ultimo_numero_nfe INTEGER DEFAULT 0,
  
  -- Ambiente
  ambiente VARCHAR(20) CHECK (ambiente IN ('producao', 'homologacao')) DEFAULT 'homologacao',
  
  -- Endereço fiscal
  logradouro VARCHAR(255),
  numero VARCHAR(10),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  uf VARCHAR(2),
  cep VARCHAR(9),
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Garantir apenas uma configuração ativa por empresa
  UNIQUE(company_id, is_active)
);

-- Índices
CREATE INDEX idx_company_fiscal_settings_company ON company_fiscal_settings(company_id);
CREATE INDEX idx_company_fiscal_settings_cnpj ON company_fiscal_settings(cnpj);

-- Comentários
COMMENT ON TABLE company_fiscal_settings IS 'Configurações fiscais da empresa para emissão de notas fiscais';
COMMENT ON COLUMN company_fiscal_settings.certificado_a1 IS 'Arquivo binário do certificado digital A1 (.pfx)';
COMMENT ON COLUMN company_fiscal_settings.csc_nfce IS 'Código de Segurança do Contribuinte para NFC-e';

-- =====================================================
-- 2. EXPANDIR PRODUTOS COM CAMPOS FISCAIS
-- =====================================================

-- Adicionar campos fiscais na tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS ncm VARCHAR(10),
ADD COLUMN IF NOT EXISTS cfop_padrao VARCHAR(10) DEFAULT '5102',
ADD COLUMN IF NOT EXISTS cst VARCHAR(10),
ADD COLUMN IF NOT EXISTS csosn VARCHAR(10),
ADD COLUMN IF NOT EXISTS origem VARCHAR(1) CHECK (origem IN ('0', '1', '2', '3', '4', '5', '6', '7', '8')) DEFAULT '0',
ADD COLUMN IF NOT EXISTS icms_aliquota DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pis_aliquota DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cofins_aliquota DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ipi_aliquota DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cest VARCHAR(10),
ADD COLUMN IF NOT EXISTS unidade_tributavel VARCHAR(10) DEFAULT 'UN';

-- Índice para NCM (usado em relatórios fiscais)
CREATE INDEX IF NOT EXISTS idx_products_ncm ON products(ncm);

-- Comentários
COMMENT ON COLUMN products.ncm IS 'Nomenclatura Comum do Mercosul - código de 8 dígitos';
COMMENT ON COLUMN products.cfop_padrao IS 'Código Fiscal de Operações e Prestações padrão';
COMMENT ON COLUMN products.cst IS 'Código de Situação Tributária (regime normal)';
COMMENT ON COLUMN products.csosn IS 'Código de Situação da Operação no Simples Nacional';
COMMENT ON COLUMN products.origem IS 'Origem da mercadoria (0=Nacional, 1=Estrangeira-Importação direta, etc)';
COMMENT ON COLUMN products.cest IS 'Código Especificador da Substituição Tributária';

-- =====================================================
-- 3. NOTAS FISCAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS fiscal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação da nota
  numero INTEGER NOT NULL,
  serie VARCHAR(10) NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('nfce', 'nfe', 'nfse')) NOT NULL,
  modelo VARCHAR(5) DEFAULT '65', -- 55=NF-e, 65=NFC-e
  chave_acesso VARCHAR(44) UNIQUE,
  
  -- Relacionamentos
  sale_id UUID REFERENCES sales(id),
  service_order_id UUID REFERENCES service_orders(id),
  client_id UUID REFERENCES clients(id),
  company_id UUID REFERENCES companies(id),
  
  -- Valores
  valor_produtos DECIMAL(10,2) NOT NULL,
  valor_frete DECIMAL(10,2) DEFAULT 0,
  valor_seguro DECIMAL(10,2) DEFAULT 0,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  valor_outras_despesas DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL,
  
  -- Impostos
  base_calculo_icms DECIMAL(10,2) DEFAULT 0,
  valor_icms DECIMAL(10,2) DEFAULT 0,
  base_calculo_icms_st DECIMAL(10,2) DEFAULT 0,
  valor_icms_st DECIMAL(10,2) DEFAULT 0,
  valor_pis DECIMAL(10,2) DEFAULT 0,
  valor_cofins DECIMAL(10,2) DEFAULT 0,
  valor_ipi DECIMAL(10,2) DEFAULT 0,
  
  -- Status e controle
  status VARCHAR(50) CHECK (status IN ('pendente', 'processando', 'autorizada', 'cancelada', 'denegada', 'rejeitada', 'inutilizada')) DEFAULT 'pendente',
  protocolo VARCHAR(50),
  motivo_status TEXT,
  
  -- XMLs e documentos
  xml_envio TEXT,
  xml_retorno TEXT,
  xml_autorizado TEXT,
  pdf_url TEXT,
  danfe_url TEXT,
  
  -- Cancelamento
  motivo_cancelamento TEXT,
  protocolo_cancelamento VARCHAR(50),
  data_cancelamento TIMESTAMP,
  
  -- QR Code (NFC-e)
  qr_code TEXT,
  url_consulta TEXT,
  
  -- Datas
  data_emissao TIMESTAMP DEFAULT NOW(),
  data_autorizacao TIMESTAMP,
  data_saida TIMESTAMP,
  
  -- Informações adicionais
  informacoes_complementares TEXT,
  informacoes_fisco TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Garantir unicidade de número por série e tipo
  UNIQUE(numero, serie, tipo, company_id)
);

-- Índices
CREATE INDEX idx_fiscal_notes_chave ON fiscal_notes(chave_acesso);
CREATE INDEX idx_fiscal_notes_sale ON fiscal_notes(sale_id);
CREATE INDEX idx_fiscal_notes_client ON fiscal_notes(client_id);
CREATE INDEX idx_fiscal_notes_status ON fiscal_notes(status);
CREATE INDEX idx_fiscal_notes_data_emissao ON fiscal_notes(data_emissao);
CREATE INDEX idx_fiscal_notes_tipo ON fiscal_notes(tipo);

-- Comentários
COMMENT ON TABLE fiscal_notes IS 'Registro de todas as notas fiscais emitidas (NFC-e, NF-e, NFS-e)';
COMMENT ON COLUMN fiscal_notes.chave_acesso IS 'Chave de acesso de 44 dígitos da nota fiscal';
COMMENT ON COLUMN fiscal_notes.qr_code IS 'Dados do QR Code para NFC-e';

-- =====================================================
-- 4. ITENS DAS NOTAS FISCAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS fiscal_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_note_id UUID REFERENCES fiscal_notes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  -- Identificação do item
  numero_item INTEGER NOT NULL,
  codigo_produto VARCHAR(50),
  ean VARCHAR(14),
  descricao VARCHAR(255) NOT NULL,
  
  -- Classificação fiscal
  ncm VARCHAR(10) NOT NULL,
  cest VARCHAR(10),
  cfop VARCHAR(10) NOT NULL,
  origem VARCHAR(1) NOT NULL,
  
  -- Quantidades e valores
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
  
  -- ICMS
  cst_icms VARCHAR(10),
  csosn VARCHAR(10),
  modalidade_bc_icms VARCHAR(1),
  base_calculo_icms DECIMAL(10,2) DEFAULT 0,
  aliquota_icms DECIMAL(5,2) DEFAULT 0,
  valor_icms DECIMAL(10,2) DEFAULT 0,
  
  -- ICMS ST
  base_calculo_icms_st DECIMAL(10,2) DEFAULT 0,
  aliquota_icms_st DECIMAL(5,2) DEFAULT 0,
  valor_icms_st DECIMAL(10,2) DEFAULT 0,
  
  -- PIS
  cst_pis VARCHAR(10),
  base_calculo_pis DECIMAL(10,2) DEFAULT 0,
  aliquota_pis DECIMAL(5,2) DEFAULT 0,
  valor_pis DECIMAL(10,2) DEFAULT 0,
  
  -- COFINS
  cst_cofins VARCHAR(10),
  base_calculo_cofins DECIMAL(10,2) DEFAULT 0,
  aliquota_cofins DECIMAL(5,2) DEFAULT 0,
  valor_cofins DECIMAL(10,2) DEFAULT 0,
  
  -- IPI
  cst_ipi VARCHAR(10),
  base_calculo_ipi DECIMAL(10,2) DEFAULT 0,
  aliquota_ipi DECIMAL(5,2) DEFAULT 0,
  valor_ipi DECIMAL(10,2) DEFAULT 0,
  
  -- Informações adicionais
  informacoes_adicionais TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Garantir ordem dos itens
  UNIQUE(fiscal_note_id, numero_item)
);

-- Índices
CREATE INDEX idx_fiscal_note_items_note ON fiscal_note_items(fiscal_note_id);
CREATE INDEX idx_fiscal_note_items_product ON fiscal_note_items(product_id);
CREATE INDEX idx_fiscal_note_items_ncm ON fiscal_note_items(ncm);

-- Comentários
COMMENT ON TABLE fiscal_note_items IS 'Itens das notas fiscais com detalhamento de impostos';

-- =====================================================
-- 5. HISTÓRICO DE INUTILIZAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS fiscal_note_inutilizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  -- Identificação
  serie VARCHAR(10) NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('nfce', 'nfe')) NOT NULL,
  numero_inicial INTEGER NOT NULL,
  numero_final INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  
  -- Justificativa
  justificativa TEXT NOT NULL,
  
  -- Retorno SEFAZ
  status VARCHAR(50) CHECK (status IN ('pendente', 'processando', 'inutilizada', 'rejeitada')) DEFAULT 'pendente',
  protocolo VARCHAR(50),
  xml_envio TEXT,
  xml_retorno TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(company_id, serie, tipo, numero_inicial, numero_final, ano)
);

-- Índices
CREATE INDEX idx_fiscal_inutilizations_company ON fiscal_note_inutilizations(company_id);
CREATE INDEX idx_fiscal_inutilizations_serie ON fiscal_note_inutilizations(serie, tipo);

-- Comentários
COMMENT ON TABLE fiscal_note_inutilizations IS 'Registro de inutilização de numeração de notas fiscais';

-- =====================================================
-- 6. FUNÇÕES AUXILIARES
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
    WHERE company_id = p_company_id
    RETURNING ultimo_numero_nfce INTO v_next_number;
  ELSIF p_tipo = 'nfe' THEN
    UPDATE company_fiscal_settings
    SET ultimo_numero_nfe = ultimo_numero_nfe + 1,
        updated_at = NOW()
    WHERE company_id = p_company_id
    RETURNING ultimo_numero_nfe INTO v_next_number;
  END IF;
  
  RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;

-- Comentário
COMMENT ON FUNCTION fn_get_next_fiscal_note_number IS 'Obtém e incrementa o próximo número de nota fiscal';

-- =====================================================
-- 7. TRIGGER PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION fn_update_fiscal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_fiscal_settings_updated
BEFORE UPDATE ON company_fiscal_settings
FOR EACH ROW
EXECUTE FUNCTION fn_update_fiscal_timestamp();

CREATE TRIGGER trg_fiscal_notes_updated
BEFORE UPDATE ON fiscal_notes
FOR EACH ROW
EXECUTE FUNCTION fn_update_fiscal_timestamp();

-- =====================================================
-- 8. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE company_fiscal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_note_inutilizations ENABLE ROW LEVEL SECURITY;

-- Políticas para company_fiscal_settings
CREATE POLICY "Usuários autenticados podem ver configurações fiscais"
ON company_fiscal_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem modificar configurações fiscais"
ON company_fiscal_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Políticas para fiscal_notes
CREATE POLICY "Usuários autenticados podem ver notas fiscais"
ON fiscal_notes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autorizados podem criar notas fiscais"
ON fiscal_notes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'manager', 'operator')
  )
);

CREATE POLICY "Apenas admins podem modificar notas fiscais"
ON fiscal_notes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Políticas para fiscal_note_items
CREATE POLICY "Usuários autenticados podem ver itens de notas fiscais"
ON fiscal_note_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autorizados podem criar itens de notas fiscais"
ON fiscal_note_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'manager', 'operator')
  )
);

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
