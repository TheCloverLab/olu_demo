/**
 * Task Agent — LangGraph graph that executes workspace tasks
 *
 * Flow: receive task → plan steps → execute tools → (optional) human approval → complete
 */

import { StateGraph, Annotation, interrupt, MemorySaver } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { allTools } from '../tools/workspace-tools.js'

// --- State definition ---

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  workspaceId: Annotation<string>(),
  agentId: Annotation<string>(),
  agentName: Annotation<string>(),
  agentPosition: Annotation<string>(),
  taskDescription: Annotation<string>(),
  requiresApproval: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  approved: Annotation<boolean | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
})

// --- Nodes ---

function buildModel() {
  const apiKey = process.env.LLM_API_KEY
  const baseURL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1'
  const modelName = process.env.LLM_MODEL || 'gpt-4o-mini'

  return new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName,
    configuration: { baseURL },
    temperature: 0.3,
  }).bindTools(allTools)
}

async function agentNode(state: typeof AgentState.State) {
  const model = buildModel()

  const systemPrompt = new SystemMessage(
    `You are ${state.agentName}, a ${state.agentPosition} AI agent working in a business workspace.

Your workspace ID is: ${state.workspaceId}
Your agent ID is: ${state.agentId}

You have tools to manage tasks in the workspace. Use them to complete the user's request.

Guidelines:
- Always check your current tasks first before taking action
- Update task status as you work (pending → in_progress → done)
- Be concise in your reasoning
- If you need to create new tasks, use descriptive task keys`,
  )

  const messages =
    state.messages.length === 0
      ? [systemPrompt, new HumanMessage(state.taskDescription)]
      : [systemPrompt, ...state.messages]

  const response = await model.invoke(messages)
  return { messages: [response] }
}

function shouldContinue(state: typeof AgentState.State) {
  const lastMessage = state.messages[state.messages.length - 1]
  const aiMessage = lastMessage as any

  // If the LLM made tool calls, execute them
  if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
    // Check if any tool call modifies task status to 'done' — may require approval
    const hasDoneUpdate = aiMessage.tool_calls.some(
      (tc: any) =>
        tc.name === 'update_task_status' && tc.args?.status === 'done',
    )
    if (hasDoneUpdate && state.requiresApproval && state.approved === null) {
      return 'approval'
    }
    return 'tools'
  }

  // No tool calls — agent is done
  return '__end__'
}

async function approvalNode(state: typeof AgentState.State) {
  // Interrupt execution and wait for human approval
  const decision = interrupt({
    question:
      'The agent wants to mark a task as done. Do you approve?',
    agentId: state.agentId,
    agentName: state.agentName,
  })

  return { approved: decision === 'approve' }
}

function afterApproval(state: typeof AgentState.State) {
  if (state.approved) {
    return 'tools'
  }
  return '__end__'
}

// --- Graph ---

const toolNode = new ToolNode(allTools)

const graph = new StateGraph(AgentState)
  .addNode('agent', agentNode)
  .addNode('tools', toolNode)
  .addNode('approval', approvalNode)
  .addEdge('__start__', 'agent')
  .addConditionalEdges('agent', shouldContinue, {
    tools: 'tools',
    approval: 'approval',
    __end__: '__end__',
  })
  .addConditionalEdges('approval', afterApproval, {
    tools: 'tools',
    __end__: '__end__',
  })
  .addEdge('tools', 'agent')

// Use in-memory checkpointing (swap for Postgres in production)
const checkpointer = new MemorySaver()

export const taskAgent = graph.compile({ checkpointer })
export type TaskAgentState = typeof AgentState.State
