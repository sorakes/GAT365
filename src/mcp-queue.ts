import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { redisConnection, getQueueConcurrency } from './redis-settings.js';
import logger from './logger.js';
import { randomUUID } from 'crypto';
import { getRequestTokens } from './request-context.js';
import { getUserIdentityForAudit } from './audit-log.js';

export const mcpQueue = new Queue('mcp-requests', { connection: redisConnection as any });
export const mcpQueueEvents = new QueueEvents('mcp-requests', { connection: redisConnection as any });

// Registro das funções originais para que o Worker saiba o que executar
type ToolExecutor = (params: any) => Promise<any>;
const toolExecutors = new Map<string, ToolExecutor>();

export function registerToolExecutor(toolAlias: string, executor: ToolExecutor) {
  toolExecutors.set(toolAlias, executor);
}

let worker: Worker | null = null;

export async function initializeWorker() {
  if (worker) return;
  const concurrency = await getQueueConcurrency();
  logger.info(`Starting MCP Queue Worker with concurrency: ${concurrency}`);
  
  worker = new Worker('mcp-requests', async (job: Job) => {
    const { toolAlias, params } = job.data;
    const executor = toolExecutors.get(toolAlias);
    if (!executor) {
      throw new Error(`No executor found for tool: ${toolAlias}`);
    }
    return await executor(params);
  }, { 
    connection: redisConnection as any,
    concurrency 
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed for tool ${job?.data?.toolAlias}: ${err.message}`);
  });
}

/**
 * Enfileira a chamada do MCP e trava (await) até que a execução termine.
 */
export async function enqueueToolCall(toolAlias: string, params: any) {
  const jobId = randomUUID();
  const token = getRequestTokens()?.accessToken;
  const username = getUserIdentityForAudit(token) || 'sistema / local';
  
  const job = await mcpQueue.add(toolAlias, { toolAlias, params, username }, { jobId });
  
  try {
    // 60s timeout para não prender o LLM para sempre
    const result = await job.waitUntilFinished(mcpQueueEvents, 60000); 
    return result;
  } catch (error) {
    logger.error(`Error waiting for job ${jobId}: ${error}`);
    throw error;
  }
}
