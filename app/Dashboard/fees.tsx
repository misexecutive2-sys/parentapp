// import React, { useState, useEffect, useCallback, useRef } from "react";
// import {
//   View, Text, TouchableOpacity, ScrollView, RefreshControl,
//   StyleSheet, ActivityIndicator, Alert, Modal, Platform,
//   Dimensions, StatusBar, Animated, FlatList,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import * as Print from "expo-print";
// import * as Sharing from "expo-sharing";

// const BASE_URL  = "https://connect.schoolaid.in";
// const YEAR_ID   = "8";
// const { width: SW } = Dimensions.get("window");

// // ─────────────────────────────────────────────────────────────
// // Design tokens — deep navy × warm slate × amber accent
// // ─────────────────────────────────────────────────────────────
// const C = {
//   // Primary
//   navy:       "#0F2057",
//   navyMid:    "#1A3070",
//   navyLight:  "#2A4494",
//   navyTint:   "#E6EAF8",
//   navyFaint:  "#F2F4FB",
//   // Semantic
//   success:    "#0D7A4E",
//   successTint:"#E3F5EE",
//   danger:     "#C0392B",
//   dangerTint: "#FDEDEB",
//   amber:      "#D4650A",
//   amberTint:  "#FEF3E8",
//   purple:     "#6B21A8",
//   purpleTint: "#F3E8FF",
//   // Neutral
//   bg:         "#F4F6FB",
//   card:       "#FFFFFF",
//   border:     "#E2E6F0",
//   borderMid:  "#C8CEDD",
//   text:       "#0A1428",
//   textMid:    "#374160",
//   textMute:   "#7A8299",
//   // Misc
//   white:      "#FFFFFF",
//   overlay:    "rgba(10,20,40,0.55)",
// };

// // ─────────────────────────────────────────────────────────────
// // Formatters
// // ─────────────────────────────────────────────────────────────
// const rupee = (n: number | string) =>
//   "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const fmtDate = (iso?: string | null) =>
//   iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// const fmtDT = (iso?: string | null) =>
//   iso
//     ? new Date(iso).toLocaleString("en-IN", {
//         day: "2-digit", month: "short", year: "numeric",
//         hour: "2-digit", minute: "2-digit", hour12: true,
//       })
//     : "—";

// const initials = (name: string) =>
//   name.trim().split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

// // ─────────────────────────────────────────────────────────────
// // Status config (all 6 transaction_status values)
// // ─────────────────────────────────────────────────────────────
// type IconName = React.ComponentProps<typeof Ionicons>["name"];
// interface SCfg { color: string; bg: string; icon: IconName; label: string }

// const STATUS_MAP: Record<string, SCfg> = {
//   success:         { color: C.success, bg: C.successTint, icon: "checkmark-circle",    label: "Paid"           },
//   failed:          { color: C.danger,  bg: C.dangerTint,  icon: "close-circle",         label: "Failed"         },
//   cancelled:       { color: C.amber,   bg: C.amberTint,   icon: "ban",                  label: "Cancelled"      },
//   pending:         { color: C.amber,   bg: C.amberTint,   icon: "time-outline",          label: "Pending"        },
//   initiated:       { color: C.navy,    bg: C.navyTint,    icon: "arrow-forward-circle",  label: "Initiated"      },
//   amount_mismatch: { color: C.purple,  bg: C.purpleTint,  icon: "alert-circle",          label: "Amount Mismatch"},
// };
// const statusCfg = (k?: string): SCfg => STATUS_MAP[k ?? ""] ?? STATUS_MAP.pending;

// // ─────────────────────────────────────────────────────────────
// // API layer — single fetch wrapper
// // ─────────────────────────────────────────────────────────────
// async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
//   const token = await AsyncStorage.getItem("token");
//   const res = await fetch(`${BASE_URL}${path}`, {
//     ...opts,
//     headers: {
//       "Content-Type":       "application/json",
//       Authorization:        `Bearer ${token ?? ""}`,
//       "x-academic-year-id": YEAR_ID,
//       ...(opts.headers ?? {}),
//     },
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`);
//   return json as T;
// }

// // ─────────────────────────────────────────────────────────────
// // Types — matching every API response field
// // ─────────────────────────────────────────────────────────────
// interface Student {
//   id: number;
//   student_name: string;
//   class_display?: string;
//   class_name?: string;
//   section_name?: string;
//   roll_no?: string;
// }

// interface Summary {
//   outstanding_amount:    number;
//   runtime_penalty_total: number;
//   waived_penalty_total:  number;
//   total_payable:         number;
// }

// // API 2 response ledger (basic)
// interface LedgerBasic {
//   id:               number;
//   fee_name:         string;
//   frequency:        string;
//   due_date:         string;
//   total_amount:     string;
//   paid_amount:      string;
//   remaining_amount: number;
//   status:           string;
//   runtime_penalty:  number;
//   waived_penalty:   number;
//   final_penalty:    number;
//   total_payable:    number;
//   is_overdue:       boolean;
//   overdue_days:     number;
// }

// // API 8 response ledger (full — from /ledger/student/:id)
// interface LedgerFull extends LedgerBasic {
//   penalty_details?: PenaltyDetail;
//   waiver_details?:  any;
//   overdue_info?:    any;
// }

// // API 9 penalty detail
// interface PenaltyDetail {
//   runtime_penalty:  number;
//   final_penalty:    number;
//   waived_penalty:   number;
//   overdue_days:     number;
//   penalty_history?: { date: string; amount: number; reason: string }[];
// }

// interface PaymentRecord {
//   id:                 number;
//   receipt_no:         string;
//   grand_total:        string;
//   total_amount:       string;
//   total_penalty:      string;
//   payment_mode:       string;
//   transaction_status: string;
//   gateway_order_id:   string;
//   gateway_response:   string;
//   paid_at:            string | null;
//   created_at:         string;
// }

// // API 5 preview — matches actual response from /api/fees/payment/preview
// interface PreviewItem {
//   ledger_id:                number;
//   fee_name:                 string;
//   due_date:                 string;
//   remaining_amount:         number;
//   before_exemption_amount:  number;
//   exempted_amount:          number;
//   after_exemption_amount:   number;
//   runtime_penalty:          number;   // accrued penalty before waiver
//   final_penalty:            number;   // penalty actually charged
//   calculated_penalty:       number;
//   penalty_amount:           number;
//   waived:                   boolean;
//   waived_penalty:           number;   // amount waived off
//   total_payable:            number;   // what parent pays for this item
//   applied_amount:           number;   // base fee applied
// }
// interface PreviewData {
//   items:                    PreviewItem[];
//   subtotal:                 number;   // sum of applied_amount
//   before_exemption_total:   number;
//   exemption_total:          number;
//   after_exemption_total:    number;
//   penalty_total:            number;   // total penalty charged
//   waived_penalty_total:     number;   // total waived
//   grand_total:              number;   // final amount to charge
// }

// // API 6 order
// interface OrderData {
//   order_id:           string;
//   payment_session_id: string;
//   order_amount:       number;
//   order_currency:     string;
// }

// // API 4 receipt
// interface ReceiptData {
//   id:                 number;
//   receipt_no:         string;
//   student_name:       string;
//   class_display:      string;
//   academic_year:      string;
//   payment_mode:       string;
//   payment_type:       string;
//   total_amount:       string;
//   total_penalty:      string;
//   grand_total:        string;
//   remarks:            string;
//   payment_status:     string;
//   created_at:         string;
//   gateway_name:       string;
//   gateway_order_id:   string;
//   transaction_status: string;
//   gateway_response:   string;
//   paid_at:            string | null;
//   verified_at:        string | null;
// }
// interface ReceiptItem {
//   id:           number;
//   fee_name:     string;
//   amount_paid:  string;
//   penalty_paid: string;
//   total_paid:   string;
//   due_date:     string;
//   month:        number;
//   year:         number;
// }

// // ─────────────────────────────────────────────────────────────
// // Gateway response parsers (gateway_response is a JSON string)
// // ─────────────────────────────────────────────────────────────
// const gwParse  = (r: string) => { try { return JSON.parse(r); } catch { return {}; } };
// const gwCfId   = (r: string) => gwParse(r)?.cashfree_payment?.cf_payment_id        ?? "";
// const gwBankRef= (r: string) => gwParse(r)?.cashfree_payment?.bank_reference       ?? "";
// const gwUpi    = (r: string) => gwParse(r)?.cashfree_payment?.payment_method?.upi?.upi_id ?? "";
// const gwMethod = (r: string): string => {
//   const g = gwParse(r)?.cashfree_payment;
//   if (!g) return "";
//   const group = g.payment_group ?? "";
//   const upi   = g.payment_method?.upi?.upi_id ?? "";
//   if (group === "upi") return `UPI${upi ? ` · ${upi}` : ""}`;
//   return group.replace(/_/g, " ").toUpperCase();
// };
// const gwItems  = (r: string): any[] =>
//   gwParse(r)?.order_request?.preview?.items ?? [];

// // ─────────────────────────────────────────────────────────────
// // PDF receipt builder
// // ─────────────────────────────────────────────────────────────
// function buildReceiptHTML(r: ReceiptData, items: ReceiptItem[]): string {
//   const n    = (v: string) => Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 });
//   const cfId = gwCfId(r.gateway_response);
//   const bank = gwBankRef(r.gateway_response);
//   const upi  = gwUpi(r.gateway_response);
//   const meth = gwMethod(r.gateway_response) || r.payment_mode.toUpperCase();

//   const rows = items.map(it => `
//     <tr>
//       <td>${it.fee_name}</td>
//       <td style="text-align:center">${new Date(it.due_date).toLocaleDateString("en-IN",{month:"short",year:"numeric"})}</td>
//       <td style="text-align:right">₹${n(it.amount_paid)}</td>
//       <td style="text-align:right">${Number(it.penalty_paid)>0 ? "₹"+n(it.penalty_paid) : "—"}</td>
//       <td style="text-align:right;font-weight:700">₹${n(it.total_paid)}</td>
//     </tr>`).join("");

//   return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
// <style>
// *{box-sizing:border-box;margin:0;padding:0}
// body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#0A1428;background:#fff;padding:40px 48px;max-width:760px;margin:0 auto;-webkit-print-color-adjust:exact}
// .hdr{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:18px;border-bottom:2.5px solid #0F2057;margin-bottom:26px}
// .org{font-size:22px;font-weight:800;color:#0F2057;letter-spacing:-0.4px}
// .org-sub{font-size:10px;color:#7A8299;margin-top:3px;letter-spacing:0.8px;text-transform:uppercase}
// .rno-lbl{font-size:9px;font-weight:700;color:#7A8299;text-transform:uppercase;letter-spacing:1px;text-align:right}
// .rno{font-family:monospace;font-size:14px;font-weight:700;color:#0F2057;background:#E6EAF8;padding:4px 11px;border-radius:6px;display:inline-block;margin-top:5px}
// .banner{background:#E3F5EE;border:1px solid #9DD6BC;border-radius:10px;padding:16px 18px;display:flex;align-items:center;gap:16px;margin-bottom:24px}
// .bi{font-size:28px}
// .bt{font-size:14px;font-weight:700;color:#0D7A4E}
// .bs{font-size:11px;color:#1A9160;margin-top:2px}
// .ba{margin-left:auto;text-align:right}
// .bav{font-size:24px;font-weight:800;color:#0D7A4E}
// .bal{font-size:9px;color:#1A9160;text-transform:uppercase;letter-spacing:0.5px}
// .sl{font-size:9px;font-weight:800;color:#7A8299;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;margin-top:20px}
// .ig{display:grid;grid-template-columns:1fr 1fr;border:1px solid #E2E6F0;border-radius:9px;overflow:hidden}
// .ic{padding:11px 14px;border-right:1px solid #E2E6F0;border-bottom:1px solid #E2E6F0}
// .ic:nth-child(2n){border-right:none}
// .icl{font-size:9px;font-weight:700;color:#7A8299;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px}
// .icv{font-size:13px;font-weight:500;color:#0A1428}
// .icv.m{font-family:monospace;font-size:11px}
// .tw{border:1px solid #E2E6F0;border-radius:9px;overflow:hidden}
// table{width:100%;border-collapse:collapse}
// thead tr{background:#0F2057}
// thead th{padding:10px 13px;font-size:11px;font-weight:700;color:#fff;text-align:left}
// thead th:not(:first-child){text-align:right}
// thead th:nth-child(2){text-align:center}
// tbody tr{border-bottom:1px solid #E2E6F0}
// tbody tr:last-child{border-bottom:none}
// tbody td{padding:10px 13px;font-size:13px}
// .tots{border:1px solid #E2E6F0;border-radius:9px;overflow:hidden;margin-top:14px}
// .tots table{}
// .tots tbody tr{border-bottom:1px solid #E2E6F0}
// .tots tbody tr:last-child{background:#0F2057;border-bottom:none}
// .tots tbody tr:last-child td{color:#fff;font-weight:700;font-size:14px}
// .tots td{padding:9px 14px}
// .tots td:last-child{text-align:right}
// .tg{background:#F4F6FB;border:1px solid #E2E6F0;border-radius:9px;padding:13px 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-top:18px}
// .tgl{font-size:9px;font-weight:700;color:#7A8299;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px}
// .tgv{font-family:monospace;font-size:12px;color:#0A1428}
// .ft{border-top:1px solid #E2E6F0;padding-top:14px;margin-top:24px;text-align:center;font-size:11px;color:#7A8299;line-height:1.7}
// </style></head><body>
// <div class="hdr">
//   <div><div class="org">SchoolAid</div><div class="org-sub">Fee Management System</div></div>
//   <div><div class="rno-lbl">Official Receipt</div><div class="rno">${r.receipt_no}</div></div>
// </div>
// <div class="banner">
//   <div class="bi">✅</div>
//   <div><div class="bt">Payment Successful</div><div class="bs">Paid on ${fmtDT(r.paid_at ?? r.created_at)}</div></div>
//   <div class="ba"><div class="bal">Amount Paid</div><div class="bav">₹${n(r.grand_total)}</div></div>
// </div>
// <div class="sl">Student & Payment Details</div>
// <div class="ig">
//   <div class="ic"><div class="icl">Student</div><div class="icv">${r.student_name}</div></div>
//   <div class="ic"><div class="icl">Class</div><div class="icv">${r.class_display}</div></div>
//   <div class="ic"><div class="icl">Academic Year</div><div class="icv">${r.academic_year}</div></div>
//   <div class="ic"><div class="icl">Payment Mode</div><div class="icv">${meth}</div></div>
//   <div class="ic" style="border-bottom:none"><div class="icl">Receipt No.</div><div class="icv m">${r.receipt_no}</div></div>
//   <div class="ic" style="border-bottom:none"><div class="icl">Order ID</div><div class="icv m" style="font-size:10px">${r.gateway_order_id}</div></div>
// </div>
// <div class="sl">Fee Items</div>
// <div class="tw">
//   <table>
//     <thead><tr><th>Fee Head</th><th>Period</th><th>Base Amount</th><th>Penalty</th><th>Total Paid</th></tr></thead>
//     <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#7A8299;padding:16px">No items</td></tr>`}</tbody>
//   </table>
// </div>
// <div class="tots">
//   <table>
//     <tbody>
//       <tr><td style="color:#374160">Base Amount</td><td>₹${n(r.total_amount)}</td></tr>
//       <tr><td style="color:#374160">Late Penalty</td><td>₹${n(r.total_penalty)}</td></tr>
//       <tr><td>Grand Total</td><td>₹${n(r.grand_total)}</td></tr>
//     </tbody>
//   </table>
// </div>
// ${(cfId || bank || upi) ? `
// <div class="sl">Transaction Reference</div>
// <div class="tg">
//   ${cfId ? `<div><div class="tgl">CF Payment ID</div><div class="tgv">${cfId}</div></div>` : ""}
//   ${bank ? `<div><div class="tgl">Bank Reference</div><div class="tgv">${bank}</div></div>` : ""}
//   ${upi  ? `<div><div class="tgl">UPI ID</div><div class="tgv">${upi}</div></div>` : ""}
//   ${r.verified_at ? `<div><div class="tgl">Verified At</div><div class="tgv">${fmtDT(r.verified_at)}</div></div>` : ""}
// </div>` : ""}
// <div class="ft">
//   This is a computer-generated receipt · Does not require a physical signature<br/>
//   <strong>SchoolAid Fee Management</strong> · Generated ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}
// </div>
// </body></html>`;
// }

// // ════════════════════════════════════════════════════════════
// // COMPONENT: PenaltyDrillDown — API 9
// // Fetches & displays per-ledger penalty breakdown on demand
// // ════════════════════════════════════════════════════════════
// function PenaltyDrillDown({ ledgerId }: { ledgerId: number }) {
//   const [data,    setData]    = useState<PenaltyDetail | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [open,    setOpen]    = useState(false);

//   const fetch9 = async () => {
//     if (data) { setOpen(o => !o); return; }
//     setLoading(true);
//     try {
//       // API 9: GET /api/fees/penalties/ledger/:ledger_id
//       const res = await api(`/api/fees/penalties/ledger/${ledgerId}`);
//       setData(res.data ?? res.penalty ?? res ?? null);
//       setOpen(true);
//     } catch (e: any) {
//       Alert.alert("Error", e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View>
//       <TouchableOpacity style={pd.btn} onPress={fetch9} disabled={loading} activeOpacity={0.75}>
//         {loading
//           ? <ActivityIndicator size="small" color={C.amber} />
//           : <Ionicons name="alert-circle-outline" size={11} color={C.amber} />}
//         <Text style={pd.btnTxt}>
//           {loading ? "Loading penalty…" : open ? "Hide penalty detail" : "View penalty breakdown"}
//         </Text>
//         {!loading && <Ionicons name={open ? "chevron-up" : "chevron-down"} size={10} color={C.amber} />}
//       </TouchableOpacity>

//       {open && data && (
//         <View style={pd.box}>
//           <PdRow label="Runtime Penalty" value={rupee(data.runtime_penalty)} color={C.amber} />
//           {data.waived_penalty > 0 && <PdRow label="Waived"         value={`-${rupee(data.waived_penalty)}`} color={C.success} />}
//           <PdRow label="Final Penalty"   value={rupee(data.final_penalty)} bold />
//           {data.overdue_days > 0 && <PdRow label="Overdue Days" value={`${data.overdue_days} days`} />}
//           {data.penalty_history && data.penalty_history.length > 0 && (
//             <View style={pd.hist}>
//               <Text style={pd.histLabel}>HISTORY</Text>
//               {data.penalty_history.map((h, i) => (
//                 <View key={i} style={pd.histRow}>
//                   <Text style={pd.histDate}>{fmtDate(h.date)}</Text>
//                   <Text style={pd.histReason} numberOfLines={1}>{h.reason}</Text>
//                   <Text style={pd.histAmt}>{rupee(h.amount)}</Text>
//                 </View>
//               ))}
//             </View>
//           )}
//         </View>
//       )}
//     </View>
//   );
// }

// function PdRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
//   return (
//     <View style={pd.row}>
//       <Text style={[pd.label, bold && { color: C.text, fontWeight: "700" as any }]}>{label}</Text>
//       <Text style={[pd.val, color ? { color } : {}, bold && { fontWeight: "800" as any }]}>{value}</Text>
//     </View>
//   );
// }

// const pd = StyleSheet.create({
//   btn:      { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 4 },
//   btnTxt:   { fontSize: 11, color: C.amber, fontWeight: "600" as any },
//   box:      { backgroundColor: C.amberTint, borderRadius: 8, padding: 11, marginTop: 6, borderWidth: 1, borderColor: "#F4C08A" },
//   row:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
//   label:    { fontSize: 11, color: C.textMute },
//   val:      { fontSize: 11, fontWeight: "600" as any, color: C.text },
//   hist:     { marginTop: 8, borderTopWidth: 1, borderTopColor: "#F4C08A", paddingTop: 7 },
//   histLabel:{ fontSize: 9, fontWeight: "700" as any, color: C.amber, letterSpacing: 0.8, marginBottom: 5 },
//   histRow:  { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 3 },
//   histDate: { fontSize: 10, color: C.textMute, width: 70 },
//   histReason:{ fontSize: 10, color: C.textMid, flex: 1 },
//   histAmt:  { fontSize: 10, fontWeight: "700" as any, color: C.amber },
// });

