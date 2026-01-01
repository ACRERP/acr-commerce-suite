export interface ExtractedStatementEntry {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  externalId?: string;
}

/**
 * Basic parser for bank statements.
 * Supports a simplified format and prepares for OFX/CSV.
 */
export const parseStatementFile = async (file: File): Promise<ExtractedStatementEntry[]> => {
  const text = await file.text();
  const entries: ExtractedStatementEntry[] = [];

  if (file.name.endsWith('.csv')) {
    const lines = text.split('\n');
    // Basic CSV assumption: Date,Description,Amount
    // Skipping header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [date, description, amountStr] = line.split(',');
        const amount = parseFloat(amountStr?.replace(/[^\d.-]/g, ''));
        
        if (!isNaN(amount)) {
            entries.push({
                date: date || new Date().toISOString(),
                description: description || 'Sem descrição',
                amount: Math.abs(amount),
                type: amount >= 0 ? 'credit' : 'debit',
                externalId: `${date}-${description}-${amount}`
            });
        }
    }
  } else if (file.name.endsWith('.ofx')) {
    // Basic OFX Parser (simplified regex-based)
    const stmtrs = text.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g);
    
    if (stmtrs) {
        stmtrs.forEach(stmt => {
            const trntype = stmt.match(/<TRNTYPE>(.*)/)?.[1]?.trim();
            const dtposted = stmt.match(/<DTPOSTED>(.*)/)?.[1]?.trim();
            const trnamt = stmt.match(/<TRNAMT>(.*)/)?.[1]?.trim();
            const fitid = stmt.match(/<FITID>(.*)/)?.[1]?.trim();
            const memo = stmt.match(/<MEMO>(.*)/)?.[1]?.trim() || stmt.match(/<NAME>(.*)/)?.[1]?.trim();

            const amount = parseFloat(trnamt || '0');
            
            // OFX Date format: YYYYMMDD
            let date = new Date().toISOString();
            if (dtposted && dtposted.length >= 8) {
                date = `${dtposted.substring(0, 4)}-${dtposted.substring(4, 6)}-${dtposted.substring(6, 8)}`;
            }

            entries.push({
                date,
                description: memo || 'Transferência',
                amount: Math.abs(amount),
                type: amount >= 0 ? 'credit' : 'debit',
                externalId: fitid
            });
        });
    }
  }

  return entries;
};
