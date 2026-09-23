# Catering App --- Mobile UI Implementation Guide

## Purpose

This document is the implementation specification for redesigning the
customer-facing mobile catering app.

The goal is to replace the existing outdated UI with a polished, modern
2026-style experience based on the four approved screen designs:

1.  Home
2.  Caterer Details
3.  Search
4.  My Bookings

The implementation should preserve all existing business logic, API
integrations, authentication, booking functionality, and data models
unless a change is explicitly required for the new UI.

**Important:** Treat the supplied UI designs as the visual source of
truth. Do not redesign the screens independently once implementation
starts.

------------------------------------------------------------------------

# 1. Overall Design Direction

## Visual personality

The app should feel:

-   Modern
-   Premium but approachable
-   Food-focused
-   Clean
-   Warm
-   Trustworthy
-   Fresh
-   Mobile-first
-   Easy to scan
-   Appropriate for an Ethiopian catering marketplace

Avoid making the interface look like a generic restaurant template.

The visual language should combine:

-   Warm off-white backgrounds
-   White content surfaces
-   Fresh green as the primary brand color
-   Dark charcoal typography
-   Soft borders
-   Large rounded corners
-   High-quality food imagery
-   Spacious layouts
-   Minimal visual noise
-   Clear hierarchy
-   Subtle interaction feedback

------------------------------------------------------------------------

# 2. Color System

Use the following color system consistently.

## Primary brand green

``` text
Primary Green: #16A34A
Dark Green:    #087443
Light Green:   #DCFCE7
Soft Green:    #EFFAF2
```

The primary green should be the main action color.

Use it for:

-   Active navigation
-   Primary buttons
-   Selected chips
-   Ratings
-   Verification indicators
-   Important links
-   Success states
-   Brand accents

Do not make the entire application green.

## Background

``` text
App Background: #FAF8F3
```

The main background should be a warm off-white rather than pure white.

## Surfaces

``` text
Card Background: #FFFFFF
Soft Surface:    #F6FBF7
```

Cards should generally be white against the warm background.

## Text

``` text
Primary Text:   #172126
Secondary Text: #64727A
Muted Text:     #8A959B
```

Use dark charcoal instead of pure black.

## Borders

``` text
Border: #E5E2D9
```

Borders should be subtle.

Avoid heavy outlines.

## Status colors

``` text
Success: #16A34A
Success Background: #DCFCE7

Warning: #D97706
Warning Background: #FEF3C7

Danger: #DC3B2F
Danger Background: #FEE2E2

Info: #2563EB
Info Background: #DBEAFE
```

------------------------------------------------------------------------

# 3. Typography

Use the existing application font if it is already configured and
visually close to the designs.

Preferred typography characteristics:

-   Modern sans-serif
-   Strong bold headings
-   Comfortable body text
-   High readability
-   Slightly tight heading line-height

Suggested hierarchy:

``` text
Screen Title:
28–34px
font-weight: 700–800

Large Hero Heading:
34–40px
font-weight: 700–800

Section Heading:
22–26px
font-weight: 700

Card Heading:
17–20px
font-weight: 700

Body:
14–16px
font-weight: 400–500

Small Metadata:
12–14px
font-weight: 400–500
```

Do not use excessive font sizes on small screens.

------------------------------------------------------------------------

# 4. Shape Language

The application should use a consistent rounded visual system.

Suggested radius values:

``` text
Small: 12px
Medium: 16px
Large: 20px
XL: 24px
Pill: 999px
```

Use:

-   16--24px radius for major cards
-   Pill shapes for filters and badges
-   Rounded search fields
-   Rounded food images
-   Large rounded bottom navigation

Avoid sharp rectangular cards.

------------------------------------------------------------------------

# 5. Shadows

The designs should not rely on heavy shadows.

Prefer:

``` text
border: 1px solid #E5E2D9
```

and only extremely subtle shadows when needed.

Example:

``` css
box-shadow: 0 4px 20px rgba(20, 40, 30, 0.05);
```

Do not use large dark drop shadows.

------------------------------------------------------------------------

# 6. Spacing System

Use a consistent 4/8px spacing system.

Recommended values:

``` text
4px
8px
12px
16px
20px
24px
32px
40px
48px
```

For mobile screen horizontal padding:

``` text
16–24px
```