// // ════════════════════════════════════════════════════════════
// // COMPONENT: ReceiptModal — API 4
// // ════════════════════════════════════════════════════════════
// function ReceiptModal({ receiptNo, onClose }: { receiptNo: string; onClose: () => void }) {
//   const [receipt, setReceipt] = useState<ReceiptData | null>(null);
//   const [items,   setItems]   = useState<ReceiptItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [dlLoading, setDlLoading] = useState(false);

//   useEffect(() => {
//     // API 4: GET /api/fees/parent/receipt/:receipt_no
//     api(`/api/fees/parent/receipt/${receiptNo}`)
//       .then(d => {
//         setReceipt(d.receipt ?? d.data?.receipt ?? null);
//         setItems(d.items ?? d.data?.items ?? []);
//       })
//       .catch(e => Alert.alert("Error", e.message))
//       .finally(() => setLoading(false));
//   }, [receiptNo]);

//   const handleDownload = async () => {
//     if (!receipt) return;
//     setDlLoading(true);
//     try {
//       const html = buildReceiptHTML(receipt, items);
//       const { uri } = await Print.printToFileAsync({ html });
//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: `Receipt ${receipt.receipt_no}` });
//       } else {
//         Alert.alert("PDF Ready", "Your receipt PDF is ready to save or print.");
//       }
//     } catch (e: any) {
//       Alert.alert("Download Failed", e.message);
//     } finally {
//       setDlLoading(false);
//     }
//   };

//   const r = receipt;
//   return (
//     <Modal visible animationType="slide" transparent onRequestClose={onClose}>
//       <View style={rcm.overlay}>
//         <View style={rcm.sheet}>
//           <View style={rcm.drag} />
//           <View style={rcm.hdr}>
//             <View style={rcm.hdrIconWrap}>
//               <Ionicons name="receipt-outline" size={16} color={C.navy} />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={rcm.hdrTitle}>Payment Receipt</Text>
//               <Text style={rcm.hdrSub} numberOfLines={1}>{receiptNo}</Text>
//             </View>
//             <TouchableOpacity style={rcm.closeBtn} onPress={onClose}>
//               <Ionicons name="close" size={16} color={C.textMute} />
//             </TouchableOpacity>
//           </View>

//           {loading ? (
//             <View style={rcm.loadBox}>
//               <ActivityIndicator size="large" color={C.navy} />
//               <Text style={rcm.loadTxt}>Fetching receipt…</Text>
//             </View>
//           ) : !r ? (
//             <View style={rcm.loadBox}>
//               <Ionicons name="alert-circle-outline" size={32} color={C.danger} />
//               <Text style={rcm.loadTxt}>Receipt not found</Text>
//             </View>
//           ) : (
//             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rcm.body}>
//               {/* Hero */}
//               <View style={rcm.hero}>
//                 <View style={rcm.heroCheck}>
//                   <Ionicons name="checkmark" size={22} color={C.white} />
//                 </View>
//                 <Text style={rcm.heroAmt}>{rupee(r.grand_total)}</Text>
//                 <Text style={rcm.heroLabel}>Payment Successful</Text>
//                 <Text style={rcm.heroDate}>{fmtDT(r.paid_at ?? r.created_at)}</Text>
//               </View>

//               {/* Student info */}
//               <SectionLabel text="STUDENT DETAILS" />
//               <InfoGrid>
//                 <InfoCell label="Student"       value={r.student_name} />
//                 <InfoCell label="Class"         value={r.class_display} />
//                 <InfoCell label="Academic Year" value={r.academic_year} />
//                 <InfoCell label="Payment Mode"  value={gwMethod(r.gateway_response) || r.payment_mode.toUpperCase()} last />
//               </InfoGrid>

//               {/* Fee items */}
//               {items.length > 0 && (
//                 <>
//                   <SectionLabel text="FEE ITEMS" />
//                   <View style={rcm.feeBox}>
//                     {items.map((it, i) => (
//                       <View key={it.id} style={[rcm.feeRow, i === items.length - 1 && rcm.feeRowLast]}>
//                         <View style={{ flex: 1 }}>
//                           <Text style={rcm.feeName}>{it.fee_name}</Text>
//                           <Text style={rcm.feePeriod}>
//                             {new Date(it.due_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
//                           </Text>
//                         </View>
//                         <View style={{ alignItems: "flex-end" }}>
//                           <Text style={rcm.feeTotal}>{rupee(it.total_paid)}</Text>
//                           {Number(it.penalty_paid) > 0 && (
//                             <Text style={rcm.feePenalty}>+{rupee(it.penalty_paid)} late fee</Text>
//                           )}
//                         </View>
//                       </View>
//                     ))}
//                     <View style={rcm.feeFooter}>
//                       <View style={rcm.feeSumRow}>
//                         <Text style={rcm.feeSumLabel}>Base</Text>
//                         <Text style={rcm.feeSumVal}>{rupee(r.total_amount)}</Text>
//                       </View>
//                       {Number(r.total_penalty) > 0 && (
//                         <View style={rcm.feeSumRow}>
//                           <Text style={[rcm.feeSumLabel, { color: C.amber }]}>Penalty</Text>
//                           <Text style={[rcm.feeSumVal, { color: C.amber }]}>+{rupee(r.total_penalty)}</Text>
//                         </View>
//                       )}
//                       <View style={[rcm.feeSumRow, rcm.feeSumGrand]}>
//                         <Text style={rcm.feeSumGrandLabel}>Total Paid</Text>
//                         <Text style={rcm.feeSumGrandVal}>{rupee(r.grand_total)}</Text>
//                       </View>
//                     </View>
//                   </View>
//                 </>
//               )}

//               {/* Transaction ref */}
//               {(gwCfId(r.gateway_response) || r.gateway_order_id) && (
//                 <>
//                   <SectionLabel text="TRANSACTION REFERENCE" />
//                   <InfoGrid>
//                     {r.gateway_order_id   && <InfoCell label="Order ID"      value={r.gateway_order_id} mono />}
//                     {gwCfId(r.gateway_response) && <InfoCell label="CF Payment ID" value={gwCfId(r.gateway_response)} mono last />}
//                   </InfoGrid>
//                 </>
//               )}

//               {/* Download */}
//               <TouchableOpacity
//                 style={[rcm.dlBtn, dlLoading && { opacity: 0.65 }]}
//                 onPress={handleDownload}
//                 disabled={dlLoading}
//                 activeOpacity={0.85}
//               >
//                 {dlLoading
//                   ? <><ActivityIndicator size="small" color={C.white} /><Text style={rcm.dlTxt}>Generating PDF…</Text></>
//                   : <><Ionicons name="download-outline" size={15} color={C.white} /><Text style={rcm.dlTxt}>Download PDF Receipt</Text></>}
//               </TouchableOpacity>
//             </ScrollView>
//           )}
//         </View>
//       </View>
//     </Modal>
//   );
// }

// // small helpers
// function SectionLabel({ text }: { text: string }) {
//   return <Text style={rcm.sectionLabel}>{text}</Text>;
// }
// function InfoGrid({ children }: { children: React.ReactNode }) {
//   return <View style={rcm.infoGrid}>{children}</View>;
// }
// function InfoCell({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
//   return (
//     <View style={[rcm.infoCell, last && rcm.infoCellLast]}>
//       <Text style={rcm.infoCellLabel}>{label}</Text>
//       <Text style={[rcm.infoCellVal, mono && rcm.infoCellMono]} numberOfLines={2}>{value || "—"}</Text>
//     </View>
//   );
// }

// const rcm = StyleSheet.create({
//   overlay:        { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
//   sheet:          { backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 10, maxHeight: "93%" },
//   drag:           { width: 38, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
//   hdr:            { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
//   hdrIconWrap:    { width: 34, height: 34, borderRadius: 8, backgroundColor: C.navyTint, alignItems: "center", justifyContent: "center" },
//   hdrTitle:       { fontSize: 15, fontWeight: "700", color: C.text },
//   hdrSub:         { fontSize: 10, color: C.textMute, marginTop: 1, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
//   closeBtn:       { width: 30, height: 30, borderRadius: 8, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
//   loadBox:        { paddingVertical: 52, alignItems: "center", gap: 10 },
//   loadTxt:        { fontSize: 13, color: C.textMute },
//   body:           { paddingBottom: 38 },
//   // Hero
//   hero:           { backgroundColor: C.navyFaint, borderRadius: 16, padding: 22, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: C.navyTint },
//   heroCheck:      { width: 48, height: 48, borderRadius: 24, backgroundColor: C.success, alignItems: "center", justifyContent: "center", marginBottom: 12 },
//   heroAmt:        { fontSize: 32, fontWeight: "800", color: C.navy, letterSpacing: -0.5 },
//   heroLabel:      { fontSize: 13, fontWeight: "600", color: C.success, marginTop: 4 },
//   heroDate:       { fontSize: 11, color: C.textMute, marginTop: 4 },
//   // Section label
//   sectionLabel:   { fontSize: 9, fontWeight: "700", color: C.textMute, letterSpacing: 1.2, marginBottom: 8, marginTop: 16 },
//   // Info grid
//   infoGrid:       { borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: "hidden", backgroundColor: C.card, marginBottom: 4 },
//   infoCell:       { paddingHorizontal: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
//   infoCellLast:   { borderBottomWidth: 0 },
//   infoCellLabel:  { fontSize: 10, color: C.textMute, marginBottom: 3 },
//   infoCellVal:    { fontSize: 13, fontWeight: "600", color: C.text },
//   infoCellMono:   { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 11 },
//   // Fee items
//   feeBox:         { borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: "hidden", backgroundColor: C.card },
//   feeRow:         { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
//   feeRowLast:     { borderBottomWidth: 0 },
//   feeName:        { fontSize: 13, fontWeight: "600", color: C.text },
//   feePeriod:      { fontSize: 10, color: C.textMute, marginTop: 2 },
//   feeTotal:       { fontSize: 13, fontWeight: "700", color: C.text },
//   feePenalty:     { fontSize: 10, color: C.amber, marginTop: 2 },
//   feeFooter:      { backgroundColor: C.navyFaint, paddingHorizontal: 13, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.navyTint },
//   feeSumRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
//   feeSumLabel:    { fontSize: 11, color: C.textMute },
//   feeSumVal:      { fontSize: 11, fontWeight: "600", color: C.text },
//   feeSumGrand:    { borderTopWidth: 1, borderTopColor: C.navyTint, marginTop: 4, paddingTop: 6 },
//   feeSumGrandLabel:{ fontSize: 13, fontWeight: "700", color: C.navy },
//   feeSumGrandVal: { fontSize: 14, fontWeight: "800", color: C.navy },
//   // Download
//   dlBtn:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.navy, borderRadius: 13, paddingVertical: 15, marginTop: 20 },
//   dlTxt:          { fontSize: 14, fontWeight: "700", color: C.white },
// });

// // ════════════════════════════════════════════════════════════
// // COMPONENT: PreviewModal — API 5 result display + confirms API 6
// // ════════════════════════════════════════════════════════════
// // ════════════════════════════════════════════════════════════
// // COMPONENT: PreviewModal — API 5 result display + confirms API 6
// // ════════════════════════════════════════════════════════════
// // ════════════════════════════════════════════════════════════
// // COMPONENT: PreviewModal — API 5 result display + confirms API 6
// // ════════════════════════════════════════════════════════════
// function PreviewModal({
//   preview, count, onClose, onConfirm,
// }: { preview: PreviewData; count: number; onClose: () => void; onConfirm: () => void }) {
//   const anim = useRef(new Animated.Value(0)).current;
//   useEffect(() => { Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start(); }, []);

//   return (
//     <Modal visible animationType="none" transparent onRequestClose={onClose}>
//       <View style={pmStyles.overlay}>
//         <Animated.View style={[pmStyles.sheet, { transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [400,0] }) }] }]}>
//           <View style={pmStyles.drag} />

//           <Text style={pmStyles.title}>Review & Confirm</Text>
//           <Text style={pmStyles.sub}>{count} fee item{count !== 1 ? "s" : ""} selected</Text>

//           {/* Amounts */}
//           <View style={pmStyles.amtCard}>
//             <View style={pmStyles.amtRow}>
//               <Text style={pmStyles.amtLabel}>Subtotal</Text>
//               <Text style={pmStyles.amtVal}>{rupee(preview.subtotal)}</Text>
//             </View>

//             {preview.exemption_total > 0 && (
//               <View style={pmStyles.amtRow}>
//                 <Text style={pmStyles.amtLabel}>Exemption Applied</Text>
//                 <Text style={[pmStyles.amtVal, { color: C.success }]}>-{rupee(preview.exemption_total)}</Text>
//               </View>
//             )}

//             {preview.penalty_total > 0 && (
//               <View style={pmStyles.amtRow}>
//                 <Text style={pmStyles.amtLabel}>Late Penalty</Text>
//                 <Text style={[pmStyles.amtVal, { color: C.amber }]}>+{rupee(preview.penalty_total)}</Text>
//               </View>
//             )}

//             {preview.waived_penalty_total > 0 && (
//               <View style={pmStyles.amtRow}>
//                 <Text style={pmStyles.amtLabel}>Penalty Waived</Text>
//                 <Text style={[pmStyles.amtVal, { color: C.success }]}>-{rupee(preview.waived_penalty_total)}</Text>
//               </View>
//             )}

//             <View style={pmStyles.divider} />

//             <View style={pmStyles.amtRow}>
//               <Text style={pmStyles.grandLabel}>Grand Total</Text>
//               <Text style={pmStyles.grandVal}>{rupee(preview.grand_total)}</Text>
//             </View>
//           </View>

//           {/* Breakdown of individual fee items */}
//           {preview.items && preview.items.length > 0 && (
//             <View style={pmStyles.bkCard}>
//               <Text style={pmStyles.bkTitle}>BREAKDOWN</Text>
//               {preview.items.map((item) => (
//                 <View key={item.ledger_id} style={pmStyles.bkRow}>
//                   <Text style={pmStyles.bkLabel} numberOfLines={2}>{item.fee_name}</Text>
//                   <View style={{ alignItems: "flex-end" }}>
//                     <Text style={pmStyles.bkVal}>{rupee(item.total_payable)}</Text>
//                     {item.final_penalty > 0 && (
//                       <Text style={pmStyles.bkPenalty}>+{rupee(item.final_penalty)} penalty</Text>
//                     )}
//                     {item.waived && item.waived_penalty > 0 && (
//                       <Text style={[pmStyles.bkPenalty, { color: C.success }]}>-{rupee(item.waived_penalty)} waived</Text>
//                     )}
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}

//           {/* Info note */}
//           <View style={pmStyles.note}>
//             <Ionicons name="information-circle-outline" size={13} color={C.navy} />
//             <Text style={pmStyles.noteTxt}>Amount is calculated live by the server and includes all current penalties, exemptions, and waivers.</Text>
//           </View>

//           <View style={pmStyles.btnRow}>
//             <TouchableOpacity style={pmStyles.cancelBtn} onPress={onClose}>
//               <Text style={pmStyles.cancelTxt}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={pmStyles.payBtn} onPress={onConfirm}>
//               <Ionicons name="lock-closed" size={13} color={C.white} />
//               <Text style={pmStyles.payTxt}>Pay {rupee(preview.grand_total)}</Text>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// }

// // Styles for PreviewModal - place this outside the component
// const pmStyles = StyleSheet.create({
//   overlay:   {
//     flex: 1,
//     backgroundColor: C.overlay,
//     justifyContent: "flex-end"
//   },
//   sheet:     {
//     backgroundColor: C.card,
//     borderTopLeftRadius: 26,
//     borderTopRightRadius: 26,
//     padding: 22,
//     paddingBottom: 38,
//     maxHeight: "90%",
//   },
//   drag:      {
//     width: 38,
//     height: 4,
//     backgroundColor: C.border,
//     borderRadius: 2,
//     alignSelf: "center",
//     marginBottom: 18
//   },
//   title:     {
//     fontSize: 19,
//     fontWeight: "800",
//     color: C.text,
//     marginBottom: 3
//   },
//   sub:       {
//     fontSize: 13,
//     color: C.textMute,
//     marginBottom: 18
//   },
//   amtCard:   {
//     backgroundColor: C.navyFaint,
//     borderRadius: 13,
//     padding: 15,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: C.navyTint
//   },
//   amtRow:    {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 6
//   },
//   amtLabel:  {
//     fontSize: 14,
//     color: C.textMute
//   },
//   amtVal:    {
//     fontSize: 14,
//     fontWeight: "600",
//     color: C.text
//   },
//   grandLabel:  {
//     fontSize: 16,
//     fontWeight: "700",
//     color: C.navy
//   },
//   grandVal:  {
//     fontSize: 20,
//     fontWeight: "800",
//     color: C.navy
//   },
//   divider:   {
//     height: 1,
//     backgroundColor: C.border,
//     marginVertical: 8
//   },
//   bkCard:    {
//     backgroundColor: C.bg,
//     borderRadius: 10,
//     padding: 13,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: C.border,
//     maxHeight: 300,
//   },
//   bkTitle:   {
//     fontSize: 9,
//     fontWeight: "700",
//     color: C.textMute,
//     letterSpacing: 0.9,
//     marginBottom: 8
//   },
//   bkRow:     {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: C.border,
//   },
//   bkLabel:   {
//     fontSize: 13,
//     color: C.textMid,
//     flex: 1,
//     marginRight: 8,
//   },
//   bkVal:     {
//     fontSize: 13,
//     fontWeight: "600",
//     color: C.text
//   },
//   bkPenalty: {
//     fontSize: 10,
//     color: C.amber,
//     marginTop: 2,
//     textAlign: "right",
//   },
//   note:      {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 7,
//     backgroundColor: C.navyTint,
//     borderRadius: 9,
//     padding: 10,
//     marginBottom: 18
//   },
//   noteTxt:   {
//     fontSize: 11,
//     color: C.navyMid,
//     lineHeight: 16,
//     flex: 1
//   },
//   btnRow:    {
//     flexDirection: "row",
//     gap: 10
//   },
//   cancelBtn: {
//     flex: 1,
//     borderRadius: 12,
//     borderWidth: 1.5,
//     borderColor: C.border,
//     paddingVertical: 14,
//     alignItems: "center"
//   },
//   cancelTxt: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: C.textMute
//   },
//   payBtn:    {
//     flex: 2,
//     borderRadius: 12,
//     backgroundColor: C.navy,
//     paddingVertical: 14,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8
//   },
//   payTxt:    {
//     fontSize: 14,
//     fontWeight: "700",
//     color: C.white
//   },
// });

// function AmtRow({ label, value, color, bold, grand }: { label: string; value: string; color?: string; bold?: boolean; grand?: boolean }) {
//   return (
//     <View style={pm.amtRow}>
//       <Text style={[pm.amtLabel, bold && { color: C.text, fontWeight: "700" as any }]}>{label}</Text>
//       <Text style={[pm.amtVal, color ? { color } : {}, grand && pm.grandVal]}>{value}</Text>
//     </View>
//   );
// }

