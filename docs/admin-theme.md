Caternet ADMIN CONSOLE — THEME + NAVIGATION REDESIGN

You are a senior product designer and frontend engineer specializing in premium SaaS, hospitality software, and modern B2B administration interfaces.

The current Caternet Admin Console has already gone through a structural UI redesign, but the visual theme still feels too generic and template-like.

I now want you to perform a SECOND major UI pass focused specifically on:

1. A completely new visual theme
2. A redesigned sidebar
3. A fully collapsible sidebar
4. Better contrast between navigation and workspace
5. A more premium hospitality/SaaS aesthetic
6. Consistent design tokens across the entire application

IMPORTANT:

Do NOT redesign the application's business logic.

Do NOT change:

- routes
- APIs
- backend logic
- database models
- authentication
- permissions
- existing functionality
- data fetching
- existing workflows

This is a visual and interaction redesign.

---

1. OVERALL DESIGN DIRECTION

---

Move Caternet away from the current:

"white admin template + burgundy accent"

visual language.

The new visual direction should be:

"premium hospitality operations console"

Think:

- sophisticated
- calm
- premium
- warm
- modern
- operational
- trustworthy
- minimal
- slightly editorial
- professional enough for restaurants/catering businesses

The product should feel like a serious B2B SaaS product rather than an internal CRUD dashboard.

Use modern 2026 SaaS principles:

- quiet chrome
- strong typography
- restrained colors
- semantic color tokens
- subtle borders
- minimal shadows
- compact navigation
- excellent spacing
- intentional empty states
- clear status indicators
- collapsible navigation
- contextual actions
- high information density without feeling crowded

Do NOT blindly add trendy UI elements.

Do NOT use:

- glassmorphism
- neon gradients
- huge gradients
- excessive shadows
- floating blobs
- oversized rounded cards
- colorful icon boxes
- unnecessary charts
- excessive animation
- excessive pill components
- decorative illustrations

The design should feel mature.

---

2. NEW COLOR THEME

---

The biggest visual change should be the relationship between the sidebar and main workspace.

Use a DARK SIDEBAR + LIGHT WORKSPACE architecture.

The sidebar should visually anchor the application.

The main content should remain light and comfortable for long admin sessions.

---

3. COLOR TOKENS

---

Create a centralized semantic design token system.

Do NOT scatter hardcoded colors throughout components.

Use CSS variables/design tokens such as:

--background
--surface
--surface-elevated
--surface-subtle

--foreground
--foreground-secondary
--foreground-muted

--border
--border-subtle

--sidebar-background
--sidebar-foreground
--sidebar-muted
--sidebar-active
--sidebar-border

--primary
--primary-hover
--primary-subtle

--success
--success-subtle

--warning
--warning-subtle

--danger
--danger-subtle

Suggested palette:

MAIN WORKSPACE

Background:
#F7F6F3

Surface:
#FFFFFF

Surface subtle:
#FBFAF8

Primary text:
#181716

Secondary text:
#5F5C59

Muted text:
#8A8783

Border:
#E5E2DE

Subtle border:
#EEECE8

BRAND

Primary burgundy:
#74263A

Burgundy hover:
#61202F

Burgundy subtle:
#F4E8EC

SIDEBAR

Sidebar background:
#191817

Sidebar surface:
#211F1E

Sidebar text:
#F5F3F0

Sidebar muted:
#A9A5A0

Sidebar border:
#302E2C

Sidebar active background:
#3A252B

Sidebar active text:
#FFFFFF

SEMANTIC

Success:
#16845B

Success subtle:
#E9F6F0

Warning:
#B7791F

Warning subtle:
#FFF5DF

Danger:
#C24141

Danger subtle:
#FCECEC

Info:
#4D6B8A

Info subtle:
#EEF3F8

IMPORTANT:

These are starting tokens.

Inspect the existing Caternet brand and adjust the exact values if necessary so the burgundy remains recognizable.

Do not introduce a rainbow of accent colors.

---

4. MAIN CONTENT BACKGROUND

---

The current main background feels too flat and slightly gray.

Replace it with a sophisticated warm-neutral background.

Use:

#F7F6F3

or a visually equivalent warm neutral.

The purpose is to create subtle separation:

DARK SIDEBAR
↓
WARM WORKSPACE
↓
WHITE SURFACES

The page should NOT look like:

gray background + random white boxes.

Instead, the surfaces should feel like part of a coherent workspace.

Use very subtle tonal differences.

---

5. SIDEBAR REDESIGN

---

Completely redesign the sidebar.

