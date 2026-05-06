import { NextResponse } from 'next/server';
import { disconnectPolkadotClient, getPolkadotClient } from '@/lib/polkadotClient';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/lib/api/types';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    api: 'up' | 'down';
    database: 'up' | 'down';
    polkadot: 'up' | 'down';
  };
  uptime: number;
}

const POLKADOT_HEALTH_TIMEOUT_MS = 5000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * GET /api/health
 * System heartbeat and version info
 */
export async function GET(): Promise<NextResponse<ApiResponse<HealthData>>> {
  const startTime = Date.now();
  const services: {
    api: 'up' | 'down';
    database: 'up' | 'down';
    polkadot: 'up' | 'down';
  } = {
    api: 'up',
    database: 'down',
    polkadot: 'down',
  };

  // Check database connection
  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      services.database = 'up';
    } catch (error) {
      console.error('Database health check failed:', error);
    }
  }

  // Check Polkadot connection
  try {
    const api = await withTimeout(
      getPolkadotClient(),
      POLKADOT_HEALTH_TIMEOUT_MS,
      'Polkadot client connection'
    );

    await withTimeout(
      api.rpc.system.health(),
      POLKADOT_HEALTH_TIMEOUT_MS,
      'Polkadot health check'
    );

    services.polkadot = 'up';
  } catch (error) {
    console.error('Polkadot health check failed:', error);
    await disconnectPolkadotClient();
  }

  const allServicesUp = Object.values(services).every((status) => status === 'up');
  const status = allServicesUp ? 'healthy' : services.database === 'down' ? 'unhealthy' : 'degraded';

  const healthData: HealthData = {
    status,
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
    services,
    uptime: Date.now() - startTime,
  };

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return NextResponse.json(
    { success: true, data: healthData },
    { status: statusCode }
  );
}
