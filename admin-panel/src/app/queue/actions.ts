'use server'

import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });
const mcpQueue = new Queue('mcp-requests', { connection: redisConnection as any });

export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    mcpQueue.getWaitingCount(),
    mcpQueue.getActiveCount(),
    mcpQueue.getCompletedCount(),
    mcpQueue.getFailedCount(),
    mcpQueue.getDelayedCount()
  ]);

  return { waiting, active, completed, failed, delayed };
}

export async function getRecentJobs() {
  // Pegamos os últimos 100 jobs ordenados (descendente)
  const jobs = await mcpQueue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed'], 0, 100, true);
  
  return jobs.map(j => {
    // Determinar status do job
    let status = 'waiting';
    if (j.failedReason) status = 'failed';
    else if (j.finishedOn) status = 'completed';
    else if (j.processedOn) status = 'active';

    return {
      id: j.id,
      name: j.name,
      status,
      data: j.data,
      returnValue: j.returnvalue,
      failedReason: j.failedReason,
      stacktrace: j.stacktrace,
      timestamp: j.timestamp,
      processedOn: j.processedOn,
      finishedOn: j.finishedOn
    };
  });
}