// const pm = StyleSheet.create({
//   overlay:   { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
//   sheet:     { backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 38 },
//   drag:      { width: 38, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 18 },
//   title:     { fontSize: 19, fontWeight: "800", color: C.text, marginBottom: 3 },
//   sub:       { fontSize: 13, color: C.textMute, marginBottom: 18 },
//   amtCard:   { backgroundColor: C.navyFaint, borderRadius: 13, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: C.navyTint },
//   amtRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
//   amtLabel:  { fontSize: 14, color: C.textMute },
//   amtVal:    { fontSize: 14, fontWeight: "600", color: C.text },
//   grandVal:  { fontSize: 20, fontWeight: "800", color: C.navy },
//   divider:   { height: 1, backgroundColor: C.border, marginVertical: 4 },
//   bkCard:    { backgroundColor: C.bg, borderRadius: 10, padding: 13, marginBottom: 12, borderWidth: 1, borderColor: C.border },
//   bkTitle:   { fontSize: 9, fontWeight: "700", color: C.textMute, letterSpacing: 0.9, marginBottom: 8 },
//   bkRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 5 },
//   bkLabel:   { fontSize: 13, color: C.textMid, flex: 1 },
//   bkVal:     { fontSize: 13, fontWeight: "600", color: C.text },
//   bkPenalty: { fontSize: 10, color: C.amber, marginTop: 1 },
//   note:      { flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: C.navyTint, borderRadius: 9, padding: 10, marginBottom: 18 },
//   noteTxt:   { fontSize: 11, color: C.navyMid, lineHeight: 16, flex: 1 },
//   btnRow:    { flexDirection: "row", gap: 10 },
//   cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingVertical: 14, alignItems: "center" },
//   cancelTxt: { fontSize: 14, fontWeight: "600", color: C.textMute },
//   payBtn:    { flex: 2, borderRadius: 12, backgroundColor: C.navy, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
//   payTxt:    { fontSize: 14, fontWeight: "700", color: C.white },
// });

// function OrderCreatedModal({
//   order,
//   onCancel,
//   onPayNow,
// }: {
//   order: OrderData;
//   onCancel: () => void;
//   onPayNow: () => void;
// }) {
//   const anim = useRef(new Animated.Value(0)).current;
//   useEffect(() => {
//     Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
//   }, []);

//   return (
//     <Modal visible animationType="none" transparent onRequestClose={onCancel}>
//       <View style={ocm.overlay}>
//         <Animated.View
//           style={[
//             ocm.sheet,
//             { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] },
//           ]}
//         >
//           <View style={ocm.drag} />

//           {/* Icon */}
//           <View style={ocm.iconWrap}>
//             <View style={ocm.iconCircle}>
//               <Ionicons name="receipt-outline" size={26} color={C.navy} />
//             </View>
//           </View>

//           {/* Title */}
//           <Text style={ocm.title}>Order Created</Text>
//           <Text style={ocm.subtitle}>Review your order before proceeding to pay</Text>

//           {/* Order detail card */}
//           <View style={ocm.detailCard}>
//             <View style={ocm.detailRow}>
//               <Text style={ocm.detailLabel}>Order ID</Text>
//               <Text style={ocm.detailVal} numberOfLines={2}>{order.order_id}</Text>
//             </View>
//             <View style={ocm.divider} />
//             <View style={ocm.detailRow}>
//               <Text style={ocm.detailLabel}>Amount</Text>
//               <Text style={ocm.amountVal}>{rupee(order.order_amount)}</Text>
//             </View>
//             <View style={ocm.divider} />
//             <View style={ocm.detailRow}>
//               <Text style={ocm.detailLabel}>Currency</Text>
//               <Text style={ocm.detailVal}>{order.order_currency ?? "INR"}</Text>
//             </View>
//           </View>

//           {/* Info note */}
//           <View style={ocm.note}>
//             <Ionicons name="shield-checkmark-outline" size={13} color={C.navy} />
//             <Text style={ocm.noteTxt}>
//               You'll be redirected to the Cashfree secure payment gateway.
//             </Text>
//           </View>

//           {/* Buttons */}
//           <View style={ocm.btnRow}>
//             <TouchableOpacity style={ocm.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
//               <Text style={ocm.cancelTxt}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={ocm.payBtn} onPress={onPayNow} activeOpacity={0.85}>
//               <Ionicons name="lock-closed" size={13} color={C.white} />
//               <Text style={ocm.payTxt}>Pay Now</Text>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// }

// const ocm = StyleSheet.create({
//   overlay:     { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
//   sheet:       {
//     backgroundColor: C.card,
//     borderTopLeftRadius: 26,
//     borderTopRightRadius: 26,
//     padding: 22,
//     paddingBottom: 40,
//   },
//   drag:        { width: 38, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
//   iconWrap:    { alignItems: "center", marginBottom: 14 },
//   iconCircle:  {
//     width: 60, height: 60, borderRadius: 30,
//     backgroundColor: C.navyTint,
//     alignItems: "center", justifyContent: "center",
//   },
//   title:       { fontSize: 20, fontWeight: "800", color: C.text, textAlign: "center", marginBottom: 4 },
//   subtitle:    { fontSize: 13, color: C.textMute, textAlign: "center", marginBottom: 20 },
//   detailCard:  {
//     backgroundColor: C.navyFaint,
//     borderRadius: 13,
//     borderWidth: 1,
//     borderColor: C.navyTint,
//     marginBottom: 14,
//     overflow: "hidden",
//   },
//   detailRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingVertical: 13 },
//   divider:     { height: 1, backgroundColor: C.navyTint },
//   detailLabel: { fontSize: 12, color: C.textMute, fontWeight: "600" },
//   detailVal:   { fontSize: 13, fontWeight: "700", color: C.text, flex: 1, textAlign: "right", marginLeft: 16,
//     fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
//   amountVal:   { fontSize: 18, fontWeight: "800", color: C.navy },
//   note:        {
//     flexDirection: "row", alignItems: "flex-start", gap: 7,
//     backgroundColor: C.navyTint, borderRadius: 9, padding: 11,
//     marginBottom: 20,
//   },
//   noteTxt:     { fontSize: 11, color: C.navyMid, lineHeight: 16, flex: 1 },
//   btnRow:      { flexDirection: "row", gap: 10 },
//   cancelBtn:   {
//     flex: 1, borderRadius: 12, borderWidth: 1.5,
//     borderColor: C.border, paddingVertical: 14, alignItems: "center",
//   },
//   cancelTxt:   { fontSize: 14, fontWeight: "600", color: C.textMute },
//   payBtn:      {
//     flex: 2, borderRadius: 12, backgroundColor: C.navy,
//     paddingVertical: 14, flexDirection: "row",
//     alignItems: "center", justifyContent: "center", gap: 8,
//   },
//   payTxt:      { fontSize: 14, fontWeight: "700", color: C.white },
// });

// // ════════════════════════════════════════════════════════════
// // COMPONENT: StudentFeesScreen — APIs 2, 3, 5, 6, 7, 8
// // ════════════════════════════════════════════════════════════
// function StudentFeesScreen({ student, onBack }: { student: Student; onBack: () => void }) {
//   const [tab,            setTab]          = useState<"ledger" | "history">("ledger");
//   const [summary,        setSummary]      = useState<Summary | null>(null);
//   const [ledger,         setLedger]       = useState<LedgerFull[]>([]);
//   const [history,        setHistory]      = useState<PaymentRecord[]>([]);
//   const [loadMain,       setLoadMain]     = useState(true);
//   const [loadHistory,    setLoadHistory]  = useState(false);
//   const [refreshing,     setRefreshing]   = useState(false);
//   const [selectedIds,    setSelectedIds]  = useState<number[]>([]);
//   const [preview,        setPreview]      = useState<PreviewData | null>(null);
//   const [previewLoading, setPvLoading]    = useState(false);
//   const [payLoading,     setPayLoading]   = useState(false);
//   const [receiptNo,      setReceiptNo]    = useState<string | null>(null);
//   const [paidOpen,       setPaidOpen]     = useState(false);
//   const [studentName,    setStudentName]  = useState(student.student_name);
//   const [classDisplay,   setClassDisplay] = useState(student.class_display ?? "");

//   // API 2: GET /api/fees/parent/student/:id — summary + basic ledger
//   // API 8: GET /api/fees/ledger/student/:id — full ledger with penalty/waiver detail
//   const fetchAll = useCallback(async (silent = false) => {
//     if (!silent) setLoadMain(true);
//     try {
//       // Run API 2 and API 8 in parallel
//       const [res2, res8] = await Promise.allSettled([
//         api(`/api/fees/parent/student/${student.id}`),
//         api(`/api/fees/ledger/student/${student.id}`),
//       ]);

//       // API 2 result — summary + student info
//       if (res2.status === "fulfilled") {
//         const d = res2.value;
//         setSummary(d.summary ?? null);
//         setStudentName(d.student?.student_name ?? student.student_name);
//         setClassDisplay(d.student?.class_display ?? student.class_display ?? "");

//         // Use API 8 ledger if available, otherwise fall back to API 2 ledger
//         if (res8.status === "fulfilled") {
//           const d8 = res8.value;
//           // API 8 response shape: { ledger: [...] } or { data: [...] }
//           const fullLedger: LedgerFull[] = d8.ledger ?? d8.data ?? [];
//           if (fullLedger.length > 0) {
//             setLedger(fullLedger);
//           } else {
//             setLedger(d.ledger ?? []);
//           }
//         } else {
//           setLedger(d.ledger ?? []);
//         }
//       } else {
//         throw new Error(res2.reason?.message ?? "Failed to load student data");
//       }
//     } catch (e: any) {
//       Alert.alert("Error", e.message);
//     } finally {
//       setLoadMain(false);
//       setRefreshing(false);
//     }
//   }, [student.id]);

//   // API 3: GET /api/fees/parent/student/:id/history
//   const fetchHistory = useCallback(async () => {
//     setLoadHistory(true);
//     try {
//       const d = await api(`/api/fees/parent/student/${student.id}/history`);
//       // Handle multiple possible response shapes
//       const list = d.payments ?? d.data?.payments ?? d.data ?? (Array.isArray(d) ? d : []);
//       setHistory(list);
//     } catch (e: any) {
//       Alert.alert("Error", e.message);
//     } finally {
//       setLoadHistory(false);
//     }
//   }, [student.id]);

//   useEffect(() => { fetchAll(); }, [fetchAll]);
//   useEffect(() => {
//     if (tab === "history" && history.length === 0 && !loadHistory) fetchHistory();
//   }, [tab]);

//   const toggleSelect = (id: number) =>
//     setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

//   // API 5: POST /api/fees/payment/preview — MUST call before payment
// // API 5: POST /api/fees/payment/preview — MUST call before payment
// const handlePreview = async () => {
//   if (!selectedIds.length) {
//     Alert.alert("Select fees", "Please select at least one pending fee.");
//     return;
//   }
//   setPvLoading(true);
//   try {
//     const d = await api("/api/fees/payment/preview", {
//       method: "POST",
//       body: JSON.stringify({
//         student_id:   student.id,
//         payment_type: "ledger_selection",
//         ledger_ids:   selectedIds,
//       }),
//     });
//     // Handle different response shapes
//     const previewData = d.data ?? d.preview ?? d;
//     setPreview(previewData);
//   } catch (e: any) {
//     Alert.alert("Preview Failed", e.message);
//   } finally {
//     setPvLoading(false);
//   }
// };

//   // API 6: POST /api/fees/payment/create-order — called after user confirms preview
//   const handleCreateOrder = async () => {
//     setPreview(null);
//     setPayLoading(true);
//     try {
//       const d = await api("/api/fees/payment/create-order", {
//         method: "POST",
//         body: JSON.stringify({
//           student_id:   student.id,
//           payment_type: "ledger_selection",
//           ledger_ids:   selectedIds,
//           payment_mode: "online",
//           remarks:      "Parent online payment",
//         }),
//       });
//       const order: OrderData = d.data ?? d;

//       // In production: open Cashfree SDK here with order.payment_session_id
//       // For now: present the order details and simulate gateway result
//       Alert.alert(
//         "Order Created",
//         `Order ID: ${order.order_id}\nAmount: ${rupee(order.order_amount)}\n\nOpen payment gateway?`,
//         [
//           {
//             text: "Cancel",
//             style: "cancel",
//             // API 7: verify even on cancel so ledger reflects cancelled status
//             onPress: () => handleVerify(order.order_id, ""),
//           },
//           {
//             text: "Pay Now",
//             onPress: () => {
//               // Simulate Cashfree result — replace this block with actual SDK callback
//               Alert.alert("Simulate Gateway", "Choose result:", [
//                 { text: "✅ Success",   onPress: () => handleVerify(order.order_id, `CF_${Date.now()}`) },
//                 { text: "❌ Failed",    onPress: () => handleVerify(order.order_id, `CF_${Date.now()}`) },
//                 { text: "⏸ Cancelled", onPress: () => handleVerify(order.order_id, "") },
//               ]);
//             },
//           },
//         ]
//       );
//     } catch (e: any) {
//       Alert.alert("Order Failed", e.message);
//     } finally {
//       setPayLoading(false);
//     }
//   };

//   // API 7: POST /api/fees/payment/verify — MANDATORY after every payment attempt
//   const handleVerify = async (orderId: string, paymentId: string) => {
//     try {
//       const d = await api("/api/fees/payment/verify", {
//         method: "POST",
//         body: JSON.stringify({ order_id: orderId, payment_id: paymentId }),
//       });
//       const status = d.data?.transaction_status ?? d.transaction_status ?? "pending";
//       const cfg    = statusCfg(status);

//       Alert.alert(
//         `Payment ${cfg.label}`,
//         status === "success"
//           ? "Your payment was successful. You can view and download your receipt from Payment History."
//           : status === "failed"
//           ? "Your payment did not go through. Please try again."
//           : status === "cancelled"
//           ? "Payment was cancelled."
//           : `Payment status: ${cfg.label}`,
//         [{
//           text: "OK",
//           onPress: () => {
//             setSelectedIds([]);
//             // Always refresh both ledger and history after any payment
//             fetchAll(true);
//             fetchHistory();
//             if (tab !== "history") setTab("history");
//           },
//         }]
//       );
//     } catch (e: any) {
//       Alert.alert("Verify Error", e.message);
//     }
//   };

//   const pending = ledger.filter(l => l.remaining_amount > 0);
//   const paid    = ledger.filter(l => l.remaining_amount <= 0);

//   return (
//     <View style={sf.root}>
//       <StatusBar barStyle="light-content" backgroundColor={C.navy} />

//       {/* Top bar */}
//       <View style={sf.topBar}>
//         <TouchableOpacity style={sf.iconBtn} onPress={onBack}>
//           <Ionicons name="arrow-back" size={20} color={C.white} />
//         </TouchableOpacity>
//         <View style={{ flex: 1 }}>
//           <Text style={sf.topName} numberOfLines={1}>{studentName}</Text>
//           {classDisplay ? <Text style={sf.topSub}>Class {classDisplay}</Text> : null}
//         </View>
//         {/* <TouchableOpacity style={sf.iconBtn} onPress={() => { setRefreshing(true); fetchAll(true); }}>
//           <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.7)" />
//         </TouchableOpacity> */}
//       </View>

//       {loadMain ? (
//         <View style={sf.centerBox}>
//           <ActivityIndicator size="large" color={C.navy} />
//           <Text style={sf.centerTxt}>Loading fees…</Text>
//         </View>
//       ) : !summary ? (
//         <View style={sf.centerBox}>
//           <Ionicons name="alert-circle-outline" size={32} color={C.danger} />
//           <Text style={sf.centerTxt}>Failed to load data</Text>
//           <TouchableOpacity onPress={() => fetchAll()} style={sf.retryBtn}>
//             <Text style={sf.retryTxt}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <>
//           {/* ── Summary strip (API 2 data) ── */}
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sf.strip} contentContainerStyle={sf.stripInner}>
//             <SummaryTile label="Outstanding"   value={rupee(summary.outstanding_amount)}    color={C.danger}  />
//             <SummaryTile label="Total Payable" value={rupee(summary.total_payable)}         color={C.navy}    />
//             {summary.runtime_penalty_total > 0 &&
//               <SummaryTile label="Late Penalty"  value={rupee(summary.runtime_penalty_total)} color={C.amber}   />}
//             {summary.waived_penalty_total > 0 &&
//               <SummaryTile label="Waived"        value={rupee(summary.waived_penalty_total)}  color={C.success} />}
//           </ScrollView>

//           {/* ── Tabs ── */}
//           <View style={sf.tabBar}>
//             {(["ledger", "history"] as const).map(t => (
//               <TouchableOpacity key={t} style={[sf.tab, tab === t && sf.tabOn]} onPress={() => setTab(t)}>
//                 <Ionicons name={t === "ledger" ? "list-outline" : "time-outline"} size={13} color={tab === t ? C.navy : C.textMute} />
//                 <Text style={[sf.tabTxt, tab === t && sf.tabTxtOn]}>
//                   {t === "ledger" ? "Fee Ledger" : "Payment History"}
//                 </Text>
//                 {t === "ledger" && pending.length > 0 && (
//                   <View style={sf.tabBadge}><Text style={sf.tabBadgeTxt}>{pending.length}</Text></View>
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* ── LEDGER TAB (APIs 2 + 8 data, API 9 on demand) ── */}
//           {tab === "ledger" ? (
//             <ScrollView
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={[sf.listPad, selectedIds.length > 0 && { paddingBottom: 108 }]}
//               refreshControl={
//                 <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(true); }} colors={[C.navy]} tintColor={C.navy} />
//               }
//             >
//               {pending.length > 0 ? (
//                 <>
//                   <View style={sf.secRow}>
//                     <View style={[sf.secDot, { backgroundColor: C.danger }]} />
//                     <Text style={sf.secTxt}>Pending</Text>
//                     <View style={[sf.secCount, { backgroundColor: C.dangerTint }]}>
//                       <Text style={[sf.secCountTxt, { color: C.danger }]}>{pending.length}</Text>
//                     </View>
//                     <View style={{ flex: 1 }} />
//                     <TouchableOpacity onPress={() =>
//                       selectedIds.length === pending.length
//                         ? setSelectedIds([])
//                         : setSelectedIds(pending.map(l => l.id))
//                     }>
//                       <Text style={sf.selAll}>
//                         {selectedIds.length === pending.length ? "Deselect All" : "Select All"}
//                       </Text>
//                     </TouchableOpacity>
//                   </View>

//                   {pending.map(item => (
//                     <PendingCard
//                       key={item.id}
//                       item={item}
//                       selected={selectedIds.includes(item.id)}
//                       onToggle={() => toggleSelect(item.id)}
//                     />
//                   ))}
//                 </>
//               ) : (
//                 <View style={sf.allPaid}>
//                   <View style={sf.allPaidIcon}>
//                     <Ionicons name="checkmark-circle" size={26} color={C.success} />
//                   </View>
//                   <Text style={sf.allPaidTxt}>All fees are cleared!</Text>
//                   <Text style={sf.allPaidSub}>No pending payments for this student.</Text>
//                 </View>
//               )}

//               {paid.length > 0 && (
//                 <View style={{ marginTop: 8 }}>
//                   <TouchableOpacity style={sf.secRow} onPress={() => setPaidOpen(o => !o)} activeOpacity={0.75}>
//                     <View style={[sf.secDot, { backgroundColor: C.success }]} />
//                     <Text style={sf.secTxt}>Paid</Text>
//                     <View style={[sf.secCount, { backgroundColor: C.successTint }]}>
//                       <Text style={[sf.secCountTxt, { color: C.success }]}>{paid.length}</Text>
//                     </View>
//                     <View style={{ flex: 1 }} />
//                     <Ionicons name={paidOpen ? "chevron-up" : "chevron-down"} size={13} color={C.textMute} />
//                   </TouchableOpacity>
//                   {paidOpen && paid.map(item => <PaidCard key={item.id} item={item} />)}
//                 </View>
//               )}

//               {ledger.length === 0 && (
//                 <EmptyView icon="document-text-outline" title="No ledger records" body="No fee records found for this student." />
//               )}
//             </ScrollView>

//           ) : (
//             /* ── HISTORY TAB (API 3 data) ── */
//             <ScrollView
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={sf.listPad}
//               refreshControl={
//                 <RefreshControl refreshing={loadHistory} onRefresh={fetchHistory} colors={[C.navy]} tintColor={C.navy} />
//               }
//             >
//               {loadHistory ? (
//                 <View style={sf.centerBox}>
//                   <ActivityIndicator size="large" color={C.navy} />
//                   <Text style={sf.centerTxt}>Loading history…</Text>
//                 </View>
//               ) : history.length === 0 ? (
//                 <EmptyView icon="time-outline" title="No payment history" body="Your payment records will appear here." />
//               ) : (
//                 history.map(p => (
//                   <HistoryCard
//                     key={p.id}
//                     payment={p}
//                     onViewReceipt={p.receipt_no ? () => setReceiptNo(p.receipt_no) : undefined}
//                   />
//                 ))
//               )}
//             </ScrollView>
//           )}

