import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { ApiResponse } from '@/lib/api/types';

const tokenUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});

// GET /api/tokens/[id] - Get a specific token
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const token = await prisma.token.findUnique({
      where: { id },
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: token,
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch token',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/tokens/[id] - Update a token
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = tokenUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const token = await prisma.token.update({
      where: { id },
      data: validationResult.data,
    });

    return NextResponse.json({
      success: true,
      data: token,
    });
  } catch (error) {
    console.error('Error updating token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update token',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/tokens/[id] - Delete a token
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const { id } = await params;
    await prisma.token.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Token deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete token',
      },
      { status: 500 }
    );
  }
}