Prefer approximately 20px on most screens.

Keep enough whitespace around sections.

------------------------------------------------------------------------

# 7. Global Mobile Layout

All four pages should share the same application shell.

Structure:

``` text
Status Bar / Safe Area
        ↓
Page Content
        ↓
Scrollable Content
        ↓
Bottom Navigation
```

The bottom navigation should remain visually consistent across every
customer page.

Account should use the same navigation shell even if its content is not
part of this redesign phase.

------------------------------------------------------------------------

# 8. Bottom Navigation

The application must have exactly four primary navigation items:

``` text
Home
Search
My Bookings
Account
```

Recommended icons:

``` text
Home        → house
Search      → magnifying glass
My Bookings → calendar
Account     → user/profile
```

Use an icon library such as Lucide if the project already uses one.

Do not mix icon styles.

## Navigation design

The navigation should:

-   Sit near the bottom of the viewport
-   Have a white background
-   Have large rounded corners
-   Use subtle border/shadow
-   Have generous horizontal spacing
-   Clearly indicate the active page
-   Use green for active icon and label
-   Use muted gray for inactive items

Example:

``` text
┌──────────────────────────────────────────┐
│                                          │
│   Home    Search    My Bookings   Account│
│    ●                                      │
└──────────────────────────────────────────┘
```

The active item should have:

-   Green icon
-   Green label
-   Slightly heavier font
-   Small green indicator dot below

Do not use huge icons.

## Safe area

The navigation must respect:

-   Android gesture navigation
-   iOS home indicator
-   Browser/PWA safe-area spacing

Use safe-area bottom padding where applicable.

------------------------------------------------------------------------

# 9. Home Page

## Purpose

The home page should immediately help the user discover caterers.

The page should communicate:

``` text
Greeting
↓
Discovery headline
↓
Search
↓
Cuisine filters
↓
Featured promotion
↓
Popular caterers
↓
Cuisine discovery
↓
Bottom navigation
```

## Header

Use:

``` text
Hello, Miko 👋
```

followed by a strong headline:

``` text
Find your perfect
caterer
```

The word "caterer" can use the primary green.

Include the user's profile avatar on the right when space allows.

Do not use the old large "My Bookings" button in the header.

Bookings are now accessible through bottom navigation.

------------------------------------------------------------------------

# 10. Home Search Field

Use a large rounded search field.

Placeholder:

``` text
Search by name, location, cuisine...
```

Include:

-   Search icon on the left
-   Filter/settings icon on the right
-   Vertical divider before the filter icon

The field should feel like a primary discovery control.

------------------------------------------------------------------------

# 11. Cuisine Chips

Horizontal scrolling chips:

``` text
All
Ethiopian
Italian
Indian
Chinese
Mexican
```

The selected chip:

-   Green background
-   White text
-   Green/dark icon if appropriate

Unselected chips:

-   White background
-   Subtle border
-   Dark text

The chip row must be horizontally scrollable and must not wrap onto
multiple lines.

------------------------------------------------------------------------

# 12. Home Promotional Banner

Add a featured food/catering promotional card.

Characteristics:

-   Large rounded container
-   Food photography
-   Green accents
-   Short promotional copy
-   Primary CTA

Example concept:

``` text
Seasonal Special

Authentic Ethiopian
Catering

Traditional flavors,
perfect for your special moments.

[ Explore Now → ]
```

The image should visually dominate one side of the banner.

On smaller screens, preserve the composition without causing text
overlap.

Do not make the banner excessively tall.

------------------------------------------------------------------------

# 13. Popular Caterers

Section header:

``` text
Popular near you                    See all →
```

Use horizontal or vertically stacked cards depending on available data
and current responsive behavior.

Each caterer card should contain:

-   Food image
-   Caterer name
-   Cuisine
-   Short description
-   Rating
-   Review count
-   Location
-   Favorite button
-   Useful tags
-   Booking CTA

Example:

``` text
[Food Image]   Zemen Ethiopian Cuisine      ♡
               Traditional • Ethiopian

               ★ 4.8  (324)
               📍 Bole, Addis Ababa

               [ Ethiopian ] [ Traditional ]

               [        Book Now        ]
```

Avoid putting too much metadata in one row.

------------------------------------------------------------------------

# 14. Caterer Card Rules

