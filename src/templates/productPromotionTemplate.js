export const productPromotionTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body style="margin: 0; background-color: #f8fafc;">
    <span style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">{{preHeader}}</span>
    <center style="width: 100%; table-layout: fixed; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto;">
            <table align="center" style="margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; color: #1f2937;">
                <!-- Banner Image -->
                {{#if showImageBanner}}
                <tr>
                    <td style="padding: 0;">
                        <img src="{{imageBannerUrl}}" alt="Promotion Banner" style="border: 0; width: 100%; max-width: 600px; height: auto;" />
                    </td>
                </tr>
                {{/if}}
                <!-- Main Content -->
                <tr>
                    <td style="padding: 32px; background-color: #ffffff;">
                        <h1 style="margin-top: 0; margin-bottom: 16px; font-size: 24px; font-weight: 600;">{{subject}}</h1>
                        <div style="line-height: 1.5;">
                            {{{body}}}
                        </div>
                        <a href="{{ctaLink}}" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background-color: {{primaryColor}}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                            {{ctaText}}
                        </a>
                    </td>
                </tr>
                <!-- Footer -->
                <tr>
                    <td style="padding: 32px; text-align: center; font-size: 12px; color: #6b7280;">
                        <p style="margin: 0;">{{footerText}}</p>
                    </td>
                </tr>
            </table>
        </div>
    </center>
</body>
</html>
`;