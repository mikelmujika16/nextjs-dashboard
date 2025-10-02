import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../lib/supabase';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

async function seedUsers() {
  // Hash passwords for users
  const usersWithHashedPasswords = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
      };
    })
  );

  // Insert users using Supabase
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(usersWithHashedPasswords, {
      onConflict: 'id',
      ignoreDuplicates: true,
    });

  if (error) {
    console.error('Error seeding users:', error);
    throw error;
  }

  return data;
}

async function seedInvoices() {
  // Insert invoices using Supabase
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .upsert(invoices, {
      onConflict: 'id',
      ignoreDuplicates: true,
    });

  if (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }

  return data;
}

async function seedCustomers() {
  // Insert customers using Supabase
  const { data, error } = await supabaseAdmin
    .from('customers')
    .upsert(customers, {
      onConflict: 'id',
      ignoreDuplicates: true,
    });

  if (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }

  return data;
}

async function seedRevenue() {
  // Insert revenue using Supabase
  const { data, error } = await supabaseAdmin
    .from('revenue')
    .upsert(revenue, {
      onConflict: 'month',
      ignoreDuplicates: true,
    });

  if (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }

  return data;
}

export async function GET() {
  try {
    // Seed all tables
    await seedUsers();
    await seedCustomers(); 
    await seedInvoices();
    await seedRevenue();

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Database seeding error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Database seeding failed' 
    }, { status: 500 });
  }
}