//           {/* ── Pay bar ── */}
//           {selectedIds.length > 0 && tab === "ledger" && (
//             <View style={sf.payBar}>
//               <View>
//                 <Text style={sf.payBarCount}>{selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected</Text>
//                 <Text style={sf.payBarHint}>Preview before you pay</Text>
//               </View>
//               <TouchableOpacity
//                 style={[sf.payBarBtn, previewLoading && { opacity: 0.6 }]}
//                 onPress={handlePreview}
//                 disabled={previewLoading}
//                 activeOpacity={0.85}
//               >
//                 {previewLoading
//                   ? <ActivityIndicator size="small" color={C.white} />
//                   : <><Ionicons name="card-outline" size={14} color={C.white} /><Text style={sf.payBarBtnTxt}>Review & Pay</Text></>
//                 }
//               </TouchableOpacity>
//             </View>
//           )}
//         </>
//       )}

//       {/* ── Modals ── */}
//       {preview && (
//         <PreviewModal
//           preview={preview}
//           count={selectedIds.length}
//           onClose={() => setPreview(null)}
//           onConfirm={handleCreateOrder}
//         />
//       )}

//       {payLoading && (
//         <View style={sf.fullOverlay}>
//           <ActivityIndicator size="large" color={C.white} />
//           <Text style={sf.overlayTxt}>Creating order…</Text>
//         </View>
//       )}

//       {receiptNo && <ReceiptModal receiptNo={receiptNo} onClose={() => setReceiptNo(null)} />}
//     </View>
//   );
// }

// // ── PendingCard — shows API 8 full ledger data + triggers API 9 ──
// function PendingCard({ item, selected, onToggle }: { item: LedgerFull; selected: boolean; onToggle: () => void }) {
//   const partial  = item.status === "partial";
//   const total    = parseFloat(item.total_amount);
//   const paid     = parseFloat(item.paid_amount);
//   const hasOverdue = item.is_overdue && item.overdue_days > 0;

//   return (
//     <TouchableOpacity
//       style={[pc.card, selected && pc.cardOn]}
//       onPress={onToggle}
//       activeOpacity={0.8}
//     >
//       {/* Header row */}
//       <View style={pc.row1}>
//         <View style={[pc.cb, selected && pc.cbOn]}>
//           {selected && <Ionicons name="checkmark" size={11} color={C.white} />}
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={pc.name}>{item.fee_name}</Text>
//           <View style={pc.meta}>
//             {item.due_date && (
//               <Text style={[pc.due, hasOverdue && { color: C.danger }]}>
//                 Due {fmtDate(item.due_date)}
//               </Text>
//             )}
//             {item.frequency && (
//               <View style={pc.freqTag}>
//                 <Text style={pc.freqTxt}>{item.frequency.replace(/_/g, " ")}</Text>
//               </View>
//             )}
//           </View>
//         </View>
//         <View style={[pc.badge, { backgroundColor: partial ? C.amberTint : C.dangerTint }]}>
//           <Text style={[pc.badgeTxt, { color: partial ? C.amber : C.danger }]}>
//             {partial ? "Partial" : "Pending"}
//           </Text>
//         </View>
//       </View>

//       {/* Amount chips */}
//       <View style={pc.chips}>
//         <AmtChip label="Total"     value={rupee(total)} />
//         <AmtChip label="Paid"      value={rupee(paid)}                   green />
//         <AmtChip label="Remaining" value={rupee(item.remaining_amount)}  red   />
//       </View>

//       {/* Overdue bar */}
//       {hasOverdue && (
//         <View style={pc.overdueBar}>
//           <Ionicons name="alert-circle-outline" size={12} color={C.danger} />
//           <Text style={pc.overdueTxt}>
//             {item.overdue_days}d overdue
//             {item.final_penalty > 0 ? ` · Penalty ${rupee(item.final_penalty)}` :
//              item.runtime_penalty > 0 ? ` · Penalty ${rupee(item.runtime_penalty)}` : ""}
//           </Text>
//         </View>
//       )}

//       {/* Waiver bar */}
//       {item.waived_penalty > 0 && (
//         <View style={pc.waiverBar}>
//           <Ionicons name="gift-outline" size={12} color={C.success} />
//           <Text style={pc.waiverTxt}>Penalty waived: {rupee(item.waived_penalty)}</Text>
//         </View>
//       )}

//       {/* API 9: penalty drill-down — only shown if overdue */}
//       {hasOverdue && <PenaltyDrillDown ledgerId={item.id} />}

//       {/* Payable */}
//       {item.total_payable > 0 && (
//         <View style={pc.payableRow}>
//           <Text style={pc.payableLabel}>Payable now</Text>
//           <Text style={pc.payableVal}>{rupee(item.total_payable)}</Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );
// }

// function AmtChip({ label, value, green, red }: { label: string; value: string; green?: boolean; red?: boolean }) {
//   return (
//     <View style={pc.chip}>
//       <Text style={pc.chipLabel}>{label}</Text>
//       <Text style={[pc.chipVal, green && { color: C.success }, red && { color: C.danger }]}>{value}</Text>
//     </View>
//   );
// }

// const pc = StyleSheet.create({
//   card:       { backgroundColor: C.card, borderRadius: 13, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: C.border },
//   cardOn:     { borderColor: C.navyLight, backgroundColor: C.navyFaint },
//   row1:       { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
//   cb:         { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: C.borderMid, alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 },
//   cbOn:       { backgroundColor: C.navy, borderColor: C.navy },
//   name:       { fontSize: 13, fontWeight: "700", color: C.text, lineHeight: 18 },
//   meta:       { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" },
//   due:        { fontSize: 11, color: C.textMute },
//   freqTag:    { backgroundColor: C.navyTint, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
//   freqTxt:    { fontSize: 9, color: C.navyMid, fontWeight: "700", textTransform: "capitalize" },
//   badge:      { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
//   badgeTxt:   { fontSize: 10, fontWeight: "700" },
//   chips:      { flexDirection: "row", gap: 5, marginBottom: 6 },
//   chip:       { flex: 1, backgroundColor: C.bg, borderRadius: 8, padding: 8, alignItems: "center", borderWidth: 1, borderColor: C.border },
//   chipLabel:  { fontSize: 9, color: C.textMute, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 2 },
//   chipVal:    { fontSize: 12, fontWeight: "700", color: C.text },
//   overdueBar: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.dangerTint, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6, marginBottom: 5 },
//   overdueTxt: { fontSize: 11, color: C.danger, fontWeight: "600", flex: 1 },
//   waiverBar:  { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.successTint, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6, marginBottom: 5 },
//   waiverTxt:  { fontSize: 11, color: C.success, fontWeight: "600" },
//   payableRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 7, backgroundColor: C.navyFaint, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: C.navyTint },
//   payableLabel:{ fontSize: 12, color: C.navyLight, fontWeight: "600" },
//   payableVal: { fontSize: 15, fontWeight: "800", color: C.navy },
// });

// // ── PaidCard ──
// function PaidCard({ item }: { item: LedgerFull }) {
//   return (
//     <View style={padc.card}>
//       <View style={padc.check}><Ionicons name="checkmark" size={11} color={C.success} /></View>
//       <View style={{ flex: 1 }}>
//         <Text style={padc.name}>{item.fee_name}</Text>
//         {item.due_date && <Text style={padc.date}>Due {fmtDate(item.due_date)}</Text>}
//       </View>
//       <View style={{ alignItems: "flex-end" }}>
//         <Text style={padc.amt}>{rupee(parseFloat(item.total_amount))}</Text>
//         <View style={padc.tag}><Text style={padc.tagTxt}>Paid</Text></View>
//       </View>
//     </View>
//   );
// }
// const padc = StyleSheet.create({
//   card:  { backgroundColor: C.card, borderRadius: 10, padding: 11, marginBottom: 6, borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center", gap: 10 },
//   check: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.successTint, alignItems: "center", justifyContent: "center" },
//   name:  { fontSize: 13, fontWeight: "600", color: C.textMid },
//   date:  { fontSize: 10, color: C.textMute, marginTop: 1 },
//   amt:   { fontSize: 13, fontWeight: "700", color: C.textMid },
//   tag:   { backgroundColor: C.successTint, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 },
//   tagTxt:{ fontSize: 9, fontWeight: "700", color: C.success },
// });

// // ── HistoryCard (API 3 data) ──
// function HistoryCard({ payment, onViewReceipt }: { payment: PaymentRecord; onViewReceipt?: () => void }) {
//   const [open, setOpen] = useState(false);
//   const cfg     = statusCfg(payment.transaction_status);
//   const total   = parseFloat(payment.grand_total);
//   const penalty = parseFloat(payment.total_penalty ?? "0");
//   const method  = gwMethod(payment.gateway_response);
//   const cfId    = gwCfId(payment.gateway_response);
//   const gItems  = gwItems(payment.gateway_response);

//   return (
//     <View style={hc.card}>
//       <TouchableOpacity style={hc.top} onPress={() => setOpen(o => !o)} activeOpacity={0.8}>
//         <View style={[hc.icon, { backgroundColor: cfg.bg }]}>
//           <Ionicons name={cfg.icon} size={17} color={cfg.color} />
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={hc.amt}>{rupee(total)}</Text>
//           <Text style={hc.date}>{fmtDT(payment.paid_at ?? payment.created_at)}</Text>
//         </View>
//         <View style={{ alignItems: "flex-end", gap: 5 }}>
//           <View style={[hc.badge, { backgroundColor: cfg.bg }]}>
//             <Text style={[hc.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
//           </View>
//           <Ionicons name={open ? "chevron-up" : "chevron-down"} size={12} color={C.textMute} />
//         </View>
//       </TouchableOpacity>

//       {/* Meta chips */}
//       <View style={hc.metaRow}>
//         {method              && <MetaChip icon="phone-portrait-outline" label={method} />}
//         {payment.payment_mode && <MetaChip icon="card-outline" label={payment.payment_mode.toUpperCase()} />}
//         {payment.gateway_order_id && <MetaChip icon="receipt-outline" label={payment.gateway_order_id} />}
//       </View>

//       {/* Expanded items (from gateway_response) */}
//       {open && (
//         <View style={hc.expanded}>
//           {gItems.length > 0 ? (
//             <>
//               <Text style={hc.expandedTitle}>ITEMS PAID</Text>
//               {gItems.map((it: any, i: number) => (
//                 <View key={i} style={hc.item}>
//                   <View style={{ flex: 1 }}>
//                     <Text style={hc.itemName}>{it.fee_name}</Text>
//                     <Text style={hc.itemDate}>Due {fmtDate(it.due_date)}</Text>
//                   </View>
//                   <View style={{ alignItems: "flex-end" }}>
//                     <Text style={hc.itemAmt}>{rupee(it.applied_amount)}</Text>
//                     {(it.penalty_amount ?? 0) > 0 && <Text style={hc.itemPenalty}>+{rupee(it.penalty_amount)} penalty</Text>}
//                   </View>
//                 </View>
//               ))}
//             </>
//           ) : (
//             <Text style={hc.noItems}>Item details embedded in receipt</Text>
//           )}

//           {/* Totals */}
//           <View style={hc.totals}>
//             <View style={hc.totRow}><Text style={hc.totLabel}>Base Amount</Text><Text style={hc.totVal}>{rupee(payment.total_amount)}</Text></View>
//             {penalty > 0 && (
//               <View style={hc.totRow}>
//                 <Text style={[hc.totLabel, { color: C.amber }]}>Late Penalty</Text>
//                 <Text style={[hc.totVal, { color: C.amber }]}>+{rupee(penalty)}</Text>
//               </View>
//             )}
//             <View style={[hc.totRow, hc.grandRow]}>
//               <Text style={hc.grandLabel}>Grand Total</Text>
//               <Text style={hc.grandVal}>{rupee(total)}</Text>
//             </View>
//           </View>

//           {cfId ? <Text style={hc.cfId}>CF Payment ID: {cfId}</Text> : null}
//         </View>
//       )}

//       {/* View receipt button — only for successful payments with a receipt_no */}
//       {payment.receipt_no && payment.transaction_status === "success" && (
//         <TouchableOpacity style={hc.receiptBtn} onPress={onViewReceipt} activeOpacity={0.8}>
//           <Ionicons name="receipt-outline" size={13} color={C.navy} />
//           <Text style={hc.receiptTxt}>View & Download Receipt</Text>
//           <Ionicons name="chevron-forward" size={12} color={C.navy} style={{ marginLeft: "auto" }} />
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// }

// function MetaChip({ icon, label }: { icon: IconName; label: string }) {
//   return (
//     <View style={hc.chip}>
//       <Ionicons name={icon} size={10} color={C.textMute} />
//       <Text style={hc.chipTxt} numberOfLines={1}>{label}</Text>
//     </View>
//   );
// }

// const hc = StyleSheet.create({
//   card:        { backgroundColor: C.card, borderRadius: 13, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: C.border },
//   top:         { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 8 },
//   icon:        { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
//   amt:         { fontSize: 15, fontWeight: "800", color: C.text },
//   date:        { fontSize: 11, color: C.textMute, marginTop: 2 },
//   badge:       { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
//   badgeTxt:    { fontSize: 10, fontWeight: "700" },
//   metaRow:     { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 4 },
//   chip:        { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.border },
//   chipTxt:     { fontSize: 10, color: C.textMute, maxWidth: SW * 0.4 },
//   expanded:    { backgroundColor: C.bg, borderRadius: 9, padding: 11, marginTop: 8, borderWidth: 1, borderColor: C.border },
//   expandedTitle:{ fontSize: 9, fontWeight: "700", color: C.textMute, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" },
//   noItems:     { fontSize: 11, color: C.textMute, fontStyle: "italic", paddingVertical: 4 },
//   item:        { flexDirection: "row", alignItems: "flex-start", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border },
//   itemName:    { fontSize: 13, fontWeight: "600", color: C.text },
//   itemDate:    { fontSize: 10, color: C.textMute, marginTop: 2 },
//   itemAmt:     { fontSize: 13, fontWeight: "700", color: C.text },
//   itemPenalty: { fontSize: 10, color: C.amber, marginTop: 2 },
//   totals:      { marginTop: 8 },
//   totRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
//   totLabel:    { fontSize: 12, color: C.textMute },
//   totVal:      { fontSize: 12, fontWeight: "600", color: C.text },
//   grandRow:    { borderTopWidth: 1, borderTopColor: C.border, marginTop: 4, paddingTop: 7 },
//   grandLabel:  { fontSize: 13, fontWeight: "700", color: C.text },
//   grandVal:    { fontSize: 14, fontWeight: "800", color: C.navy },
//   cfId:        { fontSize: 10, color: C.textMute, marginTop: 6, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
//   receiptBtn:  { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10, backgroundColor: C.navyFaint, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: C.navyTint },
//   receiptTxt:  { fontSize: 12, fontWeight: "700", color: C.navy, flex: 1 },
// });

// // ── StudentFeesScreen styles ──
// function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
//   return (
//     <View style={sf.tile}>
//       <Text style={sf.tileLabel}>{label}</Text>
//       <Text style={[sf.tileVal, { color }]}>{value}</Text>
//     </View>
//   );
// }
// function EmptyView({ icon, title, body }: { icon: IconName; title: string; body: string }) {
//   return (
//     <View style={sf.empty}>
//       <View style={sf.emptyIcon}><Ionicons name={icon} size={26} color={C.navy} /></View>
//       <Text style={sf.emptyTitle}>{title}</Text>
//       <Text style={sf.emptySub}>{body}</Text>
//     </View>
//   );
// }

// const sf = StyleSheet.create({
//   root:         { flex: 1, backgroundColor: C.bg },
//   topBar:       { backgroundColor: C.navy, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
//   iconBtn:      { width: 36, height: 36, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
//   topName:      { fontSize: 16, fontWeight: "700", color: C.white },
//   topSub:       { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 },
//   centerBox:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
//   centerTxt:    { fontSize: 13, color: C.textMute },
//   retryBtn:     { backgroundColor: C.navyTint, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 9, marginTop: 4 },
//   retryTxt:     { fontSize: 13, fontWeight: "700", color: C.navy },
//   // Summary strip
//   strip:        { backgroundColor: C.card, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: C.border },
//   stripInner:   { paddingHorizontal: 6, paddingVertical: 4, gap: 2 },
//   tile:         { paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", minWidth: 110 },
//   tileLabel:    { fontSize: 9, fontWeight: "700", color: C.textMute, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 },
//   tileVal:      { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
//   // Tabs
//   tabBar:       { flexDirection: "row", backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
//   tab:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 11, borderBottomWidth: 2.5, borderBottomColor: "transparent" },
//   tabOn:        { borderBottomColor: C.navy },
//   tabTxt:       { fontSize: 13, fontWeight: "600", color: C.textMute },
//   tabTxtOn:     { color: C.navy, fontWeight: "700" },
//   tabBadge:     { backgroundColor: C.dangerTint, borderRadius: 7, paddingHorizontal: 5, paddingVertical: 1 },
//   tabBadgeTxt:  { fontSize: 9, fontWeight: "800", color: C.danger },
//   listPad:      { paddingHorizontal: 13, paddingVertical: 14, paddingBottom: 40 },
//   // Section headers
//   secRow:       { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10, paddingVertical: 2 },
//   secDot:       { width: 7, height: 7, borderRadius: 4 },
//   secTxt:       { fontSize: 12, fontWeight: "700", color: C.textMid },
//   secCount:     { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
//   secCountTxt:  { fontSize: 10, fontWeight: "700" },
//   selAll:       { fontSize: 12, fontWeight: "600", color: C.navy },
//   // All paid
//   allPaid:      { alignItems: "center", paddingVertical: 28, gap: 6 },
//   allPaidIcon:  { width: 56, height: 56, borderRadius: 28, backgroundColor: C.successTint, alignItems: "center", justifyContent: "center", marginBottom: 4 },
//   allPaidTxt:   { fontSize: 14, fontWeight: "700", color: C.success },
//   allPaidSub:   { fontSize: 12, color: C.textMute },
//   // Pay bar
//   payBar:       { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.card, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, elevation: 14, shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 12 },
//   payBarCount:  { fontSize: 14, fontWeight: "700", color: C.text },
//   payBarHint:   { fontSize: 11, color: C.textMute, marginTop: 1 },
//   payBarBtn:    { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.navy, borderRadius: 11, paddingHorizontal: 18, paddingVertical: 12 },
//   payBarBtnTxt: { fontSize: 13, fontWeight: "700", color: C.white },
//   // Overlay
//   fullOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,20,60,0.78)", alignItems: "center", justifyContent: "center", gap: 12, zIndex: 99 },
//   overlayTxt:   { color: C.white, fontSize: 14, fontWeight: "600" },
//   // Empty
//   empty:        { alignItems: "center", paddingTop: 52, paddingHorizontal: 32, gap: 8 },
//   emptyIcon:    { width: 60, height: 60, borderRadius: 30, backgroundColor: C.navyTint, alignItems: "center", justifyContent: "center", marginBottom: 4 },
//   emptyTitle:   { fontSize: 15, fontWeight: "700", color: C.text },
//   emptySub:     { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 20 },
// });

// // ════════════════════════════════════════════════════════════
// // HOME SCREEN — API 1: GET /api/fees/parent/students
// // ════════════════════════════════════════════════════════════
// export default function FeesScreen() {
//   const router = useRouter();
//   const [students,   setStudents]   = useState<Student[]>([]);
//   const [loading,    setLoading]    = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selected,   setSelected]   = useState<Student | null>(null);
//   const [orderModal, setOrderModal] = useState<OrderData | null>(null);

