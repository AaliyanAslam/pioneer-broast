import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Database Error (Coupons GET):", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid JSON payload" }, { status: 400 });
    }
    
    const { code, discount_type, discount_value, usage_limit } = body;

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("coupons")
      .insert([{
        code: code.toUpperCase(),
        discount_type,
        discount_value,
        usage_limit: usage_limit || null,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase Database Error (Coupons POST):", error);
      // Code duplication error
      if (error.code === '23505') {
         return NextResponse.json({ success: false, message: "Coupon code already exists!" }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Coupon created successfully!", data }, { status: 201 });
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: "Coupon ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase Database Error (Delete):", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Coupon deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
