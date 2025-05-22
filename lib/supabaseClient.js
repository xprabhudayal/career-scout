'use client'

import { createClient } from "@supabase/supabase-js";
const URL = process.env.SUPABASE_URL

const ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcmlwdGppYmJ6d2NpYnlwcmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MzMxNDMsImV4cCI6MjA2MzUwOTE0M30.DsfjjW_t9Ns8s5rY6oOpKn0PGV9yz51CjZkX9I7U6Pw"

export const supabase = createClient("https://ucriptjibbzwcibyprfh.supabase.co",  ANON);
