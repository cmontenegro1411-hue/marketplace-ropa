/**
 * Script de setup: Crea la base de datos de Vendedores en Notion
 * Ejecución única: node scripts/create-notion-db.mjs
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN || 'tu_token_aqui';
const PARENT_PAGE_ID = '34461632-55c2-815d-b409-dc67292c066c'; // Moda Circular - Vendedores CRM

async function createDatabase() {
  const response = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
      icon: { type: 'emoji', emoji: '👗' },
      title: [{ type: 'text', text: { content: '👤 Vendedores Registrados - Moda Circular' } }],
      properties: {
        'Nombre': { title: {} },
        'Email': { email: {} },
        'User ID': { rich_text: {} },
        'Fecha de Registro': { date: {} },
        'Estado': {
          select: {
            options: [
              { name: 'Activo', color: 'green' },
              { name: 'Inactivo', color: 'gray' },
              { name: 'Suspendido', color: 'red' },
            ]
          }
        },
        'Fuente': {
          select: {
            options: [
              { name: 'Web', color: 'blue' },
              { name: 'Google', color: 'red' },
              { name: 'Referido', color: 'purple' },
            ]
          }
        },
        'Total Publicaciones': { number: { format: 'number' } },
        'Notas': { rich_text: {} },
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Error creando la base de datos:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('✅ Base de datos creada exitosamente!');
  console.log(`🔑 DATABASE ID: ${data.id}`);
  console.log(`🔗 URL: ${data.url}`);
  console.log('\n📋 Agrega esto a tu .env:');
  console.log(`NOTION_TOKEN=${NOTION_TOKEN}`);
  console.log(`NOTION_SELLERS_DB_ID=${data.id}`);
}

createDatabase();
