import * as XLSX from 'xlsx';
import { ClientImportData, ImportColumnMapping, detectColumnMapping, mapRowToClientData } from './clientImportValidator';

export interface ParsedImportData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  format: 'csv' | 'excel' | 'json';
  preview: string[][];
}

export interface ParseResult {
  success: boolean;
  data?: ParsedImportData;
  error?: string;
}

export async function parseImportFile(file: File): Promise<ParseResult> {
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension) {
      return { success: false, error: 'Arquivo sem extensão' };
    }

    switch (extension) {
      case 'csv':
        return await parseCSV(file);
      case 'xlsx':
      case 'xls':
        return await parseExcel(file);
      case 'json':
        return await parseJSON(file);
      default:
        return { success: false, error: `Formato não suportado: ${extension}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar arquivo'
    };
  }
}

async function parseCSV(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return { success: false, error: 'Arquivo CSV deve ter pelo menos cabeçalho e uma linha de dados' };
    }

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => parseCSVLine(line));

    return {
      success: true,
      data: {
        headers,
        rows,
        totalRows: rows.length,
        format: 'csv',
        preview: rows.slice(0, 5)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar arquivo CSV'
    };
  }
}

async function parseExcel(file: File): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: 'Arquivo Excel não contém planilhas' };
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    
    if (jsonData.length < 2) {
      return { success: false, error: 'Arquivo Excel deve ter pelo menos cabeçalho e uma linha de dados' };
    }

    const headers = jsonData[0].filter(h => h && h.toString().trim());
    const rows = jsonData.slice(1)
      .filter(row => row && row.some(cell => cell && cell.toString().trim()))
      .map(row => row.map(cell => cell ? cell.toString() : ''));

    return {
      success: true,
      data: {
        headers,
        rows,
        totalRows: rows.length,
        format: 'excel',
        preview: rows.slice(0, 5)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar arquivo Excel'
    };
  }
}

async function parseJSON(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);

    if (!Array.isArray(jsonData)) {
      return { success: false, error: 'Arquivo JSON deve conter um array de objetos' };
    }

    if (jsonData.length === 0) {
      return { success: false, error: 'Arquivo JSON está vazio' };
    }

    // Get headers from first object keys
    const firstObject = jsonData[0];
    const headers = Object.keys(firstObject).filter(key => key && key.toString().trim());

    // Convert objects to rows
    const rows = jsonData.map(obj => 
      headers.map(header => obj[header] ? obj[header].toString() : '')
    );

    return {
      success: true,
      data: {
        headers,
        rows,
        totalRows: rows.length,
        format: 'json',
        preview: rows.slice(0, 5)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar arquivo JSON'
    };
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

export function processImportData(
  parsedData: ParsedImportData,
  customMapping?: ImportColumnMapping
): {
  clients: ClientImportData[];
  mapping: ImportColumnMapping;
  unmappedColumns: string[];
} {
  const mapping = customMapping || detectColumnMapping(parsedData.headers);
  const clients: ClientImportData[] = [];

  parsedData.rows.forEach(row => {
    const clientData = mapRowToClientData(row, parsedData.headers, mapping);
    clients.push(clientData);
  });

  const unmappedColumns = parsedData.headers.filter(header => !mapping[header]);

  return {
    clients,
    mapping,
    unmappedColumns
  };
}

export function generateImportTemplate(format: 'csv' | 'excel' | 'json'): string | Uint8Array {
  const headers = [
    'nome',
    'email', 
    'telefone',
    'cpf/cnpj',
    'endereço',
    'número',
    'complemento',
    'bairro',
    'cidade',
    'estado',
    'cep',
    'data_nascimento',
    'gênero',
    'observações'
  ];

  const sampleData = [
    'João Silva',
    'joao.silva@email.com',
    '(11) 98765-4321',
    '123.456.789-00',
    'Rua das Flores',
    '123',
    'Apto 45',
    'Centro',
    'São Paulo',
    'SP',
    '01234-567',
    '1985-03-15',
    'Masculino',
    'Cliente VIP'
  ];

  switch (format) {
    case 'csv': {
      return [headers.join(','), sampleData.join(',')].join('\n');
    }
    
    case 'excel': {
      const ws = XLSX.utils.aoa_to_sheet([headers, sampleData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
      return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    }
    
    case 'json': {
      const template = headers.reduce((obj, header, index) => {
        obj[header] = sampleData[index] || '';
        return obj;
      }, {} as Record<string, string>);
      return JSON.stringify([template], null, 2);
    }
    
    default:
      throw new Error(`Formato não suportado: ${format}`);
  }
}

export function downloadTemplate(format: 'csv' | 'excel' | 'json'): void {
  try {
    const content = generateImportTemplate(format);
    const filename = `template_importacao_clientes.${format}`;
    
    if (format === 'excel') {
      const blob = new Blob([content as ArrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      downloadFile(blob, filename);
    } else {
      const blob = new Blob([content as string], { type: 'text/plain' });
      downloadFile(blob, filename);
    }
  } catch (error) {
    console.error('Erro ao baixar template:', error);
  }
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
