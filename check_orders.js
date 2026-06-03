import { supabase } from "./app/lib/supabase.js";
import { readFileSync } from "fs";

async function check() {
  const { data, error } = await supabase.from("orders").select("*").limit(1);
  console.log(JSON.stringify(data, null, 2));
}

check();
