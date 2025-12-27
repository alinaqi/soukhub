# Backlog

Future work, prioritized. Move to active.md when starting.

---

## Phase 4: Marketplace API Integration (Future)

### TODO-013: Amazon SP-API integration
**Priority**: P3 (Future)
**Depends On**: TODO-005

**Description**:
Integrate with Amazon Selling Partner API for real-time order sync and inventory updates.

**Acceptance Criteria**:
- [ ] OAuth flow for SP-API authorization
- [ ] Orders API integration (pull orders)
- [ ] Inventory API integration (push updates)
- [ ] Notifications for new orders
- [ ] Rate limit handling
- [ ] Refresh token management

---

### TODO-014: Real-time inventory sync
**Priority**: P3 (Future)
**Depends On**: TODO-013

**Description**:
Implement real-time inventory synchronization across all connected marketplaces.

**Acceptance Criteria**:
- [ ] Inventory change triggers sync to all channels
- [ ] Conflict resolution for simultaneous updates
- [ ] Sync status dashboard
- [ ] Manual sync trigger
- [ ] Sync history/audit log

---

### TODO-015: Automated listing creation
**Priority**: P3 (Future)
**Depends On**: TODO-013

**Description**:
Use AI to generate and publish product listings across marketplaces.

**Acceptance Criteria**:
- [ ] AI-generated product descriptions
- [ ] Multi-marketplace listing format
- [ ] Image optimization
- [ ] Pricing suggestions
- [ ] One-click publish to all channels

---

## Technical Debt & Improvements

### TODO-016: Add comprehensive error boundary
**Priority**: P2 (Medium)
**Depends On**: TODO-001

**Description**:
Implement React error boundaries and global error handling for graceful degradation.

**Acceptance Criteria**:
- [ ] ErrorBoundary component wrapping app
- [ ] Graceful fallback UI
- [ ] Error logging to monitoring service
- [ ] Recovery options for users

---

### TODO-017: Add E2E tests with Playwright
**Priority**: P2 (Medium)
**Depends On**: TODO-006

**Description**:
Set up Playwright for end-to-end testing of critical user flows.

**Acceptance Criteria**:
- [ ] Playwright configured with CI integration
- [ ] Login/logout flow tests
- [ ] Import flow tests
- [ ] Order management tests
- [ ] Chat interface tests

---

### TODO-018: Performance optimization
**Priority**: P2 (Medium)
**Depends On**: TODO-009

**Description**:
Optimize database queries, add caching, and improve page load times.

**Acceptance Criteria**:
- [ ] Dashboard loads under 2 seconds
- [ ] Database query optimization
- [ ] React Query caching strategy
- [ ] Slow query logging
- [ ] Lazy loading for heavy components

---
