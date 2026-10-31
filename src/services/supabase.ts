import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdhoofntiqmobuqwnlqo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_k0DOp9d36gA3DVaLfiAb1g_s6CN2y7j';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
