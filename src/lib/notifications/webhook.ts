interface WebhookPayload {
  alertId: string;
  doctorName: string;
  clinicName: string;
  date: string;
  time: string;
  sede?: string;
  bookingUrl: string;
}

export async function sendWebhookNotification(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "slot_available",
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
