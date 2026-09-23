Caternet Admin Console — Complete UI/UX Redesign
ROLE

You are a senior product designer + frontend engineer specializing in modern SaaS dashboards and admin applications.

You are redesigning the existing Caternet Admin Console.

The current interface works functionally, but its visual language feels outdated and template-like. The goal is to transform it into a professional, polished, modern 2026 SaaS administration interface while preserving all existing functionality, routes, backend integrations, permissions, and data behavior.

This is a complete design-system-level redesign, not a cosmetic restyling of individual pages.

1. PRIMARY DESIGN GOAL

Transform Caternet from:

"generic old admin dashboard"

into:

"premium modern catering operations platform"

The final interface should feel like a product that could be confidently shown to:

restaurant/catering business owners
enterprise customers
investors
partners
professional operators

The visual quality should be comparable to modern products such as:

Linear
Stripe Dashboard
Vercel
Attio
Notion
Mercury
modern Shopify admin interfaces

Do not copy any of these products directly.

Instead, borrow their design principles:

restrained visual hierarchy
excellent typography
compact but comfortable information density
minimal chrome
subtle borders
strong spacing system
clear navigation
purposeful color
excellent empty states
polished interactions
consistent components

Modern 2026 SaaS dashboards are increasingly moving away from overly decorative card grids and toward quieter interfaces where typography, spacing, data structure, and semantic color create hierarchy.

2. IMPORTANT — DO NOT CHANGE THE PRODUCT FUNCTIONALITY

This is a UI/UX redesign.

Do NOT:

remove existing functionality
remove routes
remove backend logic
change database models
change API behavior
change authentication
change permissions
change business logic
rename existing functionality unless absolutely necessary
replace working functionality with mock data

The existing application should continue working exactly as before.

Only improve:

layout
typography
spacing
visual hierarchy
colors
components
responsiveness
interaction states
navigation
tables
cards
forms
empty states
loading states
buttons
modals
dropdowns
status indicators

First inspect the existing codebase and understand the current architecture before modifying anything.

3. DESIGN DIRECTION
   Overall aesthetic

Use:

Premium SaaS + modern operations console + subtle catering personality

The interface should be:

clean
sophisticated
calm
warm
professional
highly usable
slightly editorial
modern
information-dense without feeling crowded

Avoid making it look like:

Bootstrap
AdminLTE
generic Tailwind dashboard
old enterprise software
Dribbble concept UI
overly colorful analytics dashboard
AI-generated dashboard template

The UI should feel designed, not assembled from generic components.

4. LIGHT MODE FIRST

The primary interface should remain light mode.

Do NOT turn this into a dark dashboard.

Use a sophisticated warm-neutral light palette.

Suggested foundation:

Page background:
#FAF9F7

Surface:
#FFFFFF

Elevated surface:
#FFFFFF

Primary text:
#171717

Secondary text:
#666666

Muted text:
#8A8A8A

Border:
#E7E4E1

Subtle border:
#EFEEEC

Primary brand:
#74263A

Primary brand hover:
#60202F

Primary brand subtle:
#F5EAED

Success:
#16845B

Success subtle:
#EAF7F1

Warning:
#B7791F

Warning subtle:
#FFF7E6

Danger:
#C24141

Danger subtle:
#FDEEEE

Important:

Do not introduce lots of accent colors.

The Caternet burgundy/maroon should remain the primary brand color.

Use color primarily for:

primary actions
active navigation
status
alerts
important data

Do not color every card and icon.

5. TYPOGRAPHY — MAJOR PRIORITY

The current serif typography is one of the biggest reasons the application feels dated.

Remove the current serif heading style.

Do NOT use a serif font for:

page titles
section titles
cards
navigation
buttons
tables

Use a modern sans-serif UI typeface.

Preferred font

Use:

Geist Sans

with appropriate fallbacks:

font-family:
Geist,
Inter,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif;

Geist is specifically designed for modern product interfaces and provides a precise, restrained visual language.

If Geist is already available in the project, use it.

If not, implement it properly rather than approximating it with a random font.

6. TYPOGRAPHY SYSTEM

Create a consistent typography scale.

Page title
28–32px
font-weight: 600
line-height: 1.15
letter-spacing: -0.025em

Example:

Dashboard

NOT:

