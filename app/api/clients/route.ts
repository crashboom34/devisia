import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // Fail fast at module load so deployments surface configuration issues
  throw new Error('Supabase environment variables are missing for client creation API.');
}

const supabaseServer = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : undefined;

    if (!token) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const { data: userResult, error: userError } = await supabaseServer.auth.getUser(token);
    if (userError || !userResult?.user) {
      return NextResponse.json({ error: "Session invalide ou expirée." }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      company,
      contactName,
      email,
      phone,
      address,
      postalCode,
      city,
      notes,
    } = body || {};

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Le nom ou la raison sociale est requis.' }, { status: 400 });
    }

    const { error } = await supabaseServer.from('clients').insert({
      user_id: userResult.user.id,
      name: String(name).trim(),
      company: company ? String(company).trim() : null,
      contact_name: contactName ? String(contactName).trim() : null,
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null,
      address: address ? String(address).trim() : null,
      postal_code: postalCode ? String(postalCode).trim() : null,
      city: city ? String(city).trim() : null,
      notes: notes ? String(notes).trim() : null,
      status: 'active',
    });

    if (error) {
      console.error('Supabase insert error (clients):', error);
      return NextResponse.json({ error: "Impossible d'enregistrer ce client. Merci de réessayer." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error while creating client:', err);
    return NextResponse.json({ error: "Impossible d'enregistrer ce client. Merci de réessayer." }, { status: 500 });
  }
}
