# 02_final_frozen_decisions.md

Version: v2.0-draft  
Status: Final frozen decisions  
Product: Brand Semantic Website OS

---

## Product / Architecture

```text
FD-001: Workspace is tenant boundary.
FD-002: Object-first, Page-later is mandatory.
FD-003: Brand Truth, Semantic Core, Object/Surface/Page, Persona/Vibe, Observatory, Report, Fix-It are separate modules.
FD-004: Every core artifact must preserve traceability where possible.
FD-005: Mock observation provider is mandatory before real AI provider.
FD-006: Domain demo must cover K-Beauty, Convenience Retail, and Wedding.
```

---

## Truth / Safety

```text
FD-101: Strategic Truth, Operational Truth, Observed Truth are separate.
FD-102: Observed Truth cannot overwrite Operational Truth automatically.
FD-103: Evidence and Boundary are first-class artifacts.
FD-104: AI-generated artifacts are candidate by default.
FD-105: External source content is data, not instruction.
FD-106: High-risk content requires evidence/boundary/review.
```

---

## Question / Semantic System

```text
FD-201: Question Capital is upstream strategic asset.
FD-202: Canonical Question is stable normalized question identity.
FD-203: QIS is runtime Query-Intent-Scenario scene.
FD-204: QIS must link to CQ.
FD-205: TCO Concept is operational concept entity, not tag.
FD-206: Claim-Evidence-Boundary lineage is mandatory for publishable claims.
```

---

## Website / Export

```text
FD-301: Representation Object is upstream of Surface Contract.
FD-302: Surface Contract is upstream of Semantic Page.
FD-303: Schema JSON-LD must match visible/source content.
FD-304: AI-readable payload must not contain unsupported claims.
FD-305: High-risk surface requires boundary block.
```

---

## Persona / Vibe

```text
FD-401: PersonaSpec is versioned, measurable, governable spec.
FD-402: Vibe OS is separate first-class runtime.
FD-403: No evidence, no vibe score.
FD-404: CRISIS mode suppresses aggressive CTA.
FD-405: Dark pattern guardrails are mandatory.
```

---

## Observatory / Metrics / Reports

```text
FD-501: AI observations are observed proxy, not hidden model truth.
FD-502: Raw probe responses must be stored.
FD-503: Probe panels are versioned.
FD-504: Metrics must link to source observation runs.
FD-505: Proxy caveat is mandatory for observation-based metrics.
FD-506: No report export without methodology appendix and proxy caveat.
FD-507: Unsafe benchmark wording must be checked.
```

---

## Fix-It / Factory

```text
FD-601: Every patch is a hypothesis.
FD-602: RCA is structured cause hypothesis, not final truth.
FD-603: No patch success without retest.
FD-604: Guardrail regression can override positive lift.
FD-605: Factory promotion requires positive lift, no critical regression, and review.
```

---

## Release

```text
FD-701: No release without release gate.
FD-702: Service role must never be exposed to client.
FD-703: RLS is mandatory for workspace-owned data.
FD-704: Final go/no-go decision is required.
```