Current sidebar is too visually similar to the main content.

The new sidebar should be a strong dark vertical navigation rail.

Desktop expanded width:

240px–252px

Collapsed width:

64px–72px

Recommended:

Expanded: 248px
Collapsed: 68px

Use a smooth width transition around:

200–250ms

---

6. SIDEBAR STRUCTURE

---

Expanded sidebar:

TOP

[ Caternet logo ]

Caternet
Admin Console

NAVIGATION

MAIN

Dashboard
Vendors
Users

SYSTEM

Settings

BOTTOM

Admin avatar
Admin
admin@Caternet.com

Account menu

---

7. SIDEBAR BRAND AREA

---

The top branding should feel premium.

Example:

[ Caternet logo ] Caternet
Admin Console

Keep the logo exactly as provided by the project if available.

Do NOT replace the real Caternet logo with a generic icon.

The branding area should have enough breathing room but should not consume excessive vertical space.

---

8. SIDEBAR NAVIGATION

---

Navigation items should be compact.

Height:

40–42px

Border radius:

8px

Horizontal padding:

10–12px

Icon:

17–18px

Text:

14px

Font weight:

500

Use Lucide or the project's existing icon system consistently.

---

9. SIDEBAR ACTIVE STATE

---

Do NOT use the large burgundy rounded rectangle currently used.

Instead use a sophisticated dark-sidebar active state.

Example:

background:
#3A252B

text:
#FFFFFF

icon:
#FFFFFF

Optionally add a very subtle burgundy indicator on the left:

2–3px vertical accent

The active state should feel integrated into the dark sidebar.

It should NOT look like a giant button.

---

10. SIDEBAR HOVER STATE

---

Default:

transparent

Hover:

#242220

Active:

#3A252B

Transitions:

150–180ms ease-out

Do not make hover effects dramatic.

---

11. SIDEBAR SECTION LABELS

---

Use subtle uppercase section labels:

MAIN
SYSTEM

Typography:

11px–12px
font-weight: 600
letter-spacing: 0.08em

Color:

#8F8A85

These labels should be understated.

---

12. COLLAPSIBLE SIDEBAR

---

Implement a REAL collapsible sidebar.

This is a core requirement.

Expanded:

248px

Collapsed:

68px

When collapsed:

- hide all navigation labels
- hide "Admin Console"
- hide section labels
- keep icons visible
- keep Caternet logo/mark visible
- keep navigation vertically aligned
- keep active states
- show tooltips on hover/focus

Example collapsed state:

┌────────┐
│ logo │
│ │
│ ▦ │
│ ▤ │
│ ♙ │
│ │
│ ⚙ │
│ │
│ AD │
└────────┘

---

13. COLLAPSE CONTROL

---

Add a proper sidebar collapse button.

Place it near the bottom of the sidebar or near the branding/navigation boundary depending on the existing layout.

Use a familiar icon:

PanelLeft
PanelLeftClose
PanelLeftOpen

Do NOT use text like:

"Collapse sidebar"

unless shown in a tooltip.

The button should have:

- hover state
- focus state
- tooltip
- accessible label

---

14. SIDEBAR STATE PERSISTENCE

---

Persist the sidebar state.

If the user collapses the sidebar and refreshes the page, it should remain collapsed.

Use localStorage or the application's existing preference mechanism.

Example:

Caternet-sidebar-collapsed=true

Do not reset the state on every route change.

---

15. ROUTE TRANSITIONS

---

When navigating between:

Dashboard
Vendors
Users
Settings

the sidebar should NOT visually jump between widths.

The layout should remain stable.

The main content should smoothly reflow when the sidebar expands/collapses.

---

16. COLLAPSED TOOLTIPS

---

When collapsed, every navigation icon must have an accessible tooltip.

Example:

hover:

[ Dashboard ]

The tooltip should say:

Dashboard

Similarly:

Vendors
Users
Settings

The tooltip should not appear immediately.

Use a short delay around:

300–500ms

Do not make tooltips visually heavy.

---

17. MOBILE SIDEBAR

---

On mobile, do NOT simply shrink the desktop sidebar.

Use a mobile drawer.

Behavior:

- sidebar hidden by default
- hamburger/menu button opens drawer
- drawer overlays the workspace
- add subtle backdrop
- clicking outside closes it
- Escape closes it
- navigation selection closes it

Desktop:

persistent sidebar

Mobile:

off-canvas drawer

---

18. MAIN APP SHELL

---

The entire application should follow:

Sidebar

- Workspace

Do NOT place the main content inside another giant bordered container.

