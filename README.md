<p align="center">
  <img src="public/logo.svg" alt="Revenant Logo" width="80" />
</p>

<h1 align="center">Revenant</h1>

<p align="center">
  <strong>The AI Symbiote for Engineering Teams</strong>
</p>

<p align="center">
  Revenant turns day-to-day engineering activity into real-time coaching, personal memory, and company-wide best practices.
</p>

<p align="center">
  <a href="#overview">Overview</a> &nbsp;&bull;&nbsp;
  <a href="#architecture">Architecture</a> &nbsp;&bull;&nbsp;
  <a href="#system-flow">System Flow</a> &nbsp;&bull;&nbsp;
  <a href="#memory-model">Memory Model</a> &nbsp;&bull;&nbsp;
  <a href="#components">Components</a> &nbsp;&bull;&nbsp;
  <a href="#screenshots">Screenshots</a>
</p>

---

## Overview

> This README describes the target system architecture for Revenant and should be treated as the source of truth for the platform shape.

Revenant is an engineering habit intelligence system built around two parallel loops:

- a fast path that gives immediate contextual help while work is happening
- a batch path that evaluates behavior over short windows, labels habits, and promotes strong patterns into shared company memory

Activity enters through Nango from GitHub, Slack, VS Code, and Jira. Every event is tagged with a `user_id`, routed by the FastAPI Symbiote Brain, and then sent either to a real-time assistant or to a Redis buffer for habit evaluation. The result is a system that helps individual engineers in the moment while continuously building durable organizational knowledge.

---

## Architecture

```mermaid
flowchart TD
    %% Data Sources
    GH[GitHub] -->|Commits, PRs| NANGO
    SL[Slack] -->|Messages| NANGO
    VS[VS Code] -->|File events| NANGO
    JR[Jira] -->|Tickets| NANGO

    %% Ingestion Layer
    NANGO[Nango Integration Hub<br/>Self-hosted Docker<br/>Tags every event with user_id]

    %% Processing
    NANGO -->|Webhook POST<br/>user_id tagged| BRAIN[FastAPI Symbiote Brain<br/>Webhook Receiver + Router]

    %% Dual Track Split
    BRAIN -->|Every action<br/>Fast Path| RT[Real-Time Assistant<br/>Immediate contextual help]
    BRAIN -->|Buffer actions<br/>Batch Path| REDIS[Redis Buffer<br/>10-15 action window]

    %% Buffer to Evaluator
    REDIS -->|Threshold hit<br/>15 actions| EVAL[Habit Evaluator<br/>Labels good vs bad]

    %% Evaluator Logic
    EVAL -->|Query best practices| NS_CO
    EVAL -->|Save labeled habits| NS_US
    EVAL -->|Best moment detected| PROMO[Promotion Engine<br/>Private to Global]

    %% Promotion
    PROMO -->|Promote good habit| NS_CO

    %% Real-Time queries
    RT -.->|Query personal context| NS_US
    RT -.->|Query company knowledge| NS_CO
    RT -->|Contextual help| DASH

    %% Memory Layer
    subgraph MOORCHE[Moorcheh AI Memory Layer]
        NS_CO[Company Namespace<br/>Global wisdom<br/>Best practices<br/>B09 docs]
        NS_US[User Namespace<br/>Per-user habits<br/>user_id memory<br/>Resume + interview notes]
    end

    %% Onboarding
    ONBOARD[Onboarding<br/>Resume + Interview] -->|Bootstrap on hire| NS_US

    %% Storage
    EVAL -->|Write results| PG

    subgraph STORAGE[Persistence Layer]
        PG[PostgreSQL<br/>Django ORM + habit logs]
        PGV[pgvector<br/>Vector embeddings]
    end

    NS_US -.-> PGV
    NS_CO -.-> PGV

    %% Frontend
    PG --> DASH

    subgraph FRONTEND[Django Frontend]
        DASH[Dashboard<br/>Habit trends + scores]
        ADMIN[Admin Panel<br/>Manual labeling + review]
    end

    %% Styling
    classDef source fill:#E1F5EE,stroke:#0F6E56,color:#04342C
    classDef ingestion fill:#d4edda,stroke:#28a745,color:#155724
    classDef processing fill:#FAEEDA,stroke:#854F0B,color:#412402
    classDef memory fill:#E6F1FB,stroke:#185FA5,color:#042C53
    classDef storage fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    classDef frontend fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef promo fill:#FFF3CD,stroke:#856404,color:#533f03

    class GH,SL,VS,JR,ONBOARD source
    class NANGO ingestion
    class BRAIN,RT,REDIS,EVAL processing
    class NS_CO,NS_US memory
    class PG,PGV storage
    class DASH,ADMIN frontend
    class PROMO promo
```

---

## System Flow

### 1. Ingestion

Nango normalizes events from the connected tools and forwards them to the FastAPI Symbiote Brain. Every payload is tagged with a `user_id`, which keeps the rest of the system scoped correctly from the moment the event arrives.

### 2. Fast Path

The real-time assistant handles immediate support for each action. It looks up:

- personal context from the user namespace
- company standards from the company namespace

This path is meant for low-latency coaching while an engineer is still in the middle of the task.

### 3. Batch Path

The same events are buffered in Redis in 10-15 action windows. Once the threshold is met, the habit evaluator labels the batch, stores the results, and updates the engineer's private memory.

### 4. Promotion

If the evaluator detects a particularly strong positive pattern, the promotion engine upgrades that moment from private user memory into the shared company namespace so it becomes reusable institutional knowledge.

### 5. Presentation

The Django frontend exposes the results through:

- a dashboard for habit trends and scores
- an admin panel for review, manual labeling, and operational oversight

---

## Memory Model

Revenant keeps two operational memory scopes in Moorcheh:

| Namespace | Purpose | Examples |
|:----------|:--------|:---------|
| **Company Namespace** | Shared engineering wisdom that should be reusable across the org | best practices, playbooks, B09 docs, promoted habits |
| **User Namespace** | Per-engineer context and habit history | onboarding notes, labeled actions, resume context, interview notes |

Onboarding is part of the memory pipeline, not a separate side process. Resume and interview context seed the user namespace on hire so the system starts with useful context instead of an empty profile.

---

## Components

| Layer | Responsibility |
|:------|:---------------|
| **Nango** | Collects tool activity and forwards normalized events with `user_id` tags |
| **FastAPI Symbiote Brain** | Receives webhooks, routes actions, and coordinates downstream processing |
| **Real-Time Assistant** | Uses user and company memory for immediate contextual help |
| **Redis Buffer** | Holds short action windows before batch evaluation |
| **Habit Evaluator** | Labels actions, writes habit outcomes, and identifies promotable moments |
| **Promotion Engine** | Pushes exceptional individual habits into company-wide memory |
| **Moorcheh** | Stores user and company memory layers |
| **PostgreSQL + pgvector** | Persists habit logs, scores, and embedding-backed retrieval data |
| **Django Frontend** | Displays dashboard analytics and admin review workflows |

---

## Screenshots
![Homepage Screenshot](./ss/landing.png)
![facetime](./ss/facetime.png)