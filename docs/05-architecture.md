# 05 — Architecture

> Status: **skeleton.** Draft after contracts. Component boundaries + deployment topology.

## Components
TODO(adil)

## Deployment topology
Known constraint: single VPS, 16 GB RAM / 100 GB SSD, everything self-hosted (ADR 0002).
TODO(adil): choose runtime, framework, database, container strategy, reverse proxy, TLS,
process supervision and backup target. All of it lives here, none of it is pre-decided.

## Trust boundaries
TODO(adil): whatever captures activity runs on Adil's laptop, outside the server perimeter. It holds a
credential and reports activity. Treat it as an untrusted client.