Caterer cards should have:

``` text
background: white
border: 1px solid #E5E2D9
border-radius: 20px
```

Food images:

-   High quality
-   4:3 or approximately square
-   Rounded corners
-   `object-fit: cover`

Favorite buttons should be circular.

Use green for the booking CTA.

------------------------------------------------------------------------

# 15. Explore Cuisines

Near the bottom of the Home page:

``` text
Explore cuisines                     See all →
```

Use compact image-based cuisine cards.

Examples:

-   Ethiopian
-   Italian
-   Indian
-   Chinese
-   Mexican

Each item:

``` text
[ circular/rounded food image ]

Ethiopian
```

These should feel visual and lightweight rather than like large buttons.

------------------------------------------------------------------------

# 16. Caterer Details Page

The details page is reached when a user taps a caterer.

Structure:

``` text
Hero Image
↓
Back / Favorite / Share
↓
Caterer Identity
↓
Rating + Location + Verification
↓
Feature badges
↓
About
↓
Tabs
↓
Popular dishes
↓
Custom packages
↓
Book Now
↓
Bottom Navigation
```

------------------------------------------------------------------------

# 17. Details Page Hero

Use a large full-width food photograph at the top.

The image should have:

-   Large rounded bottom corners
-   Strong food photography
-   Good contrast

Overlay:

``` text
←       ♡       Share
```

Buttons should be circular white controls.

Do not place text directly over busy food photography unless contrast is
guaranteed.

------------------------------------------------------------------------

# 18. Caterer Identity

Under the hero image:

-   Caterer logo/avatar
-   Caterer name
-   Short description
-   Rating
-   Reviews
-   Location
-   Verification status

Example:

``` text
Zemen Ethiopian Cuisine

Traditional flavors, perfect for your special moments.

★ 4.8 (324 reviews)
📍 Bole, Addis Ababa
✓ Verified Caterer
```

The caterer logo should partially overlap the hero/card boundary where
appropriate.

------------------------------------------------------------------------

# 19. Feature Badges

Use small rounded feature pills:

``` text
Traditional Ethiopian
Fresh Ingredients
On-time Delivery
```

These are informational, not primary actions.

Use pale green backgrounds.

------------------------------------------------------------------------

# 20. About Section

Use a soft green surface.

Example:

``` text
About Us

[Chef Image]

We bring the authentic taste of Ethiopia
to your table...

                         Read more →
```

The section should feel editorial and premium.

Keep text concise and allow expansion through "Read more".

------------------------------------------------------------------------

# 21. Details Tabs

Use:

``` text
Menu
Gallery
Reviews
Location
```

The active tab:

-   Green text
-   Green underline

Inactive tabs:

-   Gray text

The tab bar should be horizontally stable and easy to tap.

Do not use heavy segmented controls here.

------------------------------------------------------------------------

# 22. Popular Dishes

Display food cards horizontally.

Each card should contain:

-   Food image
-   Optional popularity badge
-   Dish name
-   Short description
-   Price
-   Add to cart button

Example:

``` text
[ Food Image ]

★ Most Popular

Tibs (Beef)

Tender beef cubes...

Br 320

[ 🛒 Add to cart ]
```

Cards should have consistent image heights.

------------------------------------------------------------------------

# 23. Custom Packages

Use event-oriented package cards.

Example:

``` text
Custom Packages

Perfect for events, meetings and celebrations.

┌────────────────────────────────┐
│ [image] Small Gathering        │
│         5–10 people • 5 dishes │
│         Br 2,500             → │
└────────────────────────────────┘
```

Possible packages:

-   Small Gathering
-   Family Event
-   Corporate Event
-   Wedding
-   Custom Event

Do not hard-code these names if the backend already provides package
data.

------------------------------------------------------------------------

# 24. Sticky Booking CTA

The caterer details page should have a highly visible:

``` text
[ 📅  Book Now ]
```

button.

Use the primary green.

The button can be sticky above the bottom navigation on mobile.

Important:

-   Do not cover the bottom navigation
-   Respect safe-area spacing
-   Ensure the last content can still be scrolled into view
-   Do not create two competing fixed navigation elements

------------------------------------------------------------------------

# 25. Search Page

The Search page is for active caterer discovery.

Structure:

