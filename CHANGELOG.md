# Changelog

## 1.0.0

### Major Changes

- Release version 1.0.0 with accessible native-button clipboard controls, localized feedback, opt-in clipboard fallback, addon hooks, typed lifecycle events, and the optional table-to-Markdown adapter.

### Minor Changes

- Add typed lifecycle event subscriptions and prevent stale addon hook failures from emitting events after destruction.

### Patch Changes

- Keep reinitialized instances registered and prevent competing instances from owning the same root. Restore authored status feedback across lifecycles and track added classes per element during cleanup. Preserve empty copied values in getValue().

  Restore authored root state classes on destroy, capturing their original membership for each initialization lifecycle.

  Keep status feedback outside detached buttons, place it beside the button after attachment, and cancel pending placement on destroy. Support button siblings in document fragments.

This package uses Changesets for release notes.
