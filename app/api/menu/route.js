import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: "Payload cannot be empty" },
        { status: 400 },
      );
    }

    // Auto-generate Slug if missing
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    // Insert into PostgreSQL table
    const { data, error } = await supabase
      .from("menu_items")
      .insert([{ ...body, slug }])
      .select()
      .single();

    if (error) {
      console.error("Supabase Database Error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Item successfully added!", data },
      { status: 201 },
    );
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Database Error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Item ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      console.error("Supabase Database Error (Delete):", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Item deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required for update" },
        { status: 400 },
      );
    }

    const { id, ...updateData } = body;

    // Auto-generate Slug if missing and name is updated
    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    const { data, error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Database Error (Update):", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Item successfully updated!", data },
      { status: 200 },
    );
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
