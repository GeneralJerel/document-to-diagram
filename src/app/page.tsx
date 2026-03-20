"use client";
import "@copilotkit/react-core/v2/styles.css";

import MarkdownIt from "markdown-it";
import React from "react";

import { diffWords } from "diff";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, useRef } from "react";
import {
  useAgent,
  useAgentContext,
  UseAgentUpdate,
  useHumanInTheLoop,
  useConfigureSuggestions,
  useDefaultRenderTool,
  CopilotSidebar,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { CopilotKit } from "@copilotkit/react-core";

const extensions = [StarterKit];

export default function PredictiveStateUpdates() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      showDevConsole={false}
      agent="predictive_state_updates"
    >
      <div className="min-h-screen w-full">
        <CopilotSidebar
          agentId="predictive_state_updates"
          defaultOpen={true}
          labels={{
            modalHeaderTitle: "AI Document Editor",
          }}
        />
        <DocumentEditor />
      </div>
    </CopilotKit>
  );
}

interface AgentState {
  document: string;
}

const DocumentEditor = () => {
  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "min-h-screen p-10" },
    },
  });
  const [placeholderVisible, setPlaceholderVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const currentDocumentRef = useRef("");
  const lastPlainTextRef = useRef("");
  const wasRunning = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);
    return () => {
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
    };
  }, [editor]);

  useConfigureSuggestions({
    suggestions: [
      {
        title: "Write a pirate story",
        message: "Please write a story about a pirate named Candy Beard.",
      },
      {
        title: "Write a mermaid story",
        message: "Please write a story about a mermaid named Luna.",
      },
      { title: "Add character", message: "Please add a character named Courage." },
    ],
    available: "always",
  });

  useAgentContext({
    description: "Document writing instructions",
    value:
      "You are an AI document editor. Write clear, well-structured documents using markdown. " +
      "Always use the write_document_local tool to write or edit documents. " +
      "Keep stories short and engaging.",
  });

  useDefaultRenderTool({
    render: ({ name, status }) => {
      if (name === "confirm_changes" || name === "write_document") return <></>;
      return (
        <div className="text-xs text-gray-500 px-3 py-2 rounded bg-gray-50 my-1">
          <span className="font-medium">{name}</span>
          {status === "executing" && <span className="ml-2 animate-pulse">running...</span>}
          {status === "complete" && <span className="ml-2">done</span>}
        </div>
      );
    },
  });

  const { agent } = useAgent({
    agentId: "predictive_state_updates",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });

  const agentState = agent.state as AgentState | undefined;
  const setAgentState = (s: AgentState) => agent.setState(s);
  const isLoading = agent.isRunning;

  useEffect(() => {
    if (isLoading) {
      currentDocumentRef.current = agentState?.document || editor?.getText() || "";
    }
    editor?.setEditable(!isLoading);
  }, [isLoading, editor]);

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (wasRunning.current && !isLoading) {
      const newDoc = agentState?.document || "";
      // Show the final clean document (no diff highlights)
      editor?.commands.setContent(fromMarkdown(newDoc));
      currentDocumentRef.current = newDoc;
      lastPlainTextRef.current = editor?.getText() || "";
    }
    wasRunning.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) {
      const saved = currentDocumentRef.current;
      const newDoc = agentState?.document || "";
      if (saved.trim().length > 0) {
        const diff = diffPartialText(saved, newDoc);
        editor?.commands.setContent(fromMarkdown(diff));
      } else {
        editor?.commands.setContent(fromMarkdown(newDoc));
      }
    }
  }, [agentState?.document]);

  const text = editor?.getText() || "";

  useEffect(() => {
    if (!isMountedRef.current) return;
    setPlaceholderVisible(text.length === 0);

    if (!isLoading && text !== lastPlainTextRef.current) {
      lastPlainTextRef.current = text;
      currentDocumentRef.current = text;
      setAgentState({
        document: text,
      });
    }
  }, [text, isLoading, isFocused, setAgentState]);

  // Auto-accept confirm_changes and write_document tool calls
  useHumanInTheLoop(
    {
      agentId: "predictive_state_updates",
      name: "confirm_changes",
      render: ({ respond, status }) => {
        if (status === "executing" && respond) {
          respond({ accepted: true });
        }
        return <></>;
      },
    },
    [],
  );

  useHumanInTheLoop(
    {
      agentId: "predictive_state_updates",
      name: "write_document",
      description: "Present the proposed changes to the user for review",
      parameters: z.object({
        document: z.string().describe("The full updated document in markdown format"),
      }),
      render({ status, respond }: { status: string; respond?: (result: unknown) => Promise<void> }) {
        if (status === "executing" && respond) {
          respond({ accepted: true });
        }
        return <></>;
      },
    },
    [],
  );

  return (
    <div className="relative min-h-screen w-full">
      {placeholderVisible && (
        <div className="absolute top-6 left-6 m-4 pointer-events-none text-gray-400">
          Write whatever you want here in Markdown format...
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

function fromMarkdown(text: string) {
  const md = new MarkdownIt({
    typographer: true,
    html: true,
  });
  return md.render(text);
}

function diffPartialText(oldText: string, newText: string, isComplete: boolean = false) {
  let oldTextToCompare = oldText;
  if (oldText.length > newText.length && !isComplete) {
    oldTextToCompare = oldText.slice(0, newText.length);
  }

  const changes = diffWords(oldTextToCompare, newText);

  let result = "";
  changes.forEach((part) => {
    if (part.added) {
      result += `<em>${part.value}</em>`;
    } else if (part.removed) {
      result += `<s>${part.value}</s>`;
    } else {
      result += part.value;
    }
  });

  if (oldText.length > newText.length && !isComplete) {
    result += oldText.slice(newText.length);
  }

  return result;
}