//   // API 1: GET /api/fees/parent/students
//   const fetchStudents = useCallback(async (silent = false) => {
//     if (!silent) setLoading(true);
//     try {
//       const d = await api("/api/fees/parent/students");
//       const raw: any[] = d.students ?? d.data ?? (Array.isArray(d) ? d : []);
//       setStudents(raw.map(s => ({
//         id:            s.id,
//         student_name:  s.student_name ?? `${s.student_firstname ?? ""} ${s.student_lastname ?? ""}`.trim(),
//         class_display: s.class_display ?? (s.class_name && s.section_name ? `${s.class_name} – ${s.section_name}` : s.class_name ?? ""),
//         class_name:    s.class_name,
//         section_name:  s.section_name,
//         roll_no:       s.roll_no,
//       })));
//     } catch (e: any) {
//       Alert.alert("Error", e.message);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => { fetchStudents(); }, [fetchStudents]);

//   if (selected) {
//     return (
//       <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
//         <StudentFeesScreen student={selected} onBack={() => setSelected(null)} />
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={hs.safe} edges={["top"]}>
//       <StatusBar barStyle="light-content" backgroundColor={C.navy} />

//       {/* Header */}
//       <View style={hs.header}>
//         <TouchableOpacity style={hs.backBtn} onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={20} color={C.white} />
//         </TouchableOpacity>
//         <View style={{ flex: 1 }}>
//           <Text style={hs.title}>Fee Management</Text>
//           <Text style={hs.subtitle}>View & pay student fees</Text>
//         </View>
//         <TouchableOpacity style={hs.refreshBtn} onPress={() => { setRefreshing(true); fetchStudents(true); }}>
//           <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.75)" />
//         </TouchableOpacity>
//       </View>

//       {loading ? (
//         <View style={hs.loaderBox}>
//           <ActivityIndicator size="large" color={C.navy} />
//           <Text style={hs.loaderTxt}>Loading…</Text>
//         </View>
//       ) : (
//         <ScrollView
//           contentContainerStyle={hs.content}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={() => { setRefreshing(true); fetchStudents(true); }}
//               colors={[C.navy]} tintColor={C.navy}
//             />
//           }
//         >
//           {students.length === 0 ? (
//             <View style={hs.emptyBox}>
//               <View style={hs.emptyIconWrap}><Ionicons name="people-outline" size={36} color={C.navy} /></View>
//               <Text style={hs.emptyTitle}>No Students Found</Text>
//               <Text style={hs.emptySub}>No students are linked to your account. Contact the school administrator.</Text>
//             </View>
//           ) : (
//             <>
//               {/* Label */}
//               <Text style={hs.sectionLabel}>LINKED STUDENTS</Text>

//               {/* Student cards */}
//               {students.map(s => (
//                 <TouchableOpacity
//                   key={s.id}
//                   style={hs.studentCard}
//                   onPress={() => setSelected(s)}
//                   activeOpacity={0.8}
//                 >
//                   <View style={hs.avatar}>
//                     <Text style={hs.avatarTxt}>{initials(s.student_name)}</Text>
//                   </View>
//                   <View style={{ flex: 1 }}>
//                     <Text style={hs.studentName}>{s.student_name}</Text>
//                     {s.class_display ? <Text style={hs.studentClass}>Class {s.class_display}</Text> : null}
//                     {s.roll_no ? <Text style={hs.studentRoll}>Roll No. {s.roll_no}</Text> : null}
//                   </View>
//                   <View style={hs.arrow}>
//                     <Ionicons name="chevron-forward" size={15} color={C.textMute} />
//                   </View>
//                 </TouchableOpacity>
//               ))}

//               {/* How it works */}
//               <Text style={[hs.sectionLabel, { marginTop: 26 }]}>HOW IT WORKS</Text>
//               {[
//                 { n: "1", icon: "person-outline" as IconName,     title: "Select a Student",   body: "Tap any student card to view their fee details." },
//                 { n: "2", icon: "checkbox-outline" as IconName,    title: "Choose Fee Items",    body: "Select the pending fees you want to pay." },
//                 { n: "3", icon: "eye-outline" as IconName,         title: "Preview Total",       body: "We calculate the exact amount including penalties and waivers." },
//                 { n: "4", icon: "card-outline" as IconName,        title: "Pay & Get Receipt",   body: "Pay via Cashfree and download your PDF receipt instantly." },
//               ].map(step => (
//                 <View key={step.n} style={hs.stepCard}>
//                   <View style={hs.stepNum}>
//                     <Ionicons name={step.icon} size={14} color={C.white} />
//                   </View>
//                   <View style={{ flex: 1 }}>
//                     <Text style={hs.stepTitle}>{step.title}</Text>
//                     <Text style={hs.stepBody}>{step.body}</Text>
//                   </View>
//                 </View>
//               ))}

//               {/* Academic year note */}
//               <View style={hs.yearNote}>
//                 <Ionicons name="calendar-outline" size={13} color={C.navy} />
//                 <Text style={hs.yearNoteTxt}>Academic Year ID: {YEAR_ID} · Change this in the app settings.</Text>
//               </View>
//             </>
//           )}
//         </ScrollView>
//       )}
//     </SafeAreaView>
//   );
// }

// const hs = StyleSheet.create({
//   safe:         { flex: 1, backgroundColor: C.bg },
//   header:       { backgroundColor: C.navy, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
//   backBtn:      { width: 36, height: 36, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
//   title:        { fontSize: 17, fontWeight: "800", color: C.white },
//   subtitle:     { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 },
//   refreshBtn:   { width: 34, height: 34, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
//   loaderBox:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
//   loaderTxt:    { fontSize: 13, color: C.textMute },
//   content:      { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 40 },
//   sectionLabel: { fontSize: 10, fontWeight: "700", color: C.textMute, letterSpacing: 1.2, marginBottom: 11 },
//   studentCard:  { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: C.border },
//   avatar:       { width: 46, height: 46, borderRadius: 12, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
//   avatarTxt:    { fontSize: 15, fontWeight: "800", color: C.white },
//   studentName:  { fontSize: 15, fontWeight: "700", color: C.text },
//   studentClass: { fontSize: 12, color: C.textMute, marginTop: 2 },
//   studentRoll:  { fontSize: 11, color: C.textMute },
//   arrow:        { width: 28, height: 28, borderRadius: 8, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
//   stepCard:     { backgroundColor: C.card, borderRadius: 11, padding: 13, marginBottom: 8, flexDirection: "row", alignItems: "flex-start", gap: 11, borderWidth: 1, borderColor: C.border },
//   stepNum:      { width: 30, height: 30, borderRadius: 8, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginTop: 1 },
//   stepTitle:    { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 2 },
//   stepBody:     { fontSize: 12, color: C.textMute, lineHeight: 17 },
//   yearNote:     { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.navyFaint, borderRadius: 9, padding: 10, marginTop: 18, borderWidth: 1, borderColor: C.navyTint },
//   yearNoteTxt:  { fontSize: 11, color: C.navyMid, flex: 1, lineHeight: 15 },
//   emptyBox:     { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 24 },
//   emptyIconWrap:{ width: 70, height: 70, borderRadius: 35, backgroundColor: C.navyTint, alignItems: "center", justifyContent: "center", marginBottom: 4 },
//   emptyTitle:   { fontSize: 16, fontWeight: "700", color: C.text },
//   emptySub:     { fontSize: 13, color: C.textMute, textAlign: "center", lineHeight: 20 },
// });

