---
name: Isolated browser testing
description: Safely test browser-local persistence without changing another browser session's saved data.
---

Use a shell-launched browser with its own user-data directory for UI tests that create, update, or remove localStorage records. A preview screenshot is a separate browser context and cannot verify another session's saved records.

**Why:** Browser-local persistence must be exercised without risking the user's existing records.

**How to apply:** Keep interactive test records inside a dedicated temporary profile, and do not infer the user's stored data from a screenshot or isolated test run.
