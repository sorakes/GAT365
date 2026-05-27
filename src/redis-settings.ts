import { Redis } from 'ioredis';
import logger from './logger.js';

export const redisConnection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Checa se a ferramenta está desativada no Painel.
 * Por padrão, falha "aberto" (permite) se o Redis estiver fora do ar no ambiente local sem painel.
 */
export async function isToolAllowed(toolName: string): Promise<boolean> {
  try {
    const disabled = await redisConnection.sismember('mcp:permissions:disabled_tools', toolName);
    return disabled === 0; // 0 significa que não está na lista de desativadas (logo, está permitida)
  } catch (error) {
    logger.error('Redis error checking tool permission:', error);
    return true; 
  }
}

/**
 * Pega a concorrência definida no Painel. Padrão 1 se não definido.
 */
export async function getQueueConcurrency(): Promise<number> {
  try {
    const conc = await redisConnection.get('mcp:settings:concurrency');
    return conc ? parseInt(conc, 10) : 1;
  } catch {
    return 1;
  }
}
