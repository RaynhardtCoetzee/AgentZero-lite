# 🏗️ Architecture Deep Dive

## The Network Boundary (proxy.ts)
- [cite_start]**Decision**: Node.js runtime sentry[cite: 847, 1011].
- [cite_start]**Purpose**: Handles auth header injection and AI stream handshakes outside the React render loop to prevent stream clipping[cite: 1011, 1012].

## Data Modeling
- [cite_start]**Schema**: Multi-tenant (User → Organisation → Agent)[cite: 858, 860].
- [cite_start]**Isolation**: Row Level Security (RLS) in Supabase ensures data tenancy[cite: 852].

## Performance Strategy
- [cite_start]**PPR**: Partial Prerendering is used to serve a cached shell in <100ms[cite: 865, 937].
- [cite_start]**Caching**: 'use cache' is applied to static-heavy components like Sidebars and Global Stats[cite: 1022].