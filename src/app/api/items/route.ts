// app/api/items/route.ts
import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

// Debug: Confirm env var is loaded
console.log('API route loaded - DATABASE_URL exists?', !!process.env.DATABASE_URL);

export async function GET() {
  try {
    console.log('GET /api/items called');
    const items = await sql`SELECT * FROM items ORDER BY created_at DESC`;
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/items called');
  try {
    const body = await request.json();
    console.log('POST body received:', body);

    const {
      name,
      created_by = 'Anonymous',
      quantity,
      price,
      notes,
      category,
      customFields,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const [newItem] = await sql`
      INSERT INTO items (
        name, created_by, quantity, price, notes, category, custom_fields
      ) VALUES (
        ${name.trim()},
        ${created_by},
        ${quantity ?? null},
        ${price ?? null},
        ${notes ?? null},
        ${category ?? null},
        ${customFields ? JSON.stringify(customFields) : null}::jsonb
      )
      RETURNING *
    `;

    // Auto-calculate total
    if (newItem.quantity != null && newItem.price != null) {
      await sql`
        UPDATE items 
        SET total = ${newItem.quantity * newItem.price}
        WHERE id = ${newItem.id}
      `;
    }

    // Return fresh data
    const [fresh] = await sql`SELECT * FROM items WHERE id = ${newItem.id}`;
    return NextResponse.json(fresh, { status: 201 });
  } catch (error: any) {
    console.error('POST error details:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to add item', details: error.message },
      { status: 500 }
    );
  }
}

// Optional: Add PUT & DELETE if not already there
export async function PUT(request: NextRequest) {
  // ... your PUT logic (similar to previous version)
  console.log('PUT called');
  // implement update...
}

export async function DELETE(request: NextRequest) {
  console.log('DELETE called');
  try {
    const { id } = await request.json();
    await sql`DELETE FROM items WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}