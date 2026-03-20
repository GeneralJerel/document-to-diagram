import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotEndpointSingleRoute,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@ag-ui/langgraph";
import { handle } from "hono/vercel";
import type { NextRequest } from "next/server";

const langgraphUrl = process.env.LANGGRAPH_URL || "http://localhost:8123";

const agents = {
  predictive_state_updates: new LangGraphAgent({
    deploymentUrl: langgraphUrl,
    graphId: "predictive_state_updates",
  }),
};

const runtime = new CopilotRuntime({
  agents,
  runner: new InMemoryAgentRunner(),
});

const app = createCopilotEndpointSingleRoute({
  runtime,
  basePath: "/api/copilotkit",
});

const handler = handle(app);

export async function POST(request: NextRequest) {
  return handler(request);
}
