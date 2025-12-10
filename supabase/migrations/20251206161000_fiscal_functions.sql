-- =====================================================
-- MÓDULO FISCAL - Funções de Cálculo de Impostos
-- Criado em: 06/12/2025
-- Objetivo: Calcular impostos automaticamente para notas fiscais
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO DE CÁLCULO DE ICMS
-- =====================================================

CREATE OR REPLACE FUNCTION fn_calculate_icms(
  p_valor_produto DECIMAL(10,2),
  p_aliquota DECIMAL(5,2),
  p_regime_tributario VARCHAR(50) DEFAULT 'simples_nacional'
) RETURNS TABLE (
  base_calculo DECIMAL(10,2),
  valor_icms DECIMAL(10,2)
) AS $$
BEGIN
  -- Para Simples Nacional, ICMS geralmente não é destacado
  IF p_regime_tributario = 'simples_nacional' THEN
    RETURN QUERY
    SELECT 
      0.00 AS base_calculo,
      0.00 AS valor_icms;
  ELSE
    -- Para regime normal, calcular ICMS
    RETURN QUERY
    SELECT 
      p_valor_produto AS base_calculo,
      ROUND(p_valor_produto * (p_aliquota / 100), 2) AS valor_icms;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_calculate_icms IS 'Calcula ICMS baseado no valor do produto e alíquota';

-- =====================================================
-- 2. FUNÇÃO DE CÁLCULO DE PIS/COFINS
-- =====================================================

CREATE OR REPLACE FUNCTION fn_calculate_pis_cofins(
  p_valor_produto DECIMAL(10,2),
  p_aliquota_pis DECIMAL(5,2),
  p_aliquota_cofins DECIMAL(5,2),
  p_regime_tributario VARCHAR(50) DEFAULT 'simples_nacional'
) RETURNS TABLE (
  base_pis DECIMAL(10,2),
  valor_pis DECIMAL(10,2),
  base_cofins DECIMAL(10,2),
  valor_cofins DECIMAL(10,2)
) AS $$
BEGIN
  -- Para Simples Nacional, PIS/COFINS não são destacados
  IF p_regime_tributario = 'simples_nacional' THEN
    RETURN QUERY
    SELECT 
      0.00 AS base_pis,
      0.00 AS valor_pis,
      0.00 AS base_cofins,
      0.00 AS valor_cofins;
  ELSE
    -- Para regime normal, calcular PIS/COFINS
    RETURN QUERY
    SELECT 
      p_valor_produto AS base_pis,
      ROUND(p_valor_produto * (p_aliquota_pis / 100), 2) AS valor_pis,
      p_valor_produto AS base_cofins,
      ROUND(p_valor_produto * (p_aliquota_cofins / 100), 2) AS valor_cofins;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_calculate_pis_cofins IS 'Calcula PIS e COFINS baseado no valor do produto e alíquotas';

-- =====================================================
-- 3. FUNÇÃO DE CÁLCULO DE IPI
-- =====================================================

CREATE OR REPLACE FUNCTION fn_calculate_ipi(
  p_valor_produto DECIMAL(10,2),
  p_aliquota DECIMAL(5,2)
) RETURNS TABLE (
  base_calculo DECIMAL(10,2),
  valor_ipi DECIMAL(10,2)
) AS $$
BEGIN
  -- IPI é calculado sobre o valor do produto
  RETURN QUERY
  SELECT 
    p_valor_produto AS base_calculo,
    ROUND(p_valor_produto * (p_aliquota / 100), 2) AS valor_ipi;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_calculate_ipi IS 'Calcula IPI baseado no valor do produto e alíquota';

-- =====================================================
-- 4. FUNÇÃO DE CÁLCULO COMPLETO DE IMPOSTOS PARA VENDA
-- =====================================================

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
  -- Buscar regime tributário da empresa
  SELECT cfs.regime_tributario INTO v_regime_tributario
  FROM sales s
  JOIN company_fiscal_settings cfs ON cfs.is_active = true
  WHERE s.id = p_sale_id
  LIMIT 1;
  
  -- Se não encontrou, usar Simples Nacional como padrão
  IF v_regime_tributario IS NULL THEN
    v_regime_tributario := 'simples_nacional';
  END IF;
  
  -- Calcular totais por item
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
  
  -- Retornar totais
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

COMMENT ON FUNCTION fn_calculate_taxes_for_sale IS 'Calcula todos os impostos de uma venda baseado nos produtos e regime tributário';

-- =====================================================
-- 5. FUNÇÃO PARA GERAR CHAVE DE ACESSO DA NOTA FISCAL
-- =====================================================