/**
 * FeesScreen.tsx — All 9 APIs fully integrated
 *
 * APIs wired:
 *  1. GET  /api/fees/parent/students                     → home student list
 *  2. GET  /api/fees/parent/student/:id                  → summary + basic ledger
 *  3. GET  /api/fees/parent/student/:id/history          → payment history
 *  4. GET  /api/fees/parent/receipt/:receipt_no          → receipt detail + PDF
 *  5. POST /api/fees/payment/preview                     → dry-run before pay
 *  6. POST /api/fees/payment/create-order                → Cashfree order creation
 *  7. POST /api/fees/payment/verify                      → post-payment verify (mandatory)
 *  8. GET  /api/fees/ledger/student/:id                  → full ledger with penalty detail
 *  9. GET  /api/fees/penalties/ledger/:ledger_id         → per-item penalty drill-down
 *
 * Dependencies: expo-print, expo-sharing, @react-native-async-storage/async-storage,
 *               expo-router, react-native-safe-area-context, @expo/vector-icons
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const BASE_URL = "https://connect.schoolaid.in";
const YEAR_ID = "8";
const { width: SW } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────
const C = {
  navy: "#0F2057",
  navyMid: "#1A3070",
  navyLight: "#2A4494",
  navyTint: "#E6EAF8",
  navyFaint: "#F2F4FB",
  success: "#0D7A4E",
  successTint: "#E3F5EE",
  danger: "#C0392B",
  dangerTint: "#FDEDEB",
  amber: "#D4650A",
  amberTint: "#FEF3E8",
  purple: "#6B21A8",
  purpleTint: "#F3E8FF",
  bg: "#F4F6FB",
  card: "#FFFFFF",
  border: "#E2E6F0",
  borderMid: "#C8CEDD",
  text: "#0A1428",
  textMid: "#374160",
  textMute: "#7A8299",
  white: "#FFFFFF",
  overlay: "rgba(10,20,40,0.6)",
};

// ─────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────
const rupee = (n: number | string) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDT = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

const initials = (name: string) =>
  name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

// ─────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────
type IconName = React.ComponentProps<typeof Ionicons>["name"];
interface SCfg {
  color: string;
  bg: string;
  icon: IconName;
  label: string;
}

const STATUS_MAP: Record<string, SCfg> = {
  success: {
    color: C.success,
    bg: C.successTint,
    icon: "checkmark-circle",
    label: "Paid",
  },
  failed: {
    color: C.danger,
    bg: C.dangerTint,
    icon: "close-circle",
    label: "Failed",
  },
  cancelled: {
    color: C.amber,
    bg: C.amberTint,
    icon: "ban",
    label: "Cancelled",
  },
  pending: {
    color: C.amber,
    bg: C.amberTint,
    icon: "time-outline",
    label: "Pending",
  },
  initiated: {
    color: C.navy,
    bg: C.navyTint,
    icon: "arrow-forward-circle",
    label: "Initiated",
  },
  amount_mismatch: {
    color: C.purple,
    bg: C.purpleTint,
    icon: "alert-circle",
    label: "Amount Mismatch",
  },
};
const statusCfg = (k?: string): SCfg =>
  STATUS_MAP[k ?? ""] ?? STATUS_MAP.pending;

// ─────────────────────────────────────────────────────────────
// API layer
// ─────────────────────────────────────────────────────────────
async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
      "x-academic-year-id": YEAR_ID,
      ...(opts.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`);
  return json as T;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Student {
  id: number;
  student_name: string;
  class_display?: string;
  class_name?: string;
  section_name?: string;
  roll_no?: string;
}
interface Summary {
  outstanding_amount: number;
  runtime_penalty_total: number;
  waived_penalty_total: number;
  total_payable: number;
}
interface LedgerBasic {
  id: number;
  fee_name: string;
  frequency: string;
  due_date: string;
  total_amount: string;
  paid_amount: string;
  remaining_amount: number;
  status: string;
  runtime_penalty: number;
  waived_penalty: number;
  final_penalty: number;
  total_payable: number;
  is_overdue: boolean;
  overdue_days: number;
}
interface LedgerFull extends LedgerBasic {
  penalty_details?: PenaltyDetail;
  waiver_details?: any;
  overdue_info?: any;
}
interface PenaltyDetail {
  runtime_penalty: number;
  final_penalty: number;
  waived_penalty: number;
  overdue_days: number;
  penalty_history?: { date: string; amount: number; reason: string }[];
}
interface PaymentRecord {
  id: number;
  receipt_no: string;
  grand_total: string;
  total_amount: string;
  total_penalty: string;
  payment_mode: string;
  transaction_status: string;
  gateway_order_id: string;
  gateway_response: string;
  paid_at: string | null;
  created_at: string;
}
interface PreviewItem {
  ledger_id: number;
  fee_name: string;
  due_date: string;
  remaining_amount: number;
  before_exemption_amount: number;
  exempted_amount: number;
  after_exemption_amount: number;
  runtime_penalty: number;
  final_penalty: number;
  calculated_penalty: number;
  penalty_amount: number;
  waived: boolean;
  waived_penalty: number;
  total_payable: number;
  applied_amount: number;
}
interface PreviewData {
  items: PreviewItem[];
  subtotal: number;
  before_exemption_total: number;
  exemption_total: number;
  after_exemption_total: number;
  penalty_total: number;
  waived_penalty_total: number;
  grand_total: number;
}
interface OrderData {
  order_id: string;
  payment_session_id: string;
  order_amount: number;
  order_currency: string;
}
interface ReceiptData {
  id: number;
  receipt_no: string;
  student_name: string;
  class_display: string;
  academic_year: string;
  payment_mode: string;
  payment_type: string;
  total_amount: string;
  total_penalty: string;
  grand_total: string;
  remarks: string;
  payment_status: string;
  created_at: string;
  gateway_name: string;
  gateway_order_id: string;
  transaction_status: string;
  gateway_response: string;
  paid_at: string | null;
  verified_at: string | null;
}
interface ReceiptItem {
  id: number;
  fee_name: string;
  amount_paid: string;
  penalty_paid: string;
  total_paid: string;
  due_date: string;
  month: number;
  year: number;
}

// ─────────────────────────────────────────────────────────────
// Gateway response parsers
// ─────────────────────────────────────────────────────────────
const gwParse = (r: string) => {
  try {
    return JSON.parse(r);
  } catch {
    return {};
  }
};
const gwCfId = (r: string) => gwParse(r)?.cashfree_payment?.cf_payment_id ?? "";
const gwBankRef = (r: string) =>
  gwParse(r)?.cashfree_payment?.bank_reference ?? "";
const gwUpi = (r: string) =>
  gwParse(r)?.cashfree_payment?.payment_method?.upi?.upi_id ?? "";
const gwMethod = (r: string): string => {
  const g = gwParse(r)?.cashfree_payment;
  if (!g) return "";
  const group = g.payment_group ?? "";
  const upi = g.payment_method?.upi?.upi_id ?? "";
  if (group === "upi") return `UPI${upi ? ` · ${upi}` : ""}`;
  return group.replace(/_/g, " ").toUpperCase();
};
const gwItems = (r: string): any[] =>
  gwParse(r)?.order_request?.preview?.items ?? [];

// ─────────────────────────────────────────────────────────────
// PDF builder
// ─────────────────────────────────────────────────────────────
function buildReceiptHTML(r: ReceiptData, items: ReceiptItem[]): string {
  const n = (v: string) =>
    Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const cfId = gwCfId(r.gateway_response);
  const bank = gwBankRef(r.gateway_response);
  const upi = gwUpi(r.gateway_response);
  const meth = gwMethod(r.gateway_response) || r.payment_mode.toUpperCase();
  const rows = items
    .map(
      (it) => `
    <tr>
      <td>${it.fee_name}</td>
      <td style="text-align:center">${new Date(it.due_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</td>
      <td style="text-align:right">₹${n(it.amount_paid)}</td>
      <td style="text-align:right">${Number(it.penalty_paid) > 0 ? "₹" + n(it.penalty_paid) : "—"}</td>
      <td style="text-align:right;font-weight:700">₹${n(it.total_paid)}</td>
    </tr>`,
    )
    .join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#0A1428;background:#fff;padding:40px 48px;max-width:760px;margin:0 auto;-webkit-print-color-adjust:exact}
.hdr{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:18px;border-bottom:2.5px solid #0F2057;margin-bottom:26px}
.org{font-size:22px;font-weight:800;color:#0F2057;letter-spacing:-0.4px}
.org-sub{font-size:10px;color:#7A8299;margin-top:3px;letter-spacing:0.8px;text-transform:uppercase}
.rno-lbl{font-size:9px;font-weight:700;color:#7A8299;text-transform:uppercase;letter-spacing:1px;text-align:right}
.rno{font-family:monospace;font-size:14px;font-weight:700;color:#0F2057;background:#E6EAF8;padding:4px 11px;border-radius:6px;display:inline-block;margin-top:5px}
.banner{background:#E3F5EE;border:1px solid #9DD6BC;border-radius:10px;padding:16px 18px;display:flex;align-items:center;gap:16px;margin-bottom:24px}
.bi{font-size:28px}.bt{font-size:14px;font-weight:700;color:#0D7A4E}.bs{font-size:11px;color:#1A9160;margin-top:2px}
.ba{margin-left:auto;text-align:right}.bav{font-size:24px;font-weight:800;color:#0D7A4E}.bal{font-size:9px;color:#1A9160;text-transform:uppercase;letter-spacing:0.5px}
.sl{font-size:9px;font-weight:800;color:#7A8299;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;margin-top:20px}
.ig{display:grid;grid-template-columns:1fr 1fr;border:1px solid #E2E6F0;border-radius:9px;overflow:hidden}
.ic{padding:11px 14px;border-right:1px solid #E2E6F0;border-bottom:1px solid #E2E6F0}.ic:nth-child(2n){border-right:none}
.icl{font-size:9px;font-weight:700;color:#7A8299;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px}
.icv{font-size:13px;font-weight:500;color:#0A1428}.icv.m{font-family:monospace;font-size:11px}
.tw{border:1px solid #E2E6F0;border-radius:9px;overflow:hidden}
table{width:100%;border-collapse:collapse}
thead tr{background:#0F2057}thead th{padding:10px 13px;font-size:11px;font-weight:700;color:#fff;text-align:left}
thead th:not(:first-child){text-align:right}thead th:nth-child(2){text-align:center}
tbody tr{border-bottom:1px solid #E2E6F0}tbody tr:last-child{border-bottom:none}tbody td{padding:10px 13px;font-size:13px}
.tots{border:1px solid #E2E6F0;border-radius:9px;overflow:hidden;margin-top:14px}
.tots tbody tr{border-bottom:1px solid #E2E6F0}.tots tbody tr:last-child{background:#0F2057;border-bottom:none}
.tots tbody tr:last-child td{color:#fff;font-weight:700;font-size:14px}.tots td{padding:9px 14px}.tots td:last-child{text-align:right}
.tg{background:#F4F6FB;border:1px solid #E2E6F0;border-radius:9px;padding:13px 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-top:18px}
.tgl{font-size:9px;font-weight:700;color:#7A8299;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px}
.tgv{font-family:monospace;font-size:12px;color:#0A1428}
.ft{border-top:1px solid #E2E6F0;padding-top:14px;margin-top:24px;text-align:center;font-size:11px;color:#7A8299;line-height:1.7}
</style></head><body>
<div class="hdr">
  <div><div class="org">SchoolAid</div><div class="org-sub">Fee Management System</div></div>
  <div><div class="rno-lbl">Official Receipt</div><div class="rno">${r.receipt_no}</div></div>
</div>
<div class="banner">
  <div class="bi">✅</div>
  <div><div class="bt">Payment Successful</div><div class="bs">Paid on ${fmtDT(r.paid_at ?? r.created_at)}</div></div>
  <div class="ba"><div class="bal">Amount Paid</div><div class="bav">₹${n(r.grand_total)}</div></div>
</div>
<div class="sl">Student & Payment Details</div>
<div class="ig">
  <div class="ic"><div class="icl">Student</div><div class="icv">${r.student_name}</div></div>
  <div class="ic"><div class="icl">Class</div><div class="icv">${r.class_display}</div></div>
  <div class="ic"><div class="icl">Academic Year</div><div class="icv">${r.academic_year}</div></div>
  <div class="ic"><div class="icl">Payment Mode</div><div class="icv">${meth}</div></div>
  <div class="ic" style="border-bottom:none"><div class="icl">Receipt No.</div><div class="icv m">${r.receipt_no}</div></div>
  <div class="ic" style="border-bottom:none"><div class="icl">Order ID</div><div class="icv m" style="font-size:10px">${r.gateway_order_id}</div></div>
</div>
<div class="sl">Fee Items</div>
<div class="tw"><table>
  <thead><tr><th>Fee Head</th><th>Period</th><th>Base Amount</th><th>Penalty</th><th>Total Paid</th></tr></thead>
  <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#7A8299;padding:16px">No items</td></tr>`}</tbody>
</table></div>
<div class="tots"><table><tbody>
  <tr><td style="color:#374160">Base Amount</td><td>₹${n(r.total_amount)}</td></tr>
  <tr><td style="color:#374160">Late Penalty</td><td>₹${n(r.total_penalty)}</td></tr>
  <tr><td>Grand Total</td><td>₹${n(r.grand_total)}</td></tr>
</tbody></table></div>
${
  cfId || bank || upi
    ? `
<div class="sl">Transaction Reference</div>
<div class="tg">
  ${cfId ? `<div><div class="tgl">CF Payment ID</div><div class="tgv">${cfId}</div></div>` : ""}
  ${bank ? `<div><div class="tgl">Bank Reference</div><div class="tgv">${bank}</div></div>` : ""}
  ${upi ? `<div><div class="tgl">UPI ID</div><div class="tgv">${upi}</div></div>` : ""}
  ${r.verified_at ? `<div><div class="tgl">Verified At</div><div class="tgv">${fmtDT(r.verified_at)}</div></div>` : ""}
</div>`
    : ""
}
<div class="ft">This is a computer-generated receipt · Does not require a physical signature<br/>
<strong>SchoolAid Fee Management</strong> · Generated ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────
// Shared bottom-sheet animation hook
// ─────────────────────────────────────────────────────────────
function useSlideUp() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 72,
      friction: 9,
    }).start();
  }, []);
  const style = {
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [500, 0],
        }),
      },
    ],
  };
  return style;
}

// ─────────────────────────────────────────────────────────────
// Shared small helpers
// ─────────────────────────────────────────────────────────────
function DragHandle() {
  return <View style={sh.drag} />;
}
function SectionLabel({ text }: { text: string }) {
  return <Text style={sh.sectionLabel}>{text}</Text>;
}
function InfoGrid({ children }: { children: React.ReactNode }) {
  return <View style={sh.infoGrid}>{children}</View>;
}
function InfoCell({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[sh.infoCell, last && sh.infoCellLast]}>
      <Text style={sh.infoCellLabel}>{label}</Text>
      <Text style={[sh.infoCellVal, mono && sh.infoCellMono]} numberOfLines={2}>
        {value || "—"}
      </Text>
    </View>
  );
}
const sh = StyleSheet.create({
  drag: {
    width: 38,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700" as any,
    color: C.textMute,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 16,
  },
  infoGrid: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    backgroundColor: C.card,
    marginBottom: 4,
  },
  infoCell: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  infoCellLast: { borderBottomWidth: 0 },
  infoCellLabel: { fontSize: 10, color: C.textMute, marginBottom: 3 },
  infoCellVal: { fontSize: 13, fontWeight: "600" as any, color: C.text },
  infoCellMono: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 11,
  },
});

// ════════════════════════════════════════════════════════════
// COMPONENT: PenaltyDrillDown — API 9
// ════════════════════════════════════════════════════════════
function PenaltyDrillDown({ ledgerId }: { ledgerId: number }) {
  const [data, setData] = useState<PenaltyDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetch9 = async () => {
    if (data) {
      setOpen((o) => !o);
      return;
    }
    setLoading(true);
    try {
      const res = await api(`/api/fees/penalties/ledger/${ledgerId}`);
      setData(res.data ?? res.penalty ?? res ?? null);
      setOpen(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={pdd.btn}
        onPress={fetch9}
        disabled={loading}
        activeOpacity={0.75}
      >
        {loading ? (
          <ActivityIndicator size="small" color={C.amber} />
        ) : (
          <Ionicons name="alert-circle-outline" size={11} color={C.amber} />
        )}
        <Text style={pdd.btnTxt}>
          {loading
            ? "Loading penalty…"
            : open
              ? "Hide penalty detail"
              : "View penalty breakdown"}
        </Text>
        {!loading && (
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={10}
            color={C.amber}
          />
        )}
      </TouchableOpacity>
      {open && data && (
        <View style={pdd.box}>
          <PdRow
            label="Runtime Penalty"
            value={rupee(data.runtime_penalty)}
            color={C.amber}
          />
          {data.waived_penalty > 0 && (
            <PdRow
              label="Waived"
              value={`-${rupee(data.waived_penalty)}`}
              color={C.success}
            />
          )}
          <PdRow label="Final Penalty" value={rupee(data.final_penalty)} bold />
          {data.overdue_days > 0 && (
            <PdRow label="Overdue Days" value={`${data.overdue_days} days`} />
          )}
          {data.penalty_history && data.penalty_history.length > 0 && (
            <View style={pdd.hist}>
              <Text style={pdd.histLabel}>HISTORY</Text>
              {data.penalty_history.map((h, i) => (
                <View key={i} style={pdd.histRow}>
                  <Text style={pdd.histDate}>{fmtDate(h.date)}</Text>
                  <Text style={pdd.histReason} numberOfLines={1}>
                    {h.reason}
                  </Text>
                  <Text style={pdd.histAmt}>{rupee(h.amount)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
function PdRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <View style={pdd.row}>
      <Text
        style={[pdd.label, bold && { color: C.text, fontWeight: "700" as any }]}
      >
        {label}
      </Text>
      <Text
        style={[
          pdd.val,
          color ? { color } : {},
          bold && { fontWeight: "800" as any },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
const pdd = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  btnTxt: { fontSize: 11, color: C.amber, fontWeight: "600" as any },
  box: {
    backgroundColor: C.amberTint,
    borderRadius: 8,
    padding: 11,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#F4C08A",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  label: { fontSize: 11, color: C.textMute },
  val: { fontSize: 11, fontWeight: "600" as any, color: C.text },
  hist: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F4C08A",
    paddingTop: 7,
  },
  histLabel: {
    fontSize: 9,
    fontWeight: "700" as any,
    color: C.amber,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  histRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
  },
  histDate: { fontSize: 10, color: C.textMute, width: 70 },
  histReason: { fontSize: 10, color: C.textMid, flex: 1 },
  histAmt: { fontSize: 10, fontWeight: "700" as any, color: C.amber },
});

// ════════════════════════════════════════════════════════════
// COMPONENT: ReceiptModal — API 4
// ════════════════════════════════════════════════════════════
function ReceiptModal({
  receiptNo,
  onClose,
}: {
  receiptNo: string;
  onClose: () => void;
}) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlLoading, setDlLoading] = useState(false);
  const slideStyle = useSlideUp();

  useEffect(() => {
    api(`/api/fees/parent/receipt/${receiptNo}`)
      .then((d) => {
        setReceipt(d.receipt ?? d.data?.receipt ?? null);
        setItems(d.items ?? d.data?.items ?? []);
      })
      .catch((e) => Alert.alert("Error", e.message))
      .finally(() => setLoading(false));
  }, [receiptNo]);

  const handleDownload = async () => {
    if (!receipt) return;
    setDlLoading(true);
    try {
      const html = buildReceiptHTML(receipt, items);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Receipt ${receipt.receipt_no}`,
        });
      } else {
        Alert.alert("PDF Ready", "Your receipt PDF is ready to save or print.");
      }
    } catch (e: any) {
      Alert.alert("Download Failed", e.message);
    } finally {
      setDlLoading(false);
    }
  };

  const r = receipt;
  return (
    <Modal visible animationType="none" transparent onRequestClose={onClose}>
      <View style={rcm.overlay}>
        <Animated.View style={[rcm.sheet, slideStyle]}>
          <DragHandle />
          <View style={rcm.hdr}>
            <View style={rcm.hdrIconWrap}>
              <Ionicons name="receipt-outline" size={16} color={C.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={rcm.hdrTitle}>Payment Receipt</Text>
              <Text style={rcm.hdrSub} numberOfLines={1}>
                {receiptNo}
              </Text>
            </View>
            <TouchableOpacity style={rcm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={C.textMute} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={rcm.loadBox}>
              <ActivityIndicator size="large" color={C.navy} />
              <Text style={rcm.loadTxt}>Fetching receipt…</Text>
            </View>
          ) : !r ? (
            <View style={rcm.loadBox}>
              <Ionicons
                name="alert-circle-outline"
                size={32}
                color={C.danger}
              />
              <Text style={rcm.loadTxt}>Receipt not found</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={rcm.body}
            >
              <View style={rcm.hero}>
                <View style={rcm.heroCheck}>
                  <Ionicons name="checkmark" size={22} color={C.white} />
                </View>
                <Text style={rcm.heroAmt}>{rupee(r.grand_total)}</Text>
                <Text style={rcm.heroLabel}>Payment Successful</Text>
                <Text style={rcm.heroDate}>
                  {fmtDT(r.paid_at ?? r.created_at)}
                </Text>
              </View>
              <SectionLabel text="STUDENT DETAILS" />
              <InfoGrid>
                <InfoCell label="Student" value={r.student_name} />
                <InfoCell label="Class" value={r.class_display} />
                <InfoCell label="Academic Year" value={r.academic_year} />
                <InfoCell
                  label="Payment Mode"
                  value={
                    gwMethod(r.gateway_response) || r.payment_mode.toUpperCase()
                  }
                  last
                />
              </InfoGrid>
              {items.length > 0 && (
                <>
                  <SectionLabel text="FEE ITEMS" />
                  <View style={rcm.feeBox}>
                    {items.map((it, i) => (
                      <View
                        key={it.id}
                        style={[
                          rcm.feeRow,
                          i === items.length - 1 && rcm.feeRowLast,
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={rcm.feeName}>{it.fee_name}</Text>
                          <Text style={rcm.feePeriod}>
                            {new Date(it.due_date).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={rcm.feeTotal}>
                            {rupee(it.total_paid)}
                          </Text>
                          {Number(it.penalty_paid) > 0 && (
                            <Text style={rcm.feePenalty}>
                              +{rupee(it.penalty_paid)} late fee
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                    <View style={rcm.feeFooter}>
                      <View style={rcm.feeSumRow}>
                        <Text style={rcm.feeSumLabel}>Base</Text>
                        <Text style={rcm.feeSumVal}>
                          {rupee(r.total_amount)}
                        </Text>
                      </View>
                      {Number(r.total_penalty) > 0 && (
                        <View style={rcm.feeSumRow}>
                          <Text style={[rcm.feeSumLabel, { color: C.amber }]}>
                            Penalty
                          </Text>
                          <Text style={[rcm.feeSumVal, { color: C.amber }]}>
                            +{rupee(r.total_penalty)}
                          </Text>
                        </View>
                      )}
                      <View style={[rcm.feeSumRow, rcm.feeSumGrand]}>
                        <Text style={rcm.feeSumGrandLabel}>Total Paid</Text>
                        <Text style={rcm.feeSumGrandVal}>
                          {rupee(r.grand_total)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
              {(gwCfId(r.gateway_response) || r.gateway_order_id) && (
                <>
                  <SectionLabel text="TRANSACTION REFERENCE" />
                  <InfoGrid>
                    {r.gateway_order_id && (
                      <InfoCell
                        label="Order ID"
                        value={r.gateway_order_id}
                        mono
                      />
                    )}
                    {gwCfId(r.gateway_response) && (
                      <InfoCell
                        label="CF Payment ID"
                        value={gwCfId(r.gateway_response)}
                        mono
                        last
                      />
                    )}
                  </InfoGrid>
                </>
              )}
              <TouchableOpacity
                style={[rcm.dlBtn, dlLoading && { opacity: 0.65 }]}
                onPress={handleDownload}
                disabled={dlLoading}
                activeOpacity={0.85}
              >
                {dlLoading ? (
                  <>
                    <ActivityIndicator size="small" color={C.white} />
                    <Text style={rcm.dlTxt}>Generating PDF…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="download-outline"
                      size={15}
                      color={C.white}
                    />
                    <Text style={rcm.dlTxt}>Download PDF Receipt</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
const rcm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 14,
    maxHeight: "93%",
  },
  hdr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  hdrIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: C.navyTint,
    alignItems: "center",
    justifyContent: "center",
  },
  hdrTitle: { fontSize: 15, fontWeight: "700" as any, color: C.text },
  hdrSub: {
    fontSize: 10,
    color: C.textMute,
    marginTop: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadBox: { paddingVertical: 52, alignItems: "center", gap: 10 },
  loadTxt: { fontSize: 13, color: C.textMute },
  body: { paddingBottom: 38 },
  hero: {
    backgroundColor: C.navyFaint,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.navyTint,
  },
  heroCheck: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroAmt: {
    fontSize: 32,
    fontWeight: "800" as any,
    color: C.navy,
    letterSpacing: -0.5,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "600" as any,
    color: C.success,
    marginTop: 4,
  },
  heroDate: { fontSize: 11, color: C.textMute, marginTop: 4 },
  feeBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    backgroundColor: C.card,
  },
  feeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  feeRowLast: { borderBottomWidth: 0 },
  feeName: { fontSize: 13, fontWeight: "600" as any, color: C.text },
  feePeriod: { fontSize: 10, color: C.textMute, marginTop: 2 },
  feeTotal: { fontSize: 13, fontWeight: "700" as any, color: C.text },
  feePenalty: { fontSize: 10, color: C.amber, marginTop: 2 },
  feeFooter: {
    backgroundColor: C.navyFaint,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.navyTint,
  },
  feeSumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  feeSumLabel: { fontSize: 11, color: C.textMute },
  feeSumVal: { fontSize: 11, fontWeight: "600" as any, color: C.text },
  feeSumGrand: {
    borderTopWidth: 1,
    borderTopColor: C.navyTint,
    marginTop: 4,
    paddingTop: 6,
  },
  feeSumGrandLabel: { fontSize: 13, fontWeight: "700" as any, color: C.navy },
  feeSumGrandVal: { fontSize: 14, fontWeight: "800" as any, color: C.navy },
  dlBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.navy,
    borderRadius: 13,
    paddingVertical: 15,
    marginTop: 20,
  },
  dlTxt: { fontSize: 14, fontWeight: "700" as any, color: C.white },
});

// ════════════════════════════════════════════════════════════
// COMPONENT: PreviewModal — API 5
// ════════════════════════════════════════════════════════════
function PreviewModal({
  preview,
  count,
  onClose,
  onConfirm,
}: {
  preview: PreviewData;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const slideStyle = useSlideUp();
  return (
    <Modal visible animationType="none" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <Animated.View style={[pm.sheet, slideStyle]}>
          <DragHandle />
          <Text style={pm.title}>Review & Confirm</Text>
          <Text style={pm.sub}>
            {count} fee item{count !== 1 ? "s" : ""} selected
          </Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 420 }}
          >
            <View style={pm.amtCard}>
              <AmtRow label="Subtotal" value={rupee(preview.subtotal)} />
              {preview.exemption_total > 0 && (
                <AmtRow
                  label="Exemption Applied"
                  value={`-${rupee(preview.exemption_total)}`}
                  color={C.success}
                />
              )}
              {preview.penalty_total > 0 && (
                <AmtRow
                  label="Late Penalty"
                  value={`+${rupee(preview.penalty_total)}`}
                  color={C.amber}
                />
              )}
              {preview.waived_penalty_total > 0 && (
                <AmtRow
                  label="Penalty Waived"
                  value={`-${rupee(preview.waived_penalty_total)}`}
                  color={C.success}
                />
              )}
              <View style={pm.divider} />
              <AmtRow
                label="Grand Total"
                value={rupee(preview.grand_total)}
                grand
              />
            </View>
            {preview.items?.length > 0 && (
              <View style={pm.bkCard}>
                <Text style={pm.bkTitle}>BREAKDOWN</Text>
                {preview.items.map((item) => (
                  <View key={item.ledger_id} style={pm.bkRow}>
                    <Text style={pm.bkLabel} numberOfLines={2}>
                      {item.fee_name}
                    </Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={pm.bkVal}>{rupee(item.total_payable)}</Text>
                      {item.final_penalty > 0 && (
                        <Text style={pm.bkPenalty}>
                          +{rupee(item.final_penalty)} penalty
                        </Text>
                      )}
                      {item.waived && item.waived_penalty > 0 && (
                        <Text style={[pm.bkPenalty, { color: C.success }]}>
                          -{rupee(item.waived_penalty)} waived
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
          <View style={pm.note}>
            <Ionicons
              name="information-circle-outline"
              size={13}
              color={C.navy}
            />
            <Text style={pm.noteTxt}>
              Amount is calculated live and includes all current penalties,
              exemptions, and waivers.
            </Text>
          </View>
          <View style={pm.btnRow}>
            <TouchableOpacity style={pm.cancelBtn} onPress={onClose}>
              <Text style={pm.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pm.payBtn} onPress={onConfirm}>
              <Ionicons name="lock-closed" size={13} color={C.white} />
              <Text style={pm.payTxt}>Pay {rupee(preview.grand_total)}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
function AmtRow({
  label,
  value,
  color,
  grand,
}: {
  label: string;
  value: string;
  color?: string;
  grand?: boolean;
}) {
  return (
    <View style={pm.amtRow}>
      <Text
        style={[
          pm.amtLabel,
          grand && { color: C.navy, fontWeight: "700" as any },
        ]}
      >
        {label}
      </Text>
      <Text style={[pm.amtVal, color ? { color } : {}, grand && pm.grandVal]}>
        {value}
      </Text>
    </View>
  );
}
const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 38,
  },
  title: {
    fontSize: 19,
    fontWeight: "800" as any,
    color: C.text,
    marginBottom: 3,
  },
  sub: { fontSize: 13, color: C.textMute, marginBottom: 18 },
  amtCard: {
    backgroundColor: C.navyFaint,
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.navyTint,
  },
  amtRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  amtLabel: { fontSize: 14, color: C.textMute },
  amtVal: { fontSize: 14, fontWeight: "600" as any, color: C.text },
  grandVal: { fontSize: 20, fontWeight: "800" as any, color: C.navy },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 6 },
  bkCard: {
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  bkTitle: {
    fontSize: 9,
    fontWeight: "700" as any,
    color: C.textMute,
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  bkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  bkLabel: { fontSize: 13, color: C.textMid, flex: 1, marginRight: 8 },
  bkVal: { fontSize: 13, fontWeight: "600" as any, color: C.text },
  bkPenalty: { fontSize: 10, color: C.amber, marginTop: 2, textAlign: "right" },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: C.navyTint,
    borderRadius: 9,
    padding: 10,
    marginBottom: 18,
    marginTop: 4,
  },
  noteTxt: { fontSize: 11, color: C.navyMid, lineHeight: 16, flex: 1 },
  btnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelTxt: { fontSize: 14, fontWeight: "600" as any, color: C.textMute },
  payBtn: {
    flex: 2,
    borderRadius: 12,
    backgroundColor: C.navy,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  payTxt: { fontSize: 14, fontWeight: "700" as any, color: C.white },
});

// ════════════════════════════════════════════════════════════
// COMPONENT: OrderCreatedModal — API 6 result (replaces native Alert)
// ════════════════════════════════════════════════════════════
// Update the OrderCreatedModal's onPayNow to pass the order to simulator
function OrderCreatedModal({ order, onCancel, onPayNow }: {
  order: OrderData; onCancel: () => void; onPayNow: () => void
}) {
  const slideStyle = useSlideUp();
  return (
    <Modal visible animationType="none" transparent onRequestClose={onCancel}>
      <View style={ocm.overlay}>
        <Animated.View style={[ocm.sheet, slideStyle]}>
          <DragHandle/>
          <View style={ocm.iconWrap}>
            <View style={ocm.iconCircle}>
              <Ionicons name="receipt-outline" size={28} color={C.navy}/>
            </View>
          </View>
          <Text style={ocm.title}>Order Created</Text>
          <Text style={ocm.subtitle}>Review your order before proceeding to pay</Text>
          
          <View style={ocm.detailCard}>
            <View style={ocm.detailRow}>
              <Text style={ocm.detailLabel}>Order ID</Text>
              <Text style={ocm.detailVal} numberOfLines={2}>{order.order_id}</Text>
            </View>
            <View style={ocm.sep}/>
            <View style={ocm.detailRow}>
              <Text style={ocm.detailLabel}>Amount</Text>
              <Text style={ocm.amountVal}>{rupee(order.order_amount)}</Text>
            </View>
            <View style={ocm.sep}/>
            <View style={ocm.detailRow}>
              <Text style={ocm.detailLabel}>Currency</Text>
              <Text style={ocm.detailVal}>{order.order_currency ?? "INR"}</Text>
            </View>
          </View>
          
          <View style={ocm.note}>
            <Ionicons name="shield-checkmark-outline" size={14} color={C.navy}/>
            <Text style={ocm.noteTxt}>You'll be redirected to the Cashfree secure payment gateway. Your data is encrypted.</Text>
          </View>
          
          <View style={ocm.btnRow}>
            <TouchableOpacity style={ocm.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={ocm.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ocm.payBtn} onPress={onPayNow} activeOpacity={0.85}>
              <Ionicons name="lock-closed" size={14} color={C.white}/>
              <Text style={ocm.payTxt}>Proceed to Pay</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
const ocm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 42,
  },
  iconWrap: { alignItems: "center", marginBottom: 14 },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: C.navyTint,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800" as any,
    color: C.text,
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    color: C.textMute,
    textAlign: "center",
    marginBottom: 22,
  },
  detailCard: {
    backgroundColor: C.navyFaint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.navyTint,
    marginBottom: 16,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sep: { height: 1, backgroundColor: C.navyTint },
  detailLabel: { fontSize: 12, color: C.textMute, fontWeight: "600" as any },
  detailVal: {
    fontSize: 12,
    fontWeight: "700" as any,
    color: C.text,
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  amountVal: { fontSize: 20, fontWeight: "800" as any, color: C.navy },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: C.navyTint,
    borderRadius: 10,
    padding: 12,
    marginBottom: 22,
  },
  noteTxt: { fontSize: 11, color: C.navyMid, lineHeight: 16, flex: 1 },
  btnRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelTxt: { fontSize: 14, fontWeight: "600" as any, color: C.textMute },
  payBtn: {
    flex: 2,
    borderRadius: 12,
    backgroundColor: C.navy,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  payTxt: { fontSize: 14, fontWeight: "700" as any, color: C.white },
});

// ════════════════════════════════════════════════════════════
// COMPONENT: PaymentResultModal — replaces verify Alert
// ════════════════════════════════════════════════════════════
function PaymentResultModal({
  status,
  onDone,
}: {
  status: string;
  onDone: () => void;
}) {
  const slideStyle = useSlideUp();
  const cfg = statusCfg(status);
  const isSuccess = status === "success";
  const isFailed = status === "failed";

  return (
    <Modal visible animationType="none" transparent>
      <View style={prm.overlay}>
        <Animated.View style={[prm.sheet, slideStyle]}>
          <DragHandle />
          <View style={prm.iconWrap}>
            <View style={[prm.iconCircle, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={32} color={cfg.color} />
            </View>
          </View>
          <Text style={[prm.title, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={prm.body}>
            {isSuccess
              ? "Your payment was successful. You can view and download your receipt from Payment History."
              : isFailed
                ? "Your payment did not go through. Please try again."
                : status === "cancelled"
                  ? "Payment was cancelled. No amount was charged."
                  : `Payment status: ${cfg.label}`}
          </Text>
          {isSuccess && (
            <View style={prm.successNote}>
              <Ionicons
                name="checkmark-circle-outline"
                size={13}
                color={C.success}
              />
              <Text style={prm.successNoteTxt}>
                Receipt is available in Payment History.
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              prm.doneBtn,
              {
                backgroundColor: isSuccess
                  ? C.success
                  : isFailed
                    ? C.danger
                    : C.navy,
              },
            ]}
            onPress={onDone}
            activeOpacity={0.85}
          >
            <Text style={prm.doneTxt}>{isSuccess ? "View History" : "OK"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
const prm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: 42,
    alignItems: "center",
  },
  iconWrap: { marginBottom: 16 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800" as any, marginBottom: 10 },
  body: {
    fontSize: 14,
    color: C.textMid,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  successNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.successTint,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 22,
  },
  successNoteTxt: { fontSize: 12, color: C.success, fontWeight: "600" as any },
  doneBtn: {
    borderRadius: 13,
    paddingVertical: 15,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  doneTxt: { fontSize: 15, fontWeight: "700" as any, color: C.white },
});

// ════════════════════════════════════════════════════════════
// COMPONENT: SimulateGatewayModal — dev-only gateway simulator
// ════════════════════════════════════════════════════════════
// Update the SimulateGatewayModal to properly simulate success/failure
function SimulateGatewayModal({
  orderId,
  onResult,
}: {
  orderId: string;
  onResult: (status: string, paymentId: string) => void;
}) {
  const slideStyle = useSlideUp();

  const handleSimulation = (result: "success" | "failed" | "cancelled") => {
    let paymentId = "";
    let status = "";

    switch (result) {
      case "success":
        paymentId = `CF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        status = "success";
        break;
      case "failed":
        paymentId = `CF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        status = "failed";
        break;
      case "cancelled":
        paymentId = "";
        status = "cancelled";
        break;
    }

    onResult(status, paymentId);
  };

  return (
    <Modal visible animationType="none" transparent>
      <View style={sgm.overlay}>
        <Animated.View style={[sgm.sheet, slideStyle]}>
          <DragHandle />
          <View style={sgm.iconWrap}>
            <View style={sgm.iconCircle}>
              <Ionicons name="card-outline" size={26} color={C.navy} />
            </View>
          </View>
          <Text style={sgm.title}>Simulate Gateway</Text>
          <Text style={sgm.subtitle}>DEV MODE — Choose a payment result</Text>
          <View style={sgm.orderBox}>
            <Text style={sgm.orderLabel}>Order ID</Text>
            <Text style={sgm.orderVal} numberOfLines={1}>
              {orderId}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              sgm.optBtn,
              { backgroundColor: C.successTint, borderColor: C.success },
            ]}
            onPress={() => handleSimulation("success")}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={18} color={C.success} />
            <Text style={[sgm.optTxt, { color: C.success }]}>
              ✅ Payment Success
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              sgm.optBtn,
              { backgroundColor: C.dangerTint, borderColor: C.danger },
            ]}
            onPress={() => handleSimulation("failed")}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={18} color={C.danger} />
            <Text style={[sgm.optTxt, { color: C.danger }]}>
              ❌ Payment Failed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              sgm.optBtn,
              { backgroundColor: C.amberTint, borderColor: C.amber },
            ]}
            onPress={() => handleSimulation("cancelled")}
            activeOpacity={0.8}
          >
            <Ionicons name="ban" size={18} color={C.amber} />
            <Text style={[sgm.optTxt, { color: C.amber }]}>
              ⏸ Payment Cancelled
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Update the styles for the buttons
const sgm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 42,
  },
  iconWrap: { alignItems: "center", marginBottom: 12 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.navyTint,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 19,
    fontWeight: "800" as any,
    color: C.text,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: C.amber,
    textAlign: "center",
    marginBottom: 18,
    fontWeight: "600" as any,
  },
  orderBox: {
    backgroundColor: C.bg,
    borderRadius: 9,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  orderLabel: {
    fontSize: 9,
    fontWeight: "700" as any,
    color: C.textMute,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  orderVal: {
    fontSize: 11,
    fontWeight: "700" as any,
    color: C.text,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  optBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  optTxt: { fontSize: 14, fontWeight: "700" as any },
});

// ════════════════════════════════════════════════════════════
// COMPONENT: StudentFeesScreen — APIs 2, 3, 5, 6, 7, 8
// ════════════════════════════════════════════════════════════
function StudentFeesScreen({
  student,
  onBack,
}: {
  student: Student;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"ledger" | "history">("ledger");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [ledger, setLedger] = useState<LedgerFull[]>([]);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loadMain, setLoadMain] = useState(true);
  const [loadHistory, setLoadHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPvLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [receiptNo, setReceiptNo] = useState<string | null>(null);
  const [paidOpen, setPaidOpen] = useState(false);
  const [studentName, setStudentName] = useState(student.student_name);
  const [classDisplay, setClassDisplay] = useState(student.class_display ?? "");
  // New themed modal states
  const [orderModal, setOrderModal] = useState<OrderData | null>(null);
  const [simModal, setSimModal] = useState<string | null>(null); // orderId for simulator
  const [resultStatus, setResultStatus] = useState<string | null>(null); // verify result

  // API 2 + API 8
  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent) setLoadMain(true);
      try {
        const [res2, res8] = await Promise.allSettled([
          api(`/api/fees/parent/student/${student.id}`),
          api(`/api/fees/ledger/student/${student.id}`),
        ]);
        if (res2.status === "fulfilled") {
          const d = res2.value;
          setSummary(d.summary ?? null);
          setStudentName(d.student?.student_name ?? student.student_name);
          setClassDisplay(
            d.student?.class_display ?? student.class_display ?? "",
          );
          if (res8.status === "fulfilled") {
            const fullLedger: LedgerFull[] =
              res8.value.ledger ?? res8.value.data ?? [];
            setLedger(fullLedger.length > 0 ? fullLedger : (d.ledger ?? []));
          } else {
            setLedger(d.ledger ?? []);
          }
        } else {
          throw new Error(
            res2.reason?.message ?? "Failed to load student data",
          );
        }
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setLoadMain(false);
        setRefreshing(false);
      }
    },
    [student.id],
  );

  // API 3
  const fetchHistory = useCallback(async () => {
    setLoadHistory(true);
    try {
      const d = await api(`/api/fees/parent/student/${student.id}/history`);
      setHistory(
        d.payments ?? d.data?.payments ?? d.data ?? (Array.isArray(d) ? d : []),
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoadHistory(false);
    }
  }, [student.id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  useEffect(() => {
    if (tab === "history" && history.length === 0 && !loadHistory)
      fetchHistory();
  }, [tab]);

  const toggleSelect = (id: number) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  // API 5
  const handlePreview = async () => {
    if (!selectedIds.length) {
      Alert.alert("Select fees", "Please select at least one pending fee.");
      return;
    }
    setPvLoading(true);
    try {
      const d = await api("/api/fees/payment/preview", {
        method: "POST",
        body: JSON.stringify({
          student_id: student.id,
          payment_type: "ledger_selection",
          ledger_ids: selectedIds,
        }),
      });
      setPreview(d.data ?? d.preview ?? d);
    } catch (e: any) {
      Alert.alert("Preview Failed", e.message);
    } finally {
      setPvLoading(false);
    }
  };

  // API 6 — shows OrderCreatedModal instead of Alert
const handleCreateOrder = async () => {
  setPreview(null);
  setPayLoading(true);
  try {
    const d = await api("/api/fees/payment/create-order", {
      method: "POST",
      body: JSON.stringify({
        student_id: student.id, 
        payment_type: "ledger_selection",
        ledger_ids: selectedIds, 
        payment_mode: "online", 
        remarks: "Parent online payment",
      }),
    });
    const order: OrderData = d.data ?? d;
    setOrderModal(order);
  } catch (e: any) { 
    Alert.alert("Order Failed", e.message); 
  } finally { 
    setPayLoading(false); 
  }
};

// Update the simulator trigger
{orderModal && (
  <OrderCreatedModal
    order={orderModal}
    onCancel={() => { 
      const o = orderModal; 
      setOrderModal(null); 
      handleVerify(o.order_id, "", "cancelled"); 
    }}
    onPayNow={() => { 
      const o = orderModal; 
      setOrderModal(null); 
      setSimModal({ orderId: o.order_id }); 
    }}
  />
)}

{/* Dev gateway simulator */}
{simModal && (
  <SimulateGatewayModal
    orderId={simModal.orderId}  // Now this will work
    onResult={(status, paymentId) => { 
      const orderId = simModal.orderId;  // Store before clearing
      setSimModal(null); 
      handleVerify(orderId, paymentId, status); 
    }}
  />
)}

  // API 7
