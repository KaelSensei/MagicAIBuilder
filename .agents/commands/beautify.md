# Beautify Command – UI Enhancement Workflow

When `/beautify <component or page description>` is invoked, immediately execute the following steps.

---

## Step 1: Load Project Context

1. Assume the project root as the working directory
2. Load and respect all Cursor rules from `.cursor/rules/*.mdc`
3. Read core project documentation if present:
   - `README.md`
   - Design system or style guide documentation
   - Component library documentation
4. Identify the current Git branch and assume it is a **feature/enhancement branch**, not `main`

---

## Step 2: Understand the Target

1. Parse the component or page description provided after `/beautify`
2. Determine:
   - Which component(s) or page(s) need enhancement
   - Current visual state and pain points
   - Desired aesthetic outcome (modern, minimal, bold, etc.)
3. Locate the exact files involved (components, styles, assets)
4. **Analyze existing design patterns** in the project before proposing changes

---

## Step 3: Design Consistency Check (Mandatory)

Before writing any code:

1. Identify the project's design system:
   - Color palette (primary, secondary, accent colors)
   - Typography hierarchy (fonts, sizes, weights)
   - Spacing system (margins, padding, gaps)
   - Component patterns (buttons, cards, inputs)
2. Check for:
   - Existing UI libraries (Tailwind, styled-components, etc.)
   - Theme configuration files
   - Design tokens or CSS variables
3. Ensure enhancements **respect existing design language**
4. If design direction is unclear, **ask before proceeding**

---

## Step 4: Implement Visual Enhancements

Apply improvements following these priorities:

### 4.1 Layout & Spacing

- Improve visual hierarchy with consistent spacing
- Ensure proper alignment and grid structure
- Add appropriate white space for breathing room

### 4.2 Typography

- Enhance readability with proper font sizing
- Improve text hierarchy (headings, body, captions)
- Ensure sufficient contrast ratios (WCAG AA minimum)

### 4.3 Colors & Visual Appeal

- Apply or refine color scheme consistently
- Add subtle gradients or shadows where appropriate
- Ensure sufficient color contrast for accessibility

### 4.4 Interactive Elements

- Add smooth transitions and hover states
- Enhance button and input styling
- Improve focus states for keyboard navigation

### 4.5 Responsiveness

- Ensure mobile-first responsive design
- Test breakpoints and adaptive layouts
- Optimize for touch targets on mobile (min 44x44px)

---

## Step 5: Accessibility & Performance Check

1. Verify accessibility compliance:
   - Semantic HTML structure
   - ARIA labels where needed
   - Keyboard navigation support
   - Color contrast ratios
2. Ensure performance is maintained:
   - No unnecessary re-renders
   - Optimized animations (prefer CSS over JS)
   - No layout shifts (CLS optimization)
3. Test across different viewport sizes

---

## Step 6: Code Quality Standards

1. Keep styles **maintainable and organized**:
   - Use design tokens/variables for reusable values
   - Follow existing CSS methodology (BEM, CSS Modules, etc.)
   - Group related styles logically
2. Add comments only for complex visual logic
3. Remove any unused or redundant styles
4. Ensure styles are scoped appropriately (no global pollution)

---

## Step 7: Validate the Enhancement

1. Visual review checklist:
   - Consistent with overall design system
   - Improved visual hierarchy
   - Enhanced user experience
   - Maintained or improved accessibility
   - Responsive across devices
2. Compare before/after if possible
3. Ensure no functionality is broken

---

## Step 8: Commit & Push (Required)

After enhancements are complete:

```bash
git add .
git commit -m "style: beautify <component/page name> - <brief description of changes>"
git push
```

- Never push directly to `main` or `master`
- Always push to the current feature/enhancement branch
- Use conventional commit type: `style:` for pure visual changes, `feat:` if adding new UI features

---

## Cursor Behavior Rules

- **Respect existing design patterns** — don't reinvent the wheel
- Prefer **consistency over novelty** unless explicitly redesigning
- **Accessibility is non-negotiable** — always maintain WCAG AA standards
- If design choices conflict with UX best practices, **ask before proceeding**
- Every `/beautify` must result in a commit unless explicitly blocked
- **Document significant visual changes** in comments when non-obvious

---

## Usage

Use `/beautify <component or page description>` to:

- Enhance visual appeal of a component or page
- Improve spacing, typography, and color usage
- Add modern UI patterns (gradients, shadows, animations)
- Ensure responsive and accessible design
- Refine interactive states (hover, focus, active)
- Align UI with design system standards
