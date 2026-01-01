"""
Script para extrair dados de um banco Access (.mdb ou .accdb)
e converter para PostgreSQL/Supabase

Requisitos:
pip install pyodbc pandas sqlalchemy

Uso:
python extract_access.py
"""

import pyodbc
import pandas as pd
import os
import json
from pathlib import Path

# Configurações
ACCESS_DB_PATH = r"C:\smb"  # Ajuste o caminho do arquivo .mdb ou .accdb
OUTPUT_DIR = r"C:\Users\Alisson Cruz\Desktop\ACRERP\acr-commerce-suite\extracted_data"

def find_access_files(directory):
    """Encontra todos os arquivos Access no diretório"""
    access_files = []
    for ext in ['*.mdb', '*.accdb']:
        access_files.extend(Path(directory).glob(ext))
    return access_files

def connect_to_access(db_path):
    """Conecta ao banco Access"""
    try:
        # Driver para Access
        conn_str = (
            r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};'
            f'DBQ={db_path};'
        )
        conn = pyodbc.connect(conn_str)
        return conn
    except Exception as e:
        print(f"Erro ao conectar: {e}")
        return None

def get_table_names(conn):
    """Lista todas as tabelas do banco"""
    cursor = conn.cursor()
    tables = []
    for table_info in cursor.tables(tableType='TABLE'):
        table_name = table_info.table_name
        # Ignora tabelas do sistema
        if not table_name.startswith('MSys'):
            tables.append(table_name)
    return tables

def export_table_to_csv(conn, table_name, output_dir):
    """Exporta uma tabela para CSV"""
    try:
        query = f"SELECT * FROM [{table_name}]"
        df = pd.read_sql(query, conn)
        
        # Criar diretório se não existir
        os.makedirs(output_dir, exist_ok=True)
        
        # Salvar CSV
        csv_path = os.path.join(output_dir, f"{table_name}.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8-sig')
        
        print(f"✅ Exportado: {table_name} ({len(df)} registros)")
        return True
    except Exception as e:
        print(f"❌ Erro ao exportar {table_name}: {e}")
        return False

def generate_postgres_schema(conn, table_name):
    """Gera o schema PostgreSQL para a tabela"""
    cursor = conn.cursor()
    
    # Mapeamento de tipos Access -> PostgreSQL
    type_mapping = {
        'COUNTER': 'SERIAL',
        'INTEGER': 'INTEGER',
        'LONG': 'BIGINT',
        'SINGLE': 'REAL',
        'DOUBLE': 'DOUBLE PRECISION',
        'CURRENCY': 'NUMERIC(19,4)',
        'DATETIME': 'TIMESTAMP',
        'BIT': 'BOOLEAN',
        'BYTE': 'SMALLINT',
        'GUID': 'UUID',
        'BIGBINARY': 'BYTEA',
        'LONGBINARY': 'BYTEA',
        'VARBINARY': 'BYTEA',
        'LONGCHAR': 'TEXT',
        'VARCHAR': 'VARCHAR',
        'CHAR': 'CHAR'
    }
    
    columns = []
    for row in cursor.columns(table=table_name):
        col_name = row.column_name
        col_type = row.type_name.upper()
        col_size = row.column_size
        is_nullable = row.nullable
        
        # Mapear tipo
        pg_type = type_mapping.get(col_type, 'TEXT')
        
        # Adicionar tamanho para VARCHAR
        if col_type == 'VARCHAR' and col_size:
            pg_type = f"VARCHAR({col_size})"
        
        # Nullable
        nullable = "" if is_nullable else "NOT NULL"
        
        columns.append(f"  {col_name} {pg_type} {nullable}".strip())
    
    schema = f"CREATE TABLE {table_name} (\n"
    schema += ",\n".join(columns)
    schema += "\n);"
    
    return schema

def main():
    print("🔍 Procurando arquivos Access em C:\\smb...")
    
    access_files = find_access_files(ACCESS_DB_PATH)
    
    if not access_files:
        print("❌ Nenhum arquivo Access encontrado!")
        print(f"Procurei em: {ACCESS_DB_PATH}")
        return
    
    print(f"\n📁 Encontrados {len(access_files)} arquivo(s):")
    for i, file in enumerate(access_files, 1):
        print(f"  {i}. {file.name}")
    
    # Processar cada arquivo
    for db_file in access_files:
        print(f"\n{'='*60}")
        print(f"📂 Processando: {db_file.name}")
        print(f"{'='*60}")
        
        conn = connect_to_access(str(db_file))
        if not conn:
            continue
        
        # Listar tabelas
        tables = get_table_names(conn)
        print(f"\n📊 Encontradas {len(tables)} tabelas:")
        for table in tables:
            print(f"  - {table}")
        
        # Criar diretório de saída
        db_output_dir = os.path.join(OUTPUT_DIR, db_file.stem)
        os.makedirs(db_output_dir, exist_ok=True)
        
        # Exportar cada tabela
        print(f"\n📤 Exportando tabelas...")
        schemas = {}
        for table in tables:
            export_table_to_csv(conn, table, db_output_dir)
            schemas[table] = generate_postgres_schema(conn, table)
        
        # Salvar schemas SQL
        schema_file = os.path.join(db_output_dir, "schema.sql")
        with open(schema_file, 'w', encoding='utf-8') as f:
            f.write("-- Schema PostgreSQL gerado do Access\n\n")
            for table, schema in schemas.items():
                f.write(f"-- Tabela: {table}\n")
                f.write(schema)
                f.write("\n\n")
        
        print(f"\n✅ Schema salvo em: {schema_file}")
        
        # Salvar metadados
        metadata = {
            'source_file': str(db_file),
            'tables': tables,
            'export_date': pd.Timestamp.now().isoformat()
        }
        
        metadata_file = os.path.join(db_output_dir, "metadata.json")
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        
        conn.close()
        
        print(f"\n✅ Dados exportados para: {db_output_dir}")
    
    print(f"\n{'='*60}")
    print("🎉 Extração concluída!")
    print(f"📁 Dados salvos em: {OUTPUT_DIR}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
