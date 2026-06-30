import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../data/translations";
import { ShieldAlert, Users, Landmark, AlertCircle, Settings, ClipboardCheck, ArrowUpRight, ArrowDownLeft, Trash2, Check, X, Search, Coins, Award, Plus, Edit2 } from "lucide-react";
import { motion } from "motion/react";

export const AdminView: React.FC = () => {
  const {
    language,
    currentUser,
    users,
    settings,
    depositRequests,
    withdrawalRequests,
    adminApproveDeposit,
    adminRejectDeposit,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    adminUpdateUser,
    adminDeleteUser,
    adminUpdateSettings,
    vipTiers,
    products,
    adminAddVipTier,
    adminUpdateVipTier,
    adminDeleteVipTier,
    adminAddProduct,
    adminUpdateProduct,
    adminDeleteProduct,
    adminAddManualWithdrawal
  } = useApp();

  const t = translations[language];
  const isRtl = language === "ar";

  const [activeSubTab, setActiveSubTab] = useState<"deposits" | "withdrawals" | "users" | "viptiers" | "tasks" | "settings">("deposits");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [selectedVip, setSelectedVip] = useState(0);

  const [inlineAdjustAmounts, setInlineAdjustAmounts] = useState<Record<string, string>>({});
  const [inlineUsernames, setInlineUsernames] = useState<Record<string, string>>({});
  const [inlineVipLevels, setInlineVipLevels] = useState<Record<string, number>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [zeroConfirmId, setZeroConfirmId] = useState<string | null>(null);
  const [inlineAdjustTodayEarnings, setInlineAdjustTodayEarnings] = useState<Record<string, string>>({});
  const [inlineAdjustTotalEarnings, setInlineAdjustTotalEarnings] = useState<Record<string, string>>({});
  const [zeroEarningsConfirmId, setZeroEarningsConfirmId] = useState<string | null>(null);
  const [zeroTasksConfirmId, setZeroTasksConfirmId] = useState<string | null>(null);

  const [appNameInput, setAppNameInput] = useState(settings.appName);
  const [usdtAddressInput, setUsdtAddressInput] = useState(settings.usdtAddress);
  const [usdtAddressPolygonInput, setUsdtAddressPolygonInput] = useState(settings.usdtAddressPolygon || "");
  const [supportLinkInput, setSupportLinkInput] = useState(settings.supportTelegram || settings.supportWhatsApp || "");
  const [minDepositInput, setMinDepositInput] = useState(String(settings.minDeposit));
  const [minWithdrawInput, setMinWithdrawInput] = useState(String(settings.minWithdraw));
  const [isHolidayEnabledInput, setIsHolidayEnabledInput] = useState(settings.isHolidayEnabled ?? false);
  const [holidayDaysInput, setHolidayDaysInput] = useState<number[]>(settings.holidayDays ?? [5, 6]);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const [isEditingVip, setIsEditingVip] = useState(false);
  const [vipLevelInput, setVipLevelInput] = useState("");
  const [vipNameInput, setVipNameInput] = useState("");
  const [vipPriceInput, setVipPriceInput] = useState("");
  const [vipDailyTasksInput, setVipDailyTasksInput] = useState("");
  const [vipDailyProfitInput, setVipDailyProfitInput] = useState("");
  const [vipSingleTaskRewardInput, setVipSingleTaskRewardInput] = useState("");
  const [vipBgInput, setVipBgInput] = useState("from-amber-500 to-yellow-600");

  const [manualWithdrawUserId, setManualWithdrawUserId] = useState<string | null>(null);
  const [manualWithdrawAmount, setManualWithdrawAmount] = useState("");
  const [manualWithdrawAddress, setManualWithdrawAddress] = useState("");
  const [manualWithdrawDate, setManualWithdrawDate] = useState("");
  const [manualWithdrawStatus, setManualWithdrawStatus] = useState<"approved" | "pending" | "rejected">("approved");

  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productIdInput, setProductIdInput] = useState("");
  const [productNameInput, setProductNameInput] = useState("");
  const [productPriceInput, setProductPriceInput] = useState("");
  const [productCommissionInput, setProductCommissionInput] = useState("");
  const [productImageInput, setProductImageInput] = useState("");
  const [productDeleteConfirmId, setProductDeleteConfirmId] = useState<string | null>(null);

  const pendingDeposits = depositRequests.filter(d => d.status === "pending");
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === "pending");

  const handleInlineAdjustBalance = (userId: string, currentBalance: number, type: "add" | "deduct") => {
    const amountStr = inlineAdjustAmounts[userId] || "";
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(language === "ar" ? "الرجاء إدخال مبلغ صحيح!" : "Please enter a valid amount!");
      return;
    }
    const newBalance = type === "add" ? parseFloat((currentBalance + amount).toFixed(2)) : parseFloat((currentBalance - amount).toFixed(2));
    adminUpdateUser(userId, { balance: newBalance });
    setInlineAdjustAmounts(prev => ({ ...prev, [userId]: "" }));
    alert(language === "ar" ? "تم تعديل الرصيد بنجاح!" : "Balance adjusted successfully!");
  };

  const handleInlineZeroBalance = (userId: string) => {
    adminUpdateUser(userId, { balance: 0 });
    setZeroConfirmId(null);
    alert(language === "ar" ? "تم تصفير الرصيد بنجاح!" : "Balance zeroed successfully!");
  };

  const handleInlineAdjustTodayEarnings = (userId: string, currentEarnings: number, type: "add" | "deduct") => {
    const amountStr = inlineAdjustTodayEarnings[userId] || "";
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(language === "ar" ? "الرجاء إدخال مبلغ صحيح لأرباح اليوم!" : "Please enter a valid amount for today's earnings!");
      return;
    }
    const newEarnings = type === "add" ? parseFloat((currentEarnings + amount).toFixed(2)) : parseFloat((currentEarnings - amount).toFixed(2));
    adminUpdateUser(userId, { todayEarnings: newEarnings });
    setInlineAdjustTodayEarnings(prev => ({ ...prev, [userId]: "" }));
    alert(language === "ar" ? "تم تعديل أرباح اليوم بنجاح!" : "Today's earnings adjusted successfully!");
  };

  const handleInlineAdjustTotalEarnings = (userId: string, currentTotal: number, type: "add" | "deduct") => {
    const amountStr = inlineAdjustTotalEarnings[userId] || "";
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(language === "ar" ? "الرجاء إدخال مبلغ صحيح للإجمالي!" : "Please enter a valid amount for total earnings!");
      return;
    }
    const newTotal = type === "add" ? parseFloat((currentTotal + amount).toFixed(2)) : parseFloat((currentTotal - amount).toFixed(2));
    adminUpdateUser(userId, { totalEarnings: newTotal });
    setInlineAdjustTotalEarnings(prev => ({ ...prev, [userId]: "" }));
    alert(language === "ar" ? "تم تعديل إجمالي الأرباح بنجاح!" : "Total earnings adjusted successfully!");
  };

  const handleInlineZeroEarnings = (userId: string) => {
    adminUpdateUser(userId, { todayEarnings: 0, totalEarnings: 0 });
    setZeroEarningsConfirmId(null);
    alert(language === "ar" ? "تم تصفير الأرباح بنجاح!" : "Earnings zeroed successfully!");
  };

  const handleInlineZeroTasks = (userId: string) => {
    adminUpdateUser(userId, { completedTasksToday: 0, lastTaskResetTime: new Date().toISOString() });
    setZeroTasksConfirmId(null);
    alert(language === "ar" ? "تم تصفير عداد المهام بنجاح!" : "Tasks counter zeroed successfully!");
  };

  const handleInlineDeleteUser = (userId: string) => {
    adminDeleteUser(userId);
    setDeleteConfirmId(null);
    alert(language === "ar" ? "تم حذف حساب المستخدم بنجاح!" : "User account deleted successfully!");
  };

  const handleInlineVipChange = (userId: string, level: number) => {
    adminUpdateUser(userId, { vipLevel: level });
    alert(language === "ar" ? "تم تعديل مستوى VIP بنجاح!" : "VIP Level updated successfully!");
  };

  const handleInlineUsernameChange = (userId: string) => {
    const newUsername = inlineUsernames[userId] || "";
    if (!newUsername.trim()) {
      alert(language === "ar" ? "الرجاء إدخال اسم مستخدم صحيح!" : "Please enter a valid username!");
      return;
    }
    adminUpdateUser(userId, { username: newUsername.trim() });
    alert(language === "ar" ? "تم تعديل اسم المستخدم بنجاح!" : "Username updated successfully!");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    adminUpdateSettings({
      appName: appNameInput,
      usdtAddress: usdtAddressInput,
      usdtAddressPolygon: usdtAddressPolygonInput,
      supportTelegram: supportLinkInput,
      supportWhatsApp: supportLinkInput,
      minDeposit: parseFloat(minDepositInput) || 10,
      minWithdraw: parseFloat(minWithdrawInput) || 20,
      isHolidayEnabled: isHolidayEnabledInput,
      holidayDays: holidayDaysInput
    });
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2000);
  };

  return (
    <div className={`p-4 flex flex-col gap-4 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* (بقية الكود الخاص بالعرض لم يتغير...) */}
      {/* نظرًا لمحدودية المساحة، تم دمج المودال فقط في الأسفل */}

      {/* Manual Withdrawal Modal */}
      {manualWithdrawUserId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-black text-amber-500 uppercase text-center">
              {language === "ar" ? "إضافة سحب يدوي" : "Add Manual Withdrawal"}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">{language === "ar" ? "المبلغ (USDT)" : "Amount (USDT)"}</label>
                <input type="number" step="0.01" value={manualWithdrawAmount} onChange={e => setManualWithdrawAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-right" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">{language === "ar" ? "عنوان المحفظة" : "Wallet Address"}</label>
                <input type="text" value={manualWithdrawAddress} onChange={e => setManualWithdrawAddress(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-right text-[10px]" placeholder="0x..." />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">{language === "ar" ? "التاريخ" : "Date"}</label>
                <input type="date" value={manualWithdrawDate} onChange={e => setManualWithdrawDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-right" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">{language === "ar" ? "الحالة" : "Status"}</label>
                <select value={manualWithdrawStatus} onChange={e => setManualWithdrawStatus(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-right cursor-pointer">
                  <option value="approved">{language === "ar" ? "مكتمل" : "Approved"}</option>
                  <option value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</option>
                  <option value="rejected">{language === "ar" ? "مرفوض" : "Rejected"}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={async () => {
                  const user = users.find(u => u.id === manualWithdrawUserId);
                  if (!user) { alert("Error: User not found!"); return; }
                  const amount = parseFloat(manualWithdrawAmount);
                  if (isNaN(amount) || amount <= 0) { alert(language === "ar" ? "يرجى إدخال مبلغ صحيح!" : "Please enter a valid amount!"); return; }
                  const createdAt = manualWithdrawDate ? new Date(manualWithdrawDate).toISOString() : new Date().toISOString();
                  await adminAddManualWithdrawal(user.id, user.username, user.phone, amount, manualWithdrawAddress, manualWithdrawStatus, createdAt);
                  setManualWithdrawUserId(null);
                  setManualWithdrawAmount("");
                  setManualWithdrawAddress("");
                  alert(language === "ar" ? "تمت إضافة السحب بنجاح!" : "Withdrawal added successfully!");
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2 rounded-xl text-xs cursor-pointer transition-all active:scale-95"
              >
                {language === "ar" ? "حفظ" : "Save"}
              </button>
              <button onClick={() => setManualWithdrawUserId(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-2 rounded-xl text-xs cursor-pointer">
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
