import { createClient } from "@supabase/supabase-js";

interface EmailPayload {
  to: string;
  subject: string;
  doctorName: string;
  clinicName: string;
  date: string;
  time: string;
  sede?: string;
  bookingUrl: string;
}

export async function sendAlertEmail(payload: EmailPayload): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const htmlBody = `
    <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">HoraDoc</h1>
        <p style="color: #ccfbf1; margin: 4px 0 0;">Nueva hora disponible</p>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e7e5e4; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1c1917; margin: 0 0 16px;">Se liberó una hora con ${payload.doctorName}</h2>
        <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 4px 0;"><strong>Clínica:</strong> ${payload.clinicName}</p>
          <p style="margin: 4px 0;"><strong>Fecha:</strong> ${payload.date}</p>
          <p style="margin: 4px 0;"><strong>Hora:</strong> ${payload.time}</p>
          ${payload.sede ? `<p style="margin: 4px 0;"><strong>Sede:</strong> ${payload.sede}</p>` : ""}
        </div>
        <a href="${payload.bookingUrl}" style="display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reservar hora
        </a>
        <p style="color: #78716c; font-size: 12px; margin-top: 24px;">
          Recibes este email porque tienes una alerta configurada en HoraDoc.
        </p>
      </div>
    </div>
  `;

  try {
    const { error } = await supabase.auth.admin.createUser({
      email: "noop@noop.com",
    });
    void error;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: payload.to,
          subject: payload.subject,
          html: htmlBody,
        }),
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
