// app/api/items/route.ts
import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

// Safely initialize the Neon client so builds don't crash if env is missing
const connectionString = process.env.DATABASE_URL;

// Use a relaxed type here to avoid build-time type issues with Neon generics
const sql = connectionString ? (neon(connectionString) as any) : null;

// Debug: Confirm env var is loaded
console.log('API route loaded - DATABASE_URL exists?', !!connectionString);

export async function GET() {
  try {
    if (!sql) {
      console.error('GET /api/items: DATABASE_URL is not configured');
      return NextResponse.json(
        { error: 'Database is not configured on the server.' },
        { status: 500 }
      );
    }
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sql) {
      console.error('POST /api/items: DATABASE_URL is not configured');
      return NextResponse.json(
        { error: 'Database is not configured on the server.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('POST body received:', body);

    const {
      name,
      quantity,
      price,
      notes,
      category,
      customFields,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const createdBy = session.user.name || session.user.email!;
    const ownerEmail = session.user.email!;

    const [newItem] = await sql`
      INSERT INTO items (
        name, created_by, owner_email, quantity, price, notes, category, custom_fields
      ) VALUES (
        ${name.trim()},
        ${createdBy},
        ${ownerEmail},
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

export async function PUT(request: NextRequest) {
  console.log('PUT /api/items called');
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sql) {
      console.error('PUT /api/items: DATABASE_URL is not configured');
      return NextResponse.json(
        { error: 'Database is not configured on the server.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      quantity,
      price,
      notes,
      category,
      customFields,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Fetch existing item to check ownership
    const [existing] = await sql`
      SELECT id, owner_email
      FROM items
      WHERE id = ${id}
    `;

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const userRole = (session.user as any).role || "user";
    const isOwner = existing.owner_email === session.user.email;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`
      UPDATE items
      SET
        name = ${name?.trim() ?? existing.name},
        quantity = ${quantity ?? null},
        price = ${price ?? null},
        notes = ${notes ?? null},
        category = ${category ?? null},
        custom_fields = ${customFields ? JSON.stringify(customFields) : null}::jsonb
      WHERE id = ${id}
    `;

    // Recalculate total if needed
    if (quantity != null && price != null) {
      await sql`
        UPDATE items 
        SET total = ${quantity * price}
        WHERE id = ${id}
      `;
    }

    const [fresh] = await sql`SELECT * FROM items WHERE id = ${id}`;
    return NextResponse.json(fresh);
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update item', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log('DELETE called');
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sql) {
      console.error('DELETE /api/items: DATABASE_URL is not configured');
      return NextResponse.json(
        { error: 'Database is not configured on the server.' },
        { status: 500 }
      );
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const [existing] = await sql`
      SELECT id, owner_email
      FROM items
      WHERE id = ${id}
    `;

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const userRole = (session.user as any).role || "user";
    const isOwner = existing.owner_email === session.user.email;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`DELETE FROM items WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}