The workspace should feel like an open canvas.

Structure:

┌──────────────────────────────────────────────┐
│ Dark sidebar │ Top utility bar │
│ ├──────────────────────────────┤
│ │ │
│ │ Main content │
│ │ │
│ │ │
└──────────────────────────────────────────────┘

---

19. TOP BAR

---

Keep the top bar extremely minimal.

Background:

#F7F6F3

Border bottom:

#E5E2DE

Height:

56px–60px

Contents:

LEFT:

Breadcrumb/context

RIGHT:

Search
Admin avatar
Account menu

Avoid unnecessary buttons.

---

20. BREADCRUMBS

---

Use a subtle breadcrumb.

Example:

Caternet / Dashboard

Current page:

dark text

Parent:

muted text

Do not make breadcrumbs oversized.

---

21. SEARCH

---

Keep the global search.

Redesign it to fit the new theme.

Example:

[ Search ⌘K ]

Height:

36–38px

Background:

#FFFFFF

Border:

#E5E2DE

Radius:

8px

Do not make it excessively wide.

---

22. MAIN CONTENT CONTAINER

---

Use:

max-width:
1400px

padding:

desktop:
32–40px

tablet:
24px

mobile:
16px

The workspace should breathe, but avoid the huge empty areas present in the old design.

---

23. DASHBOARD PAGE

---

The dashboard should inherit the new theme.

Do NOT redesign it into a colorful analytics dashboard.

Keep the current useful information architecture:

Dashboard
Overview
Vendor activity
Pending approvals
Quick actions

But make it visually consistent with the new theme.

---

24. KPI CARDS

---

Keep KPI cards white.

Do not give each card a different colored background.

Use:

background:
#FFFFFF

border:
1px solid #E5E2DE

radius:
10–12px

minimal/no shadow

The cards should feel like data surfaces rather than decorative boxes.

Example:

Total vendors

0

0 vendor accounts

The number should be the strongest visual element.

---

25. CARD ICONS

---

Avoid the old:

large icon inside colored square

pattern.

Icons should be smaller and quieter.

Possible layout:

Total vendors icon

0

0 vendor accounts

Use the icon only as secondary context.

---

26. CARD SHADOWS

---

Do NOT use strong shadows.

Default:

box-shadow: none

Use borders for separation.

If elevation is necessary:

use an extremely subtle shadow.

---

27. TABLES

---

Tables should become one of the strongest parts of the design.

Use:

white surface
subtle border
minimal separators
comfortable density

Row height:

48–52px

Header:

12px
font-weight: 600
muted

Body:

13–14px

Avoid boxed cells.

---

28. STATUS BADGES

---

Status should be semantic.

Examples:

Live
Pending
Suspended

Use:

small dot + text

rather than oversized pills.

Example:

● Live

or:

● Pending

Use subtle tinted backgrounds only where helpful.

---

29. EMPTY STATES

---

Empty states should fit the new premium theme.

Instead of:

"No vendors found"

in the middle of a giant empty white area,

use:

small icon

No vendors yet

Vendors added to Caternet will appear here.

[ Add vendor ]

Keep it understated.

Do not use cartoon illustrations.

---

30. QUICK ACTIONS

---

Quick actions should look like actionable navigation rather than another giant card.

Example:

Quick actions

Add vendor →
Review pending →
Manage users →

Use compact rows.

---

31. TYPOGRAPHY

---

Continue using a modern sans-serif font.

Preferred:

Geist

Fallback:

Inter,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif

Do NOT bring back serif headings.

Typography should be one of the primary visual tools.

---

32. PAGE HEADERS

---

Page headers should be restrained.

Example:

Dashboard

Monitor your vendor operations and approvals.

Avoid giant headings.

Recommended:

28–32px
font-weight: 600
letter-spacing: -0.025em

---

33. SPACING SYSTEM

---

Create a consistent spacing system.

Use multiples around:

4px
8px
12px
16px
20px
24px
32px
40px
48px

Avoid arbitrary spacing values throughout the application.

---

34. BORDER RADIUS

---

Use restrained radius.

Suggested:

6px
8px
10px
12px
14px

Do not make every component look like a pill.

---

35. MOTION

---

Use subtle animation.

Sidebar:

200–250ms

Navigation:

150ms

Dropdown:

150ms

Modal:

150–200ms

Use ease-out.

Do not add excessive page animations.

The UI should feel fast.

---

36. THEME ARCHITECTURE

---

IMPORTANT:

Do not implement the new theme by changing random CSS values across individual pages.

Create a centralized design token architecture.

The goal should be:

