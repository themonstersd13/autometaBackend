export const welcomeTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .pre-header { display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; }
        .header { background-color: {{primaryColor}}; color: #ffffff; padding: 10px 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .content { padding: 20px; color: #333; line-height: 1.6; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <div class="pre-header">{{preHeader}}</div>
    <div class="container">
        <div class="header">
            <h1>{{subject}}</h1>
        </div>
        <div class="content">
            {{{body}}}
        </div>
        <div class="footer">
            <p>{{footerText}}</p>
        </div>
    </div>
</body>
</html>
`;