Dashboard in giant serif typography.

Section title
18–20px
font-weight: 600
letter-spacing: -0.015em
Body
14–15px
font-weight: 400
line-height: 1.5
Navigation
14px
font-weight: 500

Active:

font-weight: 600
Labels
12–13px
font-weight: 500

Use uppercase sparingly.

KPI numbers
28–32px
font-weight: 600
letter-spacing: -0.03em

Numbers should feel prominent without becoming enormous.

7. DESIGN SYSTEM — BUILD THIS FIRST

Do not redesign each page independently.

Create a reusable design system.

Define tokens for:

colors
typography
spacing
radius
borders
shadows
transitions
z-index
container widths

Use semantic tokens rather than hardcoding colors throughout components.

For example:

--background
--surface
--surface-subtle
--foreground
--foreground-muted
--border
--border-subtle
--primary
--primary-hover
--success
--warning
--danger

This should make the entire application visually consistent.

Modern dashboard systems increasingly rely on semantic tokens so the interface can evolve without manually restyling every component.

8. APP SHELL

Redesign the entire application shell.

Current:

Sidebar

- Huge empty content area

Create a more refined:

┌─────────────────────────────────────────────────────────┐
│ Sidebar │ Top utility/header │
│ ├───────────────────────────────────────────────┤
│ │ │
│ │ Main content │
│ │ │
│ │ │
└─────────────────────────────────────────────────────────┘
Sidebar

Keep the sidebar, but completely redesign it.

Target width:

240–256px

It should feel like a professional SaaS application rather than an old admin template.

Sidebar structure

Top:

[ Caternet logo ]

Caternet
Admin Console

Then navigation:

MAIN

Dashboard
Vendors
Users

Then potentially:

SYSTEM

Settings

Use clear grouping.

9. SIDEBAR DESIGN

Remove:

oversized active pill
excessive burgundy background
heavy rounded rectangle around active navigation
dated icon styling
unnecessary borders

Instead:

Default navigation
icon Dashboard
icon Vendors
icon Users

Subtle neutral text.

Active navigation

Use a subtle tinted background.

Example:

background: #F5EAED
color: #74263A
font-weight: 600

Border radius:

8px

Keep it compact.

The active state should be obvious but sophisticated.

10. SIDEBAR BRANDING

Improve the Caternet brand header.

Instead of:

[large icon]
Caternet
Admin Console

Create:

[logo] Caternet
Admin Console

Keep it compact.

If the existing Caternet logo is available in the codebase, use the real logo.

Do not recreate it using generic icons.

11. USER ACCOUNT AREA

The bottom-left account area should look much more polished.

Instead of:

admin@Caternet.com
admin@Caternet.com

Sign out

Use something like:

┌────────────────────────────┐
│ AD Admin │
│ admin@Caternet.com │
│ ⋯ │
└────────────────────────────┘

Clicking it can open:

Account
Settings
Sign out

Do not waste vertical space.

12. TOP BAR

Add a subtle top utility bar where appropriate.

Potential structure:

Dashboard / Vendors

                         Search    Help    Admin avatar

Keep it extremely clean.

Do not create a giant navbar.

13. MAIN CONTENT WIDTH

Do not allow content to stretch endlessly across large desktop screens.

Use:

max-width: 1400px

with responsive horizontal padding.

Example:

desktop:
32px–40px

large desktop:
40px–48px

tablet:
24px

mobile:
16px

The current screenshots have too much unused horizontal space in some areas and insufficient information density.

14. PAGE HEADER

Every page should have a consistent page header.

Example:

Dashboard

Monitor your vendor operations and approvals.

                                    [optional action]

For Vendors:

Vendors

Review and manage vendors registered on Caternet.

                              [Add vendor]

Use:

Title
Supporting description
Optional primary action

Do not use overly large headings.

15. DASHBOARD REDESIGN

Completely redesign the current Dashboard.

The current:

4 huge cards

- 2 giant empty panels

looks dated.

Instead create a modern operations dashboard.

Suggested structure:

Dashboard
Good afternoon, Admin.

────────────────────────────────────────

Overview

[ Total vendors ] [ Pending approval ] [ Live ] [ Suspended ]

────────────────────────────────────────

Vendor activity

