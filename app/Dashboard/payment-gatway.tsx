import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://connect.schoolaid.in";

interface FeeItem {
  fee_id: string;
  label: string;       // e.g. "Term 1 Fee"
  amount: number;      // in rupees
  student_id: string;
  due_date?: string;
  status?: "paid" | "pending" | "overdue";
}

interface Props {
  fee: FeeItem;        
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

export default function PaymentScreen({
  fee = {
    fee_id: "fee_001",
    label: "Term 1 Fee",
    amount: 500,
    student_id: "stu_001",
    status: "pending",
  },
  parentName = "Parent",
  parentEmail = "parent@example.com",
  parentPhone = "9999999999",
}: Props) {
  const [loading, setLoading] = useState(false);

  const startPayment = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      // ── Step 1: Create order on backend ──
      const res = await fetch(`${BASE_URL}/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: fee.amount,
          receipt: `receipt_${fee.fee_id}_${Date.now()}`,
          student_id: fee.student_id,
          fee_id: fee.fee_id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Could not create order");
      }

      const order = await res.json();

      // ── Step 2: Open Razorpay checkout ──
      const options = {
        description: fee.label,
        currency: "INR",
        key: order.key_id,           // comes from backend — never hardcode
        amount: order.amount,         // in paise, as returned by backend
        order_id: order.id,
        name: "SchoolAid",
        prefill: {
          name: parentName,
          email: parentEmail,
          contact: parentPhone,
        },
        theme: { color: "#0047AB" },
      };

      RazorpayCheckout.open(options)
        .then(async (paymentData: any) => {
          // ── Step 3: Verify payment signature on backend ──
          const verifyRes = await fetch(`${BASE_URL}/verify-payment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              order_id: order.id,
              payment_id: paymentData.razorpay_payment_id,
              signature: paymentData.razorpay_signature,
            }),
          });

          const result = await verifyRes.json();

          if (result.success) {
            Alert.alert(
              "Payment Successful! 🎉",
              `Payment ID: ${result.payment_id}\n\nYour fee payment has been recorded.`,
              [{ text: "OK" }]
            );
          } else {
            Alert.alert(
              "Verification Failed",
              "Payment was received but verification failed. Please contact support."
            );
          }
        })
        .catch((err: any) => {
          // User dismissed or payment failed
          if (err.code === 2) {
            // code 2 = user cancelled
            Alert.alert("Payment Cancelled", "You cancelled the payment.");
          } else {
            Alert.alert(
              "Payment Failed",
              err.description ?? "Something went wrong. Please try again."
            );
          }
        })
        .finally(() => setLoading(false));
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Error", err.message ?? "Something went wrong");
    }
  };

  const isPaid = fee.status === "paid";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>

        {/* Fee label */}
        <Text style={styles.feeLabel}>{fee.label}</Text>

        {/* Amount */}
        <Text style={styles.amount}>₹{fee.amount.toLocaleString("en-IN")}</Text>

        {/* Status badge */}
        <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgePending]}>
          <Text style={[styles.badgeText, isPaid ? styles.badgeTextPaid : styles.badgeTextPending]}>
            {fee.status?.toUpperCase() ?? "PENDING"}
          </Text>
        </View>

        {/* Due date */}
        {fee.due_date && (
          <Text style={styles.dueDate}>Due: {fee.due_date}</Text>
        )}

        {/* Pay button */}
        {!isPaid && (
          <TouchableOpacity
            style={[styles.payBtn, loading && { backgroundColor: "#aaa" }]}
            onPress={startPayment}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.payBtnText, { marginLeft: 8 }]}>Processing…</Text>
              </View>
            ) : (
              <Text style={styles.payBtnText}>
                Pay ₹{fee.amount.toLocaleString("en-IN")}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {isPaid && (
          <View style={styles.paidBox}>
            <Text style={styles.paidText}>✓ Fee Paid</Text>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", justifyContent: "center", padding: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E6F0",
    padding: 24,
    alignItems: "center",
    elevation: 3,
  },

  feeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
    marginBottom: 8,
    textAlign: "center",
  },

  amount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0047AB",
    marginBottom: 14,
  },

  badge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgePaid: { backgroundColor: "#E6F4EA" },
  badgePending: { backgroundColor: "#FFF3E0" },
  badgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  badgeTextPaid: { color: "#2E7D32" },
  badgeTextPending: { color: "#E65100" },

  dueDate: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
  },

  payBtn: {
    backgroundColor: "#0047AB",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnRow: { flexDirection: "row", alignItems: "center" },

  paidBox: {
    backgroundColor: "#E6F4EA",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  paidText: { color: "#2E7D32", fontWeight: "700", fontSize: 16 },
});