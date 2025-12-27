---
"@prosdevlab/experience-sdk": minor
"@prosdevlab/experience-sdk-plugins": minor
---

feat: add display condition plugins with event-driven architecture

Add 4 new display condition plugins with comprehensive testing and documentation:

**New Plugins:**
- Exit Intent: Velocity-based mouse tracking with session awareness
- Scroll Depth: Multiple thresholds with advanced engagement metrics
- Page Visits: Session and lifetime counters with first-visit detection
- Time Delay: Millisecond-precision delays with visibility API integration

**Core Enhancements:**
- Event-driven trigger architecture (`trigger:*` events)
- Composable display conditions (AND/OR/NOT logic)
- TriggerState interface for type-safe context updates

**Developer Experience:**
- 101 new tests across 4 plugins (314 total)
- 12 integration tests for plugin composition
- Complete API documentation with examples
- Pure functions for easier testing

All plugins are backward compatible and work independently or together.

