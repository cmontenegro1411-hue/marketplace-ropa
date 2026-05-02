
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
  const { supabaseAdmin } = await import("./lib/supabase-admin");

  const { data: columns, error } = await supabaseAdmin
    .rpc('get_table_columns', { table_name: 'products' });

  if (error) {
    // Try querying information_schema
    const { data: infoSchema, error: infoError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'products');
      
    if (infoError) {
      console.log("Could not fetch schema:", infoError.message);
      // Fallback: just fetch one row and see keys
      const { data: sample } = await supabaseAdmin.from('products').select('*').limit(1).single();
      console.log("Product keys:", Object.keys(sample || {}));
    } else {
      console.log("Product columns:", infoSchema.map(c => c.column_name).join(', '));
    }
  } else {
    console.log("Product columns:", columns);
  }
}

checkSchema();
