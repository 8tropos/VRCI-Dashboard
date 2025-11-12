import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { ApiResponse } from '@/lib/api/types';

/**
 * GET /api/contracts
 * List all deployed contracts from the metadata folder
 */
export async function GET(): Promise<NextResponse<ApiResponse<string[]>>> {
  try {
    const metadataPath = path.join(process.cwd(), 'src', 'contracts', 'metadata');
    
    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json(
        { success: false, error: 'Metadata directory not found' },
        { status: 404 }
      );
    }

    const files = fs.readdirSync(metadataPath).filter((f) => f.endsWith('.json'));
    const contracts = files.map((f) => f.replace('.json', ''));

    return NextResponse.json({ success: true, data: contracts });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

