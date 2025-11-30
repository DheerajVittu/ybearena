import { createClient } from "@supabase/supabase-js";

const NEXT_PUBLIC_SUPABASE_URL = "https://zgdiqbegspidkmmpojaw.supabase.co";
const NEXT_PUBLIC_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZGlxYmVnc3BpZGttbXBvamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NjIsImV4cCI6MjA4MDAxMDU2Mn0.yNHR8QcU0TSOgJt3u_pqEdPQUT7CgcbEnmuZFx-aihA";

export const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY
);
