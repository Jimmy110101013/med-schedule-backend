# Dot Pattern Background Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a NuPhy-style semi-transparent dot grid background that respects light/dark theme switching.

**Architecture:** Pure CSS radial-gradient dots via a utility class `.bg-dot-pattern`, driven by a `--pattern-color` CSS variable that switches between `:root` (light) and `.dark` (dark) values. Applied to `<body>` so it tiles behind all content.

**Tech Stack:** CSS (oklch colors, radial-gradient), Tailwind `@layer utilities`, next-themes (existing)

---

## Chunk 1: Implementation

Two files modified, zero files created.

### Task 1: Add `--pattern-color` CSS variables to `globals.css`

**Files:**
- Modify: `frontend/app/globals.css:50-83` (`:root` block) — add light pattern color
- Modify: `frontend/app/globals.css:85-117` (`.dark` block) — add dark pattern color

- [ ] **Step 1: Add `--pattern-color` to `:root`**

In `frontend/app/globals.css`, inside the `:root` block, add after `--sidebar-ring` (line 82):

```css
  --pattern-color: oklch(0.552 0.016 285.938 / 0.25);
```

- [ ] **Step 2: Add `--pattern-color` to `.dark`**

In `frontend/app/globals.css`, inside the `.dark` block, add after `--sidebar-ring` (line 116):

```css
  --pattern-color: oklch(0.705 0.015 286.067 / 0.15);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/globals.css
git commit -m "style: add --pattern-color CSS vars for light/dark themes"
```

---

### Task 2: Add `.bg-dot-pattern` utility class to `globals.css`

**Files:**
- Modify: `frontend/app/globals.css` — append `@layer utilities` block at end of file

- [ ] **Step 1: Add the utility class**

Append to the bottom of `frontend/app/globals.css`:

```css
@layer utilities {
  .bg-dot-pattern {
    background-image: radial-gradient(var(--pattern-color) 1px, transparent 1px);
    background-size: 24px 24px;
    background-position: center center;
  }
}
```

- [ ] **Step 2: Run build to verify CSS compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/globals.css
git commit -m "style: add .bg-dot-pattern utility class with radial-gradient dots"
```

---

### Task 3: Apply dot pattern to layout

**Files:**
- Modify: `frontend/app/layout.tsx:30` — add `bg-dot-pattern` to `<body>` className
- Modify: `frontend/app/layout.tsx:38` — add `relative` to flex container className

- [ ] **Step 1: Add `bg-dot-pattern` to `<body>`**

In `frontend/app/layout.tsx`, change line 30 from:

```tsx
className={`${geistSans.variable} ${geistMono.variable} antialiased`}
```

to:

```tsx
className={`${geistSans.variable} ${geistMono.variable} antialiased bg-dot-pattern`}
```

- [ ] **Step 2: Add `relative` to the flex container**

In `frontend/app/layout.tsx`, change line 38 from:

```tsx
<div className="flex min-h-screen">
```

to:

```tsx
<div className="relative flex min-h-screen">
```

- [ ] **Step 3: Run build to verify everything compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/layout.tsx
git commit -m "style: apply dot-pattern background to body layout"
```

---

## Verification

After all tasks, visually verify:
1. Light mode: subtle grey dots visible behind content
2. Dark mode: lighter, lower-opacity dots visible behind content
3. Theme toggle transitions correctly between the two
4. Dots tile seamlessly across the full viewport
5. No performance issues (pure CSS, no JS)
