import { createClient } from '@supabase/supabase-js';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)
    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const { data, error } = await supabase
      .from('revenue')
      .select('*');

    if (error) {
      throw error;
    }

    // console.log('Data fetch completed after 3 seconds.');
    return data as Revenue[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        amount,
        customers (
          name,
          image_url,
          email
        )
      `)
      .order('date', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    const latestInvoices = data.map((invoice: any) => ({
      id: invoice.id,
      amount: formatCurrency(invoice.amount),
      name: invoice.customers.name,
      image_url: invoice.customers.image_url,
      email: invoice.customers.email,
    }));

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    // Execute multiple queries in parallel using Promise.all
    const [invoicesResult, customersResult, invoiceStatusResult] = await Promise.all([
      // Count total invoices
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true }),
      
      // Count total customers
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true }),
      
      // Get paid and pending invoice totals
      supabase
        .from('invoices')
        .select('amount, status')
    ]);

    if (invoicesResult.error) throw invoicesResult.error;
    if (customersResult.error) throw customersResult.error;
    if (invoiceStatusResult.error) throw invoiceStatusResult.error;

    const numberOfInvoices = invoicesResult.count ?? 0;
    const numberOfCustomers = customersResult.count ?? 0;

    // Calculate paid and pending totals
    const paidTotal = invoiceStatusResult.data
      ?.filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0;
    
    const pendingTotal = invoiceStatusResult.data
      ?.filter(invoice => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0;

    const totalPaidInvoices = formatCurrency(paidTotal);
    const totalPendingInvoices = formatCurrency(pendingTotal);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    let supabaseQuery = supabase
      .from('invoices')
      .select(`
        id,
        amount,
        date,
        status,
        customers (
          name,
          email,
          image_url
        )
      `)
      .order('date', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    // If there's a query, add filtering
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `customers.name.ilike.%${query}%,customers.email.ilike.%${query}%,amount::text.ilike.%${query}%,date::text.ilike.%${query}%,status.ilike.%${query}%`
      );
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const invoices = data.map((invoice: any) => ({
      id: invoice.id,
      amount: invoice.amount,
      date: invoice.date,
      status: invoice.status,
      name: invoice.customers.name,
      email: invoice.customers.email,
      image_url: invoice.customers.image_url,
    })) as InvoicesTable[];

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    let supabaseQuery = supabase
      .from('invoices')
      .select(`
        id,
        customers (
          name,
          email
        )
      `, { count: 'exact', head: true });

    // If there's a query, add filtering
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `customers.name.ilike.%${query}%,customers.email.ilike.%${query}%,amount::text.ilike.%${query}%,date::text.ilike.%${query}%,status.ilike.%${query}%`
      );
    }

    const { count, error } = await supabaseQuery;

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        customer_id,
        amount,
        status
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    // Convert amount from cents to dollars
    const invoice = {
      ...data,
      amount: data.amount / 100,
    };

    return invoice as InvoiceForm;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        name
      `)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data as CustomerField[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    // First, get customers with filtering
    let customersQuery = supabase
      .from('customers')
      .select(`
        id,
        name,
        email,
        image_url
      `)
      .order('name', { ascending: true });

    if (query) {
      customersQuery = customersQuery.or(
        `name.ilike.%${query}%,email.ilike.%${query}%`
      );
    }

    const { data: customers, error: customersError } = await customersQuery;

    if (customersError) {
      throw customersError;
    }

    // Get invoice data for each customer
    const customersWithInvoices = await Promise.all(
      customers.map(async (customer) => {
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('id, amount, status')
          .eq('customer_id', customer.id);

        if (invoicesError) {
          throw invoicesError;
        }

        const totalInvoices = invoices.length;
        const totalPending = invoices
          .filter(inv => inv.status === 'pending')
          .reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0);

        return {
          ...customer,
          total_invoices: totalInvoices,
          total_pending: totalPending,
          total_paid: totalPaid,
        };
      })
    );

    return customersWithInvoices as CustomersTableType[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer table.');
  }
}