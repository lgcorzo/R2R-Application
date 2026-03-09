// R2R SSE Event Types based on official documentation
// https://github.com/sciphi-ai/r2r/blob/main/docs/documentation/retrieval/agentic-rag.md

export interface ThinkingEventData {
  delta: {
    content: Array<{
      type: string;
      payload: {
        value: string;
      };
    }>;
  };
}

export interface ToolCallEventData {
  name: string;
  arguments: string | Record<string, unknown>;
}

export interface ToolResultEventData {
  content: string;
}

export interface CitationEventData {
  id: string;
  payload?: unknown;
  is_new?: boolean;
  span?: [number, number];
}

export interface MessageEventData {
  delta: {
    content: Array<{
      type: string;
      payload: {
        value: string;
      };
    }>;
  };
}

export interface FinalAnswerEventData {
  generated_answer: string;
  citations: Array<{
    id: string;
    span: [number, number];
    payload?: unknown;
  }>;
}

export interface SearchResultsEventData {
  data: {
    chunk_search_results?: Array<{
      text: string;
      score: number;
      metadata: Record<string, unknown>;
    }>;
    graph_search_results?: Array<{
      result_type: string;
      content: Record<string, unknown>;
    }>;
    web_search_results?: unknown[];
  };
}

// SSE Event Types
export type R2REventType =
  | 'search_results'
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'citation'
  | 'message'
  | 'final_answer';

export interface R2RSSEEvent {
  event: R2REventType;
  data:
    | SearchResultsEventData
    | ThinkingEventData
    | ToolCallEventData
    | ToolResultEventData
    | CitationEventData
    | MessageEventData
    | FinalAnswerEventData;
}

// Extended Message type with agent activity
export interface AgentActivity {
  type: 'thinking' | 'tool_call' | 'tool_result';
  content: string;
  timestamp: number;
}