``` text
Discovery Header
↓
Search
↓
Cuisine filters
↓
Advanced filters
↓
Result count + location
↓
Caterer results
↓
Bottom navigation
```

------------------------------------------------------------------------

# 26. Search Header

Use:

``` text
Discover amazing
Caterers Near You
```

Optional supporting copy:

``` text
Find the perfect caterer for your event,
meeting or special occasion.
```

A small decorative food image/illustration can appear in the header.

Do not let decorative artwork interfere with the search field.

------------------------------------------------------------------------

# 27. Search Input

Use the same global search component as Home.

This consistency is important.

Placeholder:

``` text
Search by name, location, cuisine...
```

Include filter icon on the right.

------------------------------------------------------------------------

# 28. Search Filters

Cuisine chips:

``` text
All
Ethiopian
Italian
Indian
Chinese
```

Advanced filter row:

``` text
Price Range
Rating
Location
Sort
```

Each filter should be a rounded outlined pill.

When a filter is active:

-   Green border
-   Green text
-   Optional pale green background

Do not open complex filter dialogs unnecessarily.

------------------------------------------------------------------------

# 29. Search Results

Display:

``` text
12 caterers found             📍 Bole, Addis Ababa
```

The number must come from actual search results.

Do not hard-code result counts.

------------------------------------------------------------------------

# 30. Search Result Card

Each result should include:

-   Large food image
-   Caterer logo
-   Caterer name
-   Description
-   Rating
-   Review count
-   Location
-   Cuisine
-   Service tags
-   Verification
-   Starting price
-   Favorite button

Example structure:

``` text
┌─────────────────────────────────────────┐
│ [ Food ]   [Logo] Caterer Name       ♡  │
│ [ Image ]        Description             │
│                 ★ 4.8 (324)             │
│                 📍 Bole, Addis Ababa     │
│                                         │
│                 [Ethiopian] [Traditional]│
│                                         │
│                 ✓ Verified Caterer       │
│                                   Br 320+│
└─────────────────────────────────────────┘
```

Cards should remain easy to scan.

------------------------------------------------------------------------

# 31. Search Interaction

Search should support:

-   Text search
-   Cuisine filtering
-   Price filtering
-   Rating filtering
-   Location filtering
-   Sorting
-   Favorite toggling

Use debounced search where appropriate.

Avoid reloading the entire page for every keystroke.

------------------------------------------------------------------------

# 32. My Bookings Page

The booking page should feel organized and reassuring.

Structure:

``` text
Header
↓
Booking filters
↓
Booking cards
↓
Bottom navigation
```

Header:

``` text
My Bookings

Your food moments,
all in one place
```

Supporting text:

``` text
View and manage your catering bookings.
```

------------------------------------------------------------------------

# 33. Booking Filters

Use:

``` text
All
Upcoming
Completed
Cancelled
```

Selected:

-   Green background
-   White text

Unselected:

-   White background
-   Dark text
-   Subtle border

Make the row horizontally scrollable if required.

------------------------------------------------------------------------

# 34. Booking Cards

Each booking should contain:

-   Caterer/food image
-   Booking status
-   Caterer name
-   Service/event type
-   Date
-   Time
-   Location
-   Guest count
-   Total price
-   View details action
-   Chevron

Example:

``` text
┌─────────────────────────────────────────┐
│ [Image]   [ Upcoming ]                  │
│           Zemen Ethiopian Cuisine       │
│           Traditional Ethiopian Platter │
│                                         │
│           📅 Jun 20, 2026   📍 Bole     │
│           👥 25 people       Br 320     │
│                                         │
│           [     View Details        → ] │
└─────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 35. Booking Status Styling

## Upcoming

Use green.

``` text
background: #DCFCE7
text: #16803C
```

## Completed

Use green but visually quieter than Upcoming.

## Cancelled

Use a muted red/blue informational appearance rather than making the
whole card red.

The status badge should be the only strongly colored element.

Do not turn entire cards red for cancellation.

------------------------------------------------------------------------

# 36. Empty States

All list pages must have intentional empty states.

Examples:

### No bookings

``` text
[calendar illustration]

No bookings yet

When you book a caterer,
your upcoming events will appear here.

[ Find a Caterer ]
```

### No search results

``` text
[search/food illustration]

No caterers found

Try another cuisine, location,
or search term.

