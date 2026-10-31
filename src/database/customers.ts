import { supabase } from '../services/supabase';
import type { Customer, LoyaltyLedgerEntry } from '../types/database';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LC-${code}`;
}

export async function getAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const q = `%${query}%`;
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.${q},code.ilike.${q},phone.ilike.${q}`)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function getCustomerByCode(code: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('code', code.trim())
    .single();
  if (error) return null;
  return data;
}

export interface CustomerInput {
  name: string;
  phone?: string | null;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from('customers')
      .insert({ code, name: input.name.trim(), phone: input.phone?.trim() || null })
      .select()
      .single();
    if (data) return data;
    if (error && !String(error.message).includes('unique')) throw error;
  }
  throw new Error('Failed to generate unique customer code');
}

export async function updateCustomer(
  id: number,
  input: Partial<CustomerInput> & { is_active?: number }
): Promise<void> {
  const updates: any = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.phone !== undefined) updates.phone = input.phone?.trim() || null;
  if (input.is_active !== undefined) updates.is_active = input.is_active;
  if (Object.keys(updates).length === 0) return;
  
  const { error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCustomer(id: number): Promise<void> {
  // Assuming cascading deletes are configured on loyalty_ledger and sales tables in Supabase
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function adjustPoints(
  customerId: number,
  deltaPoints: number,
  description: string,
  createdBy: number
): Promise<number> {
  // NOTE: This should be implemented as a Postgres RPC function for atomicity.
  // Client-side flow for now:
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
  if (fetchError || !customer) throw new Error('Customer not found');
  
  const newBalance = customer.points_balance + deltaPoints;
  if (newBalance < 0) throw new Error('Adjustment would make balance negative');
  
  const { error: ledgerError } = await supabase.from('loyalty_ledger').insert({
    customer_id: customerId,
    sale_id: null,
    type: 'adjust',
    points: deltaPoints,
    description,
    created_by: createdBy,
  });
  if (ledgerError) throw ledgerError;
  
  const { error: updateError } = await supabase
    .from('customers')
    .update({
      points_balance: newBalance,
      lifetime_points: Math.max(customer.lifetime_points + (deltaPoints > 0 ? deltaPoints : 0), 0),
    })
    .eq('id', customerId);
  if (updateError) throw updateError;
  
  return newBalance;
}

export async function getLedger(
  customerId: number,
  limit: number = 100
): Promise<LoyaltyLedgerEntry[]> {
  const { data, error } = await supabase
    .from('loyalty_ledger')
    .select('*')
    .eq('customer_id', customerId)
    .order('id', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getActiveCustomersCount(): Promise<number> {
  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', 1);
  if (error) throw error;
  return count ?? 0;
}
