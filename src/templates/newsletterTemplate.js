export const newsletterTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #eeeeee; }
        .wrapper { width: 100%; table-layout: fixed; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        .webkit { max-width: 600px; margin: 0 auto; }
        .outer { margin: 0 auto; width: 100%; max-width: 600px; }
        .pre-header { display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; }
        .header { padding: 20px; background-color: {{primaryColor}}; color: white; text-align: center; }
        .content-padding { padding: 30px; }
        .content { background-color: #ffffff; }
        .footer { background-color: #34495E; color: #bdc3c7; padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <span class="pre-header">{{preHeader}}</span>
    <center class="wrapper">
        <div class="webkit">
            <table class="outer" align="center">
                <tr>
                    <td>
                        <div class="header">
                            <h2>Our Newsletter</h2>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td class="content-padding">
                        <table class="content" style="width:100%;">
                            <tr>
                                <td style="padding: 20px;">
                                    <h3>{{subject}}</h3>
                                    <div>{{{body}}}</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="footer">
                            <p>{{footerText}}</p>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </center>
</body>
</html>
`;