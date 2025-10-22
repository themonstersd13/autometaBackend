export const simpleAnnouncementTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body style="margin: 0; background-color: #f3f4f6;">
    <span style="display: none; font-size: 1px; color: #f3f4f6; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">{{preHeader}}</span>
    <center style="width: 100%; table-layout: fixed; background-color: #f3f4f6; padding-top: 40px; padding-bottom: 40px;">
        <div style="max-width: 560px; margin: 0 auto;">
            <table align="center" style="margin: 0 auto; width: 100%; max-width: 560px; border-spacing: 0; font-family: sans-serif; color: #111827; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <!-- Header -->
                <tr>
                    <td style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
                        <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: {{primaryColor}};">{{subject}}</h1>
                    </td>
                </tr>
                <!-- Body -->
                <tr>
                    <td style="padding: 32px; line-height: 1.6;">
                        {{{body}}}
                    </td>
                </tr>
                <!-- Footer -->
                <tr>
                    <td style="padding: 32px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0;">{{footerText}}</p>
                    </td>
                </tr>
            </table>
        </div>
    </center>
</body>
</html>
`;