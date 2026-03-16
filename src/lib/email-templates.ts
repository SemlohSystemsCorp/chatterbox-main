export function welcomeEmail(name: string, loginUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Chatterbox</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#000000;border-radius:10px;padding:8px 10px;vertical-align:middle;" valign="middle">
                    <img src="https://api.iconify.design/lucide/message-square.svg?color=white&width=18&height=18" alt="" width="18" height="18" style="display:block;" />
                  </td>
                  <td style="padding-left:10px;font-size:20px;font-weight:700;color:#000000;vertical-align:middle;" valign="middle">
                    Chatterbox
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:48px 40px;">
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#000000;letter-spacing:-0.02em;">
                Welcome to Chatterbox, ${name}!
              </h1>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#71717a;">
                Your account is ready. Create a workspace, invite your team, and start collaborating in real time.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;background-color:#000000;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                      Open Chatterbox
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e4e4e7;padding-top:24px;">
                    <p style="margin:0 0 12px;font-size:13px;color:#a1a1aa;text-align:center;">
                      Chatterbox &mdash; The best way to communicate
                    </p>
                    <p style="margin:0;font-size:12px;color:#d4d4d8;text-align:center;">
                      &copy; ${new Date().getFullYear()} Chatterbox. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function inviteEmail(
  inviterName: string,
  boxName: string,
  inviteUrl: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to ${boxName} — Chatterbox</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#000000;border-radius:10px;padding:8px 10px;vertical-align:middle;" valign="middle">
                    <img src="https://api.iconify.design/lucide/message-square.svg?color=white&width=18&height=18" alt="" width="18" height="18" style="display:block;" />
                  </td>
                  <td style="padding-left:10px;font-size:20px;font-weight:700;color:#000000;vertical-align:middle;" valign="middle">
                    Chatterbox
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:48px 40px;">

              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#000000;letter-spacing:-0.02em;">
                You're invited to ${boxName}
              </h1>

              <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#71717a;">
                ${inviterName} invited you to join <strong>${boxName}</strong> on Chatterbox. Click the button below to accept.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display:inline-block;background-color:#000000;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                      Accept invite
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                If you weren&rsquo;t expecting this invite, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e4e4e7;padding-top:24px;">

                    <p style="margin:0 0 12px;font-size:13px;color:#a1a1aa;text-align:center;">
                      Chatterbox &mdash; The best way to communicate
                    </p>

                    <p style="margin:0 0 12px;font-size:12px;color:#d4d4d8;text-align:center;">
                      <a href="https://chatterbox.io" style="color:#a1a1aa;text-decoration:none;">Website</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://chatterbox.io/privacy" style="color:#a1a1aa;text-decoration:none;">Privacy</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://chatterbox.io/terms" style="color:#a1a1aa;text-decoration:none;">Terms</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://chatterbox.io/support" style="color:#a1a1aa;text-decoration:none;">Support</a>
                    </p>

                    <p style="margin:0;font-size:12px;color:#d4d4d8;text-align:center;">
                      &copy; ${new Date().getFullYear()} Chatterbox. All rights reserved.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function notificationEmail(
  actorName: string,
  title: string,
  body: string,
  actionUrl: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Chatterbox</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#000000;border-radius:10px;padding:8px 10px;vertical-align:middle;" valign="middle">
                    <img src="https://api.iconify.design/lucide/message-square.svg?color=white&width=18&height=18" alt="" width="18" height="18" style="display:block;" />
                  </td>
                  <td style="padding-left:10px;font-size:20px;font-weight:700;color:#000000;vertical-align:middle;" valign="middle">
                    Chatterbox
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:48px 40px;">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#000000;letter-spacing:-0.02em;">
                ${title}
              </h1>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#71717a;">
                <strong>${actorName}</strong>
              </p>

              ${body ? `<div style="margin:0 0 28px;padding:16px;background-color:#f4f4f5;border-radius:10px;font-size:14px;line-height:1.6;color:#3f3f46;">${body}</div>` : ""}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" style="display:inline-block;background-color:#000000;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">
                      View in Chatterbox
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
                You can manage your notification preferences in Chatterbox settings.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e4e4e7;padding-top:24px;">

                    <p style="margin:0 0 12px;font-size:13px;color:#a1a1aa;text-align:center;">
                      Chatterbox &mdash; The best way to communicate
                    </p>

                    <p style="margin:0 0 12px;font-size:12px;color:#d4d4d8;text-align:center;">
                      <a href="https://chatterbox.io" style="color:#a1a1aa;text-decoration:none;">Website</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://chatterbox.io/privacy" style="color:#a1a1aa;text-decoration:none;">Privacy</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://chatterbox.io/terms" style="color:#a1a1aa;text-decoration:none;">Terms</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://chatterbox.io/support" style="color:#a1a1aa;text-decoration:none;">Support</a>
                    </p>

                    <p style="margin:0;font-size:12px;color:#d4d4d8;text-align:center;">
                      &copy; ${new Date().getFullYear()} Chatterbox. All rights reserved.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function subscriptionReceiptEmail({
  customerName,
  planName,
  boxName,
  amount,
  currency,
  interval,
  dashboardUrl,
}: {
  customerName: string;
  planName: string;
  boxName: string;
  amount: string;
  currency: string;
  interval: string;
  dashboardUrl: string;
}): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Subscription Receipt &mdash; Chatterbox</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#000000;border-radius:10px;padding:8px 10px;vertical-align:middle;" valign="middle">
                    <img src="https://api.iconify.design/lucide/message-square.svg?color=white&width=18&height=18" alt="" width="18" height="18" style="display:block;" />
                  </td>
                  <td style="padding-left:10px;font-size:20px;font-weight:700;color:#000000;vertical-align:middle;" valign="middle">
                    Chatterbox
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:48px 40px;">

              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#000000;letter-spacing:-0.02em;">
                Subscription confirmed
              </h1>

              <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#71717a;">
                Thanks${customerName ? `, ${customerName}` : ""}! Your ${planName} plan is now active for <strong>${boxName}</strong>.
              </p>

              <!-- Receipt details -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#71717a;padding-bottom:12px;">Plan</td>
                        <td style="font-size:13px;color:#000000;font-weight:600;text-align:right;padding-bottom:12px;">${planName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#71717a;padding-bottom:12px;">Workspace</td>
                        <td style="font-size:13px;color:#000000;font-weight:600;text-align:right;padding-bottom:12px;">${boxName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#71717a;padding-bottom:12px;">Billing</td>
                        <td style="font-size:13px;color:#000000;font-weight:600;text-align:right;padding-bottom:12px;">${amount} ${currency.toUpperCase()}/${interval}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#71717a;">Date</td>
                        <td style="font-size:13px;color:#000000;font-weight:600;text-align:right;">${date}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display:inline-block;background-color:#000000;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">
                      Open Chatterbox
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
                You can manage your subscription at any time from your workspace settings. If you have any questions, reply to this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e4e4e7;padding-top:24px;">
                    <p style="margin:0 0 12px;font-size:13px;color:#a1a1aa;text-align:center;">
                      Chatterbox &mdash; The best way to communicate
                    </p>
                    <p style="margin:0;font-size:12px;color:#d4d4d8;text-align:center;">
                      &copy; ${new Date().getFullYear()} Chatterbox. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function verificationCodeEmail(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email — Chatterbox</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#000000;border-radius:10px;padding:8px 10px;vertical-align:middle;" valign="middle">
                    <img src="https://api.iconify.design/lucide/message-square.svg?color=white&width=18&height=18" alt="" width="18" height="18" style="display:block;" />
                  </td>
                  <td style="padding-left:10px;font-size:20px;font-weight:700;color:#000000;vertical-align:middle;" valign="middle">
                    Chatterbox
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:48px 40px;">

              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#000000;letter-spacing:-0.02em;">
                Verify your email
              </h1>

              <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#71717a;">
                Enter this code in Chatterbox to complete your sign up. The code expires in 10 minutes.
              </p>

              <!-- Code block -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#f4f4f5;border-radius:12px;padding:24px;">
                    <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#000000;font-family:'Courier New',Courier,monospace;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                If you didn&rsquo;t create a Chatterbox account, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e4e4e7;padding-top:24px;">

                    <p style="margin:0 0 12px;font-size:13px;color:#a1a1aa;text-align:center;">
                      Chatterbox &mdash; The best way to communicate
                    </p>

                    <p style="margin:0 0 12px;font-size:12px;color:#d4d4d8;text-align:center;">
                      <a href="https://chatterbox.io" style="color:#a1a1aa;text-decoration:none;">Website</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://chatterbox.io/privacy" style="color:#a1a1aa;text-decoration:none;">Privacy</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://chatterbox.io/terms" style="color:#a1a1aa;text-decoration:none;">Terms</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://chatterbox.io/support" style="color:#a1a1aa;text-decoration:none;">Support</a>
                    </p>

                    <p style="margin:0;font-size:12px;color:#d4d4d8;text-align:center;">
                      &copy; ${new Date().getFullYear()} Chatterbox. All rights reserved.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