[ Clear Filters ]
```

Empty states should use the same green visual language.

------------------------------------------------------------------------

# 37. Loading States

Do not show blank white screens while data loads.

Use skeleton loading.

Skeletons should match the final component dimensions:

-   Image skeleton
-   Heading skeleton
-   Metadata skeleton
-   Button skeleton

Use subtle neutral gray tones.

Avoid spinner-only loading for large lists.

------------------------------------------------------------------------

# 38. Images

Food imagery is one of the most important parts of this UI.

Images should:

-   Be high quality
-   Use `object-fit: cover`
-   Have consistent aspect ratios
-   Have rounded corners
-   Avoid visible stretching
-   Lazy-load below-the-fold images

For remote images:

-   Show skeleton while loading
-   Show a clean fallback if unavailable
-   Never break the layout when an image fails

If Cloudinary is already used, continue using the existing Cloudinary
pipeline.

Do not introduce a second image provider unnecessarily.

------------------------------------------------------------------------

# 39. Icons

Use one consistent icon system throughout the app.

Recommended:

``` text
Lucide Icons
```

Suggested icons:

``` text
Home          House
Search        Search
Bookings      Calendar
Account       User
Favorite      Heart
Share         Share2
Location      MapPin
Rating        Star
Filter        SlidersHorizontal
Verified      BadgeCheck / ShieldCheck
People        Users
Price         Tag
Delivery      Truck
Cart          ShoppingCart
Back          ChevronLeft
Forward       ChevronRight
```

Avoid emoji icons for functional controls.

Emoji may be used only in friendly copy such as:

``` text
Hello, Miko 👋
```

------------------------------------------------------------------------

# 40. Interaction Design

The app should feel responsive.

Add subtle transitions to:

-   Buttons
-   Chips
-   Cards
-   Favorite buttons
-   Tabs
-   Navigation items
-   Filter selection

Recommended duration:

``` text
150–250ms
```

Use ease-out style transitions.

Avoid excessive animation.

------------------------------------------------------------------------

# 41. Button Behavior

Primary button:

``` text
Green background
White text
Rounded pill/large radius
```

Secondary button:

``` text
White background
Green/dark text
Green border
```

Tertiary:

``` text
Transparent
Green text
```

Pressed state should slightly reduce scale or opacity.

Never use aggressive bouncing.

------------------------------------------------------------------------

# 42. Accessibility

All interactive elements must have:

-   Accessible labels
-   Minimum comfortable touch target
-   Visible focus state where applicable
-   Sufficient color contrast
-   Semantic button/link behavior

Do not rely solely on color to communicate state.

For example, a selected filter should have both:

-   Color change
-   Text/icon state

------------------------------------------------------------------------

# 43. Responsive Behavior

The primary target is mobile.

Design for approximately:

``` text
360px
375px
390px
412px
430px
```

The UI must not depend on a single phone width.

At narrow widths:

-   Reduce horizontal padding slightly
-   Allow chip rows to scroll horizontally
-   Avoid text clipping
-   Allow headings to wrap naturally
-   Keep buttons tappable

At larger mobile widths:

-   Do not simply enlarge everything
-   Maintain readable content width
-   Increase whitespace where appropriate

------------------------------------------------------------------------

# 44. PWA Considerations

Since this is a PWA/mobile application:

-   Respect safe-area insets
-   Avoid content hiding behind browser UI
-   Ensure bottom navigation remains usable
-   Avoid fixed elements covering scrollable content
-   Test installed PWA mode
-   Test browser mode
-   Test Android gesture navigation

Use CSS environment variables where supported:

``` css
padding-bottom: env(safe-area-inset-bottom);
```

------------------------------------------------------------------------

# 45. Component Architecture

Do not implement every screen as one huge component.

Create reusable components.

Suggested structure:

``` text
components/
  mobile/
    BottomNav.tsx
    SearchBar.tsx
    CuisineChip.tsx
    FilterChip.tsx
    CatererCard.tsx
    CatererListCard.tsx
    Rating.tsx
    FavoriteButton.tsx
    VerificationBadge.tsx
    FoodImage.tsx
    SectionHeader.tsx
    StatusBadge.tsx
    BookingCard.tsx
    DishCard.tsx
    PackageCard.tsx
    EmptyState.tsx
    SkeletonCard.tsx
