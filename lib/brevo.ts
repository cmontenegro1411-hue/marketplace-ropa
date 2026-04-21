export interface EmailPayload {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Servicio utilitario para enviar correos usando la API nativa de Brevo v3.
 * Evitamos instalar el SDK pesado y en su lugar usamos fetch directamente.
 */
export async function sendEmail(payload: EmailPayload) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@tudominio.com";
  const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Notificaciones";

  if (!BREVO_API_KEY) {
    console.warn("⚠️ BREVO_API_KEY no configurado en entorno.");
    return { success: false, error: "Missing API Key" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
        to: payload.to,
        subject: payload.subject,
        htmlContent: payload.htmlContent,
        textContent: payload.textContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error de la API de Brevo:", errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    const recipients = payload.to.map(t => t.email).join(", ");
    console.log(`✅ Email enviado con éxito a ${recipients} a través de Brevo. ID: ${data.messageId}`);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Error crítico enviando email:", error);
    return { success: false, error };
  }
}
