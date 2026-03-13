/**
 * @gao/ui — Form Components
 *
 * Input, Select, Checkbox, SwitchToggle, and FormGroup components.
 *
 * @since 0.6.0
 */

// ─── Types ───────────────────────────────────────────────────

export interface InputConfig {
    /** Input name attribute. */
    name: string;
    /** Label text. */
    label?: string;
    /** Input type. Default: 'text'. */
    type?: string;
    /** Placeholder text. */
    placeholder?: string;
    /** Current value. */
    value?: string;
    /** Required field. */
    required?: boolean;
    /** Disabled state. */
    disabled?: boolean;
    /** Validation error message. */
    error?: string;
    /** Hint text below input. */
    hint?: string;
    /** Size variant. */
    size?: 'sm' | 'md' | 'lg';
    /** HTML id (auto-generated from name if not provided). */
    id?: string;
    /** Additional CSS class. */
    className?: string;
}

export interface SelectOption {
    value: string;
    text: string;
    selected?: boolean;
    disabled?: boolean;
}

export interface SelectConfig {
    name: string;
    label?: string;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    id?: string;
    className?: string;
}

export interface CheckboxConfig {
    name: string;
    label: string;
    type?: 'checkbox' | 'radio';
    checked?: boolean;
    value?: string;
    disabled?: boolean;
    id?: string;
}

export interface SwitchToggleConfig {
    name: string;
    label: string;
    checked?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    id?: string;
}

export interface FormGroupConfig {
    label: string;
    /** Inner HTML (the form element). */
    children: string;
    error?: string;
    hint?: string;
    required?: boolean;
}

// ─── Components ──────────────────────────────────────────────

/**
 * Text input with label, hint, and error support.
 */
export function gaoInput(config: InputConfig): string {
    const {
        name, label, type = 'text', placeholder = '', value = '',
        required = false, disabled = false, error, hint,
        size = 'md', id, className = '',
    } = config;

    const inputId = id ?? `gao-input-${name}`;
    const sizeClass = size !== 'md' ? ` gao-input-${size}` : '';
    const errorClass = error ? ' gao-input-error' : '';
    const cls = `gao-input${sizeClass}${errorClass} ${className}`.trim();

    const labelHtml = label
        ? `<label for="${inputId}" class="gao-label${required ? ' gao-label-required' : ''}">${label}</label>\n`
        : '';
    const hintHtml = hint && !error ? `\n<p class="gao-hint">${hint}</p>` : '';
    const errorHtml = error ? `\n<p class="gao-error-message" role="alert">${error}</p>` : '';
    const disabledAttr = disabled ? ' disabled' : '';
    const requiredAttr = required ? ' required' : '';
    const ariaInvalid = error ? ' aria-invalid="true"' : '';

    return `<div class="gao-form-group">
${labelHtml}<input type="${type}" id="${inputId}" name="${name}" class="${cls}" placeholder="${placeholder}" value="${value}"${disabledAttr}${requiredAttr}${ariaInvalid}>${hintHtml}${errorHtml}
</div>`;
}

/**
 * Select dropdown with options.
 */
export function gaoSelect(config: SelectConfig): string {
    const { name, label, options, placeholder, required = false, disabled = false, error, id, className = '' } = config;
    const selectId = id ?? `gao-select-${name}`;
    const errorClass = error ? ' gao-input-error' : '';
    const cls = `gao-input gao-select${errorClass} ${className}`.trim();

    const labelHtml = label
        ? `<label for="${selectId}" class="gao-label${required ? ' gao-label-required' : ''}">${label}</label>\n`
        : '';

    const placeholderOpt = placeholder ? `<option value="" disabled selected>${placeholder}</option>\n` : '';
    const optionsHtml = options.map(o => {
        const sel = o.selected ? ' selected' : '';
        const dis = o.disabled ? ' disabled' : '';
        return `<option value="${o.value}"${sel}${dis}>${o.text}</option>`;
    }).join('\n');

    const errorHtml = error ? `\n<p class="gao-error-message" role="alert">${error}</p>` : '';
    const disabledAttr = disabled ? ' disabled' : '';
    const requiredAttr = required ? ' required' : '';

    return `<div class="gao-form-group">
${labelHtml}<select id="${selectId}" name="${name}" class="${cls}"${disabledAttr}${requiredAttr}>
${placeholderOpt}${optionsHtml}
</select>${errorHtml}
</div>`;
}

/**
 * Checkbox or radio input with label.
 */
export function gaoCheckbox(config: CheckboxConfig): string {
    const { name, label, type = 'checkbox', checked = false, value = '', disabled = false, id } = config;
    const inputId = id ?? `gao-${type}-${name}`;
    const checkedAttr = checked ? ' checked' : '';
    const disabledAttr = disabled ? ' disabled' : '';
    const valueAttr = value ? ` value="${value}"` : '';
    const wrapperClass = type === 'radio' ? 'gao-radio' : 'gao-checkbox';

    return `<label class="${wrapperClass}" for="${inputId}">
<input type="${type}" id="${inputId}" name="${name}"${valueAttr}${checkedAttr}${disabledAttr}>
<span>${label}</span>
</label>`;
}

/**
 * iOS-style toggle switch.
 */
export function gaoSwitchToggle(config: SwitchToggleConfig): string {
    const { name, label, checked = false, disabled = false, id } = config;
    const inputId = id ?? `gao-switch-${name}`;
    const checkedAttr = checked ? ' checked' : '';
    const disabledAttr = disabled ? ' disabled' : '';

    return `<label class="gao-switch" for="${inputId}">
<input type="checkbox" id="${inputId}" name="${name}"${checkedAttr}${disabledAttr}>
<span class="gao-switch-track"><span class="gao-switch-thumb"></span></span>
<span>${label}</span>
</label>`;
}

/**
 * Form group wrapper with label, children, error, and hint.
 */
export function gaoFormGroup(config: FormGroupConfig): string {
    const { label, children, error, hint, required = false } = config;
    const labelHtml = `<label class="gao-label${required ? ' gao-label-required' : ''}">${label}</label>`;
    const hintHtml = hint && !error ? `<p class="gao-hint">${hint}</p>` : '';
    const errorHtml = error ? `<p class="gao-error-message" role="alert">${error}</p>` : '';

    return `<div class="gao-form-group">
${labelHtml}
${children}
${hintHtml}${errorHtml}
</div>`;
}
