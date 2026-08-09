# Bridge Bootstrap

Use this reference when `globalThis.agent` is missing, when the Chrome bridge state is unclear, or when a user says an existing ChatGPT tab is already open.

In a true Codex browser-control run, read the currently installed Browser or Chrome control skill completely and follow its exact bootstrap procedure. That skill owns the bridge module path, setup signature, and browser acquisition API; this plugin deliberately does not duplicate them because those host contracts can change independently.

Bootstrap inside the current agent or subagent's own JavaScript runtime. Never copy `globalThis.agent`, `browser`, `page`, imported modules, or tab handles from another agent's runtime.

After bootstrap:

```js
JSON.stringify({
  hasAgent: !!globalThis.agent,
  hasBrowser: !!globalThis.browser
}, null, 2);
```

Only report `browser_bridge_unavailable` after bootstrap fails or the bridge remains unavailable.

After loading the plugin runtime, run the runtime version handshake before a live command. Keep one browser operation in flight for this runtime/tab; use isolated runtimes and tabs for intentional parallel work.

Do not use `browser.tabs.list()` or `browser.tabs.selected()` alone to decide a user-open ChatGPT tab is unavailable. Those APIs can be sparse for user-open tabs. Prefer SDK `existingTab` options or lower-level `browser.user.openTabs()` and `browser.user.claimTab()` when exact user-open tab reuse matters.
