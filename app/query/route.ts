import { createClient } from '../lib/supabase/client';

const supabase = createClient();

async function listInvoicesManualJoin() {

  console.log('Fetching revenue data...');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Get invoices first
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('id, amount, customer_id')
    .eq('amount', 666);

  if (invoicesError) {
    console.error('Error fetching invoices:', invoicesError);
    throw invoicesError;
  }

  // Get customer data for each invoice
  const result = await Promise.all(
    invoices.map(async (invoice) => {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('name')
        .eq('id', invoice.customer_id)
        .single();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
        throw customerError;
      }

      return {
        amount: invoice.amount,
        customers: {
          name: customer.name
        }
      };
    })
  );

  return result;
}

export async function GET() {
  try {
    return Response.json(await listInvoicesManualJoin());
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}