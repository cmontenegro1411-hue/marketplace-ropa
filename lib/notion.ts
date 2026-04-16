import { Client } from '@notionhq/client';

// ─── Validación de entorno ────────────────────────────────────────────────────
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_SELLERS_DB_ID = process.env.NOTION_SELLERS_DB_ID;

if (!NOTION_TOKEN) {
  console.warn('[Notion] NOTION_TOKEN no está configurado. El CRM de vendedores estará deshabilitado.');
}

// ─── Cliente Notion ──────────────────────────────────────────────────────────
export const notionClient = NOTION_TOKEN
  ? new Client({ auth: NOTION_TOKEN })
  : null;

// ─── Tipos ──────────────────────────────────────────────────────────────────
export interface NewSellerData {
  userId: string;
  email: string;
  name: string;
  source?: 'Web' | 'Google' | 'Referido';
}

// ─── Funciones de sincronización ─────────────────────────────────────────────

/**
 * Crea un registro de vendedor en la base de datos de Notion CRM.
 * Diseñado como fire-and-forget: nunca bloquea el flujo principal de registro.
 *
 * @returns La página creada en Notion, o null si el CRM no está configurado.
 */
export async function syncSellerToNotion(seller: NewSellerData): Promise<boolean> {
  if (!notionClient || !NOTION_SELLERS_DB_ID) {
    console.warn('[Notion CRM] Sincronización deshabilitada: faltan variables de entorno.');
    return false;
  }

  try {
    await notionClient.pages.create({
      parent: { database_id: NOTION_SELLERS_DB_ID },
      icon: { type: 'emoji', emoji: '👗' },
      properties: {
        'Nombre': {
          title: [{ text: { content: seller.name } }],
        },
        'Email': {
          email: seller.email,
        },
        'User ID': {
          rich_text: [{ text: { content: seller.userId } }],
        },
        'Fecha de Registro': {
          date: { start: new Date().toISOString().split('T')[0] },
        },
        'Estado': {
          select: { name: 'Activo' },
        },
        'Fuente': {
          select: { name: seller.source ?? 'Web' },
        },
        'Total Publicaciones': {
          number: 0,
        },
      },
    });

    console.log(`[Notion CRM] ✅ Vendedor sincronizado: ${seller.email}`);
    return true;
  } catch (err: any) {
    // Error no-bloqueante: loguea pero NO interrumpe el registro del usuario
    console.error(`[Notion CRM] ❌ Error sincronizando vendedor ${seller.email}:`, err?.message);
    return false;
  }
}

/**
 * Verifica que la conexión con Notion esté activa.
 * Útil para health checks y diagnósticos.
 */
export async function testNotionConnection(): Promise<{ ok: boolean; message: string }> {
  if (!notionClient || !NOTION_SELLERS_DB_ID) {
    return { ok: false, message: 'Variables de entorno no configuradas' };
  }

  try {
    await notionClient.databases.retrieve({ database_id: NOTION_SELLERS_DB_ID });
    return { ok: true, message: 'Conexión con Notion CRM activa' };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? 'Error desconocido' };
  }
}
