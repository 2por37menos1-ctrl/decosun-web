import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://raoztmkpispwpuiwmxbv.supabase.co'

const supabaseAnonKey = 'sb_publishable_S_hSds8GscLScsAMYSLO7w_seKc2-hN'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)