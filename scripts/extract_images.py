"""
Script para extrair imagens do Access e copiar para o projeto

Uso:
python extract_images.py
"""

import pyodbc
import os
from pathlib import Path

ACCESS_DB_PATH = r"C:\smb"  # Ajuste conforme necessário
OUTPUT_DIR = r"C:\Users\Alisson Cruz\Desktop\ACRERP\acr-commerce-suite\public\products"

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

def extract_images(conn, table_name, image_column, id_column):
    """Extrai imagens de uma tabela"""
    cursor = conn.cursor()
    
    try:
        query = f"SELECT [{id_column}], [{image_column}] FROM [{table_name}] WHERE [{image_column}] IS NOT NULL"
        cursor.execute(query)
        
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        count = 0
        for row in cursor.fetchall():
            record_id = row[0]
            image_data = row[1]
            
            if image_data:
                # Salvar imagem
                image_path = os.path.join(OUTPUT_DIR, f"product_{record_id}.jpg")
                with open(image_path, 'wb') as f:
                    f.write(image_data)
                count += 1
                print(f"✅ Extraída: product_{record_id}.jpg")
        
        print(f"\n🎉 Total de {count} imagens extraídas!")
        
    except Exception as e:
        print(f"❌ Erro ao extrair imagens: {e}")

def main():
    print("🔍 Procurando banco Access...")
    
    access_files = find_access_files(ACCESS_DB_PATH)
    
    if not access_files:
        print("❌ Nenhum arquivo encontrado!")
        return
    
    db_file = access_files[0]
    print(f"📂 Usando: {db_file.name}")
    
    conn = connect_to_access(str(db_file))
    if not conn:
        return
    
    # Ajuste os nomes conforme sua tabela
    TABLE_NAME = "produtos"  # Nome da tabela
    IMAGE_COLUMN = "foto"    # Nome da coluna com imagem
    ID_COLUMN = "id"         # Nome da coluna ID
    
    print(f"\n📸 Extraindo imagens da tabela '{TABLE_NAME}'...")
    extract_images(conn, TABLE_NAME, IMAGE_COLUMN, ID_COLUMN)
    
    conn.close()

if __name__ == "__main__":
    main()
