import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid JSON payload" }, { status: 400 });
    }
    const { 
      customer_name, 
      customer_phone, 
      customer_address, 
      order_type, 
      delivery_city, 
      delivery_area, 
      total_amount, 
      items
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: "Cart is empty" }, { status: 400 });
    }

    let calculatedTotal = 0;

    // Security check: Fetch prices from menu_items
    for (const item of items) {
      const { data: product, error } = await supabase
        .from("menu_items")
        .select("price, discount_price")
        .eq("id", item.id)
        .single();

      if (error) {
        console.error("Supabase error (fetch menu item):", error);
        return NextResponse.json({ success: false, message: "Error fetching item details" }, { status: 500 });
      }
      if (!product) {
        return NextResponse.json({ success: false, message: `${item.name} not found!` }, { status: 404 });
      }
      
      const activePrice = product.discount_price || product.price;
      calculatedTotal += activePrice * item.quantity;
    }

    let deliveryCharges = order_type === 'Delivery' ? 150 : 0;
    const finalTotal = calculatedTotal + deliveryCharges;

    // Supabase ki orders table mein data insert karein
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customer_name,
          customer_phone: customer_phone,
          customer_address: customer_address || null,
          delivery_city: delivery_city || null,
          delivery_area: delivery_area || null,
          order_type: order_type || 'Delivery',
          total_amount: finalTotal,
          items: items, // Save cart items with specialInstructions
          status: "pending"
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Supabase error (insert order):", orderError);
      return NextResponse.json({ success: false, message: `Failed to place order: ${orderError.message || orderError.details || JSON.stringify(orderError)}` }, { status: 500 });
    }

    // Nodemailer se Admin aur Customer dono ko email bhejna
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true, // Use true for 465, false for all other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS, // App password
        },
      });

      // 1. Admin Notification
      const adminMailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_RECEIVER_EMAIL,
        subject: `🚨 New Food Order! #${newOrder.id.slice(0, 8)}`,
        text: `New order received for Pioneer Broast!\n\nOrder ID: ${newOrder.id}\nType: ${order_type}\nCustomer: ${customer_name}\nPhone: ${customer_phone}\nTotal: Rs. ${finalTotal}\n\nPlease check the Admin Panel to start preparing it.`,
      };
      await transporter.sendMail(adminMailOptions);

      // 2. Customer Notification (if email was collected, we don't collect email anymore though, so this is optional)
      // Skipped sending to customer since we no longer collect email in fast food ordering system.

    } catch (emailError) {
      console.error("Nodemailer error:", emailError);
      // Email fail bhi ho jaye toh order place ho jana chahiye
    }

    return NextResponse.json({ success: true, message: "Order Placed!", orderId: newOrder.id }, { status: 201 });

  } catch (error) {
    console.error("Order API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Database Error (Orders GET):", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}