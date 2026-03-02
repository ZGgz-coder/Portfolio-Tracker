# UI Style Guide — FactuApp

SumUp/Holded-inspired design system. All tokens are CSS custom properties defined in `:root` inside `styles.css`.

---

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-bg` | `#111827` | Sidebar background |
| `--sidebar-text` | `#9CA3AF` | Sidebar nav text |
| `--sidebar-active` | `#60A5FA` | Active nav item text |
| `--bg` | `#F3F4F6` | App background |
| `--card` | `#FFFFFF` | Card / panel background |
| `--border` | `#E5E7EB` | Default border |
| `--ink` | `#111827` | Primary text |
| `--muted` | `#6B7280` | Secondary / label text |
| `--primary` | `#2563EB` | Primary buttons, links |
| `--primary-hover` | `#1D4ED8` | Primary button hover |
| `--primary-light` | `#EFF6FF` | Primary tinted surfaces |
| `--success` | `#059669` | Success states |
| `--success-light` | `#D1FAE5` | Success badge background |
| `--success-text` | `#064E3B` | Success badge text |
| `--warning` | `#D97706` | Warning states |
| `--warning-light` | `#FEF3C7` | Warning badge background |
| `--warning-text` | `#78350F` | Warning badge text |
| `--danger` | `#DC2626` | Error states |
| `--danger-light` | `#FEE2E2` | Error badge background |
| `--danger-text` | `#7F1D1D` | Error badge text |

---

## Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | `6px` |
| `--radius` | `10px` |
| `--radius-lg` | `14px` |

---

## Typography

- **Body**: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Helvetica, sans-serif`; 14px / 1.5 line-height
- **Labels** (`field-label`, `section-label`, `th`): 11.5px, uppercase, `letter-spacing: 0.04em`, color `--muted`
- **Table body**: 13px
- **View titles**: 18px / 700 weight
- **Card title**: 14.5px / 600 weight

---

## Button Variants

| Class | Appearance | Use case |
|-------|-----------|----------|
| `button` (default) | Blue fill, white text | Primary CTA |
| `.ghost` | White fill, border, dark text | Secondary action |
| `.btn-sm` | Smaller padding (5px 10px), 12.5px font | Table/row actions |
| `.btn-lg` | Larger padding (9px 18px), 14px font | Hero / prominent CTA |
| `.btn-primary-sm` | Blue fill, 5px 12px padding | Small primary action |
| `.export-btn` | Ghost-sized, 7px 12px | PDF / Excel export |

All buttons have `border-radius: var(--radius-sm)`, `transition: background 0.15s`, `opacity: 0.45` when disabled.

---

## Form Elements

- **Inputs / Select / Textarea**: `border: 1px solid var(--border)`, `border-radius: var(--radius-sm)`, `padding: 7px 10px`
- **Focus ring**: `border-color: var(--primary)`, `box-shadow: 0 0 0 3px rgba(37,99,235,0.12)`
- **Disabled**: `background: #F9FAFB`, `color: var(--muted)`, `cursor: not-allowed`
- **Textarea**: `resize: vertical`

---

## Tables

| Element | Style |
|---------|-------|
| `th` | 11.5px, uppercase, `letter-spacing: 0.04em`, color `--muted`, background `#F9FAFB` |
| `td` | 13px, `border-bottom: 1px solid var(--border)` |
| Row hover | `background: #FAFAFA` |
| Last row | No bottom border |
| `.empty-state` | Centered, muted, `padding: 40px 16px` |
| `.col-sm` | 70px wide |
| `.col-md` | 110px wide |
| `.col-action` | 72px, text-align right |

---

## Status Badges

Rendered by `statusBadge(status)` in `app.js`. Class `status-badge` + lowercase status key.

| Status | Spanish label | Background | Text |
|--------|--------------|------------|------|
| `DRAFT` | **Borrador** | `#F3F4F6` | `#374151` |
| `OFFICIAL` | **Oficial** | `--success-light` | `--success-text` |
| `SPECIAL` | **Especial** | `--warning-light` | `--warning-text` |

Styles: `border-radius: 999px`, `padding: 3px 9px`, 11px / 700 weight.

---

## Banner Component

- Class: `.banner` + `.error` / `.warning` / `.success`
- `position: relative`, `padding-right: 40px` (room for close button)
- Auto-dismisses after **7 seconds** for error/warning types
- Contains `#banner-msg` (text span) + `#banner-close` (× button)
- Never auto-dismisses success (success feedback uses toast instead)

---

## Toast Component

- Dark chip (`#1F2937` bg, white text), top-right of topbar
- Auto-hides after **2.4 seconds**
- Used for all success confirmations

---

## Inline Action Error

- Class: `.action-error`
- Used below `#officialize-btn` for officialize-specific errors
- Renders instead of the global banner for officialize failures
- Clears on view change or next officialize attempt
