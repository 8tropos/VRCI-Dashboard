import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { ApiResponse, ContractMetadata } from '@/lib/api/types';

/**
 * GET /api/contracts/[name]/methods
 * Fetch contract metadata (methods, types, docs)
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ name: string }> }
): Promise<NextResponse<ApiResponse<ContractMetadata>>> {
  try {
    const { name } = await params;
    const metadataPath = path.join(
      process.cwd(),
      'src',
      'contracts',
      'metadata',
      `${name}.json`
    );

    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json(
        { success: false, error: `Contract ${name} not found` },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(metadataPath, 'utf-8');
    const json = JSON.parse(fileContent);

    // Extract contract info
    const contractInfo = json.contract || {};
    const spec = json.spec || {};

    const metadata: ContractMetadata = {
      name: contractInfo.name || name,
      version: contractInfo.version || '0.1.0',
      messages: spec.messages || [],
      constructors: spec.constructors || [],
    };

    return NextResponse.json({ success: true, data: metadata });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

