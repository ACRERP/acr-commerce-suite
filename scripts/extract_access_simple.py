"""
Script simplificado para extrair dados do Access SMB
Foca apenas na extração de dados, sem gerar schemas
"""

import pyodbc
import pandas as pd
import os
from pathlib import Path

ACCESS_DB_PATH = r"C:\smb"
OUTPUT_DIR = r"C:\Users\Alisson Cruz\Desktop\ACRERP\acr-commerce-suite\extracted_data"

def find_access_files(directory):
    """Encontra arquivos Access"""
    access_files = []
    for ext in ['*.mdb', '*.accdb']:
        access_files.extend(Path(directory).glob(ext))
    return access_files

def connect_to_access(db_path):
    """Conecta ao Access"""
    try:
        conn_str = (
            r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};'
            f'DBQ={db_path};'
        )
        return pyodbc.connect(conn_str)
    except Exception as e:
        print(f"Erro: {e}")
        return None

def get_table_names(conn):
    """Lista tabelas"""
    cursor = conn.cursor()
    tables = []
    for table_info in cursor.tables(tableType='TABLE'):
        table_name = table_info.table_name
        if not table_name.startswith('MSys') and not table_name.startswith('USys'):
            tables.append(table_name)
    return tables

def export_table_to_csv(conn, table_name, output_dir):
    """Exporta tabela para CSV"""
    try:
        query = f"SELECT * FROM [{table_name}]"
        df = pd.read_sql(query, conn)
        
        os.makedirs(output_dir, exist_ok=True)
        
        csv_path = os.path.join(output_dir, f"{table_name}.csv")
        df.to_csv(csv_path, index=False, encoding='utf-8-sig')
        
        print(f"✅ {table_name}: {len(df)} registros, {len(df.columns)} colunas")
        return len(df), list(df.columns)
    except Exception as e:
        print(f"❌ Erro em {table_name}: {e}")
        return 0, []

def main():
    print("🔍 Procurando SMB v4.0a.accdb...")
    
    db_file = Path(r"C:\smb\SMB v4.0a.accdb")
    
    if not db_file.exists():
        print("❌ Arquivo não encontrado!")
        return
    
    print(f"📂 Conectando ao banco...")
    conn = connect_to_access(str(db_file))
    if not conn:
        return
    
    tables = get_table_names(conn)
    print(f"\n📊 Encontradas {len(tables)} tabelas\n")
    
    db_output_dir = os.path.join(OUTPUT_DIR, "SMB_v4")
    os.makedirs(db_output_dir, exist_ok=True)
    
    # Estatísticas
    total_records = 0
    table_stats = []
    
    print("📤 Exportando tabelas...\n")
    for table in sorted(tables):
        count, columns = export_table_to_csv(conn, table, db_output_dir)
        total_records += count
        if count > 0:
            table_stats.append({
                'table': table,
                'records': count,
                'columns': len(columns),
                'column_names': columns
            })
    
    # Salvar resumo
    summary_file = os.path.join(db_output_dir, "RESUMO.txt")
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("="*60 + "\n")
        f.write("RESUMO DA EXTRAÇÃO - SMB v4.0a\n")
        f.write("="*60 + "\n\n")
        f.write(f"Total de Tabelas: {len(table_stats)}\n")
        f.write(f"Total de Registros: {total_records}\n\n")
        f.write("="*60 + "\n")
        f.write("TABELAS POR TAMANHO:\n")
        f.write("="*60 + "\n\n")
        
        for stat in sorted(table_stats, key=lambda x: x['records'], reverse=True):
            f.write(f"{stat['table']}\n")
            f.write(f"  Registros: {stat['records']}\n")
            f.write(f"  Colunas: {stat['columns']}\n")
            f.write(f"  Campos: {', '.join(stat['column_names'][:10])}")
            if len(stat['column_names']) > 10:
                f.write(f" ... (+{len(stat['column_names'])-10} campos)")
            f.write("\n\n")
    
    conn.close()
    
    print(f"\n{'='*60}")
    print("🎉 Extração concluída!")
    print(f"📁 Dados salvos em: {db_output_dir}")
    print(f"📊 Total: {len(table_stats)} tabelas, {total_records} registros")
    print(f"📄 Resumo salvo em: RESUMO.txt")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
