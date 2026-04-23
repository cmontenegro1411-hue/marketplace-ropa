import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function backupAndDelete() {
  console.log("Fetching all completed orders for final audit...");
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_status', 'completed');

  if (!orders) return;

  // Save backup
  fs.writeFileSync('scratch/orders_backup.json', JSON.stringify(orders, null, 2));
  console.log("Backup saved to scratch/orders_backup.json");

  const toDelete: string[] = [];

  // Criteria 1: "Test User"
  orders.filter(o => o.buyer_name?.toLowerCase().includes('test')).forEach(o => {
    console.log(`Marked for deletion (Test User): ${o.id} - ${o.buyer_name}`);
    toDelete.push(o.id);
  });

  // Criteria 2: Zapatillas duplicates (Keep one for Miguel)
  // Miguel's ID is f587d410-fe76-4a1c-85f5-5c7c1de2febc
  const miguelZapas = orders.filter(o => 
    !toDelete.includes(o.id) && 
    o.total_amount === 120 && 
    (typeof o.items === 'string' ? o.items.includes('Zapatillas') : JSON.stringify(o.items).includes('Zapatillas'))
  );

  if (miguelZapas.length > 1) {
    // Keep only the most recent one by date
    miguelZapas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const [keep, ...others] = miguelZapas;
    console.log(`Keeping most recent Miguel order: ${keep.id} from ${keep.created_at}`);
    others.forEach(o => {
      console.log(`Marked for deletion (Miguel duplicate): ${o.id} from ${o.created_at}`);
      toDelete.push(o.id);
    });
  }

  // Criteria 3: Bao Bao duplicates (Keep one for Jennyfer)
  // Jennyfer has 315. 350 * 0.9 = 315 (10% commission).
  const jennyBao = orders.filter(o => 
    !toDelete.includes(o.id) && 
    o.total_amount === 350 && 
    (typeof o.items === 'string' ? o.items.includes('Bao Bao') : JSON.stringify(o.items).includes('Bao Bao'))
  );

  if (jennyBao.length > 1) {
    jennyBao.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const [keep, ...others] = jennyBao;
    console.log(`Keeping most recent Jennyfer order: ${keep.id} from ${keep.created_at}`);
    others.forEach(o => {
      console.log(`Marked for deletion (Jennyfer duplicate): ${o.id} from ${o.created_at}`);
      toDelete.push(o.id);
    });
  }

  if (toDelete.length > 0) {
    console.log(`\nReady to delete ${toDelete.length} records.`);
    const { error } = await supabase.from('orders').delete().in('id', toDelete);
    if (error) {
      console.error("Deletion error:", error);
    } else {
      console.log("Successfully deleted ghost orders.");
    }
  } else {
    console.log("No ghost orders identified for deletion.");
  }
}

backupAndDelete();
