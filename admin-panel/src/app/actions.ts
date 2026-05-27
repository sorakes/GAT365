'use server'

import { Redis } from 'ioredis';
import fs from 'fs/promises';
import path from 'path';

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

export async function getDashboardData() {
  const conc = await redis.get('mcp:settings:concurrency');
  const disabledTools = await redis.smembers('mcp:permissions:disabled_tools');
  
  let availableTools: Array<any> = [];
  try {
    const endpointsPath = path.join(process.cwd(), '../src/endpoints.json');
    const data = await fs.readFile(endpointsPath, 'utf8');
    const endpoints = JSON.parse(data);
    const uniqueMap = new Map();
    endpoints.forEach((e: any) => {
      if (!uniqueMap.has(e.toolName)) {
        uniqueMap.set(e.toolName, {
          toolName: e.toolName,
          description: e.description || 'Integração Microsoft Graph',
          method: e.method ? e.method.toUpperCase() : 'GET',
          pathPattern: e.pathPattern || '',
          scopes: e.scopes || e.workScopes || [],
          llmTip: e.llmTip || ''
        });
      }
    });
    availableTools = Array.from(uniqueMap.values());
  } catch (err) {
    console.error('Failed to read endpoints.json:', err);
  }

  return {
    concurrency: conc ? parseInt(conc, 10) : 1,
    disabledTools,
    availableTools
  };
}

export async function setConcurrency(val: number) {
  await redis.set('mcp:settings:concurrency', val.toString());
}

export async function toggleTool(toolName: string, isEnabled: boolean) {
  if (isEnabled) {
    await redis.srem('mcp:permissions:disabled_tools', toolName);
  } else {
    await redis.sadd('mcp:permissions:disabled_tools', toolName);
  }
}

export async function toggleBulkTools(toolNames: string[], isEnabled: boolean) {
  if (toolNames.length === 0) return;
  
  const pipeline = redis.pipeline();
  for (const toolName of toolNames) {
    if (isEnabled) {
      pipeline.srem('mcp:permissions:disabled_tools', toolName);
    } else {
      pipeline.sadd('mcp:permissions:disabled_tools', toolName);
    }
  }
  await pipeline.exec();
}

// Helpers para token cache MSAL
function unwrapCache(raw: string): { data: string; savedAt?: number } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed._cacheEnvelope && typeof parsed.data === 'string') {
      return { data: parsed.data, savedAt: parsed.savedAt };
    }
  } catch {}
  return { data: raw };
}

export async function getAccounts() {
  try {
    const raw = await redis.get('mcp:auth:token_cache');
    if (!raw) return [];
    
    const unwrapped = unwrapCache(raw);
    const msalCache = JSON.parse(unwrapped.data);
    
    if (!msalCache.Account) return [];
    
    return Object.values(msalCache.Account).map((acc: any) => ({
      homeAccountId: acc.homeAccountId,
      environment: acc.environment,
      username: acc.username,
      name: acc.name,
      localAccountId: acc.localAccountId
    }));
  } catch (err) {
    console.error('Failed to parse accounts from Redis:', err);
    return [];
  }
}

export async function removeAccount(homeAccountId: string) {
  try {
    const raw = await redis.get('mcp:auth:token_cache');
    if (!raw) return { success: false, error: 'Cache is empty' };
    
    const unwrapped = unwrapCache(raw);
    const msalCache = JSON.parse(unwrapped.data);
    
    if (msalCache.Account) {
      const key = Object.keys(msalCache.Account).find(
        k => msalCache.Account[k].homeAccountId === homeAccountId
      );
      if (key) {
        delete msalCache.Account[key];
        
        ['AccessToken', 'RefreshToken', 'IdToken'].forEach(tokenType => {
          if (msalCache[tokenType]) {
            Object.keys(msalCache[tokenType]).forEach(k => {
              if (msalCache[tokenType][k].homeAccountId === homeAccountId) {
                delete msalCache[tokenType][k];
              }
            });
          }
        });

        const serialized = JSON.stringify(msalCache);
        const wrapped = JSON.stringify({ _cacheEnvelope: true, data: serialized, savedAt: Date.now() });
        await redis.set('mcp:auth:token_cache', wrapped);
      }
    }

    const selectedRaw = await redis.get('mcp:auth:selected_account');
    if (selectedRaw) {
      const selectedUnwrapped = unwrapCache(selectedRaw);
      try {
        const selected = JSON.parse(selectedUnwrapped.data);
        if (selected.accountId === homeAccountId) {
          await redis.del('mcp:auth:selected_account');
        }
      } catch {}
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
