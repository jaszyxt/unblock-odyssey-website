# Website Design System

The website mirrors the game's visual identity. All values below are traceable to the game's
`ui/theme/Color.kt`, `ui/theme/Type.kt`, `ui/theme/Tokens.kt`, and `design/GameThemeCatalog.kt`.

## Brand

- **Name**: Unblock Odyssey
- **Tagline**: *"Make a path. Try a plan."*
- **Support line**: "Move the pieces, clear the road, and grow your thinking."
- **Voice**: short, encouraging, growth-minded ("Path cleared!", "Level complete!").

## Color tokens (`src/styles/tokens.css`)

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FAF9F6` warm off-white | `#0F111A` |
| `--surface` | `#FFFFFF` | `#1A1D29` |
| `--surface-2` | `#F0ECF7` soft lavender | `#2D2934` |
| `--text` | `#24212B` | `#F7F3FB` |
| `--muted` | `#77717F` | `#C9C3D0` |
| `--primary` | `#5C51D6` playful indigo | `#A594F9` |
| `--primary-deep` | `#3B347F` | `#3B347F` |
| `--primary-container` | `#E7E5FF` | `#3B347F` |
| `--teal` | `#4DB6AC` | `#80CBC4` |
| `--raspberry` | `#B83256` | `#FFB1C3` |
| `--gold` | `#FFD700` reward gold | `#FFD700` |
| `--success` | `#257A4B` | `#8DD8AA` |

High-contrast mode swaps to the game's accessibility palette (`#001B6B` primary, stronger borders,
pure white/black board cells).

## Typography

**Atkinson Hyperlegible** (Google Fonts; system fallbacks) — the same hyper-legible family the game
uses (`Atkinson Hyperlegible Next`). Scale: Display 32–40 Bold for hero, 20–24 Bold headings,
16–18 body, 13–14 labels. Generous line height (1.5) for young readers.

## Shape & elevation

- Radii: chips 20px, cards 24px, hero panels 32px (mirrors the game's 8–32dp scale).
- Soft layered shadows, never harsh. 3px focus rings (`--focus` `#0057D9`).
- Gradients: world stage gradients behind boards/sections; glossy block fills (light top glare strip
  + darker bottom edge) matching the launcher-icon art style.

## World theming (`data/theme.json`)

Each world defines: `stage` gradient, board colors (`bg`, `inner`, `lines`, `target`, `ink`, `rim`),
`blockers` palette, hero emoji + name, and a `motif` watermark. Tracks are mapped to worlds in
`trackWorld` (curated, editable):

| Track | World |
|---|---|
| EXPLORER | City Cars |
| BUILDER | Magic Forest |
| PLANNER | Space Explorer |
| STRATEGIST | Clearspace |
| ARCHITECT | Clearspace |
| INNOVATOR | Space Explorer |
| VISIONARY | Magic Forest |

## Motion

Idle hero bob, gate-open pulse, solve confetti — all gated behind `prefers-reduced-motion` and the
manual reduced-motion toggle. Durations follow the game's tokens (90–650ms).

## Components

- `.btn` (primary / soft / ghost), `.chip`, `.card`, `.stars` (gold ★), `.board-frame` with exit gap,
  `.gate` assembly (pole, light, barrier arm, checkered runway), `.dialog` for win flow.
- Buttons ≥ 48px tall; board blocks ≥ 48px on phone widths.
