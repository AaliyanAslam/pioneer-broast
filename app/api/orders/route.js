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
    const { cartItems, customerInfo, couponCode } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ success: false, message: "Cart is empty" }, { status: 400 });
    }

    let totalAmount = 0;

    // Security check: Database se original price fetch kar ke total calculate karein 
    // (Taake koi hacker frontend se price change na kar sake)
    for (const item of cartItems) {
      const { data: product, error } = await supabase
        .from("products")
        .select("price, discount_price, stock")
        .eq("id", item.id)
        .single();

      if (error) {
        console.error("Supabase error (fetch product):", error);
        return NextResponse.json({ success: false, message: "Error fetching product details" }, { status: 500 });
      }
      if (!product) {
        return NextResponse.json({ success: false, message: `${item.name} not found!` }, { status: 404 });
      }
      
      const activePrice = product.discount_price || product.price;
      totalAmount += activePrice * item.quantity;
    }

    let subtotal = totalAmount;
    let deliveryCharges = subtotal > 0 ? 180 : 0;
    let discountAmount = 0;
    let appliedCouponData = null;

    if (couponCode && subtotal > 0) {
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .single();

      if (!couponError && coupon && coupon.is_active && (!coupon.usage_limit || coupon.times_used < coupon.usage_limit)) {
        appliedCouponData = coupon;
        if (coupon.discount_type === "free_delivery") {
          deliveryCharges = 0;
        } else if (coupon.discount_type === "percentage") {
          discountAmount = Math.floor(subtotal * (coupon.discount_value / 100));
        } else if (coupon.discount_type === "fixed") {
          discountAmount = coupon.discount_value;
          if (discountAmount > subtotal) discountAmount = subtotal;
        }
      }
    }

    const finalTotal = subtotal + deliveryCharges - discountAmount;

    // Supabase ki orders table mein data insert karein
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          phone: customerInfo.phone,
          shipping_address: customerInfo.address,
          city: customerInfo.city,
          total_amount: finalTotal,
          items: [
            ...cartItems,
            {
              isMetadata: true,
              couponCode: appliedCouponData ? appliedCouponData.code : null,
              discountAmount: discountAmount,
              deliveryCharges: deliveryCharges,
              subtotal: subtotal,
              paymentMethod: "Cash on Delivery"
            }
          ], // Save cart items with metadata
          status: "pending",
          user_id: customerInfo.userId || null
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Supabase error (insert order):", orderError);
      return NextResponse.json({ success: false, message: "Failed to place order" }, { status: 500 });
    }

    // Increment coupon usage if applied
    if (appliedCouponData) {
      const { error: updateCouponError } = await supabase
        .from("coupons")
        .update({ times_used: appliedCouponData.times_used + 1 })
        .eq("id", appliedCouponData.id);
      
      if (updateCouponError) {
        console.error("Supabase error (update coupon):", updateCouponError);
      }
    }

    // Product ka stock kam karein
    let lowStockAlerts = [];
    
    for (const item of cartItems) {
      const { data: currentProduct } = await supabase.from('products').select('stock, name').eq('id', item.id).single();
      if(currentProduct) {
        const newStock = currentProduct.stock - item.quantity;
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.id);
        
        if (updateError) {
          console.error("Supabase error (update stock):", updateError);
          // Non-fatal, continuing for other items
        } else if (newStock <= 2) {
          lowStockAlerts.push(`${currentProduct.name || item.name} (Only ${newStock} left!)`);
        }
      }
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
        to: process.env.ADMIN_RECEIVER_EMAIL, // Email id jahan alerts receive hongi
        subject: `🚨 New Order Received! #${newOrder.id.slice(0, 8)}`,
        text: `You got a new order!\n\nOrder ID: ${newOrder.id}\nCustomer: ${customerInfo.name}\nCity: ${customerInfo.city}\nTotal: Rs. ${finalTotal}${appliedCouponData ? ` (Coupon Applied: ${appliedCouponData.code})` : ''}\n\nPlease check the Kova Tech Admin Panel for full details.`,
      };
      await transporter.sendMail(adminMailOptions);

      // 2. Customer Confirmation
      if (customerInfo.email) {
        const customerMailOptions = {
          from: process.env.SMTP_USER,
          to: customerInfo.email,
          subject: `Order Confirmed - Kova Tech #${newOrder.id.slice(0, 8)}`,
          text: `Hi ${customerInfo.name},\n\nThank you for your order! Your order has been placed successfully.\n\nOrder ID: ${newOrder.id}\nTotal Amount: Rs. ${finalTotal}\nShipping Address: ${customerInfo.address}, ${customerInfo.city}\n\nWe will contact you shortly to verify your order.\n\nThanks for shopping with Kova Tech!`,
        };
        await transporter.sendMail(customerMailOptions);
      }

      // 3. Low Stock Notification
      if (lowStockAlerts.length > 0) {
        const stockAlertOptions = {
          from: process.env.SMTP_USER,
          to: process.env.ADMIN_RECEIVER_EMAIL, 
          subject: `⚠️ Low Stock Alert - Kova Tech`,
          text: `Warning!\n\nThe following products are running out of stock (2 or less remaining):\n\n${lowStockAlerts.map(alert => `- ${alert}`).join('\n')}\n\nPlease restock them immediately from the Admin Panel.`,
        };
        await transporter.sendMail(stockAlertOptions);
      }

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