Changing the sidebar color should require changing ONE token.

Changing the workspace background should require changing ONE token.

Changing the brand color should require changing ONE token.

Components should consume semantic tokens.

---

37. VISUAL HIERARCHY

---

The visual hierarchy should be:

1. Current page/content
2. Important data
3. Primary actions
4. Navigation
5. Secondary information
6. Decorative elements

Do NOT let the sidebar or cards compete with the content.

---

38. CATERING / HOSPITALITY PERSONALITY

---

The application is Caternet, a catering platform.

The UI should have a subtle hospitality character.

However:

DO NOT add:

- food illustrations everywhere
- chef graphics
- restaurant stock imagery
- food emojis
- excessive brown/orange colors

Instead communicate hospitality through:

- warm neutrals
- sophisticated burgundy
- calm surfaces
- premium typography
- elegant spacing

The product should feel "hospitality" without looking themed like a restaurant website.

---

39. RESPONSIVE BEHAVIOR

---

Test the redesign at:

1440px
1280px
1024px
768px
390px

At 1440px:

Sidebar:
248px

At collapsed desktop:

Sidebar:
68px

At mobile:

Sidebar:
off-canvas drawer

Main content must never become horizontally clipped.

---

40. ACCESSIBILITY

---

The sidebar must be fully keyboard accessible.

Requirements:

- semantic navigation
- keyboard focus
- visible focus ring
- accessible collapse button
- accessible tooltips
- Escape closes mobile drawer
- focus should not become trapped incorrectly
- sufficient contrast
- navigation items must have accessible names when collapsed

Never rely solely on color to communicate active state.

---

41. DO NOT BREAK FUNCTIONALITY

---

Before changing the UI:

inspect the existing code.

Understand:

- routing
- layout structure
- shared components
- navigation
- authentication
- permissions
- API calls
- state management

Then refactor the visual layer.

Do not rewrite backend logic unnecessarily.

---

42. IMPLEMENTATION ORDER

---

Follow this exact sequence:

PHASE 1

Audit current application architecture.

PHASE 2

Create centralized theme/design tokens.

PHASE 3

Redesign app shell.

PHASE 4

Implement dark collapsible sidebar.

PHASE 5

Implement persistent sidebar state.

PHASE 6

Implement mobile drawer behavior.

PHASE 7

Update top navigation.

PHASE 8

Update Dashboard.

PHASE 9

Update Vendors.

PHASE 10

Apply theme consistently to Users and Settings.

PHASE 11

Update tables, forms, dialogs, badges and empty states.

PHASE 12

Perform responsive/accessibility pass.

---

43. FINAL VISUAL TARGET

---

The final interface should visually communicate:

"Caternet is a serious, premium hospitality operations platform."

NOT:

"This is a Tailwind admin template."

The visual relationship should be:

DARK SIDEBAR
↓
WARM LIGHT WORKSPACE
↓
WHITE DATA SURFACES
↓
BURGUNDY PRIMARY ACTIONS
↓
SUBTLE SEMANTIC STATUS COLORS

The sidebar should be the visual anchor.

The workspace should remain calm and light.

The data should be the focus.

---

44. FINAL QUALITY CHECK

---

Before finishing, inspect the entire application and verify:

[ ] Dark premium sidebar implemented
[ ] Sidebar collapses to ~68px
[ ] Sidebar expands to ~248px
[ ] Collapse state persists
[ ] Tooltips work in collapsed mode
[ ] Mobile drawer implemented
[ ] Main background changed
[ ] White cards remain visually distinct
[ ] Burgundy remains the Caternet brand accent
[ ] No serif UI typography
[ ] Geist/modern sans-serif used consistently
[ ] No excessive shadows
[ ] No excessive rounded cards
[ ] No unnecessary gradients
[ ] Navigation is visually polished
[ ] Active navigation state is subtle
[ ] Tables are modern
[ ] Status indicators are semantic
[ ] Empty states are intentional
[ ] Loading states remain polished
[ ] Forms remain consistent
[ ] Existing functionality still works
[ ] Existing routes still work
[ ] Desktop layout works
[ ] Tablet layout works
[ ] Mobile layout works
[ ] Keyboard navigation works
[ ] Focus states work

MOST IMPORTANT:

Do not simply recolor the existing interface.

This should feel like a genuine visual redesign of the Caternet product.

The goal is:

OLD:
Generic light admin dashboard

NEW:
Premium dark-sidebar + warm-light-workspace hospitality SaaS console.

Prioritize visual coherence, restraint, and professional product quality over adding more UI elements.
