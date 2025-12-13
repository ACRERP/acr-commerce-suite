import { test, expect } from '@playwright/test';

test.describe('Dashboard & Analytics Integration', () => {
  
  // Login antes de cada teste (assumindo que existe um comando de login ou fluxo)
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Simular fluxo de login se necessário, ou usar estado de sessão salvo
    // Por enquanto, vamos preencher o form de login padrão
    await page.fill('input[type="email"]', 'admin@acr.com'); // Ajuste conforme seed
    await page.fill('input[type="password"]', 'admin123'); // Ajuste conforme seed
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard'); 
  });

  test('Relatórios - Deve carregar gráficos e KPIs', async ({ page }) => {
    await page.goto('/relatorios');
    
    // Verificar Título
    await expect(page.getByText('Central de Inteligência')).toBeVisible();

    // Verificar se os Cards de KPI estão carregando (não deve ter Skeleton após load)
    // Skeletons geralmente tem classe 'animate-pulse' ou similar
    await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar KPI de Receita
    await expect(page.getByText('Receita Total')).toBeVisible();
    
    // Verificar se tem algum gráfico renderizado (recharts surface)
    await expect(page.locator('.recharts-surface').first()).toBeVisible();

    // Testar Filtro de Período
    await page.click('button[role="combobox"]'); // Select trigger
    await page.click('text=Este Ano (YTD)');
    // Esperar reload dos dados
    await page.waitForTimeout(1000); // Pequena espera técnica para atualização UI
  });

  test('Fiscal - Deve carregar Agenda Tributária e Notas', async ({ page }) => {
    await page.goto('/fiscal');

    await expect(page.getByText('Fiscal & Tributário')).toBeVisible();

    // Verificar Agenda Tributária
    await expect(page.getByText('Agenda Tributária')).toBeVisible();
    await expect(page.getByText('DAS - Simples Nacional')).toBeVisible();

    // Verificar Tabela de Notas Fiscais
    await expect(page.getByText('Movimentação Fiscal Real')).toBeVisible();
    
    // Verificar se tabela carregou (sem skeletons)
    await expect(page.locator('tbody .animate-pulse')).not.toBeVisible({ timeout: 10000 });
  });

});
