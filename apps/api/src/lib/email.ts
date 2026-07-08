export async function sendEmail(
  props: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  },
  apiKey: string,
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Savemony <noreply@tudominio.com>",
      to: props.to,
      subject: props.subject,
      html: props.html,
      text: props.text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Email failed: ${await res.text()}`);
  }
}
