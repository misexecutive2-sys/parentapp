import React from "react";
import { Button, Alert } from "react-native";
import RazorpayCheckout from "react-native-razorpay";

export default function PaymentScreen() {
  const startPayment = async () => {
    try {
      // Call backend to create order
      const res = await fetch("http://localhost:5000/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 500, receipt: "receipt#1" }),
      });
      const order = await res.json();

      const options = {
        description: "School Fee Payment",
        currency: "INR",
        key: order.key_id, // from backend
        amount: order.amount,
        order_id: order.id,
        name: "SchoolAid",
        prefill: {
          email: "parent@test.com",
          contact: "9999999999",
        },
        theme: { color: "#3399cc" },
      };

      RazorpayCheckout.open(options)
        .then(async (paymentData) => {
          // Verify payment with backend
          const verifyRes = await fetch("http://localhost:5000/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: order.id,
              payment_id: paymentData.razorpay_payment_id,
              signature: paymentData.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();

          if (result.success) {
            Alert.alert("Payment Successful!");
          } else {
            Alert.alert("Payment Verification Failed");
          }
        })
        .catch((err) => {
          Alert.alert("Payment Failed", err.description);
        });
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return <Button title="Pay ₹500" onPress={startPayment} />;
}
