# Peptide Library Redesign Specification (V1)

## Summary
Create a **category-first, progressive disclosure** experience that moves users through:

**Categories (grid) → Peptides (list) → Quick Info (expanded) → PepTalk link**

This replaces the current long scrolling list and reduces cognitive load.

---

## Core UX Decisions (Locked)
- Category grid first — **no peptides visible on initial load**.
- Clicking a category shows only peptides in that category.
- Clicking a peptide expands quick info (2–3 sentences + bullet points).
- Only one peptide expanded at a time.
- Peptides can belong to multiple categories.
- Back button returns to category grid.
- “Learn More on PepTalk” opens in a new tab.

---

## Category Set (V1)

| Category | Example Peptides | Icon | Accent Color |
|---|---|---|---|
| Weight Management | Semaglutide, Tirzepatide, AOD-9604 | Scale/Flame | Amber |
| Muscle & Recovery | BPC-157, TB-500 | Dumbbell/Muscle | Blue |
| Anti‑Aging & Longevity | Epithalon, GHK‑Cu | Hourglass/DNA | Violet |
| Cognitive Enhancement | Semax, Selank | Brain | Teal |
| Skin & Beauty | GHK‑Cu, Melanotan | Sparkle/Face | Pink |
| Immune Support | Thymosin Alpha‑1 | Shield | Green |
| Sexual Health | PT‑141 | Heart | Red |
| Sleep & Relaxation | DSIP, Selank | Moon | Indigo |

Notes:
- Peptides can be in multiple categories.
- Category counts are derived from data, not hard‑coded.

---

## Information Architecture

### Level 1: Category Grid
- Glass morphism cards, icon + label + count.
- Responsive: 4–5 columns desktop, 2 columns mobile.

### Level 2: Peptide List (within category)
- Compact cards or accordion list.
- Shows name + one‑line tagline.
- Clicking expands quick info.

### Level 3: Quick Info (expanded)
- 2–3 sentence research summary.
- Bullet list of research areas.
- Tags (category pills).
- “Learn More on PepTalk” CTA.

---

## User Flow (High Level)

```
Categories → Category list → Expand peptide → PepTalk
```

- Initial view is **CategoryGrid**.
- Selecting a category transitions to **PeptideList**.
- Expanding a peptide reveals **Quick Info**.
- “Back to categories” returns to the grid.

---

## Visual Style

- **Keep glass morphism** (current aesthetic).
- Each category has **distinct accent color + icon**.
- Expanded cards increase glass opacity for readability.
- **Smooth animations** (200–300ms, ease-out).
- Mobile: 2‑column categories; peptides as accordion list.

---

## Components

### `PeptideLibraryPage`
Container that manages view state and URL sync if desired.

### `CategoryGrid`
Props: `categories[]`, `onSelect(categoryId)`

### `CategoryHeader`
Shows category title, icon, accent, and Back button.

### `PeptideList`
Props: `peptides[]`, `expandedId`, `onToggle(id)`

### `PeptideCard` (Collapsed)
Name + tagline + chevron.

### `PeptideCardExpanded`
Summary, bullets, tags, PepTalk CTA.

---

## State Model

```ts
type LibraryView = 'categories' | 'category';

const [view, setView] = useState<LibraryView>('categories');
const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
const [expandedPeptideId, setExpandedPeptideId] = useState<string | null>(null);
```

Optional: URL sync with `?category=slug`.

---

## Data Structures

```ts
interface PeptideCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  accent: string; // e.g., 'amber', 'teal'
}

interface Peptide {
  id: string;
  name: string;
  abbreviation?: string;
  tagline: string;
  summary: string;         // 2–3 sentences
  researchAreas: string[]; // bullet points
  categoryIds: string[];
  peptalkUrl: string;
}
```

---

## PepTalk Integration

- Open in new tab: `target="_blank" rel="noopener noreferrer"`.
- URL format (based on current site links):
  - `https://peptalk.bio/peptides/{slug}`
- If PepTalk base URL changes, update in one config location.

---

## Accessibility Requirements

- Keyboard navigation for all cards.
- `aria-expanded` on peptide rows.
- Focus management on expand/collapse.
- Respect `prefers-reduced-motion`.
- Minimum 4.5:1 contrast for text on glass cards.

---

## Implementation Checklist

### Phase 1: Data
- Create `categories` data file
- Create `peptides` data file with multi‑category mapping

### Phase 2: Components
- CategoryGrid
- CategoryHeader
- PeptideList
- PeptideCard (collapsed + expanded)

### Phase 3: Integration
- Replace current library UI
- Wire up state & transitions
- Add PepTalk links

### Phase 4: Polish
- Motion + staggered reveals
- Mobile layout tuning
- Contrast + readability pass

---

## Compliance Reminder

All content must:
- Use “research purposes only” language
- Avoid medical claims, dosage, or outcomes
- Avoid any implication of human use
```