// API 7 - Updated to handle different response structures
// In handleVerify
const handleVerify = async (orderId: string, paymentId: string, statusOverride?: string) => {
  console.log("🔍 Verifying:", { orderId, paymentId, statusOverride });
  
  try {
    if (statusOverride) {
      console.log("🎭 Using simulated status:", statusOverride);
      setResultStatus(statusOverride);
      // ... rest of code
      return;
    }
    
    const d = await api("/api/fees/payment/verify", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId, payment_id: paymentId }),
    });
    
    console.log("📦 Verify response:", JSON.stringify(d, null, 2));
    
    const status = d.data?.transaction_status ?? d.transaction_status ?? "pending";
    console.log("✅ Final status:", status);
    setResultStatus(status);
    // ... rest of code
  } catch (e: any) { 
    console.error("❌ Verify error:", e);
    Alert.alert("Verify Error", e.message); 
  }
};

  // Called when result modal is dismissed
  const handleResultDone = () => {
    setResultStatus(null);
    setSelectedIds([]);
    fetchAll(true);
    fetchHistory();
    setTab("history");
  };

  const pending = ledger.filter((l) => l.remaining_amount > 0);
  const paid = ledger.filter((l) => l.remaining_amount <= 0);

  return (
    <View style={sf.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Top bar */}
      <View style={sf.topBar}>
        <TouchableOpacity style={sf.iconBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={sf.topName} numberOfLines={1}>
            {studentName}
          </Text>
          {classDisplay ? (
            <Text style={sf.topSub}>Class {classDisplay}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={sf.iconBtn}
          onPress={() => {
            setRefreshing(true);
            fetchAll(true);
          }}
        >
          <Ionicons
            name="refresh-outline"
            size={18}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>
      </View>

      {loadMain ? (
        <View style={sf.centerBox}>
          <ActivityIndicator size="large" color={C.navy} />
          <Text style={sf.centerTxt}>Loading fees…</Text>
        </View>
      ) : !summary ? (
        <View style={sf.centerBox}>
          <Ionicons name="alert-circle-outline" size={32} color={C.danger} />
          <Text style={sf.centerTxt}>Failed to load data</Text>
          <TouchableOpacity onPress={() => fetchAll()} style={sf.retryBtn}>
            <Text style={sf.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Summary strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={sf.strip}
            contentContainerStyle={sf.stripInner}
          >
            <SummaryTile
              label="Outstanding"
              value={rupee(summary.outstanding_amount)}
              color={C.danger}
            />
            <SummaryTile
              label="Total Payable"
              value={rupee(summary.total_payable)}
              color={C.navy}
            />
            {summary.runtime_penalty_total > 0 && (
              <SummaryTile
                label="Late Penalty"
                value={rupee(summary.runtime_penalty_total)}
                color={C.amber}
              />
            )}
            {summary.waived_penalty_total > 0 && (
              <SummaryTile
                label="Waived"
                value={rupee(summary.waived_penalty_total)}
                color={C.success}
              />
            )}
          </ScrollView>

          {/* Tabs */}
          <View style={sf.tabBar}>
            {(["ledger", "history"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[sf.tab, tab === t && sf.tabOn]}
                onPress={() => setTab(t)}
              >
                <Ionicons
                  name={t === "ledger" ? "list-outline" : "time-outline"}
                  size={13}
                  color={tab === t ? C.navy : C.textMute}
                />
                <Text style={[sf.tabTxt, tab === t && sf.tabTxtOn]}>
                  {t === "ledger" ? "Fee Ledger" : "Payment History"}
                </Text>
                {t === "ledger" && pending.length > 0 && (
                  <View style={sf.tabBadge}>
                    <Text style={sf.tabBadgeTxt}>{pending.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {tab === "ledger" ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                sf.listPad,
                selectedIds.length > 0 && { paddingBottom: 108 },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchAll(true);
                  }}
                  colors={[C.navy]}
                  tintColor={C.navy}
                />
              }
            >
              {pending.length > 0 ? (
                <>
                  <View style={sf.secRow}>
                    <View style={[sf.secDot, { backgroundColor: C.danger }]} />
                    <Text style={sf.secTxt}>Pending</Text>
                    <View
                      style={[sf.secCount, { backgroundColor: C.dangerTint }]}
                    >
                      <Text style={[sf.secCountTxt, { color: C.danger }]}>
                        {pending.length}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                      onPress={() =>
                        selectedIds.length === pending.length
                          ? setSelectedIds([])
                          : setSelectedIds(pending.map((l) => l.id))
                      }
                    >
                      <Text style={sf.selAll}>
                        {selectedIds.length === pending.length
                          ? "Deselect All"
                          : "Select All"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {pending.map((item) => (
                    <PendingCard
                      key={item.id}
                      item={item}
                      selected={selectedIds.includes(item.id)}
                      onToggle={() => toggleSelect(item.id)}
                    />
                  ))}
                </>
              ) : (
                <View style={sf.allPaid}>
                  <View style={sf.allPaidIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={26}
                      color={C.success}
                    />
                  </View>
                  <Text style={sf.allPaidTxt}>All fees are cleared!</Text>
                  <Text style={sf.allPaidSub}>
                    No pending payments for this student.
                  </Text>
                </View>
              )}
              {paid.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <TouchableOpacity
                    style={sf.secRow}
                    onPress={() => setPaidOpen((o) => !o)}
                    activeOpacity={0.75}
                  >
                    <View style={[sf.secDot, { backgroundColor: C.success }]} />
                    <Text style={sf.secTxt}>Paid</Text>
                    <View
                      style={[sf.secCount, { backgroundColor: C.successTint }]}
                    >
                      <Text style={[sf.secCountTxt, { color: C.success }]}>
                        {paid.length}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Ionicons
                      name={paidOpen ? "chevron-up" : "chevron-down"}
                      size={13}
                      color={C.textMute}
                    />
                  </TouchableOpacity>
                  {paidOpen &&
                    paid.map((item) => <PaidCard key={item.id} item={item} />)}
                </View>
              )}
              {ledger.length === 0 && (
                <EmptyView
                  icon="document-text-outline"
                  title="No ledger records"
                  body="No fee records found for this student."
                />
              )}
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={sf.listPad}
              refreshControl={
                <RefreshControl
                  refreshing={loadHistory}
                  onRefresh={fetchHistory}
                  colors={[C.navy]}
                  tintColor={C.navy}
                />
              }
            >
              {loadHistory ? (
                <View style={sf.centerBox}>
                  <ActivityIndicator size="large" color={C.navy} />
                  <Text style={sf.centerTxt}>Loading history…</Text>
                </View>
              ) : history.length === 0 ? (
                <EmptyView
                  icon="time-outline"
                  title="No payment history"
                  body="Your payment records will appear here."
                />
              ) : (
                history.map((p) => (
                  <HistoryCard
                    key={p.id}
                    payment={p}
                    onViewReceipt={
                      p.receipt_no
                        ? () => setReceiptNo(p.receipt_no)
                        : undefined
                    }
                  />
                ))
              )}
            </ScrollView>
          )}

          {/* Pay bar */}
          {selectedIds.length > 0 && tab === "ledger" && (
            <View style={sf.payBar}>
              <View>
                <Text style={sf.payBarCount}>
                  {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""}{" "}
                  selected
                </Text>
                <Text style={sf.payBarHint}>Preview before you pay</Text>
              </View>
              <TouchableOpacity
                style={[sf.payBarBtn, previewLoading && { opacity: 0.6 }]}
                onPress={handlePreview}
                disabled={previewLoading}
                activeOpacity={0.85}
              >
                {previewLoading ? (
                  <ActivityIndicator size="small" color={C.white} />
                ) : (
                  <>
                    <Ionicons name="card-outline" size={14} color={C.white} />
                    <Text style={sf.payBarBtnTxt}>Review & Pay</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {preview && (
        <PreviewModal
          preview={preview}
          count={selectedIds.length}
          onClose={() => setPreview(null)}
          onConfirm={handleCreateOrder}
        />
      )}

      {payLoading && (
        <View style={sf.fullOverlay}>
          <ActivityIndicator size="large" color={C.white} />
          <Text style={sf.overlayTxt}>Creating order…</Text>
        </View>
      )}

      {/* Themed Order Created modal */}
      {orderModal && (
        <OrderCreatedModal
          order={orderModal}
          onCancel={() => {
            const o = orderModal;
            setOrderModal(null);
            handleVerify(o.order_id, "");
          }}
          onPayNow={() => {
            const o = orderModal;
            setOrderModal(null);
            setSimModal(o.order_id);
          }}
        />
      )}

      {/* Dev gateway simulator */}
      {simModal && (
        <SimulateGatewayModal
          orderId={simModal}
          onResult={(payId) => {
            const id = simModal;
            setSimModal(null);
            handleVerify(id, payId);
          }}
        />
      )}

      {/* Payment result */}
      {resultStatus && (
        <PaymentResultModal status={resultStatus} onDone={handleResultDone} />
      )}

      {receiptNo && (
        <ReceiptModal
          receiptNo={receiptNo}
          onClose={() => setReceiptNo(null)}
        />
      )}
    </View>
  );
}

// ── PendingCard ──
function PendingCard({
  item,
  selected,
  onToggle,
}: {
  item: LedgerFull;
  selected: boolean;
  onToggle: () => void;
}) {
  const partial = item.status === "partial";
  const total = parseFloat(item.total_amount);
  const paid = parseFloat(item.paid_amount);
  const hasOverdue = item.is_overdue && item.overdue_days > 0;
  return (
    <TouchableOpacity
      style={[pc.card, selected && pc.cardOn]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={pc.row1}>
        <View style={[pc.cb, selected && pc.cbOn]}>
          {selected && <Ionicons name="checkmark" size={11} color={C.white} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={pc.name}>{item.fee_name}</Text>
          <View style={pc.meta}>
            {item.due_date && (
              <Text style={[pc.due, hasOverdue && { color: C.danger }]}>
                Due {fmtDate(item.due_date)}
              </Text>
            )}
            {item.frequency && (
              <View style={pc.freqTag}>
                <Text style={pc.freqTxt}>
                  {item.frequency.replace(/_/g, " ")}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            pc.badge,
            { backgroundColor: partial ? C.amberTint : C.dangerTint },
          ]}
        >
          <Text style={[pc.badgeTxt, { color: partial ? C.amber : C.danger }]}>
            {partial ? "Partial" : "Pending"}
          </Text>
        </View>
      </View>
      <View style={pc.chips}>
        <AmtChip label="Total" value={rupee(total)} />
        <AmtChip label="Paid" value={rupee(paid)} green />
        <AmtChip label="Remaining" value={rupee(item.remaining_amount)} red />
      </View>
      {hasOverdue && (
        <View style={pc.overdueBar}>
          <Ionicons name="alert-circle-outline" size={12} color={C.danger} />
          <Text style={pc.overdueTxt}>
            {item.overdue_days}d overdue
            {item.final_penalty > 0
              ? ` · Penalty ${rupee(item.final_penalty)}`
              : item.runtime_penalty > 0
                ? ` · Penalty ${rupee(item.runtime_penalty)}`
                : ""}
          </Text>
        </View>
      )}
      {item.waived_penalty > 0 && (
        <View style={pc.waiverBar}>
          <Ionicons name="gift-outline" size={12} color={C.success} />
          <Text style={pc.waiverTxt}>
            Penalty waived: {rupee(item.waived_penalty)}
          </Text>
        </View>
      )}
      {hasOverdue && <PenaltyDrillDown ledgerId={item.id} />}
      {item.total_payable > 0 && (
        <View style={pc.payableRow}>
          <Text style={pc.payableLabel}>Payable now</Text>
          <Text style={pc.payableVal}>{rupee(item.total_payable)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
function AmtChip({
  label,
  value,
  green,
  red,
}: {
  label: string;
  value: string;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <View style={pc.chip}>
      <Text style={pc.chipLabel}>{label}</Text>
      <Text
        style={[
          pc.chipVal,
          green && { color: C.success },
          red && { color: C.danger },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
const pc = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 13,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardOn: { borderColor: C.navyLight, backgroundColor: C.navyFaint },
  row1: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  cb: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  cbOn: { backgroundColor: C.navy, borderColor: C.navy },
  name: {
    fontSize: 13,
    fontWeight: "700" as any,
    color: C.text,
    lineHeight: 18,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
    flexWrap: "wrap",
  },
  due: { fontSize: 11, color: C.textMute },
  freqTag: {
    backgroundColor: C.navyTint,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  freqTxt: {
    fontSize: 9,
    color: C.navyMid,
    fontWeight: "700" as any,
    textTransform: "capitalize",
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  badgeTxt: { fontSize: 10, fontWeight: "700" as any },
  chips: { flexDirection: "row", gap: 5, marginBottom: 6 },
  chip: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  chipLabel: {
    fontSize: 9,
    color: C.textMute,
    fontWeight: "600" as any,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  chipVal: { fontSize: 12, fontWeight: "700" as any, color: C.text },
  overdueBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.dangerTint,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 5,
  },
  overdueTxt: {
    fontSize: 11,
    color: C.danger,
    fontWeight: "600" as any,
    flex: 1,
  },
  waiverBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.successTint,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 5,
  },
  waiverTxt: { fontSize: 11, color: C.success, fontWeight: "600" as any },
  payableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 7,
    backgroundColor: C.navyFaint,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.navyTint,
  },
  payableLabel: { fontSize: 12, color: C.navyLight, fontWeight: "600" as any },
  payableVal: { fontSize: 15, fontWeight: "800" as any, color: C.navy },
});

// ── PaidCard ──
function PaidCard({ item }: { item: LedgerFull }) {
  return (
    <View style={padc.card}>
      <View style={padc.check}>
        <Ionicons name="checkmark" size={11} color={C.success} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={padc.name}>{item.fee_name}</Text>
        {item.due_date && (
          <Text style={padc.date}>Due {fmtDate(item.due_date)}</Text>
        )}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={padc.amt}>{rupee(parseFloat(item.total_amount))}</Text>
        <View style={padc.tag}>
          <Text style={padc.tagTxt}>Paid</Text>
        </View>
      </View>
    </View>
  );
}
const padc = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 11,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.successTint,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 13, fontWeight: "600" as any, color: C.textMid },
  date: { fontSize: 10, color: C.textMute, marginTop: 1 },
  amt: { fontSize: 13, fontWeight: "700" as any, color: C.textMid },
  tag: {
    backgroundColor: C.successTint,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 3,
  },
  tagTxt: { fontSize: 9, fontWeight: "700" as any, color: C.success },
});

// ── HistoryCard ──
function HistoryCard({
  payment,
  onViewReceipt,
}: {
  payment: PaymentRecord;
  onViewReceipt?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = statusCfg(payment.transaction_status);
  const total = parseFloat(payment.grand_total);
  const penalty = parseFloat(payment.total_penalty ?? "0");
  const method = gwMethod(payment.gateway_response);
  const cfId = gwCfId(payment.gateway_response);
  const gItems = gwItems(payment.gateway_response);
  return (
    <View style={hc.card}>
      <TouchableOpacity
        style={hc.top}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <View style={[hc.icon, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={17} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={hc.amt}>{rupee(total)}</Text>
          <Text style={hc.date}>
            {fmtDT(payment.paid_at ?? payment.created_at)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 5 }}>
          <View style={[hc.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[hc.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={12}
            color={C.textMute}
          />
        </View>
      </TouchableOpacity>
      <View style={hc.metaRow}>
        {method && <MetaChip icon="phone-portrait-outline" label={method} />}
        {payment.payment_mode && (
          <MetaChip
            icon="card-outline"
            label={payment.payment_mode.toUpperCase()}
          />
        )}
        {payment.gateway_order_id && (
          <MetaChip icon="receipt-outline" label={payment.gateway_order_id} />
        )}
      </View>
      {open && (
        <View style={hc.expanded}>
          {gItems.length > 0 ? (
            <>
              <Text style={hc.expandedTitle}>ITEMS PAID</Text>
              {gItems.map((it: any, i: number) => (
                <View key={i} style={hc.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={hc.itemName}>{it.fee_name}</Text>
                    <Text style={hc.itemDate}>Due {fmtDate(it.due_date)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={hc.itemAmt}>{rupee(it.applied_amount)}</Text>
                    {(it.penalty_amount ?? 0) > 0 && (
                      <Text style={hc.itemPenalty}>
                        +{rupee(it.penalty_amount)} penalty
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <Text style={hc.noItems}>Item details embedded in receipt</Text>
          )}
          <View style={hc.totals}>
            <View style={hc.totRow}>
              <Text style={hc.totLabel}>Base Amount</Text>
              <Text style={hc.totVal}>{rupee(payment.total_amount)}</Text>
            </View>
            {penalty > 0 && (
              <View style={hc.totRow}>
                <Text style={[hc.totLabel, { color: C.amber }]}>
                  Late Penalty
                </Text>
                <Text style={[hc.totVal, { color: C.amber }]}>
                  +{rupee(penalty)}
                </Text>
              </View>
            )}
            <View style={[hc.totRow, hc.grandRow]}>
              <Text style={hc.grandLabel}>Grand Total</Text>
              <Text style={hc.grandVal}>{rupee(total)}</Text>
            </View>
          </View>
          {cfId ? <Text style={hc.cfId}>CF Payment ID: {cfId}</Text> : null}
        </View>
      )}
      {payment.receipt_no && payment.transaction_status === "success" && (
        <TouchableOpacity
          style={hc.receiptBtn}
          onPress={onViewReceipt}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt-outline" size={13} color={C.navy} />
          <Text style={hc.receiptTxt}>View & Download Receipt</Text>
          <Ionicons
            name="chevron-forward"
            size={12}
            color={C.navy}
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
function MetaChip({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={hc.chip}>
      <Ionicons name={icon} size={10} color={C.textMute} />
      <Text style={hc.chipTxt} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
const hc = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 13,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: C.border,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 8 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  amt: { fontSize: 15, fontWeight: "800" as any, color: C.text },
  date: { fontSize: 11, color: C.textMute, marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 10, fontWeight: "700" as any },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.bg,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipTxt: { fontSize: 10, color: C.textMute, maxWidth: SW * 0.4 },
  expanded: {
    backgroundColor: C.bg,
    borderRadius: 9,
    padding: 11,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  expandedTitle: {
    fontSize: 9,
    fontWeight: "700" as any,
    color: C.textMute,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  noItems: {
    fontSize: 11,
    color: C.textMute,
    fontStyle: "italic",
    paddingVertical: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  itemName: { fontSize: 13, fontWeight: "600" as any, color: C.text },
  itemDate: { fontSize: 10, color: C.textMute, marginTop: 2 },
  itemAmt: { fontSize: 13, fontWeight: "700" as any, color: C.text },
  itemPenalty: { fontSize: 10, color: C.amber, marginTop: 2 },
  totals: { marginTop: 8 },
  totRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totLabel: { fontSize: 12, color: C.textMute },
  totVal: { fontSize: 12, fontWeight: "600" as any, color: C.text },
  grandRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 4,
    paddingTop: 7,
  },
  grandLabel: { fontSize: 13, fontWeight: "700" as any, color: C.text },
  grandVal: { fontSize: 14, fontWeight: "800" as any, color: C.navy },
  cfId: {
    fontSize: 10,
    color: C.textMute,
    marginTop: 6,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  receiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    backgroundColor: C.navyFaint,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: C.navyTint,
  },
  receiptTxt: {
    fontSize: 12,
    fontWeight: "700" as any,
    color: C.navy,
    flex: 1,
  },
});

// ── StudentFeesScreen shared helpers ──
function SummaryTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={sf.tile}>
      <Text style={sf.tileLabel}>{label}</Text>
      <Text style={[sf.tileVal, { color }]}>{value}</Text>
    </View>
  );
}
function EmptyView({
  icon,
  title,
  body,
}: {
  icon: IconName;
  title: string;
  body: string;
}) {
  return (
    <View style={sf.empty}>
      <View style={sf.emptyIcon}>
        <Ionicons name={icon} size={26} color={C.navy} />
      </View>
      <Text style={sf.emptyTitle}>{title}</Text>
      <Text style={sf.emptySub}>{body}</Text>
    </View>
  );
}
const sf = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: {
    backgroundColor: C.navy,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topName: { fontSize: 16, fontWeight: "700" as any, color: C.white },
  topSub: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  centerTxt: { fontSize: 13, color: C.textMute },
  retryBtn: {
    backgroundColor: C.navyTint,
    borderRadius: 9,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 4,
  },
  retryTxt: { fontSize: 13, fontWeight: "700" as any, color: C.navy },
  strip: {
    backgroundColor: C.card,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  stripInner: { paddingHorizontal: 6, paddingVertical: 4, gap: 2 },
  tile: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    minWidth: 110,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: "700" as any,
    color: C.textMute,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  tileVal: { fontSize: 14, fontWeight: "800" as any, letterSpacing: -0.2 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabOn: { borderBottomColor: C.navy },
  tabTxt: { fontSize: 13, fontWeight: "600" as any, color: C.textMute },
  tabTxtOn: { color: C.navy, fontWeight: "700" as any },
  tabBadge: {
    backgroundColor: C.dangerTint,
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeTxt: { fontSize: 9, fontWeight: "800" as any, color: C.danger },
  listPad: { paddingHorizontal: 13, paddingVertical: 14, paddingBottom: 40 },
  secRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
    paddingVertical: 2,
  },
  secDot: { width: 7, height: 7, borderRadius: 4 },
  secTxt: { fontSize: 12, fontWeight: "700" as any, color: C.textMid },
  secCount: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  secCountTxt: { fontSize: 10, fontWeight: "700" as any },
  selAll: { fontSize: 12, fontWeight: "600" as any, color: C.navy },
  allPaid: { alignItems: "center", paddingVertical: 28, gap: 6 },
  allPaidIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.successTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  allPaidTxt: { fontSize: 14, fontWeight: "700" as any, color: C.success },
  allPaidSub: { fontSize: 12, color: C.textMute },
  payBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    elevation: 14,
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 12,
  },
  payBarCount: { fontSize: 14, fontWeight: "700" as any, color: C.text },
  payBarHint: { fontSize: 11, color: C.textMute, marginTop: 1 },
  payBarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.navy,
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  payBarBtnTxt: { fontSize: 13, fontWeight: "700" as any, color: C.white },
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,20,60,0.78)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    zIndex: 99,
  },
  overlayTxt: { color: C.white, fontSize: 14, fontWeight: "600" as any },
  empty: {
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.navyTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700" as any, color: C.text },
  emptySub: {
    fontSize: 13,
    color: C.textMute,
    textAlign: "center",
    lineHeight: 20,
  },
});

// ════════════════════════════════════════════════════════════
// HOME SCREEN — API 1
// ════════════════════════════════════════════════════════════
export default function FeesScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [simModal, setSimModal] = useState<{ orderId: string } | null>(null);

  const fetchStudents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await api("/api/fees/parent/students");
      const raw: any[] = d.students ?? d.data ?? (Array.isArray(d) ? d : []);
      setStudents(
        raw.map((s) => ({
          id: s.id,
          student_name:
            s.student_name ??
            `${s.student_firstname ?? ""} ${s.student_lastname ?? ""}`.trim(),
          class_display:
            s.class_display ??
            (s.class_name && s.section_name
              ? `${s.class_name} – ${s.section_name}`
              : (s.class_name ?? "")),
          class_name: s.class_name,
          section_name: s.section_name,
          roll_no: s.roll_no,
        })),
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  if (selected) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <StudentFeesScreen
          student={selected}
          onBack={() => setSelected(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={hs.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <View style={hs.header}>
        <TouchableOpacity style={hs.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={hs.title}>Fee Management</Text>
          <Text style={hs.subtitle}>View & pay student fees</Text>
        </View>
        <TouchableOpacity
          style={hs.refreshBtn}
          onPress={() => {
            setRefreshing(true);
            fetchStudents(true);
          }}
        >
          <Ionicons
            name="refresh-outline"
            size={18}
            color="rgba(255,255,255,0.75)"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={hs.loaderBox}>
          <ActivityIndicator size="large" color={C.navy} />
          <Text style={hs.loaderTxt}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={hs.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchStudents(true);
              }}
              colors={[C.navy]}
              tintColor={C.navy}
            />
          }
        >
          {students.length === 0 ? (
            <View style={hs.emptyBox}>
              <View style={hs.emptyIconWrap}>
                <Ionicons name="people-outline" size={36} color={C.navy} />
              </View>
              <Text style={hs.emptyTitle}>No Students Found</Text>
              <Text style={hs.emptySub}>
                No students are linked to your account. Contact the school
                administrator.
              </Text>
            </View>
          ) : (
            <>
              <Text style={hs.sectionLabel}>LINKED STUDENTS</Text>
              {students.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={hs.studentCard}
                  onPress={() => setSelected(s)}
                  activeOpacity={0.8}
                >
                  <View style={hs.avatar}>
                    <Text style={hs.avatarTxt}>{initials(s.student_name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={hs.studentName}>{s.student_name}</Text>
                    {s.class_display && (
                      <Text style={hs.studentClass}>
                        Class {s.class_display}
                      </Text>
                    )}
                    {s.roll_no && (
                      <Text style={hs.studentRoll}>Roll No. {s.roll_no}</Text>
                    )}
                  </View>
                  <View style={hs.arrow}>
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={C.textMute}
                    />
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={[hs.sectionLabel, { marginTop: 26 }]}>
                HOW IT WORKS
              </Text>
              {[
                {
                  icon: "person-outline" as IconName,
                  title: "Select a Student",
                  body: "Tap any student card to view their fee details.",
                },
                {
                  icon: "checkbox-outline" as IconName,
                  title: "Choose Fee Items",
                  body: "Select the pending fees you want to pay.",
                },
                {
                  icon: "eye-outline" as IconName,
                  title: "Preview Total",
                  body: "We calculate the exact amount including penalties and waivers.",
                },
                {
                  icon: "card-outline" as IconName,
                  title: "Pay & Get Receipt",
                  body: "Pay via Cashfree and download your PDF receipt instantly.",
                },
              ].map((step, i) => (
                <View key={i} style={hs.stepCard}>
                  <View style={hs.stepNum}>
                    <Ionicons name={step.icon} size={14} color={C.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={hs.stepTitle}>{step.title}</Text>
                    <Text style={hs.stepBody}>{step.body}</Text>
                  </View>
                </View>
              ))}

              <View style={hs.yearNote}>
                <Ionicons name="calendar-outline" size={13} color={C.navy} />
                <Text style={hs.yearNoteTxt}>
                  Academic Year ID: {YEAR_ID} · Change this in the app settings.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const hs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.navy,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "800" as any, color: C.white },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loaderTxt: { fontSize: 13, color: C.textMute },
  content: { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700" as any,
    color: C.textMute,
    letterSpacing: 1.2,
    marginBottom: 11,
  },
  studentCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 15, fontWeight: "800" as any, color: C.white },
  studentName: { fontSize: 15, fontWeight: "700" as any, color: C.text },
  studentClass: { fontSize: 12, color: C.textMute, marginTop: 2 },
  studentRoll: { fontSize: 11, color: C.textMute },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCard: {
    backgroundColor: C.card,
    borderRadius: 11,
    padding: 13,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    borderWidth: 1,
    borderColor: C.border,
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700" as any,
    color: C.text,
    marginBottom: 2,
  },
  stepBody: { fontSize: 12, color: C.textMute, lineHeight: 17 },
  yearNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.navyFaint,
    borderRadius: 9,
    padding: 10,
    marginTop: 18,
    borderWidth: 1,
    borderColor: C.navyTint,
  },
  yearNoteTxt: { fontSize: 11, color: C.navyMid, flex: 1, lineHeight: 15 },
  emptyBox: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.navyTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" as any, color: C.text },
  emptySub: {
    fontSize: 13,
    color: C.textMute,
    textAlign: "center",
    lineHeight: 20,
  },
});
