# 🚀 AgentZero Setup Guide

[cite_start]Follow these steps to initialize your AgentZero instance in under 10 minutes. [cite: 83, 929]

## 1. Clone & Install
`git clone <your-repo-url>`
`cd agent-zero`
[cite_start]`npm install` [cite: 929]

## 2. Environment Configuration
[cite_start]Copy `.env.local.example` and fill in the required keys: [cite: 391]
- [cite_start]**NEXT_PUBLIC_SUPABASE_URL**: API Endpoint. [cite: 25]
- [cite_start]**SUPABASE_SECRET_KEY**: Admin access (Node-only). [cite: 178]
- [cite_start]**AUTH_SECRET**: Generate via `npx auth secret`. [cite: 29]
- [cite_start]**OPENAI_API_KEY**: Primary Agent Brain. [cite: 48]

## 3. Database Initialization (Supabase)
1. [cite_start]Create a project at [supabase.com](https://supabase.com). [cite: 25]
2. [cite_start]Enable the **pgvector** extension in the SQL Editor. [cite: 25, 852]
3. [cite_start]Map the multi-tenant schema: **User → Organisation → Agent**. [cite: 33, 858]

## 4. Local Development
[cite_start]Run the development server with **Turbopack** for 1s starts: [cite: 19, 846]
`npm run dev`

---

## 🛠️ Troubleshooting
- [cite_start]**Async APIs**: Ensure all `cookies()` and `headers()` calls are awaited. [cite: 29, 1015]
- **Stream Integrity**: Next.js 16 enforces the **Node.js runtime** for `proxy.ts`. [cite_start]Do **NOT** export `runtime = "edge"`. [cite: 177, 1011]
- [cite_start]**Credit Guard**: If tools fail, verify the `usage` table has sufficient credits. [cite: 71, 901]