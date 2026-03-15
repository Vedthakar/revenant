import { NextResponse } from 'next/server';
import { getMemoryHealth } from '@/lib/moorchehMemory';

// GET /api/memory-health — returns all memory nodes with strength/decay data for D3 graph
export async function GET() {
  try {
    const nodes = await getMemoryHealth();
    return NextResponse.json({ nodes });
  } catch (error: any) {
    console.error('[MEMORY-HEALTH]', error.message);
    return NextResponse.json({ nodes: [], error: error.message }, { status: 500 });
  }
}
