# 04 — Contracts (data schema + API surface)

> Status: **skeleton.** This is the LOCK-IN POINT. Nothing here changes without an ADR.

## Data schema
TODO(adil)

## API surface
TODO(adil): every route scoped to the authenticated user.

## Ingest contract for the tracker
TODO(adil): the local daemon and the browser extension both POST activity sessions here.
This seam is what lets browser-tab tracking be deferred without rework. Decide:
batch size, idempotency key, clock-skew handling, backlog replay after offline.
