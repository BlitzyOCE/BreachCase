## Phase 1: Page & Navigation
Start dev server
Nav links -- Check both desktop and mobile nav show "My Breachcase" between Search and About
Auth redirect -- Visit /my-breachcase while logged out, confirm it redirects to /login?redirectTo=/my-breachcase
Page loads -- Log in, click "My Breachcase" in nav, confirm the page renders with the three sections (Watchlists, Saved Breaches, Recently Viewed)
## Phase 2: Watchlist Engine
Empty state -- With no watchlists, you should see the "Create Your First Watchlist" CTA
Create watchlist -- Click create, fill in a name (e.g. "Healthcare"), set a keyword and/or check some industry/country filters, save
Feed loads -- The new tab should appear and automatically load matching breaches with a count badge
Pagination -- If >12 results, verify Previous/Next buttons work
Edit watchlist -- Click Edit, change filters, save. Feed should refresh with updated results
Multiple tabs -- Create a second watchlist with different filters, switch between tabs, confirm each loads its own feed independently
Delete watchlist -- Delete one, confirm the tab disappears and another tab becomes active
Save from search -- Go to /search, apply filters, click "Save as Watchlist" -- then go back to My Breachcase and confirm the new watchlist appears with the correct filters
## Phase 3: Card Save & Profile Cleanup
Bookmark button -- On any breach card (home page, search results, watchlist feeds), hover and confirm the bookmark icon appears in the top-right corner
Save a breach -- Click the bookmark, confirm it fills in. Navigate away and back to confirm persistence
Saved Breaches section -- On My Breachcase, confirm the saved breach appears in the "Saved Breaches" section
Unsave -- Click the X on a saved breach in the section, confirm it removes. Also test clicking a filled bookmark on a card to unsave
Not logged in -- Log out, confirm bookmark buttons don't render on cards
Profile page -- Visit /profile, confirm it only shows the header and edit form (no more saved breaches, watchlists, or recently viewed sections)
Collapsible sections -- On My Breachcase, click the chevrons on Saved Breaches and Recently Viewed to confirm they collapse/expand