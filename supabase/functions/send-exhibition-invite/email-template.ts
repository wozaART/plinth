export interface ExhibitionInviteEmailParams {
  galleryName: string;
  accentColor: string;
  artistName: string;
  inviterName: string;
  exhibitionTitle: string;
  message: string;
  inviteUrl: string;
  expiryDate: string;
  appUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderExhibitionInviteEmail(params: ExhibitionInviteEmailParams): string {
  const galleryName = escapeHtml(params.galleryName);
  const artistName = escapeHtml(params.artistName || "there");
  const inviterName = escapeHtml(params.inviterName);
  const exhibitionTitle = escapeHtml(params.exhibitionTitle);
  const message = escapeHtml(params.message);
  const accentColor = escapeHtml(params.accentColor);
  const inviteUrl = escapeHtml(params.inviteUrl);
  const expiryDate = escapeHtml(params.expiryDate);
  const appUrl = escapeHtml(params.appUrl);

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>You're invited to exhibit with ${galleryName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f4f2ee; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${galleryName} has invited you to exhibit in ${exhibitionTitle}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f2ee;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e8e4dc;">

          <!-- Header / brand -->
          <tr>
            <td align="center" style="padding:32px 40px; background-color:#1c1a17;">
              <span style="font-family:Georgia, 'Times New Roman', serif; font-size:20px; letter-spacing:1px; color:#ffffff;">${galleryName}</span>
            </td>
          </tr>

          <!-- Accent bar -->
          <tr>
            <td style="height:4px; line-height:4px; font-size:0; background-color:${accentColor};">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 8px;">
              <p style="margin:0 0 8px; font-family:Georgia, 'Times New Roman', serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#9a8f7c;">
                Exhibition Invitation
              </p>
              <h1 style="margin:0 0 24px; font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.35; color:#1c1a17; font-weight:400;">
                ${galleryName} would like to invite you to exhibit in ${exhibitionTitle}
              </h1>

              <p style="margin:0 0 20px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#4a453d;">
                Hi ${artistName},
              </p>

              <p style="margin:0 0 20px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#4a453d;">
                <strong>${inviterName}</strong> from <strong>${galleryName}</strong> has invited you to participate in <strong>${exhibitionTitle}</strong>. Accept below to view the exhibition's theme, requirements and rules, and confirm your participation.
              </p>

              ${message ? `<p style="margin:0 0 20px; padding:14px 16px; background-color:#f4f2ee; border-radius:8px; font-family:Helvetica, Arial, sans-serif; font-size:14px; line-height:1.6; color:#4a453d; font-style:italic;">"${message}"</p>` : ""}

              <p style="margin:0 0 32px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#4a453d;">
                This invitation will expire on <strong>${expiryDate}</strong>, so be sure to accept it soon.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:8px; background-color:${accentColor};">
                    <a href="${inviteUrl}" target="_blank"
                       style="display:inline-block; padding:14px 32px; font-family:Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:8px;">
                      View Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0; font-family:Helvetica, Arial, sans-serif; font-size:12px; line-height:1.5; color:#9a8f7c;">
                Or copy and paste this link into your browser:<br />
                <a href="${inviteUrl}" style="color:#9a8f7c; word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dc; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 40px;">
              <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6; color:#9a8f7c;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
          <tr>
            <td align="center" style="padding:24px 16px 0;">
              <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:12px; line-height:1.6; color:#b3a996;">
                Plinth &middot; Gallery &amp; artist management &middot; <a href="${appUrl}" style="color:#b3a996;">${appUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
