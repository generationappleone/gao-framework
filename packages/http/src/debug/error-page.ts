/**
 * @gao/http — Developer Error Page
 */

const devErrorTemplate = (error: Error, path: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GAO Error - ${error.name}</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #fdfdfd; margin: 0; padding: 20px; color: #333; }
        .error-box { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #e1e4e8; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: #d73a49; color: #fff; padding: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .stack-trace { background: #f6f8fa; padding: 15px; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 14px; line-height: 1.5; color: #24292e; border: 1px solid #e1e4e8; }
        .context { margin-top: 20px; font-size: 14px; color: #586069; }
    </style>
</head>
<body>
    <div class="error-box">
        <div class="header">
            <h1>${error.name}</h1>
            <p>${error.message}</p>
        </div>
        <div class="content">
            <h3>Stack Trace</h3>
            <div class="stack-trace">
                <pre>${error.stack || 'No stack trace available'}</pre>
            </div>
            <div class="context">
                <p><strong>Path:</strong> ${path}</p>
                <p><strong>Environment:</strong> development</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

export function renderDevErrorPage(error: Error, path = '/'): string {
  return devErrorTemplate(error, path);
}