┌──────────────────────────────────────┐
│ Recent vendors │
│ │
│ vendor location status added │
│ ... │
└──────────────────────────────────────┘

┌─────────────────────┐ ┌──────────────┐
│ Pending approvals │ │ Quick actions│
│ │ │ │
│ 3 vendors │ │ Review │
│ need attention │ │ vendors │
└─────────────────────┘ └──────────────┘

Do not add charts simply because modern dashboards have charts.

Only use visualizations if the underlying data actually benefits from visualization.

Modern dashboards increasingly favor useful structured data over decorative charts.

16. KPI COMPONENTS

Redesign the existing KPI cards.

Current cards are too:

tall
decorative
icon-heavy
spacious
generic

Instead:

Total vendors

128
↑ 12% this month

Use small supporting icon if useful, but don't put a giant icon inside a rounded colored square.

Possible layout:

┌──────────────────────────┐
│ Total vendors ⋯ │
│ │
│ 128 │
│ ↑ 12% vs last month │
└──────────────────────────┘

Height:

120–140px

Keep them compact.

17. CARDS

Cards should no longer look like floating boxes everywhere.

Use cards selectively.

Default:

background: white
border: 1px solid #E7E4E1
border-radius: 12px

Avoid:

large shadows
strong gradients
huge corner radius
thick borders
colored backgrounds everywhere

Prefer borders over shadows.

Use shadows only when an element genuinely floats above the interface.

18. BORDER RADIUS

Create a consistent radius system.

sm: 6px
md: 8px
lg: 12px
xl: 16px
pill: 999px

Do not make everything extremely rounded.

Professional enterprise/SaaS products usually use restrained radii.

19. VENDORS PAGE

The Vendors page should become a professional data management interface.

Current:

Tabs
Search
Huge table

Keep the same basic information architecture but improve it significantly.

Target:

Vendors

Manage vendor accounts and approval status.

[Search vendors...] [Add vendor]

All Pending Live Suspended

────────────────────────────────────────────────────────

Vendor Location Contact Status Added Actions
────────────────────────────────────────────────────────

... 20. TABLE DESIGN

Tables are extremely important.

Use a modern SaaS table design.

Header
font-size: 12px
font-weight: 500
color: muted

Potentially uppercase with modest letter spacing, but do not overdo it.

Rows

Height:

52–60px
Borders

Only subtle horizontal separators.

Avoid boxed cells.

Hover
background: #FAFAF9
Status

Use semantic badges.

Example:

● Live
● Pending
● Suspended

Use subtle tinted backgrounds.

Example:

Live:
background #EAF7F1
color #16845B 21. SEARCH

Redesign the search field.

Current search looks like a generic form input.

Create:

[⌕ Search vendors... ]

Height:

38–40px

Border:

1px solid #E7E4E1

Focus:

border: primary
box-shadow: 0 0 0 3px rgba(...)

If appropriate, support:

⌘ K

or:

Ctrl K

for global search.

22. FILTER TABS

Redesign:

All
Pending
Live
Suspended

Avoid the chunky old segmented control.

Use either:

Option A — underline tabs
All Pending Live Suspended
────

or

Option B — subtle segmented navigation
All Pending Live Suspended

with only the active item receiving a subtle background.

Choose whichever fits the final visual system best.

23. EMPTY STATES

This is very important.

The current:

No vendors found

looks unfinished.

Create intentional empty states.

Example:

                 [simple line icon]

             No vendors yet

        Vendors you add will appear here.

              [Add vendor]

For filtered results:

No vendors match your search

Try changing your search or clearing the filters.

             [Clear filters]

Do not use giant illustrations.

Keep empty states minimal and professional.

24. LOADING STATES

Do not leave blank white boxes while data loads.

Implement:

skeleton loaders
table skeletons
KPI skeletons
button loading states
page-level loading states

Skeletons should use subtle neutral animation.

25. ERROR STATES

Create a consistent error component.

Example:

Unable to load vendors

Something went wrong while retrieving your vendor list.

[Try again]

Use semantic red only where necessary.

26. BUTTON SYSTEM

Create a reusable button system.

Primary
background: #74263A
color: white
Secondary
background: white
border: #E7E4E1
Ghost

Transparent.

Destructive

Use red only for destructive actions.

Buttons should generally be:

