// Re-export ToolLoopAgent from AI SDK 6 under the project's lib path.
// This keeps import paths consistent with provider-factory.ts and embeddings.ts
// and gives us a single place to swap the implementation if the SDK API changes.
export { ToolLoopAgent } from "ai";
