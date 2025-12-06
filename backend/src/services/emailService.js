export async function sendPasswordResetEmail(email, token) {
  // TODO: integrate real provider (e.g., SendGrid, SES)
  console.log(`[emailService] Password reset to ${email}: token=${token}`);
}

export async function sendJobAlertEmail(email, payload) {
  console.log(`[emailService] Job alert to ${email}:`, payload);
}