CREATE OR REPLACE FUNCTION fn_generate_fiscal_note_key(
  p_uf VARCHAR(2),
  p_ano_mes VARCHAR(4), -- AAMM
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
  -- Gerar código numérico aleatório se não fornecido
  IF p_codigo_numerico IS NULL THEN
    v_codigo_numerico := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
  ELSE
    v_codigo_numerico := p_codigo_numerico;
  END IF;
  
  -- Montar chave sem dígito verificador
  v_chave := p_uf || p_ano_mes || p_cnpj || p_modelo || 
             LPAD(p_serie, 3, '0') || LPAD(p_numero, 9, '0') || 
             p_tipo_emissao || v_codigo_numerico;
  
  -- Calcular dígito verificador (módulo 11)
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
  
  -- Retornar chave completa
  RETURN v_chave || v_digito_verificador::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generate_fiscal_note_key IS 'Gera chave de acesso de 44 dígitos para nota fiscal eletrônica';

-- =====================================================
-- 6. FUNÇÃO PARA VALIDAR CHAVE DE ACESSO
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validate_fiscal_note_key(
  p_chave VARCHAR(44)
) RETURNS BOOLEAN AS $$
DECLARE
  v_chave_sem_dv VARCHAR(43);
  v_dv_informado INTEGER;
  v_dv_calculado INTEGER;
  v_soma INTEGER := 0;
  v_peso INTEGER := 2;
  v_i INTEGER;
BEGIN
  -- Verificar tamanho
  IF LENGTH(p_chave) != 44 THEN
    RETURN FALSE;
  END IF;
  
  -- Separar chave e dígito verificador
  v_chave_sem_dv := SUBSTRING(p_chave, 1, 43);
  v_dv_informado := SUBSTRING(p_chave, 44, 1)::INTEGER;
  
  -- Calcular dígito verificador
  FOR v_i IN 1..LENGTH(v_chave_sem_dv) LOOP
    v_soma := v_soma + (SUBSTRING(v_chave_sem_dv, v_i, 1)::INTEGER * v_peso);
    v_peso := v_peso + 1;
    IF v_peso > 9 THEN
      v_peso := 2;
    END IF;
  END LOOP;
  
  v_dv_calculado := 11 - (v_soma % 11);
  IF v_dv_calculado >= 10 THEN
    v_dv_calculado := 0;
  END IF;
  
  -- Comparar
  RETURN v_dv_calculado = v_dv_informado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_validate_fiscal_note_key IS 'Valida chave de acesso de nota fiscal verificando o dígito verificador';

-- =====================================================
-- 7. FUNÇÃO PARA GERAR DADOS DO QR CODE (NFC-e)
-- =====================================================

CREATE OR REPLACE FUNCTION fn_generate_nfce_qrcode_data(
  p_chave_acesso VARCHAR(44),
  p_ambiente VARCHAR(20),
  p_id_csc INTEGER,
  p_csc VARCHAR(100)
) RETURNS TEXT AS $$
DECLARE
  v_url_base TEXT;
  v_hash TEXT;
  v_dados_qrcode TEXT;
BEGIN
  -- URL base conforme ambiente (exemplo para SP)
  IF p_ambiente = 'producao' THEN
    v_url_base := 'https://www.fazenda.sp.gov.br/nfce/qrcode';
  ELSE
    v_url_base := 'https://www.homologacao.fazenda.sp.gov.br/nfce/qrcode';
  END IF;
  
  -- Gerar hash SHA-1 (simplificado - em produção usar extensão pgcrypto)
  -- v_hash := encode(digest(p_chave_acesso || p_csc, 'sha1'), 'hex');
  v_hash := 'HASH_PLACEHOLDER'; -- Substituir por hash real
  
  -- Montar dados do QR Code
  v_dados_qrcode := v_url_base || '?p=' || p_chave_acesso || 
                    '|2|' || p_ambiente || '|' || p_id_csc || '|' || v_hash;
  
  RETURN v_dados_qrcode;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generate_nfce_qrcode_data IS 'Gera dados para QR Code de NFC-e';

-- =====================================================
-- 8. VIEW PARA RELATÓRIO FISCAL
-- =====================================================

CREATE OR REPLACE VIEW vw_fiscal_report AS
SELECT 
  fn.id,
  fn.numero,
  fn.serie,
  fn.tipo,
  fn.chave_acesso,
  fn.data_emissao,
  fn.status,
  c.name as cliente_nome,
  c.cpf_cnpj as cliente_documento,
  fn.valor_produtos,
  fn.valor_desconto,
  fn.valor_total,
  fn.valor_icms,
  fn.valor_pis,
  fn.valor_cofins,
  fn.valor_ipi,
  fn.protocolo,
  u.full_name as emitido_por,
  s.sale_number as numero_venda
FROM fiscal_notes fn
LEFT JOIN clients c ON fn.client_id = c.id
LEFT JOIN auth.users u ON fn.created_by = u.id
LEFT JOIN sales s ON fn.sale_id = s.id
ORDER BY fn.data_emissao DESC;

COMMENT ON VIEW vw_fiscal_report IS 'View para relatórios fiscais com informações consolidadas';

-- =====================================================
-- 9. VIEW PARA TOTAIS FISCAIS POR PERÍODO
-- =====================================================

CREATE OR REPLACE VIEW vw_fiscal_totals_by_period AS
SELECT 
  DATE_TRUNC('month', data_emissao) as periodo,
  tipo,
  COUNT(*) as quantidade_notas,
  SUM(valor_produtos) as total_produtos,
  SUM(valor_desconto) as total_descontos,
  SUM(valor_total) as total_geral,
  SUM(valor_icms) as total_icms,
  SUM(valor_pis) as total_pis,
  SUM(valor_cofins) as total_cofins,
  SUM(valor_ipi) as total_ipi,
  COUNT(*) FILTER (WHERE status = 'autorizada') as notas_autorizadas,
  COUNT(*) FILTER (WHERE status = 'cancelada') as notas_canceladas
FROM fiscal_notes
WHERE status IN ('autorizada', 'cancelada')
GROUP BY DATE_TRUNC('month', data_emissao), tipo
ORDER BY periodo DESC, tipo;

COMMENT ON VIEW vw_fiscal_totals_by_period IS 'Totais fiscais agrupados por período e tipo de nota';

-- =====================================================
-- FIM DAS FUNÇÕES
-- =====================================================
