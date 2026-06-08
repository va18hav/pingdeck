# PingDeck — Design System (v0.2 Modern Minimal)

Clean, modern, high-contrast developer utility. Breathable layout, readable typography, crisp surface contrast, and zero "pill soup".

## Core Principles (Anti-Monotony Rules)

1. **Ban the "Pill Soup":** Do not wrap every piece of metadata, filter, provider name, or secondary action in a bordered box or pill.
   - **Filters** use **underline tabs** flush with the section border — never a row of bordered chips.
   - **Provider & metadata** render as **inline icon + text** separated by `·` dividers — never a bordered tag next to buttons.
   - **Toolbar actions** use one primary/secondary button + quiet ghost buttons (`hover:bg-hover`, no border) so the header doesn't look like a wall of identical boxes.
2. **Real Breathing Room:** Generous padding (`20px–24px`), comfortable row heights (`48px–60px`), and readable text (`14px` base, `13px` secondary/mono). Nothing cramped at `11px` uppercase unless it is a true table column header.
3. **Crisp Surface Hierarchy:** Pure white (`#FFFFFF`) elevated surfaces (panels, modals, inputs) over a quiet warm-grey canvas (`#F4F4F5`), anchored by a **deep carbon/charcoal accent** (`#18181B`).

## Fonts

- **UI font: Satoshi** (Fontshare). Weights: `400` (body), `500` (labels, tabs, controls), `600` (headings, titles).
- **Mono font: JetBrains Mono** — event IDs, URLs, HTTP status codes, timings, secrets, JSON payloads.

## Color Tokens (`web/src/index.css`)

### Surfaces & Borders (Crisp Zinc / Neutral)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F4F4F5` (zinc-100) | App canvas, recessed wells, segmented track bg |
| `--color-surface` | `#FFFFFF` | Main panels, modals, inputs, active segment |
| `--color-hover` | `#F4F4F5` (zinc-100) | Row hover, ghost button hover |
| `--color-active` | `#E4E4E7` (zinc-200/60) | Selected row surface |
| `--color-line` | `#E4E4E7` (zinc-200) | Structural 1px dividers |
| `--color-line-strong` | `#D4D4D8` (zinc-300) | Input borders, outlined buttons |

### Text

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#09090B` (zinc-950) | Primary text & headings |
| `--color-ink-2` | `#52525B` (zinc-600) | Secondary text, form labels, inactive tabs |
| `--color-ink-3` | `#71717A` (zinc-500) | Timestamps, muted hints, URLs |

### Accent — Deep Carbon Charcoal (Darker & Richer)

| Token | Value | Use |
|---|---|---|
| `--color-accent` | `#18181B` (zinc-900) | Primary buttons, active tab bar, selected rail |
| `--color-accent-hover` | `#09090B` (zinc-950) | Primary button hover |
| `--color-on-accent` | `#FAFAFA` (zinc-50) | Text on primary accent |

### Semantic Status Colors

| Status | Dot | Text | Subtle Tint (optional) |
|---|---|---|---|
| `DELIVERED` | `#10B981` | `#047857` | `#ECFDF5` |
| `RETRYING` | `#F59E0B` | `#B45309` | `#FFFBEB` |
| `PENDING` | `#71717A` | `#52525B` | `#F4F4F5` |
| `PROCESSING` | `#3B82F6` | `#1D4ED8` | `#EFF6FF` |
| `FAILED` | `#EF4444` | `#B91C1C` | `#FEF2F2` |

## Typography Scale

| Element | Size / Weight | Notes |
|---|---|---|
| Panel / Modal Title | `18px` / `600` (`-0.01em`) | Clean sentence case |
| Top Bar Brand | `16px` / `600` (`-0.01em`) | Paired with carbon mark |
| Body / List Primary | `14px` / `500` | Endpoint names, primary content |
| Form Label / Control | `13px` / `500` | Sentence case (`text-ink-2`) — **not** 11px uppercase |
| Mono / Technical | `13px` / `400` | URLs, event IDs, JSON, secrets |
| Meta / Timestamp | `13px` / `400` | Relative times, retry counts (`text-ink-3`) |

## Sizing & Spacing

- **Top bar:** `52px` height (`h-13`), `px-6`.
- **Left pane (Endpoints):** `340px` width; header `px-5 py-3.5`; each endpoint item `px-5 py-3.5` (comfortable 2-line rhythm with `6px` gap).
- **Right panel (Endpoint detail):**
  - Header `px-6 pt-5 pb-4` with `18px` title, inline provider mark (`Icon + Label`), and clean metadata row separated by `·`.
  - Filter bar: `px-6` **underline tabs** (`h-10`, `gap-6`, `border-b-2` on active tab) — no button pills.
  - Event rows: `48px` height (`h-12`), `px-6`, generous column spacing.
- **Buttons:** `36px` height (`h-9`), `px-3.5`, `rounded-lg` (`8px`), `13px` font-medium.
- **Inputs:** `40px` height (`h-10`), `px-3.5`, `rounded-lg` (`8px`), `14px` text, `#FFFFFF` background with `--color-line-strong` border and `focus:border-accent`.

## Modals (Modern Structured Dialogs)

- **Backdrop:** `bg-black/40 backdrop-blur-[2px]`.
- **Container:** `w-[480px]` (confirm dialogs `w-[420px]`), `rounded-xl` (`12px`), `bg-surface` (`#FFFFFF`), `border border-line`, `shadow-xl` (`0 20px 25px -5px rgb(0 0 0 / 0.1)`).
- **Anatomy:**
  1. **Header:** `px-6 pt-6 pb-4` — `18px font-semibold` title + `13px text-ink-2` description.
  2. **Body:** `px-6 py-2 space-y-4` — sentence-case `13px` labels above `40px` inputs.
  3. **Segmented Picker (Verify Source):** Single recessed track (`bg-bg p-1 rounded-lg grid grid-cols-4 gap-1`) where the active option is a raised white segment (`bg-surface text-ink shadow-xs rounded-md h-8`) and inactive options are plain text (`text-ink-2 hover:text-ink`) — never 4 separate bordered pills.
  4. **Footer:** `mt-6 flex justify-end gap-2.5 border-t border-line bg-bg/50 px-6 py-4 rounded-b-xl`.