36–40px high
8px radius
13–14px text
font-weight: 500/600

Avoid oversized buttons.

27. ICONS

Use one consistent icon system.

Prefer:

Lucide Icons

or the project's existing professional icon library if one already exists.

Do not mix:

Font Awesome
random SVG icons
emojis
Material icons
arbitrary icon packs

Use approximately:

16–18px

Icons should support the text, not dominate it.

28. STATUS SYSTEM

Create reusable status components.

Example:

Live
Pending
Suspended
Rejected
Active
Inactive

Use:

small dot

- text

Example:

● Live

The dot should be semantic.

Do not make huge colored badges.

29. FORMS

All forms throughout the application should use the same design language.

Inputs:

height: 40–44px
border: 1px solid #E7E4E1
radius: 8px
padding: 0 12px
font-size: 14px

Focus:

border: brand
subtle focus ring

Labels:

13px
font-weight: 500

Helper text:

12–13px
muted

Errors:

12–13px
semantic red 30. MODALS / DRAWERS

Use modern dialogs.

Do not make huge centered boxes.

Prefer:

width: 420–560px
border-radius: 14px
background: white

with:

Header
Content
Footer

For complex vendor details, consider a right-side drawer instead of a giant modal.

Example:

┌───────────────────────────┐
│ Vendor details × │
├───────────────────────────┤
│ │
│ Vendor information │
│ │
│ Contact │
│ │
│ Status │
│ │
├───────────────────────────┤
│ Cancel Approve │
└───────────────────────────┘

This is especially appropriate for admin workflows.

31. MOTION / ANIMATION

Use subtle motion.

Do NOT make the dashboard flashy.

Recommended:

150–200ms
ease-out

Use motion for:

sidebar transitions
dropdowns
dialogs
drawers
hover states
tab transitions
skeletons
toast notifications
page transitions where appropriate

Avoid:

excessive bouncing
large page animations
parallax
animated gradients
unnecessary movement

The product should feel fast.

32. MICRO-INTERACTIONS

Add subtle polish:

Buttons

Hover:

slightly darker
Table rows

Hover:

subtle background
Navigation

Smooth active transition.

Copy buttons

Show:

Copied
Approve action

Show immediate feedback:

Vendor approved

using a toast.

These small details make the application feel significantly more premium.

33. RESPONSIVE DESIGN

The current desktop UI should not simply be shrunk for mobile.

Design proper responsive behavior.

Desktop
Sidebar visible
Main content spacious
Tables full width
Tablet
Sidebar reduced/collapsible
Content padding reduced
Mobile

Use:

top navigation
hamburger/sidebar drawer

Tables should become:

horizontally scrollable where appropriate

or:

responsive stacked rows/cards when appropriate.

Do NOT allow the entire desktop layout to overflow the viewport.

34. ACCESSIBILITY

The redesign must remain accessible.

Implement:

proper semantic HTML
keyboard navigation
visible focus states
accessible buttons
accessible form labels
appropriate ARIA where required
sufficient color contrast
don't rely on color alone for status

Do not sacrifice accessibility for aesthetics.

35. DESKTOP INFORMATION DENSITY

One of the biggest changes should be better use of space.

The screenshots currently have enormous areas of unused whitespace.

Do not simply make everything bigger.

Instead:

less decorative padding

- better content hierarchy
- more useful information
- compact components

The goal is:

comfortable density

Not:

maximum density

and not:

giant empty cards.

36. DASHBOARD EMPTY STATE

Because the screenshots currently show zero vendors, make the zero-data dashboard look intentional.

Do not make it feel like the application is broken.

Example:

Overview

0 vendors
0 pending approvals
0 active accounts
0 suspended

──────────────────────────────

Vendor activity

        No vendor activity yet

        Once vendors are added,
        their activity will appear here.

        [Add vendor]

This should look like a designed first-run experience.

Modern SaaS products treat onboarding and empty states as part of the product experience rather than simply displaying "No data."

37. SETTINGS PAGE

Redesign Settings using a modern settings architecture.

Instead of one long form, use:

Settings

General
Account
Notifications
Security

Left-side settings navigation:

General
Account
Notifications
Security

Right:

section title
description
form
save button

Use progressive disclosure.

38. CONSISTENCY ACROSS ALL PAGES

