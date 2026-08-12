---
name: testing-browser-extensions
description: Runs real-browser end-to-end tests for this Firefox and Chromium extension. Use after changing extension behavior, manifests, builds, context menus, selection conversion, or clipboard handling.
compatibility: Requires Linux, Node.js 24, pnpm, Firefox ESR, Chromium, Fluxbox, Xvfb, xdotool, and xclip.
---

# Testing Browser Extensions

Use the bundled test to verify the built extension in real Firefox and Chromium
browsers. Unit tests alone do not exercise native context menus or the system
clipboard.

## Workflow

1. Run the normal unit tests and build:
   ```sh
   pnpm test
   pnpm build
   ```
2. Run `scripts/test-context-menu.sh all` from this skill directory. It:
   - launches each real browser under Xvfb;
   - installs the corresponding built extension;
   - selects formatted text in the fixture page;
   - invokes the browser's native context menu with `Shift+F10`;
   - chooses `Copy Selection as Markdown`;
   - verifies Markdown written to the system clipboard.
3. Report results separately for Firefox and Chromium. Do not claim browser
   coverage if either browser was skipped or unavailable.

Run one target while debugging with `scripts/test-context-menu.sh firefox` or
`scripts/test-context-menu.sh chromium`.

## Failures

The script prints the temporary directory containing browser, web-ext, and Xvfb
logs when a test fails. Inspect those logs before changing the test. A timeout
or missing clipboard content is not proof of an extension defect: confirm that
the browser opened, the extension loaded, and the native menu received keyboard
input.

Keep browser setup in `.agents/setup` and behavior in this skill's scripts so a
fresh orb can reproduce the test without relying on prior conversation history.
