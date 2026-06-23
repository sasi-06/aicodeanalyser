#!/bin/bash

# Frontend Implementation Verification Guide

## Step 1: Install Dependencies

cd frontend
npm install

## Step 2: Start Development Server

npm run dev

# Expected output:

# ▶ Local: http://localhost:5173/

# ▶ press h to show help

## Step 3: Open Browser

# Navigate to http://localhost:5173/

# You should see the newly designed premium home page

## Step 4: Verify Features

### ✅ Header Navigation

- [ ] Sticky header appears on scroll
- [ ] Logo displays correctly
- [ ] Navigation links visible on desktop
- [ ] Mobile menu works on smaller screens
- [ ] Login and Get Started buttons visible

### ✅ Hero Section

- [ ] Large headline "TECHNICAL HIRING / BEYOND THE CODE"
- [ ] Gradient text effect on subtitle
- [ ] Two CTA buttons (Deploy Test, Recruiter Access)
- [ ] Dashboard mockup displays
- [ ] Animated background gradients

### ✅ Features Section

- [ ] 6 feature cards visible in grid
- [ ] Each card has icon, title, description
- [ ] Cards hover with slight lift animation
- [ ] "Elite Coding IDE" card visible
- [ ] "Typing Telemetry ML" card visible
- [ ] All 6 cards render in responsive grid

### ✅ Workflow Section

- [ ] Two-column layout on desktop
- [ ] Left column: 3 workflow steps
- [ ] Right column: Metrics display
- [ ] Animated progress bars
- [ ] Candidate profile card

### ✅ CTA Section

- [ ] Blue gradient background
- [ ] "Ready to Scale Your Engineering Team?" headline
- [ ] Two CTA buttons
- [ ] Animated blob effect in background

### ✅ Footer

- [ ] 4-column footer layout
- [ ] Brand section with logo and social links
- [ ] Platform, Company, Resources sections
- [ ] Copyright and legal links

## Step 5: Component Testing

### Test Button Component

```jsx
import { Button } from '@/common/components';
import { ArrowRight } from 'lucide-react';

// Basic button
<Button variant="primary" size="md">Click me</Button>

// With icon
<Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
  Get Started
</Button>

// Loading state
<Button variant="primary" isLoading={true}>Processing</Button>

// Disabled
<Button variant="primary" isDisabled={true}>Cannot click</Button>
```

### Test Card Component

```jsx
import { Card } from '@/common/components';

// Default card
<Card variant="default" className="p-8">
  Content
</Card>

// Interactive card
<Card variant="interactive" onClick={() => console.log('clicked')}>
  Click me
</Card>

// Elevated card
<Card variant="elevated" className="p-8">
  Premium content
</Card>
```

### Test Grid Component

```jsx
import { Grid, Container } from "@/common/components";

<Container>
  <Grid columns={3} gap="lg">
    <Card>Item 1</Card>
    <Card>Item 2</Card>
    <Card>Item 3</Card>
  </Grid>
</Container>;
```

### Test Animations

```jsx
import { motion } from 'framer-motion';
import { animations } from '@/design-system';

// Fade in animation
<motion.div {...animations.fadeInUp}>
  Animated content
</motion.div>

// Hover effect
<motion.div {...animations.hoverLift}>
  Hover me
</motion.div>
```

### Test Hooks

```jsx
import { useAsync, useFetch, useDebounce } from "@/hooks/useAdvanced";

// Async operation
const { status, data, error } = useAsync(() => fetch("/api/data"));

// Fetch data
const { data, loading, error } = useFetch("/api/users");

// Debounce search
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 500);
```

## Step 6: Responsive Testing

### Desktop (1920px)

- [ ] All sections fully visible
- [ ] Grid shows 3 columns
- [ ] Navigation full-width

### Tablet (768px)

- [ ] Grid shows 2 columns
- [ ] Navigation responsive
- [ ] Layout stacks appropriately

### Mobile (375px)

- [ ] Hamburger menu active
- [ ] Grid shows 1 column
- [ ] All text readable
- [ ] Buttons full-width

## Step 7: Dark Mode & Accessibility

### Visual Checks

- [ ] All text readable on dark background
- [ ] Sufficient color contrast
- [ ] Icons clearly visible
- [ ] Hover states obvious

### Accessibility

- [ ] Tab through buttons - focus visible
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] No color-only information

## Step 8: Performance

### DevTools Checks

- [ ] Network requests < 1MB combined
- [ ] No console errors
- [ ] No console warnings
- [ ] Smooth animations (60fps)

### Lighthouse

```bash
npm run build
# Check build size
ls -lh dist/
```

Expected: < 300KB gzipped

## Step 9: Component Import Verification

Test that path aliases work correctly:

```javascript
// ✅ These should all work
import { Button } from "@/common/components";
import { animations } from "@/design-system";
import { useAsync } from "@/hooks/useAdvanced";

// Instead of
import { Button } from "../../../common/components/Button";
```

## Step 10: Documentation Review

Read in this order:

1. `REDESIGN_SUMMARY.md` - Overview of changes
2. `ARCHITECTURE.md` - How things are organized
3. `DESIGN_SYSTEM.md` - Component usage guide

## Troubleshooting

### Port already in use

```bash
# Use different port
npm run dev -- --port 3000
```

### Import errors

- Verify `vite.config.js` has path aliases
- Restart dev server
- Clear node_modules and reinstall

### Component not rendering

- Check Console for errors
- Verify component is exported from index.js
- Check CSS classes apply correctly

### Animations not smooth

- Open DevTools Performance tab
- Check for layout thrashing
- Verify GPU acceleration enabled

### Mobile menu not working

- Check useMediaQuery hook is functioning
- Verify Tailwind responsive classes work
- Check event handlers attached

## Success Criteria

✅ Home page loads without errors  
✅ All sections visible and styled  
✅ Responsive design works across devices  
✅ Animations smooth and performant  
✅ Components import cleanly  
✅ No console errors  
✅ Accessibility features working  
✅ Documentation is clear

## Next Steps

1. **Migrate Pages** - Update auth, recruiter, candidate pages
2. **Extend Design System** - Add new colors/variants as needed
3. **Build Features** - Use components as building blocks
4. **Performance** - Run Lighthouse and optimize
5. **Testing** - Add unit and integration tests

## Quick Reference

### Import Components

```jsx
import {
  Button,
  Card,
  Container,
  Section,
  Stack,
  Grid,
  Heading,
  Paragraph,
} from "@/common/components";
```

### Import Design System

```jsx
import {
  animations,
  buttonVariants,
  cardVariants,
  brandConfigs,
} from "@/design-system";
```

### Import Hooks

```jsx
import {
  useAsync,
  useFetch,
  useDebounce,
  useFormReducer,
  useMediaQuery,
} from "@/hooks/useAdvanced";
```

### Animation Quick Start

```jsx
<motion.div {...animations.fadeInUp}>Animated content</motion.div>
```

### Component Quick Start

```jsx
<Container>
  <Section id="features">
    <Grid columns={3} gap="lg">
      <Card variant="interactive">
        <Heading level={3}>Title</Heading>
        <Paragraph>Description</Paragraph>
      </Card>
    </Grid>
  </Section>
</Container>
```

## Support

- Ask questions in component JSDoc comments
- Review Home.jsx for real-world examples
- Check DESIGN_SYSTEM.md for detailed guides
- Review ARCHITECTURE.md for patterns

---

**Verification Date**: April 14, 2026  
**Last Updated**: April 14, 2026  
**All Systems**: ✅ GO