This is extremely important.

After redesigning Dashboard and Vendors, inspect every other page.

Everything must use the same:

typography
spacing
button styles
input styles
card styles
border styles
status badges
icons
navigation
page headers
tables
dialogs
empty states
loading states
toast notifications

Do not create one beautiful Dashboard while leaving the other pages using the old design.

39. DO NOT OVERDESIGN

This is a professional administration application.

Avoid:

❌ gradients everywhere
❌ glassmorphism
❌ giant rounded cards
❌ neon colors
❌ huge illustrations
❌ excessive shadows
❌ animated backgrounds
❌ excessive charts
❌ oversized typography
❌ excessive icons
❌ decorative blobs
❌ random accent colors
❌ excessive badges
❌ fake analytics

Instead:

✅ typography
✅ spacing
✅ hierarchy
✅ data
✅ subtle borders
✅ restrained color
✅ good interaction design

40. VISUAL REFERENCE

Use the following design philosophy:

Linear

Borrow:

compact navigation
information density
restrained color
subtle borders
keyboard-friendly interactions
Stripe

Borrow:

excellent tables
strong hierarchy
professional financial/operational feel
excellent forms
Vercel / Geist

Borrow:

typography
spacing discipline
minimal chrome
monochrome foundation
precise UI components

Vercel's Geist system explicitly centers a high-contrast, consistent design system with dedicated typography, colors, grid, and components.

Attio

Borrow:

modern data-management interfaces
clean tables
contextual actions
sophisticated empty states
Mercury

Borrow:

premium financial-product feeling
restrained color
polished surfaces 41. IMPLEMENTATION PROCESS

Do NOT immediately start editing random components.

Follow this sequence:

Step 1 — Audit

Inspect the entire codebase.

Identify:

framework
styling system
component system
layout architecture
routes
shared components
font setup
icons
tables
forms
modals
navigation
Step 2 — Create the design system

Before redesigning individual pages, establish:

colors
typography
spacing
radii
borders
shadows
buttons
inputs
badges
cards
tables
navigation
dialogs
toasts
empty states
skeletons
Step 3 — Redesign application shell

Implement:

Sidebar
Topbar
Main content container
Responsive navigation
Account menu
Step 4 — Redesign Dashboard

Use the new design system.

Step 5 — Redesign Vendors

Use the same design system.

Step 6 — Redesign remaining pages

Apply the same visual language everywhere.

Step 7 — Responsive pass

Test:

1440px
1280px
1024px
768px
390px
Step 8 — Interaction pass

Test:

hover
focus
active
disabled
loading
success
error
empty
long text
large datasets 42. QUALITY BAR

When finished, compare the result against the original screenshots.

The new interface should feel like a completely different generation of product.

The difference should be immediately obvious.

Current feeling:

Old admin template / internal tool

Desired feeling:

Modern SaaS operations platform / premium B2B product

43. FINAL DESIGN CHECKLIST

Before considering the redesign complete, verify:

Typography
No outdated serif UI typography
Geist/modern sans-serif used consistently
Clear type hierarchy
Correct font weights
Numbers visually strong
Secondary text appropriately muted
Layout
Modern sidebar
Clean top navigation
Consistent page headers
Better information density
No unnecessary giant whitespace
Responsive layouts
Components
Modern buttons
Modern inputs
Modern tables
Modern tabs
Modern badges
Modern dialogs
Modern dropdowns
Modern toasts
Skeleton loaders
Empty states
Visual
Warm white background
Caternet burgundy used as primary accent
Restrained color palette
Minimal shadows
Subtle borders
Consistent 6–16px radius system
No excessive gradients
No excessive rounded cards
UX
Keyboard accessible
Visible focus states
Loading states
Error states
Empty states
Success feedback
Responsive
Existing functionality preserved 44. MOST IMPORTANT INSTRUCTION

Do not interpret this task as "make the existing UI prettier."

Treat it as:

"Build a cohesive, production-quality 2026 design system for Caternet and migrate the entire admin console to that system."

The final result should look intentional down to the smallest details.

Every spacing value, font size, border, icon, color, hover state, empty state, and interaction should feel like it belongs to the same product.

Prioritize polish and consistency over adding more UI elements.

The interface should feel quiet, premium, modern, fast, and trustworthy.
