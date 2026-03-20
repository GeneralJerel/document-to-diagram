# Document to Diagram with CopilotKit

https://github.com/user-attachments/assets/5b16421d-e921-4ca4-ba0c-6d477ab4e0eb

Powered by [Open Generative UI](https://github.com/CopilotKit/OpenGenerativeUI)

An AI-powered document editor that transforms written content into interactive diagrams, timelines, and visualizations. Write or edit documents with real-time predictive state updates, then ask the agent to generate rich visual explanations — all rendered inline in the chat sidebar.

## Features

- **Open Generative UI** - The agent generates interactive HTML/SVG visualizations (diagrams, timelines, charts, step-through explainers) from document content, rendered in sandboxed iframes in the sidebar chat
- **Predictive state updates** - Document changes stream from the LangGraph agent to the TipTap editor in real time, with added/removed text highlighted via inline diffs
- **Expand to modal** - Visualizations can be expanded to a content-hugging modal for a closer look
- **Glassmorphic UI** - Frosted-glass shell with animated background blobs and a branded gradient header

## Architecture

```
src/
  app/
    page.tsx                  # Main page: CopilotKit + TipTap editor + hooks
    layout.tsx                # Root layout with Plus Jakarta Sans font
    globals.css               # Brand design tokens, glassmorphism, animations
    api/copilotkit/           # CopilotKit API route (connects to LangGraph)
  components/
    widget-renderer.tsx       # Sandboxed iframe renderer for HTML/SVG widgets

agent/
  agent.ts                    # LangGraph TypeScript agent (single chat_node graph)
  langgraph.json              # LangGraph deployment config
```

### How it works

1. The **LangGraph agent** (`agent/agent.ts`) runs a single `chat_node` that can call `write_document_local` to write/edit documents or `widgetRenderer` to create visualizations
2. **Predictive state updates** are configured via `predict_state` metadata, which streams the `document` argument of `write_document_local` to the frontend before the tool call completes
3. The **frontend** (`src/app/page.tsx`) uses `useAgent` to subscribe to state changes and renders the streamed document in a TipTap editor with diff highlighting
4. **Visualizations** are registered via CopilotKit's `useComponent` hook as a frontend tool, so the agent can call `widgetRenderer` and CopilotKit renders the result inline in the sidebar

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key

### Setup

1. Install dependencies:

```bash
npm install
cd agent && npm install
```

2. Configure environment variables:

```bash
# Root .env or .env.local
OPENAI_API_KEY=sk-...
LANGGRAPH_URL=http://localhost:2024

# agent/.env
OPENAI_API_KEY=sk-...
```

3. Start the LangGraph agent:

```bash
npm run agent
```

4. In a separate terminal, start the Next.js app:

```bash
npm run dev
```

5. Open [http://localhost:3003](http://localhost:3003)

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS 4, TipTap
- **Agent**: LangGraph (TypeScript), OpenAI
- **Integration**: CopilotKit v2 (ag-ui protocol)
- **Styling**: Glassmorphic design with CSS custom properties, Plus Jakarta Sans
