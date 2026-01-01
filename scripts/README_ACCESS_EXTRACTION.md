# 📦 Extração de Dados do Access

## Scripts Criados

1. **`extract_access.py`** - Extrai todas as tabelas para CSV
2. **`extract_images.py`** - Extrai imagens dos produtos

## Como Usar

### 1. Instalar Dependências
```bash
pip install pyodbc pandas sqlalchemy
```

### 2. Executar Extração de Dados
```bash
cd scripts
python extract_access.py
```

**Resultado:**
- Cria pasta `extracted_data/` com:
  - Arquivos CSV de cada tabela
  - `schema.sql` com estrutura PostgreSQL
  - `metadata.json` com informações

### 3. Executar Extração de Imagens
```bash
python extract_images.py
```

**Resultado:**
- Copia imagens para `public/products/`
- Nomeia como `product_1.jpg`, `product_2.jpg`, etc.

### 4. Ajustar Scripts

**No `extract_images.py`, ajuste:**
```python
TABLE_NAME = "produtos"  # Nome da sua tabela
IMAGE_COLUMN = "foto"    # Nome da coluna com imagem
ID_COLUMN = "id"         # Nome da coluna ID
```

## Próximos Passos

Após a extração:
1. Revisar os CSVs gerados
2. Importar para o Supabase
3. Atualizar referências de imagens

## Troubleshooting

**Erro: Driver não encontrado**
- Instale o Microsoft Access Database Engine:
  - https://www.microsoft.com/en-us/download/details.aspx?id=54920

**Erro: Arquivo bloqueado**
- Feche o Access antes de executar
- Execute como Administrador
