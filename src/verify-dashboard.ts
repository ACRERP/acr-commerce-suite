
import { supabase } from './lib/supabaseClient';

async function verifyDashboard() {
  console.log('🚀 Verifying Dashboard RPCs...');

  try {
    // 1. Test get_dashboard_stats
    console.log('\nTesting get_dashboard_stats(30)...');
    const { data: stats, error: statsError } = await supabase
      .rpc('get_dashboard_stats', { period_days: 30 });

    if (statsError) {
      console.error('❌ Error fetching stats:', statsError.message);
    } else {
      console.log('✅ Stats received:', stats);
      if (typeof stats.revenue === 'number') console.log('   - Revenue field present');
      if (typeof stats.revenue_growth === 'number') console.log('   - Growth field present');
    }

    // 2. Test get_sales_chart_data
    console.log('\nTesting get_sales_chart_data(30)...');
    const { data: chart, error: chartError } = await supabase
      .rpc('get_sales_chart_data', { period_days: 30 });

    if (chartError) {
      console.error('❌ Error fetching chart:', chartError.message);
    } else {
      console.log(`✅ Chart data received: ${chart?.length} days`);
      if (chart && chart.length > 0) {
        console.log('   - Sample day:', chart[0]);
      }
    }

    // 3. Test View DRE
    console.log('\nTesting vw_dre_report access...');
    const { data: dre, error: dreError } = await supabase
      .from('vw_dre_report')
      .select('*')
      .limit(1);

    if (dreError) {
      console.error('❌ Error fetching DRE:', dreError.message);
    } else {
      console.log('✅ DRE view accessible. Rows:', dre?.length);
      if (dre && dre.length > 0) console.log('   - Sample row:', dre[0]);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

verifyDashboard();
