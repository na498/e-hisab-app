import React, { useState } from 'react';
import { Printer, X, Plus, Trash2, FileText, Receipt } from 'lucide-react';
import { ShopInfo, Transaction, MemoItem } from '../types';
import { toBengaliNumber, formatSimpleDate } from '../utils/formatters';
import { handlePrint } from '../utils/printHelper';

interface CashMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopInfo: ShopInfo;
  transaction?: Transaction | null;
  useBengaliDigits?: boolean;
}

export function CashMemoModal({
  isOpen,
  onClose,
  shopInfo,
  transaction,
  useBengaliDigits = true,
}: CashMemoModalProps) {
  if (!isOpen) return null;

  // Compute initial memo date without time
  const getInitialDate = () => {
    if (transaction?.date) {
      return formatSimpleDate(transaction.date, useBengaliDigits);
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return formatSimpleDate(`${yyyy}-${mm}-${dd}`, useBengaliDigits);
  };

  // Initial memo state
  const [memoNumber, setMemoNumber] = useState<string>(
    transaction ? transaction.id.replace('tx_', '').substring(0, 8).toUpperCase() : `${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [memoDate, setMemoDate] = useState<string>(getInitialDate());
  const [paymentMethod, setPaymentMethod] = useState<string>(
    transaction?.paymentMethod || 'ক্যাশ (Cash)'
  );
  const [customerName, setCustomerName] = useState<string>(
    transaction?.customerName || 'সম্মানিত গ্রাহক'
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    transaction?.customerPhone || '০১৭০০-০০০০০০'
  );
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    transaction?.deliveryAddress || shopInfo.address || 'উজিরপুর বাজার, চাম্পাফুল'
  );
  const [district, setDistrict] = useState<string>(
    transaction?.district || 'সাতক্ষীরা'
  );
  const [deliveryCharge, setDeliveryCharge] = useState<number>(
    transaction?.deliveryCharge || 0
  );

  // Items list
  const [items, setItems] = useState<MemoItem[]>(
    transaction?.items && transaction.items.length > 0
      ? transaction.items
      : [
          {
            productName: transaction ? `${transaction.category} - ${transaction.description}` : 'ফটোস্ট্যাট ও কালার প্রিন্ট',
            quantity: 1,
            unit: 'টি',
            price: transaction ? transaction.amount : 100,
          },
        ]
  );

  // Add Item
  const handleAddItem = () => {
    setItems([
      ...items,
      { productName: 'নতুন কাজ / পণ্য', quantity: 1, unit: 'টি', price: 50 },
    ]);
  };

  // Update Item
  const handleUpdateItem = (index: number, field: keyof MemoItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Total calculation
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = subtotal + Number(deliveryCharge || 0);

  // Site config fallback structure
  const siteConfig = {
    storeName: shopInfo.shopName || 'ই-সেন্টার',
    storeSlogan: shopInfo.storeSlogan || 'এক ছাদের নিচে সবল ডিজিটাল সেবার বিশ্বস্ত ঠিকানা',
    storeLogo: shopInfo.storeLogo || '',
    contactOffice: shopInfo.contactOffice || shopInfo.address || 'উজিরপুর বাজার, চাম্পাফুল, কালিগঞ্জ, সাতক্ষীরা।',
    contactPhone: shopInfo.contactPhone || shopInfo.phone || '০১৮১০-৯৫৭৯৫৯',
    contactEmail: shopInfo.contactEmail || 'masumbillah10032002@gmail.com',
  };

  const orderDetails = {
    id: memoNumber,
    createdAt: memoDate,
    paymentMethod,
    customerName,
    customerPhone,
    deliveryAddress,
    district,
    items,
    totalAmount,
    deliveryCharge,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 print:m-0 print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white">ক্যাশ মেমো ও ইনভয়েস প্রিন্ট</h2>
              <p className="text-xs text-slate-400">মেমো বা ৮০মিমি থার্মাল রসিদ সিলেক্ট করে প্রিন্ট করুন</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 80mm POS Thermal Print Button */}
            <button
              onClick={() => handlePrint('printable-thermal-memo', `POS Invoice #${orderDetails.id}`)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
              id="print-thermal-btn"
            >
              <Receipt className="w-4 h-4" />
              <span>থার্মাল প্রিন্ট (80mm)</span>
            </button>

            {/* Standard Memo Print Button */}
            <button
              onClick={() => handlePrint('printable-memo', `Cash Memo #${orderDetails.id}`)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
              id="print-memo-btn"
            >
              <Printer className="w-4 h-4" />
              <span>মেমো প্রিন্ট করুন</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editable Form Controls (Hidden on Print) */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs print:hidden">
          <div>
            <label className="block font-bold text-slate-700 mb-1">গ্রাহকের নাম</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">পেমেন্ট পদ্ধতি</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="ক্যাশ (Cash)">ক্যাশ (Cash)</option>
              <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
              <option value="নগদ (Nagad)">নগদ (Nagad)</option>
              <option value="বকেয়া (Due)">বকেয়া (Due)</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">ঠিকানা / এলাকা</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">জেলা / থানা</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">ডেলিভারি / অন্যান্য চার্জ (৳)</label>
            <input
              type="number"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
            />
          </div>
        </div>

        {/* Item Editor (Hidden on Print) */}
        <div className="p-6 bg-slate-100 border-b border-slate-200 print:hidden">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-800 text-sm">আইটেম তালিকা (পণ্যের বিবরণ)</h4>
            <button
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              আইটেম যোগ করুন
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-400 w-6 text-center">{idx + 1}.</span>
                <input
                  type="text"
                  placeholder="বিবরণ"
                  value={item.productName}
                  onChange={(e) => handleUpdateItem(idx, 'productName', e.target.value)}
                  className="flex-1 border border-slate-200 rounded p-1.5 text-xs"
                />
                <input
                  type="number"
                  placeholder="পরিমাণ"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                  className="w-16 border border-slate-200 rounded p-1.5 text-xs text-center"
                />
                <input
                  type="text"
                  placeholder="একক"
                  value={item.unit || 'টি'}
                  onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                  className="w-16 border border-slate-200 rounded p-1.5 text-xs text-center"
                />
                <input
                  type="number"
                  placeholder="মূল্য"
                  value={item.price}
                  onChange={(e) => handleUpdateItem(idx, 'price', Number(e.target.value))}
                  className="w-24 border border-slate-200 rounded p-1.5 text-xs text-right font-bold"
                />
                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PRINTABLE CASH MEMO AREA (Standard Memo) */}
        <div className="p-6 print:p-0">
          <div
            id="printable-memo"
            className="text-black bg-white p-6 border-4 border-double border-slate-800 rounded-xl space-y-6 max-w-2xl mx-auto font-sans relative overflow-hidden print:border-2 print:border-slate-800 print:max-w-none print:w-full print:p-8 print:shadow-none"
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-300 relative z-10 flex flex-col items-center justify-center">
              {siteConfig.storeLogo ? (
                <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 mx-auto mb-1.5 shadow-2xs">
                  <img src={siteConfig.storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                </div>
              ) : null}
              <h1 className="text-2xl font-black text-slate-950">{siteConfig.storeName || "ম্যাংগো লাভার"}</h1>
              <p className="text-xs font-bold text-slate-600">{siteConfig.storeSlogan || "শতভাগ খাঁটি ও নিরাপদ অর্গানিক ফুড শপ"}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">অফিস: {siteConfig.contactOffice || "Nowhata, Paba, Rajshahi"}</p>
              <p className="text-[10px] text-slate-500 font-semibold">
                মোবাইল: {siteConfig.contactPhone || "01301-636461"} | ইমেইল: {siteConfig.contactEmail || "info@mangolover.com"}
              </p>
            </div>

            <div className="text-center py-1">
              <span className="border-2 border-slate-950 px-3 py-1 text-xs font-black uppercase bg-slate-100 tracking-wider">
                ক্যাশ মেমো / CASH RECEIPT
              </span>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-slate-200">
              <div className="space-y-1">
                <p><span className="font-bold text-slate-500">মেমো নম্বর:</span> <strong className="font-sans text-slate-900">#ORD-{orderDetails.id}</strong></p>
                <p><span className="font-bold text-slate-500">তারিখ:</span> <strong className="text-slate-800">{orderDetails.createdAt}</strong></p>
                <p><span className="font-bold text-slate-500">পেমেন্ট পদ্ধতি:</span> <strong className="uppercase text-slate-800">{orderDetails.paymentMethod}</strong></p>
              </div>
              <div className="space-y-1 border-l border-slate-200 pl-4">
                <p><span className="font-bold text-slate-500">গ্রাহকের নাম:</span> <strong className="text-slate-900">{orderDetails.customerName}</strong></p>
                <p><span className="font-bold text-slate-500">মোবাইল:</span> <strong className="text-slate-900">{orderDetails.customerPhone}</strong></p>
                <p><span className="font-bold text-slate-500">ঠিকানা:</span> <strong className="text-slate-800">{orderDetails.deliveryAddress}, {orderDetails.district}</strong></p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 text-left bg-slate-100 font-bold">
                  <th className="py-2 px-1 text-slate-900">ক্রমিক</th>
                  <th className="py-2 px-1 text-slate-900">পণ্যের বিবরণ</th>
                  <th className="py-2 px-1 text-center text-slate-900">পরিমাণ</th>
                  <th className="py-2 px-1 text-right text-slate-900">একক মূল্য</th>
                  <th className="py-2 px-1 text-right text-slate-900">মোট মূল্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orderDetails.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-1 font-bold text-slate-500">{useBengaliDigits ? toBengaliNumber(idx + 1) : idx + 1}</td>
                    <td className="py-2 px-1 font-bold text-slate-900">{item.productName}</td>
                    <td className="py-2 px-1 text-center font-bold text-slate-800">
                      {useBengaliDigits ? toBengaliNumber(item.quantity) : item.quantity} {item.unit || 'টি'}
                    </td>
                    <td className="py-2 px-1 text-right font-bold text-slate-700">
                      ৳{useBengaliDigits ? toBengaliNumber(item.price) : item.price}
                    </td>
                    <td className="py-2 px-1 text-right font-black text-slate-900">
                      ৳{useBengaliDigits ? toBengaliNumber(item.price * item.quantity) : item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Calculation */}
            <div className="flex justify-end pt-2 border-t-2 border-slate-300">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between border-b pb-1">
                  <span className="font-bold text-slate-600">উপ-মোট (Subtotal):</span>
                  <span className="font-black text-slate-800">
                    ৳{useBengaliDigits ? toBengaliNumber(orderDetails.totalAmount - orderDetails.deliveryCharge) : orderDetails.totalAmount - orderDetails.deliveryCharge}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="font-bold text-slate-600">ডেলিভারি / সার্ভিস চার্জ:</span>
                  <span className="font-black text-slate-800">
                    ৳{useBengaliDigits ? toBengaliNumber(orderDetails.deliveryCharge) : orderDetails.deliveryCharge}
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-sm">
                  <span className="font-black text-slate-900">সর্বমোট প্রদেয়:</span>
                  <span className="font-black text-orange-600 border-b-2 border-slate-900">
                    ৳{useBengaliDigits ? toBengaliNumber(orderDetails.totalAmount) : orderDetails.totalAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs text-slate-800">
              <div><div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 font-bold">ক্রেতার স্বাক্ষর</div></div>
              <div><div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 font-bold">অনুমোদিত স্বাক্ষর</div></div>
            </div>
          </div>
        </div>

        {/* POS THERMAL INVOICE TEMPLATE (80mm) */}
        <div className="hidden">
          <div id="printable-thermal-memo" className="p-2 bg-white text-black font-sans text-xs">
            {/* Header */}
            <div className="header text-center pb-2 mb-2 border-b border-dashed border-black">
              {siteConfig.storeLogo ? (
                <img
                  src={siteConfig.storeLogo}
                  alt="logo"
                  className="logo"
                  style={{ maxWidth: '40px', height: 'auto', display: 'block', margin: '0 auto 2px auto' }}
                />
              ) : null}
              <h1 className="shop-name text-sm font-bold m-0">
                {siteConfig.storeName || "ম্যাংগো লাভার"}
              </h1>
              <p className="shop-meta text-[9px] m-0">
                {siteConfig.contactOffice || "Nowhata, Paba, Rajshahi"}
              </p>
              <p className="shop-meta text-[9px] m-0">
                ফোন: {siteConfig.contactPhone || "01301-636461"}
              </p>
            </div>

            {/* Customer & Invoice Info */}
            <div className="text-[9px] mb-1 pt-1 border-t border-dashed border-black space-y-1">
              <div className="flex justify-between">
                <span>ইনভয়েস: <b>#{orderDetails.id}</b></span>
                <span>তারিখ: {orderDetails.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span>গ্রাহক: {orderDetails.customerName}</span>
                <span>মোবাইল: {orderDetails.customerPhone}</span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse my-1 text-[10px]">
              <thead>
                <tr className="border-b border-black font-bold text-[9px]">
                  <th className="text-left py-1">বিবরণ</th>
                  <th className="text-center py-1 w-[15%]">সং</th>
                  <th className="text-right py-1 w-[20%]">দর</th>
                  <th className="text-right py-1 w-[20%]">মোট</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-dashed border-gray-300">
                    <td className="py-1 text-left align-top">{item.productName}</td>
                    <td className="py-1 text-center align-top">{useBengaliDigits ? toBengaliNumber(item.quantity) : item.quantity}</td>
                    <td className="py-1 text-right align-top">{useBengaliDigits ? toBengaliNumber(item.price) : item.price}</td>
                    <td className="py-1 text-right align-top">{useBengaliDigits ? toBengaliNumber(item.price * item.quantity) : item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-dashed border-black pt-1 mt-1 text-[10px]">
              <div className="flex justify-between mb-0.5">
                <span>সাব-টোটাল:</span>
                <span>৳{useBengaliDigits ? toBengaliNumber(orderDetails.totalAmount - orderDetails.deliveryCharge) : orderDetails.totalAmount - orderDetails.deliveryCharge}</span>
              </div>
              {orderDetails.deliveryCharge > 0 && (
                <div className="flex justify-between mb-0.5">
                  <span>ডেলিভারি চার্জ:</span>
                  <span>+৳{useBengaliDigits ? toBengaliNumber(orderDetails.deliveryCharge) : orderDetails.deliveryCharge}</span>
                </div>
              )}
              <div className="flex justify-between border-y border-dashed border-black py-1 font-bold text-xs my-1">
                <span>মোট বিল:</span>
                <span>৳{useBengaliDigits ? toBengaliNumber(orderDetails.totalAmount) : orderDetails.totalAmount}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-2 text-center text-[9px] border-t border-dotted border-gray-400 pt-1">
              <p className="m-0 font-medium">আমাদের থেকে সেবা নেওয়ার জন্য ধন্যবাদ।</p>
              <p className="text-[8px] text-gray-500 m-0">Sold by: {siteConfig.storeName}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
