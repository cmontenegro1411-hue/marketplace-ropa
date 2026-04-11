import { supabase } from "../lib/supabase";

async function checkUsersTable() {
  console.log("Verificando tabla 'users'...");
  const { data, error } = await supabase.from('users').select('id').limit(1);
  
  if (error) {
    console.log("La tabla 'users' no parece existir o no hay acceso:", error.message);
  } else {
    console.log("La tabla 'users' existe correctamente.");
  }
}

checkUsersTable();
