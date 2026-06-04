import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("setting_key", "estimated_time")
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error("Supabase error (get setting):", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data?.setting_value || "45-50 minutes" }, { status: 200 });
  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { setting_value } = await request.json();

    if (!setting_value) {
      return NextResponse.json({ success: false, message: "Setting value is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("store_settings")
      .upsert({ 
        setting_key: "estimated_time", 
        setting_value,
        updated_at: new Date().toISOString()
      }, { onConflict: "setting_key" })
      .select()
      .single();

    if (error) {
      console.error("Supabase error (update setting):", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data.setting_value }, { status: 200 });
  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
