# 05 — Architecture

> Status: **skeleton.** Draft after contracts. Component boundaries + deployment topology.

## Components
TODO(adil)

## Deployment topology
Known constraint: single VPS, 16 GB RAM / 100 GB SSD, self-hosted, Docker Compose.
TODO(adil): confirm reverse proxy, TLS, process supervision, backup target.

## Trust boundaries
TODO(adil): the tracker daemon runs on adil's laptop, outside the server perimeter.
It holds a credential and reports activity. Treat it as an untrusted client.
