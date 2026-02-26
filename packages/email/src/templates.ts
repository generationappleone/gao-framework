/**
 * @gao/email — Built-in Templates
 *
 * Pre-built email templates following modern inline-CSS email design.
 * All templates use {{variable}} syntax for data binding.
 */

// ─── Base wrapper ────────────────────────────────────────────

const BASE_STYLE = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #1e293b;
`;

const BUTTON_STYLE = `
  display: inline-block;
  padding: 12px 28px;
  background: #6366f1;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
`;

const FOOTER_STYLE = `
  color: #94a3b8;
  font-size: 13px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
`;

// ─── Welcome ─────────────────────────────────────────────────

export const WELCOME_TEMPLATE = `
<div style="${BASE_STYLE}">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">
    Welcome, {{name}}! 🎉
  </h1>
  <p style="font-size: 16px; line-height: 1.6; color: #475569;">
    Thank you for joining <strong>{{appName}}</strong>.
    Your account has been created successfully.
  </p>
  <div style="margin: 32px 0;">
    <a href="{{dashboardUrl}}" style="${BUTTON_STYLE}">Go to Dashboard</a>
  </div>
  <p style="${FOOTER_STYLE}">
    — The {{appName}} Team
  </p>
</div>
`;

// ─── Reset Password ──────────────────────────────────────────

export const RESET_PASSWORD_TEMPLATE = `
<div style="${BASE_STYLE}">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">
    Password Reset
  </h1>
  <p style="font-size: 16px; line-height: 1.6; color: #475569;">
    Hi {{name}}, we received a request to reset your password.
    Click the button below to set a new password. This link expires in
    <strong>{{expiresIn}}</strong>.
  </p>
  <div style="margin: 32px 0;">
    <a href="{{resetUrl}}" style="${BUTTON_STYLE}">Reset Password</a>
  </div>
  <p style="font-size: 14px; color: #64748b;">
    If you didn't request this, you can safely ignore this email.
    Your password will remain unchanged.
  </p>
  <p style="${FOOTER_STYLE}">
    — The {{appName}} Team
  </p>
</div>
`;

// ─── Email Verification ─────────────────────────────────────

export const VERIFICATION_TEMPLATE = `
<div style="${BASE_STYLE}">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">
    Verify Your Email
  </h1>
  <p style="font-size: 16px; line-height: 1.6; color: #475569;">
    Hi {{name}}, please verify your email address by clicking the button below.
  </p>
  <div style="margin: 32px 0;">
    <a href="{{verifyUrl}}" style="${BUTTON_STYLE}">Verify Email</a>
  </div>
  <p style="font-size: 14px; color: #64748b;">
    Or copy and paste this URL into your browser:<br/>
    <span style="color: #6366f1; word-break: break-all;">{{verifyUrl}}</span>
  </p>
  <p style="${FOOTER_STYLE}">
    — The {{appName}} Team
  </p>
</div>
`;

/**
 * Registry of built-in templates.
 */
export const BUILT_IN_TEMPLATES: Record<string, string> = {
    welcome: WELCOME_TEMPLATE,
    'reset-password': RESET_PASSWORD_TEMPLATE,
    verification: VERIFICATION_TEMPLATE,
};
