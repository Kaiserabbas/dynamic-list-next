// src/app/api/items/route.ts
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Try to read items (table may not exist yet → we'll create it next)
    const items = await sql`SELECT * FROM items ORDER BY created_at DESC LIMIT 50`;
    
    return NextResponse.json(items);
  } catch (error: any) {
    console.error("DB read error:", error);
    return NextResponse.json(
      { error: "Database connection failed", details: error?.message },
      { status: 500 }
    );
  }
}