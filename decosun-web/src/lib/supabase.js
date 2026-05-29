import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  "https://raoztmkpispwpuiwmxbv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_S_hSds8GscLScsAMYSLO7w_seKc2-hN";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
