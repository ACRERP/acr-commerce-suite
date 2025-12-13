
import XLSX from 'xlsx';
import * as fs from 'fs';

const FILE_PATH = 'BancoDeDados.xlsx';

try {
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        process.exit(1);
    }

    const workbook = XLSX.readFile(FILE_PATH);
    const sheetNames = workbook.SheetNames;

    console.log('## Sheets Found:', sheetNames.join(', '));

    const analysis = {};

    sheetNames.forEach(name => {
        const worksheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (data.length > 0) {
            analysis[name] = {
                headers: data[0],
                rowCount: data.length - 1,
                sample: data.slice(1, 4) // First 3 rows of data
            };
        }
    });

    fs.writeFileSync('migration_analysis.json', JSON.stringify(analysis, null, 2));
    console.log('Analysis saved to migration_analysis.json');

} catch (error) {
    console.error('Error reading file:', error);
}
