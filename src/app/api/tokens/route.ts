import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { ApiResponse } from '@/lib/api/types';

const tokenCreateSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol must be 10 characters or less'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
});

const tokenUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});

// GET /api/tokens - List all tokens
export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const tokens = await prisma.token.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tokens',
      },
      { status: 500 }
    );
  }
}

// POST /api/tokens - Create a new token
export async function POST(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validationResult = tokenCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { symbol, name, description, enabled } = validationResult.data;

    // Check if token already exists
    const existing = await prisma.token.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Token with symbol ${symbol.toUpperCase()} already exists` },
        { status: 409 }
      );
    }

    const token = await prisma.token.create({
      data: {
        symbol: symbol.toUpperCase(),
        name,
        description,
        enabled,
      },
    });

    return NextResponse.json({
      success: true,
      data: token,
    });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create token',
      },
      { status: 500 }
    );
  }
}

