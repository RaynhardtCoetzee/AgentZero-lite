# 🧪 AgentZero Manual Testing Protocol

[cite_start]Follow these checklists at every "Quality Gate" and before every merge to `main`[cite: 709, 710].

## 1. Daily Smoke Test (5 mins)
- [ ] [cite_start]App starts without errors: `npm run dev` [cite: 713]
- [ ] [cite_start]Can sign in and sign out [cite: 713]
- [ ] [cite_start]Dashboard loads in under 2 seconds [cite: 713]
- [ ] [cite_start]No red errors in browser console [cite: 713]
- [ ] [cite_start]No TypeScript errors: `npx tsc --noEmit` [cite: 714]

## 2. Agent & Tools Checklist
- [ ] [cite_start]Prompt returns response from default model [cite: 722]
- [ ] [cite_start]Model swap via .env works for GPT-4o, Claude 3.7, and DeepSeek [cite: 722]
- [ ] [cite_start]Web search tool returns results for test query [cite: 722]
- [ ] [cite_start]Email tool successfully drafts/sends via Resend [cite: 722]
- [ ] [cite_start]Zod 4 validation rejects malformed input with 400/422 error [cite: 724]
- [ ] [cite_start]UI shows "Thinking..." logs during execution [cite: 724]

## 3. RAG & Memory Checklist
- [ ] [cite_start]PDF/TXT upload succeeds and stores vectors in Supabase [cite: 726, 727]
- [ ] [cite_start]Agent answers question using ONLY the uploaded context [cite: 728]
- [ ] [cite_start]Agent does NOT hallucinate content outside the document [cite: 729]
- [ ] [cite_start]Vector cache invalidates on document update [cite: 730]

## 4. Billing & Credits Checklist
- [ ] [cite_start]Webhook receives payment and updates credits correctly [cite: 732]
- [ ] [cite_start]Agent returns 402 error when credits are zero [cite: 734]
- [ ] [cite_start]Credits deducted ONLY on successful tool execution [cite: 735]
- [ ] [cite_start]Credits refunded/rolled back on agent failure [cite: 736, 737]