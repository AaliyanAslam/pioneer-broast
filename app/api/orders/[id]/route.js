import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import nodemailer from "nodemailer";

const VALID_STATUSES = ["pending", "processing", "delivered", "failed", "cancelled"];

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { status, estimated_time, cancel_reason } = body;

    const updates = {};
    
    if (status) {
      if (!VALID_STATUSES.includes(status.toLowerCase())) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updates.status = status.toLowerCase();
    }
    
    if (estimated_time !== undefined) {
      updates.estimated_time = estimated_time;
    }
    
    if (cancel_reason !== undefined) {
      updates.cancel_reason = cancel_reason;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error (update order status):", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to update order status" },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (updatedOrder.customer_email && status) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: true, // Use true for port 465
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        let statusMessage = status.toLowerCase() === "delivered" 
          ? "has been delivered to your address." 
          : `is now being processed.`;
          
        if (status.toLowerCase() === "cancelled") {
           statusMessage = "has been cancelled.";
        }

        let emailText = `Hello ${updatedOrder.customer_name},\n\nYour order #${updatedOrder.id} ${statusMessage}\n\nStatus: ${status.toUpperCase()}\n`;
        
        if (status.toLowerCase() === "cancelled" && updatedOrder.cancel_reason) {
            emailText += `Reason: ${updatedOrder.cancel_reason}\n`;
        }
        
        emailText += `Total Amount: Rs. ${updatedOrder.total_amount}\n\nThank you for shopping with Pioneer Broast!`;

        const mailOptions = {
          from: process.env.SMTP_USER,
          to: updatedOrder.customer_email,
          subject: `Pioneer Broast: Order #${updatedOrder.id.slice(0, 8)} is ${status.toUpperCase()}`,
          text: emailText,
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error("Nodemailer error (Customer Notification):", emailError);
        // Ignore email errors to ensure API still returns success for status update
      }
    }

    return NextResponse.json(
      { success: true, message: "Order status updated successfully", data: updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error("Critical API Error (PATCH /api/orders/[id]):", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: order },
      { status: 200 }
    );
  } catch (error) {
    console.error("Critical API Error (GET /api/orders/[id]):", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