```

Page-level components:

``` text
pages/
  Home
  Search
  CatererDetails
  MyBookings
```

Use the existing project architecture if it differs, but preserve this
separation of responsibilities.

------------------------------------------------------------------------

# 46. Recommended Reusable Data Models

The UI should consume real backend data.

Conceptually:

``` ts
type Caterer = {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  cuisine?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  tags?: string[];
  startingPrice?: number;
};
```

Booking:

``` ts
type Booking = {
  id: string;
  catererId: string;
  catererName: string;
  imageUrl?: string;
  status: "upcoming" | "completed" | "cancelled";
  eventType?: string;
  date: string;
  time?: string;
  location?: string;
  guestCount?: number;
  total: number;
};
```

Dish:

``` ts
type Dish = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  popular?: boolean;
};
```

Do not force the backend into these exact structures if existing models
already exist. Map existing data into UI view models instead.

------------------------------------------------------------------------

# 47. Currency

Use Ethiopian Birr consistently.

Display prices like:

``` text
Br 320
Br 2,500
Br 8,900
```

Avoid inconsistent currency formats across screens.

If the existing system already has a currency formatter, reuse it.

------------------------------------------------------------------------

# 48. Date Formatting

Dates should be human-readable.

Prefer:

``` text
Jun 20, 2026
12:00 PM
```

rather than raw ISO timestamps.

Use the user's locale/timezone handling already present in the
application.

Do not hard-code dates from the design examples.

------------------------------------------------------------------------

# 49. Data vs Design Content

The generated designs contain example content.

The examples are for visual reference only.

Do NOT hard-code:

``` text
Zemen Ethiopian Cuisine
La Piazza
Spice Route
Dragon Wok
12 caterers found
Br 320
324 reviews
```

unless these are actual records in the database.

The implementation must use real application data.

------------------------------------------------------------------------

# 50. Existing Functionality Must Remain

During the redesign:

DO NOT break:

-   Authentication
-   Google login
-   User profile
-   Caterer discovery
-   Search
-   Filters
-   Favorites
-   Booking creation
-   Booking history
-   Booking details
-   Payment functionality
-   Existing API calls
-   Existing Supabase integration
-   Cloudinary image handling
-   Existing routing
-   Existing database schema

The redesign is primarily a UI/UX modernization.

------------------------------------------------------------------------

# 51. Navigation Rules

Bottom navigation:

``` text
Home
Search
My Bookings
Account
```

Routes should remain logically separated.

Suggested route concepts:

``` text
/home
/search
/bookings
/account
/caterers/:id
```

Use the project's existing routing conventions if different.

The Caterer Details page is not a bottom-nav item.

It is a secondary route opened from Home/Search.

------------------------------------------------------------------------

# 52. Performance

The UI must remain fast.

Important:

-   Lazy-load large food images
-   Use image resizing/CDN transformations
-   Avoid unnecessary re-renders
-   Debounce search
-   Paginate/infinite-scroll long caterer lists
-   Cache frequently used caterer data
-   Avoid loading all bookings at once
-   Avoid huge DOM trees
-   Use skeletons instead of layout jumps

The bottom navigation should remain responsive even when page content is
loading.

------------------------------------------------------------------------

# 53. Scroll Behavior

Home and Search:

-   Vertical scrolling
-   Horizontal scrolling for chips
-   Horizontal scrolling for cuisine/dish cards where appropriate

Caterer Details:

-   Long vertical page
-   Sticky booking CTA where appropriate

My Bookings:

-   Vertical scrolling list
-   Filter tabs remain easy to access

Do not nest multiple vertical scroll containers unnecessarily.

------------------------------------------------------------------------

# 54. Mobile Touch Behavior

Interactive elements should be comfortably tappable.

Avoid:

-   Tiny heart buttons
-   Tiny filter buttons
-   Tiny chevrons as the only clickable target
-   Text links that are difficult to tap

If a small icon is displayed, give it a larger invisible/visual touch
area.

------------------------------------------------------------------------

# 55. Visual Consistency Rules

Across all pages:

### Cards

Use:

``` text
white
rounded
subtle border
minimal shadow
```

### Primary actions

Use:

``` text
#16A34A
```

### Active states

Use:

``` text
green + pale green
```

### Background

Use:

``` text
#FAF8F3
```

### Typography

Use:

``` text
dark charcoal
```

### Secondary content

Use:

``` text
muted gray
```

Do not introduce unrelated colors unless needed for semantic status.

------------------------------------------------------------------------

# 56. What to Avoid

Do NOT recreate the old design patterns.

Avoid:

-   Large empty spaces
-   Giant plain white cards
-   Thick borders
-   Brown/gold as the primary brand color
-   Old-fashioned pill-heavy interfaces everywhere
-   Huge navigation buttons
-   Excessive shadows
-   Gradients everywhere
-   Excessive glassmorphism
-   Tiny metadata
-   Dense text blocks
-   Random icon styles
-   Full-width red danger buttons except for genuine destructive actions
-   Hard-coded mock data
-   Desktop-first layouts squeezed into mobile

------------------------------------------------------------------------

# 57. Implementation Order

Implement in this order:

## Phase 1 --- Design foundation

Create:

-   Colors
-   Typography
-   Radius tokens
-   Spacing tokens
-   Shadows
-   Icon rules
-   Buttons
-   Common card styles

## Phase 2 --- Global navigation

Build:

``` text
BottomNav
```

Verify it works on:

-   Home
-   Search
-   My Bookings
-   Account

## Phase 3 --- Shared components

Build:

``` text
SearchBar
CuisineChip
FilterChip
CatererCard
Rating
FavoriteButton
StatusBadge
SectionHeader
```

## Phase 4 --- Home

Implement the full Home page.

## Phase 5 --- Search

Reuse Home components wherever possible.

## Phase 6 --- Caterer Details

Build the hero, caterer information, menu, dishes, packages, and booking
CTA.

## Phase 7 --- My Bookings

Build status filters and booking cards.

## Phase 8 --- Polish

Test:

-   Responsive behavior
-   Loading states
-   Empty states
-   Error states
-   Touch targets
-   Navigation
-   Safe areas
-   Image loading
-   Accessibility

------------------------------------------------------------------------

# 58. Acceptance Criteria

The redesign is complete only when:

### Home

-   [ ] Modern header
-   [ ] Search field
-   [ ] Horizontal cuisine filters
-   [ ] Promotional banner
-   [ ] Popular caterers
-   [ ] Explore cuisines
-   [ ] Bottom navigation
-   [ ] Real backend data
-   [ ] Loading state
-   [ ] Empty/error handling

### Search

-   [ ] Search header
-   [ ] Search input
-   [ ] Cuisine filters
-   [ ] Advanced filters
-   [ ] Sort
-   [ ] Location selector
-   [ ] Result count from backend
-   [ ] Caterer cards
-   [ ] Favorite functionality
-   [ ] Bottom navigation

### Caterer Details

-   [ ] Hero image
-   [ ] Back button
-   [ ] Favorite
-   [ ] Share
-   [ ] Logo
-   [ ] Caterer identity
-   [ ] Rating
-   [ ] Location
-   [ ] Verification
-   [ ] Feature badges
-   [ ] About section
-   [ ] Menu/Gallery/Reviews/Location tabs
-   [ ] Popular dishes
-   [ ] Custom packages
-   [ ] Book Now CTA
-   [ ] Bottom navigation

### My Bookings

-   [ ] Header
-   [ ] Booking filters
-   [ ] Upcoming bookings
-   [ ] Completed bookings
-   [ ] Cancelled bookings
-   [ ] Booking metadata
-   [ ] Price
-   [ ] View Details
-   [ ] Empty state
-   [ ] Bottom navigation

------------------------------------------------------------------------

# 59. Final Design Principle

The goal is **not simply to make the old UI prettier**.

The goal is to make the app feel like a professionally designed modern
catering marketplace.

The experience should communicate:

``` text
Discover → Trust → Explore → Book
```

Every screen should make the next action obvious without feeling
aggressive.

Prioritize:

1.  Visual hierarchy
2.  Food imagery
3.  Discoverability
4.  Trust
5.  Clear actions
6.  Spacious layouts
7.  Consistent components
8.  Real data
9.  Fast interactions
10. Mobile usability

When a design decision is not explicitly covered here, follow the visual
language established by the approved Home, Caterer Details, Search, and
My Bookings designs rather than introducing a new design direction.
