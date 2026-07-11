import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../data/translations";
import { ShieldAlert, Users, Landmark, AlertCircle, Settings, ClipboardCheck, ArrowUpRight, ArrowDownLeft, Trash2, Check, X, Search, Coins, Award, Plus, Edit2, MessageSquare, Headphones, Send } from "lucide-react";
import { motion } from "motion/react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { SupportMessage } from "../../types";

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
    adminAddManualWithdrawal,
    
    // Support Context items
    supportChats,
    unreadSupportCountAdmin,
    adminSendSupportMessage,
    closeSupportChat,
    clearAdminUnreadSupport
  } = useApp();

  const t = translations[language];
  const isRtl = language === "ar";

  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<"deposits" | "withdrawals" | "users" | "viptiers" | "tasks" | "settings" | "support">("deposits");

  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Edit user variables
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [selectedVip, setSelectedVip] = useState(0);

  // User list inline input states
  const [inlineAdjustAmounts, setInlineAdjustAmounts] = useState<Record<string, string>>({});
  const [inlineUsernames, setInlineUsernames] = useState<Record<string, string>>({});
  const [inlineVipLevels, setInlineVipLevels] = useState<Record<string, number>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [zeroConfirmId, setZeroConfirmId] = useState<string | null>(null);
  const [inlineAdjustTodayEarnings, setInlineAdjustTodayEarnings] = useState<Record<string, string>>({});
  const [inlineAdjustTotalEarnings, setInlineAdjustTotalEarnings] = useState<Record<string, string>>({});
  const [zeroEarningsConfirmId, setZeroEarningsConfirmId] = useState<string | null>(null);
  const [zeroTasksConfirmId, setZeroTasksConfirmId] = useState<string | null>(null);

  // Settings variables
  const [appNameInput, setAppNameInput] = useState(settings.appName);
  const [usdtAddressInput, setUsdtAddressInput] = useState(settings.usdtAddress);
  const [usdtAddressPolygonInput, setUsdtAddressPolygonInput] = useState(settings.usdtAddressPolygon || "");
  const [supportLinkInput, setSupportLinkInput] = useState(settings.supportTelegram || settings.supportWhatsApp || "");
  const [minDepositInput, setMinDepositInput] = useState(String(settings.minDeposit));
  const [minWithdrawInput, setMinWithdrawInput] = useState(String(settings.minWithdraw));
  const [isHolidayEnabledInput, setIsHolidayEnabledInput] = useState(settings.isHolidayEnabled ?? false);
  const [holidayDaysInput, setHolidayDaysInput] = useState<number[]>(settings.holidayDays ?? [5, 6]);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // VIP Tiers states
  const [isEditingVip, setIsEditingVip] = useState(false);
  const [vipLevelInput, setVipLevelInput] = useState("");
  const [vipNameInput, setVipNameInput] = useState("");
  const [vipPriceInput, setVipPriceInput] = useState("");
  const [vipDailyTasksInput, setVipDailyTasksInput] = useState("");
  const [vipDailyProfitInput, setVipDailyProfitInput] = useState("");
  const [vipSingleTaskRewardInput, setVipSingleTaskRewardInput] = useState("");
  const [vipBgInput, setVipBgInput] = useState("from-amber-500 to-yellow-600");

  // Manual Withdrawal states
  const [manualWithdrawUserId, setManualWithdrawUserId] = useState<string | null>(null);
  const [manualWithdrawAmount, setManualWithdrawAmount] = useState("");
  const [manualWithdrawAddress, setManualWithdrawAddress] = useState("");
  const [manualWithdrawDate, setManualWithdrawDate] = useState("");
  const [manualWithdrawTime, setManualWithdrawTime] = useState("");
  const [manualWithdrawStatus, setManualWithdrawStatus] = useState<"approved" | "pending" | "rejected">("approved");

  // Products/Tasks states
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productIdInput, setProductIdInput] = useState("");
  const [productNameInput, setProductNameInput] = useState("");
  const [productPriceInput, setProductPriceInput] = useState("");
  const [productCommissionInput, setProductCommissionInput] = useState("");
  const [productImageInput, setProductImageInput] = useState("");
  const [productDeleteConfirmId, setProductDeleteConfirmId] = useState<string | null>(null);

  // Technical Support admin states
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const adminMessagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Local real-time listener for the selected user's support chat messages
  const [localMessages, setLocalMessages] = useState<SupportMessage[]>([]);

  React.useEffect(() => {
    if (!selectedChatUserId) {
      setLocalMessages([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, "supportChats", selectedChatUserId, "messages"),
      (snapshot) => {
        const msgs: SupportMessage[] = [];
        snapshot.forEach((doc) => {
          msgs.push(doc.data() as SupportMessage);
        });
        msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setLocalMessages(msgs);
      },
      (error) => {
        console.error("Error syncing selected support chat messages:", error);
      }
    );

    return () => unsub();
  }, [selectedChatUserId]);

  // Clear admin unread
  React.useEffect(() => {
    if (selectedChatUserId) {
      clearAdminUnreadSupport(selectedChatUserId);
    }
  }, [selectedChatUserId, supportChats]);

  // Listen to open-admin-support event to switch sub-tab when clicking top bell
  React.useEffect(() => {
    const handleOpenAdminSupport = () => {
      setActiveSubTab("support");
    };
    window.addEventListener("open-admin-support", handleOpenAdminSupport);
    return () => window.removeEventListener("open-admin-support", handleOpenAdminSupport);
  }, []);

  // Scroll support chat
  React.useEffect(() => {
    if (adminMessagesEndRef.current) {
      setTimeout(() => {
        adminMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [localMessages]);

  // Pending totals
  const pendingDeposits = depositRequests.filter(d => d.status === "pending");
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === "pending");

  // Search filter
  const handleUserSearch = () => {
    const user = users.find(u => u.phone === searchPhone.trim());
    if (user) {
      setSelectedUser(user);
      setSelectedVip(user.vipLevel);
      setAdjustAmount("");
    } else {
      setSelectedUser(null);
      alert(language === "ar" ? "المستخدم غير موجود!" : "User not found!");
    }
  };

  const handleAdjustBalance = (type: "add" | "deduct") => {
    if (!selectedUser) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newBalance = type === "add" 
      ? parseFloat((selectedUser.balance + amount).toFixed(2))
      : parseFloat((selectedUser.balance - amount).toFixed(2));

    adminUpdateUser(selectedUser.id, { balance: newBalance });
    
    // Refresh locally selected user state
    setSelectedUser(prev => prev ? { ...prev, balance: newBalance } : null);
    setAdjustAmount("");
    alert(language === "ar" ? "تم تعديل الرصيد بنجاح!" : "Balance adjusted successfully!");
  };

  const handleInlineAdjustBalance = (userId: string, currentBalance: number, type: "add" | "deduct") => {
    const amountStr = inlineAdjustAmounts[userId] || "";
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert(language === "ar" ? "الرجاء إدخال مبلغ صحيح!" : "Please enter a valid amount!");
      return;
    }

    const newBalance = type === "add"
      ? parseFloat((currentBalance + amount).toFixed(2))
      : parseFloat((currentBalance - amount).toFixed(2));

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

    const newEarnings = type === "add"
      ? parseFloat((currentEarnings + amount).toFixed(2))
      : parseFloat((currentEarnings - amount).toFixed(2));

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

    const newTotal = type === "add"
      ? parseFloat((currentTotal + amount).toFixed(2))
      : parseFloat((currentTotal - amount).toFixed(2));

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

  const handleSaveVipChange = () => {
    if (!selectedUser) return;
    adminUpdateUser(selectedUser.id, { vipLevel: selectedVip });
    alert(language === "ar" ? "تم تعديل مستوى الـ VIP بنجاح!" : "VIP Level modified successfully!");
  };

  return (
    <div className={`p-4 flex flex-col gap-4 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Alert Header */}
      <div className="bg-gradient-to-r from-red-950/80 to-slate-900 border border-red-900/40 p-4 rounded-2xl flex items-center gap-3 shadow-md">
        <ShieldAlert className="w-8 h-8 text-red-500 flex-shrink-0 animate-pulse" />
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.adminDashboard}</h3>
          <p className="text-[10px] text-red-400 mt-0.5 font-semibold">
            {t.adminModeActive}
          </p>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl">
          <Users className="w-4 h-4 mx-auto text-slate-400 mb-0.5" />
          <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "ar" ? "أعضاء" : "Users"}</span>
          <span className="text-xs font-black text-white font-mono">{users.length}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl">
          <ArrowDownLeft className="w-4 h-4 mx-auto text-amber-500 mb-0.5" />
          <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "ar" ? "شحنات" : "Deposits"}</span>
          <span className="text-xs font-black text-amber-400 font-mono">{pendingDeposits.length}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl">
          <ArrowUpRight className="w-4 h-4 mx-auto text-purple-500 mb-0.5" />
          <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "ar" ? "سحوبات" : "Payouts"}</span>
          <span className="text-xs font-black text-purple-400 font-mono">{pendingWithdrawals.length}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl">
          <Landmark className="w-4 h-4 mx-auto text-emerald-500 mb-0.5" />
          <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "ar" ? "سيولة" : "Total USD"}</span>
          <span className="text-xs font-black text-emerald-400 font-mono">
            ${users.reduce((sum, u) => sum + u.balance, 0).toFixed(0)}
          </span>
        </div>
      </div>

      {/* Admin subtabs menu */}
      <div className="grid grid-cols-3 bg-slate-900 p-1.5 rounded-2xl border border-slate-850 gap-1.5 text-[10px] font-bold">
        <button
          onClick={() => setActiveSubTab("deposits")}
          className={`py-2 text-center rounded-xl transition-all ${
            activeSubTab === "deposits" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          {language === "ar" ? `شحن (${pendingDeposits.length})` : `Deposits (${pendingDeposits.length})`}
        </button>
        <button
          onClick={() => setActiveSubTab("withdrawals")}
          className={`py-2 text-center rounded-xl transition-all ${
            activeSubTab === "withdrawals" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          {language === "ar" ? `سحب (${pendingWithdrawals.length})` : `Payouts (${pendingWithdrawals.length})`}
        </button>
        <button
          onClick={() => setActiveSubTab("users")}
          className={`py-2 text-center rounded-xl transition-all ${
            activeSubTab === "users" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          {language === "ar" ? "أعضاء" : "Users"}
        </button>
        <button
          onClick={() => {
            setIsEditingVip(false);
            setVipLevelInput("");
            setVipNameInput("");
            setVipPriceInput("");
            setVipDailyTasksInput("");
            setVipDailyProfitInput("");
            setVipSingleTaskRewardInput("");
            setActiveSubTab("viptiers");
          }}
          className={`py-2 text-center rounded-xl transition-all ${
            activeSubTab === "viptiers" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          {language === "ar" ? "مستويات VIP" : "VIP Tiers"}
        </button>
        <button
          onClick={() => {
            setIsEditingProduct(false);
            setProductIdInput("");
            setProductNameInput("");
            setProductPriceInput("");
            setProductCommissionInput("");
            setProductImageInput("");
            setActiveSubTab("tasks");
          }}
          className={`py-2 text-center rounded-xl transition-all ${
            activeSubTab === "tasks" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          {language === "ar" ? "المنتجات" : "Products/Tasks"}
        </button>
        <button
          onClick={() => {
            setAppNameInput(settings.appName);
            setUsdtAddressInput(settings.usdtAddress);
            setUsdtAddressPolygonInput(settings.usdtAddressPolygon || "");
            setSupportLinkInput(settings.supportTelegram || settings.supportWhatsApp || "");
            setMinDepositInput(String(settings.minDeposit));
            setMinWithdrawInput(String(settings.minWithdraw));
            setIsHolidayEnabledInput(settings.isHolidayEnabled ?? false);
            setHolidayDaysInput(settings.holidayDays ?? [5, 6]);
            setActiveSubTab("settings");
          }}
          className={`py-2 text-center rounded-xl transition-all ${
            activeSubTab === "settings" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          {language === "ar" ? "إعدادات" : "Settings"}
        </button>
        <button
          onClick={() => {
            setSelectedChatUserId(null);
            setAdminReplyText("");
            setActiveSubTab("support");
          }}
          className={`py-2 text-center rounded-xl transition-all relative ${
            activeSubTab === "support" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <span>{language === "ar" ? "الدعم" : "Support"}</span>
            {unreadSupportCountAdmin > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white font-mono animate-pulse">
                {unreadSupportCountAdmin}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Main Admin Tab Panel Contents */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 shadow-xl min-h-[300px]">
        
        {/* PENDING DEPOSITS LIST */}
        {activeSubTab === "deposits" && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider mb-2">
              {t.adminDeposits}
            </h4>
            {pendingDeposits.length === 0 ? (
              <div className="text-center py-10 text-slate-500 italic text-xs">
                {t.noPendingRequests}
              </div>
            ) : (
              <div className="space-y-2">
                {pendingDeposits.map(d => (
                  <div key={d.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-2 text-xs relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-white block font-mono">@{d.username}</strong>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{d.phone}</span>
                      </div>
                      <span className="text-sm font-mono font-black text-emerald-400">${d.amount.toFixed(2)}</span>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-850 font-mono text-[10px] text-slate-400 break-all select-all">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">TXID Hash:</span>
                      {d.hash}
                    </div>

                    {d.screenshot && (
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-850">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold mb-1">
                          {language === "ar" ? "إثبات الإيداع (لقطة الشاشة):" : "Deposit Proof (Screenshot):"}
                        </span>
                        <div className="relative group overflow-hidden rounded-md border border-slate-800">
                          <img
                            src={d.screenshot}
                            alt="Deposit Proof"
                            className="max-h-24 w-full object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
                            onClick={() => setExpandedImage(d.screenshot || null)}
                          />
                          <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-white">
                            {language === "ar" ? "اضغط للتكبير" : "Click to expand"}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={() => adminApproveDeposit(d.id)}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold py-1.5 rounded-lg text-[10px] border border-emerald-500/20 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.approve}</span>
                      </button>
                      <button
                        onClick={() => adminRejectDeposit(d.id)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-1.5 rounded-lg text-[10px] border border-red-500/20 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{t.reject}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PENDING WITHDRAWALS LIST */}
        {activeSubTab === "withdrawals" && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider mb-2">
              {t.adminWithdrawals}
            </h4>
            {pendingWithdrawals.length === 0 ? (
              <div className="text-center py-10 text-slate-500 italic text-xs">
                {t.noPendingRequests}
              </div>
            ) : (
              <div className="space-y-2">
                {pendingWithdrawals.map(w => (
                  <div key={w.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-2 text-xs relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-white block font-mono">@{w.username}</strong>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{w.phone}</span>
                      </div>
                      <span className="text-sm font-mono font-black text-amber-400">${w.amount.toFixed(2)}</span>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-850 font-mono text-[10px] text-slate-400 break-all select-all">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">Withdraw Wallet Address:</span>
                      {w.address}
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={() => adminApproveWithdrawal(w.id)}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold py-1.5 rounded-lg text-[10px] border border-emerald-500/20 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.approve}</span>
                      </button>
                      <button
                        onClick={() => adminRejectWithdrawal(w.id)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-1.5 rounded-lg text-[10px] border border-red-500/20 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{t.reject}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MANAGE USERS & ADJUST BALANCES */}
        {activeSubTab === "users" && (
          <div className="space-y-4">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider">
              {t.adminUsers}
            </h4>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder={language === "ar" ? "ابحث برقم الهاتف أو اسم المستخدم..." : "Search by phone or username..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500 font-mono"
              />
            </div>

            {/* List of Registered Users */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {users
                .filter(u => {
                  const query = searchPhone.trim().toLowerCase();
                  if (!query) return true;
                  return u.phone.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
                })
                .map(user => {
                  const inlineAmount = inlineAdjustAmounts[user.id] || "";
                  const inlineVip = inlineVipLevels[user.id] ?? user.vipLevel;
                  const isDeleting = deleteConfirmId === user.id;
                  const isZeroing = zeroConfirmId === user.id;
                  const isZeroingTasks = zeroTasksConfirmId === user.id;
                  const referralsCount = users.filter(u => u.referredBy && u.referredBy.toUpperCase().trim() === user.invitationCode?.toUpperCase().trim()).length;

                  return (
                    <div key={user.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3 text-xs relative">
                      {/* User Top info */}
                      <div className="flex justify-between items-start border-b border-slate-850 pb-2.5">
                        <div>
                          <span className="text-[9px] text-slate-500 font-mono block">ID: {user.id}</span>
                          <strong className="text-white text-sm block font-mono">@{user.username} {user.isAdmin && <span className="text-amber-500 font-black text-[10px] ml-1 bg-amber-500/10 px-1 py-0.5 rounded">ADMIN</span>}</strong>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{user.phone}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">Registered: {new Date(user.createdAt).toLocaleDateString()}</span>
                          
                          {/* Password & Referral Info */}
                          <div className="mt-2 flex flex-col gap-1 text-[10px] font-mono bg-slate-900/40 p-2 rounded-lg border border-slate-900/80">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span className="text-slate-500">{language === "ar" ? "كلمة المرور:" : "Password:"}</span>
                              <span className="font-bold select-all text-amber-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">{user.password || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span className="text-slate-500">{language === "ar" ? "رمز الدعوة:" : "Invite Code:"}</span>
                              <span className="font-bold text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">{user.invitationCode || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span className="text-slate-500">{language === "ar" ? "الأعضاء المدعوين:" : "Invited Members:"}</span>
                              <span className="font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{referralsCount}</span>
                            </div>
                          </div>
                          
                          {/* Current Earnings Display */}
                          <div className="text-[10px] text-slate-400 font-mono mt-1.5 space-y-0.5 bg-slate-900/50 p-1.5 rounded-lg border border-slate-900">
                            <div>
                              <span className="text-slate-500">{language === "ar" ? "أرباح اليوم:" : "Today's Earnings:"}</span>{" "}
                              <span className="text-amber-500 font-bold font-mono">${(user.todayEarnings || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">{language === "ar" ? "إجمالي الأرباح:" : "Total Earnings:"}</span>{" "}
                              <span className="text-amber-400 font-bold font-mono">${(user.totalEarnings || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="text-emerald-400 font-black font-mono block text-sm">${(user.balance ?? 0).toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400 block uppercase mt-0.5 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {vipTiers.find(v => v.level === user.vipLevel)?.name || (user.vipLevel === 0 ? "VIP 0" : `G${user.vipLevel}`)}
                          </span>
                          {user.referredBy && (
                            <span className="text-[9px] text-indigo-400 block font-mono mt-0.5">
                              Referred by: {user.referredBy}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Modify Username Inline */}
                      <div className="space-y-1.5 border-b border-slate-900/50 pb-2.5">
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {language === "ar" ? "تعديل اسم المستخدم" : "Edit Username"}
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={inlineUsernames[user.id] ?? user.username}
                            onChange={(e) => setInlineUsernames(prev => ({ ...prev, [user.id]: e.target.value }))}
                            placeholder="Enter new username"
                            className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                          />
                          <button
                            onClick={() => handleInlineUsernameChange(user.id)}
                            className="bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 px-4 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer text-[10px]"
                          >
                            <span>{language === "ar" ? "حفظ" : "Save"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Adjust Balance Inline */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {language === "ar" ? "تعديل رصيد المستخدم" : "Adjust User Balance"}
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={inlineAmount}
                            onChange={(e) => setInlineAdjustAmounts(prev => ({ ...prev, [user.id]: e.target.value }))}
                            placeholder="0.00"
                            className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                          />
                          <button
                            onClick={() => handleInlineAdjustBalance(user.id, user.balance, "add")}
                            className="bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer text-[10px]"
                          >
                            <Coins className="w-3 h-3" />
                            <span>{language === "ar" ? "+ إضافة" : "+ Add"}</span>
                          </button>
                          <button
                            onClick={() => handleInlineAdjustBalance(user.id, user.balance, "deduct")}
                            className="bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer text-[10px]"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{language === "ar" ? "- خصم" : "- Deduct"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Adjust Today's Earnings Inline */}
                      <div className="space-y-1.5 border-t border-slate-900/50 pt-2">
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {language === "ar" ? "تعديل أرباح اليوم" : "Adjust Today's Earnings"}
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={inlineAdjustTodayEarnings[user.id] || ""}
                            onChange={(e) => setInlineAdjustTodayEarnings(prev => ({ ...prev, [user.id]: e.target.value }))}
                            placeholder="0.00"
                            className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                          />
                          <button
                            onClick={() => handleInlineAdjustTodayEarnings(user.id, user.todayEarnings || 0, "add")}
                            className="bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer text-[10px]"
                          >
                            <Coins className="w-3 h-3" />
                            <span>{language === "ar" ? "+ إضافة" : "+ Add"}</span>
                          </button>
                          <button
                            onClick={() => handleInlineAdjustTodayEarnings(user.id, user.todayEarnings || 0, "deduct")}
                            className="bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer text-[10px]"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{language === "ar" ? "- خصم" : "- Deduct"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Adjust Total Earnings Inline */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {language === "ar" ? "تعديل إجمالي الأرباح" : "Adjust Total Earnings"}
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={inlineAdjustTotalEarnings[user.id] || ""}
                            onChange={(e) => setInlineAdjustTotalEarnings(prev => ({ ...prev, [user.id]: e.target.value }))}
                            placeholder="0.00"
                            className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                          />
                          <button
                            onClick={() => handleInlineAdjustTotalEarnings(user.id, user.totalEarnings || 0, "add")}
                            className="bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer text-[10px]"
                          >
                            <Coins className="w-3 h-3" />
                            <span>{language === "ar" ? "+ إضافة" : "+ Add"}</span>
                          </button>
                          <button
                            onClick={() => handleInlineAdjustTotalEarnings(user.id, user.totalEarnings || 0, "deduct")}
                            className="bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer text-[10px]"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{language === "ar" ? "- خصم" : "- Deduct"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Modify VIP & Extra Action Buttons */}
                      <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-900">
                        {/* VIP dropdown */}
                        <div className="flex gap-2 items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">VIP Tier:</span>
                          <select
                            value={inlineVip}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setInlineVipLevels(prev => ({ ...prev, [user.id]: val }));
                              handleInlineVipChange(user.id, val);
                            }}
                            className="bg-slate-900 border border-slate-850 rounded-xl px-2 py-1.5 text-[11px] text-white focus:outline-hidden min-w-[120px]"
                          >
                            {vipTiers.map(tier => (
                              <option key={tier.level} value={tier.level}>{tier.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Actions (Zero, Zero Earnings, and Delete) */}
                        <div className="flex gap-1.5 justify-end flex-wrap">
                          {/* Zero Balance Button */}
                          <button
                            onClick={() => {
                              if (isZeroing) {
                                handleInlineZeroBalance(user.id);
                              } else {
                                setZeroConfirmId(user.id);
                                setZeroEarningsConfirmId(null);
                                setDeleteConfirmId(null);
                                setTimeout(() => setZeroConfirmId(current => current === user.id ? null : current), 4000);
                              }
                            }}
                            className={`px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isZeroing
                                ? "bg-amber-500 text-slate-950 font-black animate-pulse"
                                : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20"
                            }`}
                          >
                            <span>{isZeroing ? (language === "ar" ? "تأكيد التصفير؟" : "Confirm Zero?") : (language === "ar" ? "تصفير الرصيد" : "Zero Balance")}</span>
                          </button>

                          {/* Zero Earnings Button */}
                          <button
                            onClick={() => {
                              const isZeroingEarnings = zeroEarningsConfirmId === user.id;
                              if (isZeroingEarnings) {
                                handleInlineZeroEarnings(user.id);
                              } else {
                                setZeroEarningsConfirmId(user.id);
                                setZeroConfirmId(null);
                                setZeroTasksConfirmId(null);
                                setDeleteConfirmId(null);
                                setTimeout(() => setZeroEarningsConfirmId(current => current === user.id ? null : current), 4000);
                              }
                            }}
                            className={`px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              zeroEarningsConfirmId === user.id
                                ? "bg-amber-500 text-slate-950 font-black animate-pulse"
                                : "bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500/20"
                            }`}
                          >
                            <span>{zeroEarningsConfirmId === user.id ? (language === "ar" ? "تأكيد تصفير الأرباح؟" : "Confirm Zero Earnings?") : (language === "ar" ? "تصفير الأرباح" : "Zero Earnings")}</span>
                          </button>

                          {/* Zero Tasks Button */}
                          <button
                            onClick={() => {
                              if (isZeroingTasks) {
                                handleInlineZeroTasks(user.id);
                              } else {
                                setZeroTasksConfirmId(user.id);
                                setZeroConfirmId(null);
                                setZeroEarningsConfirmId(null);
                                setDeleteConfirmId(null);
                                setTimeout(() => setZeroTasksConfirmId(current => current === user.id ? null : current), 4000);
                              }
                            }}
                            className={`px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isZeroingTasks
                                ? "bg-amber-500 text-slate-950 font-black animate-pulse"
                                : "bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                            }`}
                          >
                            <span>{isZeroingTasks ? (language === "ar" ? "تأكيد تصفير المهام؟" : "Confirm Zero Tasks?") : (language === "ar" ? "تصفير المهام" : "Zero Tasks")}</span>
                          </button>

                          {/* Delete Account Button */}
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => {
                                if (isDeleting) {
                                  handleInlineDeleteUser(user.id);
                                } else {
                                  setDeleteConfirmId(user.id);
                                  setZeroConfirmId(null);
                                  setZeroEarningsConfirmId(null);
                                  setTimeout(() => setDeleteConfirmId(current => current === user.id ? null : current), 4000);
                                }
                              }}
                              className={`px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isDeleting
                                  ? "bg-red-500 text-white font-black animate-pulse"
                                  : "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20"
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{isDeleting ? (language === "ar" ? "تأكيد حذف الحساب؟" : "Confirm Delete Account?") : (language === "ar" ? "حذف الحساب" : "Delete Account")}</span>
                            </button>
                          )}

                          {/* Manual Withdrawal Button */}
                          <button
                            onClick={() => {
                              setManualWithdrawUserId(user.id);
                              setManualWithdrawAddress(user.withdrawalAddress || "");
                              setManualWithdrawAmount("");
                              setManualWithdrawDate(new Date().toISOString().slice(0, 10));
                              setManualWithdrawTime(new Date().toTimeString().slice(0, 5));
                              setManualWithdrawStatus("approved");
                            }}
                            className="px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>{language === "ar" ? "إضافة سحب" : "Add Withdrawal"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {users.filter(u => {
                const query = searchPhone.trim().toLowerCase();
                if (!query) return true;
                return u.phone.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
              }).length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  {language === "ar" ? "لا يوجد مستخدمين مطابقين للبحث!" : "No users matched your search!"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLATFORM CONFIGURATION SETTINGS */}
        {activeSubTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider mb-2">
              {t.adminSettings}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">{t.changeAppName}</label>
                <input
                  type="text"
                  required
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">{t.changeUsdtAddress}</label>
                <input
                  type="text"
                  required
                  value={usdtAddressInput}
                  onChange={(e) => setUsdtAddressInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  {language === "ar" ? "عنوان الإيداع (USDT Polygon)" : "Deposit Address (USDT Polygon)"}
                </label>
                <input
                  type="text"
                  required
                  value={usdtAddressPolygonInput}
                  onChange={(e) => setUsdtAddressPolygonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  {language === "ar" ? "رابط إدارة منصة BET" : "BET Platform Admin Link"}
                </label>
                <input
                  type="text"
                  required
                  value={supportLinkInput}
                  onChange={(e) => setSupportLinkInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">الحد الأدنى للإيداع ($)</label>
                <input
                  type="number"
                  required
                  value={minDepositInput}
                  onChange={(e) => setMinDepositInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">الحد الأدنى للسحب ($)</label>
                <input
                  type="number"
                  required
                  value={minWithdrawInput}
                  onChange={(e) => setMinWithdrawInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Holiday / Weekend Settings Section */}
            <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <h5 className="text-xs font-bold text-amber-500">
                    {language === "ar" ? "تفعيل العطلة الأسبوعية" : "Enable Weekend Holidays"}
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === "ar" 
                      ? "عند التفعيل، لن يستطيع المستخدمون تنفيذ المهام اليومية خلال أيام العطل المحددة." 
                      : "When enabled, users cannot complete daily tasks during selected holiday days."}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsHolidayEnabledInput(true)}
                    className={`px-3 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-colors ${
                      isHolidayEnabledInput 
                        ? "bg-amber-500 text-slate-950 border border-amber-400" 
                        : "bg-slate-900 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {language === "ar" ? "تشغيل" : "ON"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHolidayEnabledInput(false)}
                    className={`px-3 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-colors ${
                      !isHolidayEnabledInput 
                        ? "bg-amber-500 text-slate-950 border border-amber-400" 
                        : "bg-slate-900 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {language === "ar" ? "إيقاف" : "OFF"}
                  </button>
                </div>
              </div>

              {isHolidayEnabledInput && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1 text-right">
                    {language === "ar" ? "حدد أيام العطلة الأسبوعية:" : "Select Weekend Holiday Days:"}
                  </span>
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    {[
                      { nameAr: "الأحد", nameEn: "Sunday", val: 0 },
                      { nameAr: "الاثنين", nameEn: "Monday", val: 1 },
                      { nameAr: "الثلاثاء", nameEn: "Tuesday", val: 2 },
                      { nameAr: "الأربعاء", nameEn: "Wednesday", val: 3 },
                      { nameAr: "الخميس", nameEn: "Thursday", val: 4 },
                      { nameAr: "الجمعة", nameEn: "Friday", val: 5 },
                      { nameAr: "السبت", nameEn: "Saturday", val: 6 },
                    ].map((day) => {
                      const isSelected = holidayDaysInput.includes(day.val);
                      return (
                        <button
                          key={day.val}
                          type="button"
                          onClick={() => {
                            if (holidayDaysInput.includes(day.val)) {
                              setHolidayDaysInput(holidayDaysInput.filter(d => d !== day.val));
                            } else {
                              setHolidayDaysInput([...holidayDaysInput, day.val].sort());
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-amber-500 text-slate-950 shadow-md border border-amber-400" 
                              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                          }`}
                        >
                          {language === "ar" ? day.nameAr : day.nameEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {settingsSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{t.saveSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-3 rounded-xl text-xs transition-transform active:scale-95 shadow-md cursor-pointer"
            >
              {t.save}
            </button>
          </form>
        )}

        {/* VIP TIERS MANAGEMENT */}
        {activeSubTab === "viptiers" && (
          <div className="space-y-4 text-xs text-right" dir="rtl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider">
                {language === "ar" ? "إدارة مستويات الـ VIP" : "Manage VIP Tiers"}
              </h4>
              <button
                onClick={() => {
                  setIsEditingVip(!isEditingVip);
                  setVipLevelInput("");
                  setVipNameInput("");
                  setVipPriceInput("");
                  setVipDailyTasksInput("");
                  setVipDailyProfitInput("");
                  setVipBgInput("from-amber-500 to-yellow-600");
                }}
                className="bg-amber-500 text-slate-950 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "إضافة مستوى" : "Add VIP"}</span>
              </button>
            </div>

            {/* Edit / Add Form */}
            {isEditingVip && (
              <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl space-y-3">
                <h5 className="font-bold text-white">
                  {vipLevelInput !== "" && vipTiers.some(v => v.level === parseInt(vipLevelInput)) ? (language === "ar" ? "تعديل مستوى" : "Edit VIP") : (language === "ar" ? "إضافة مستوى جديد" : "Add New VIP")}
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">المستوى الرقمي (مثال: 1, 2)</label>
                    <input
                      type="number"
                      required
                      value={vipLevelInput}
                      onChange={(e) => setVipLevelInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white disabled:opacity-50 text-right"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">اسم الـ VIP (مثال: VIP 1)</label>
                    <input
                      type="text"
                      required
                      value={vipNameInput}
                      onChange={(e) => setVipNameInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white text-right"
                      placeholder="VIP 1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">سعر الترقية (USDT)</label>
                    <input
                      type="number"
                      required
                      value={vipPriceInput}
                      onChange={(e) => setVipPriceInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white text-right"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">المهام اليومية (كم مهمة)</label>
                    <input
                      type="number"
                      required
                      value={vipDailyTasksInput}
                      onChange={(e) => setVipDailyTasksInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white text-right"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">سعر/عمولة المهمة الواحدة (USDT)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={vipSingleTaskRewardInput}
                      onChange={(e) => setVipSingleTaskRewardInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white text-right font-mono text-amber-400"
                      placeholder="1.50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">نسبة الربح الاحتياطية (مثال: 0.01)</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={vipDailyProfitInput}
                      onChange={(e) => setVipDailyProfitInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white text-right"
                      placeholder="0.012"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">تدرج الألوان (خلفية البطاقة)</label>
                    <input
                      type="text"
                      required
                      value={vipBgInput}
                      onChange={(e) => setVipBgInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono text-right"
                      placeholder="from-amber-500 to-yellow-600"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (vipLevelInput === "" || !vipNameInput || !vipPriceInput || !vipDailyTasksInput) {
                        alert("يرجى ملء جميع الحقول المطلوبة.");
                        return;
                      }
                      const lvl = parseInt(vipLevelInput);
                      const price = parseFloat(vipPriceInput);
                      const dailyTasks = parseInt(vipDailyTasksInput);
                      const commissionRate = parseFloat(vipDailyProfitInput) || 0.01;
                      const singleTaskReward = parseFloat(vipSingleTaskRewardInput) || 0;
                      
                      adminAddVipTier({
                        level: lvl,
                        name: vipNameInput,
                        price,
                        dailyTasks,
                        commissionRate,
                        minBalanceRequired: price,
                        icon: "ShieldAlert",
                        color: "text-amber-400 border-amber-400/20",
                        bgGradient: vipBgInput,
                        singleTaskReward
                      });
                      
                      setIsEditingVip(false);
                      setVipLevelInput("");
                      setVipNameInput("");
                      setVipPriceInput("");
                      setVipDailyTasksInput("");
                      setVipDailyProfitInput("");
                      setVipSingleTaskRewardInput("");
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2 rounded-xl text-xs cursor-pointer"
                  >
                    {language === "ar" ? "حفظ وتثبيت" : "Save Tier"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingVip(false);
                      setVipLevelInput("");
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-755 text-slate-400 font-bold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {/* Tiers List */}
            <div className="space-y-2">
              {vipTiers.map(tier => (
                <div key={tier.level} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div className="text-right">
                    <span className="font-bold text-white text-sm block">
                      {tier.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1">
                      سعر الترقية: {tier.price} USDT | مهام يومية: {tier.dailyTasks} | عمولة المهمة: <span className="text-amber-400 font-bold">{tier.singleTaskReward !== undefined ? `${tier.singleTaskReward.toFixed(2)} USDT` : `${((tier.commissionRate || 0) * 100).toFixed(1)}%`}</span>
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setVipLevelInput(String(tier.level));
                        setVipNameInput(tier.name);
                        setVipPriceInput(String(tier.price));
                        setVipDailyTasksInput(String(tier.dailyTasks));
                        setVipDailyProfitInput(String(tier.commissionRate));
                        setVipSingleTaskRewardInput(tier.singleTaskReward !== undefined ? String(tier.singleTaskReward) : "");
                        setVipBgInput(tier.bgGradient);
                        setIsEditingVip(true);
                      }}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 active:scale-90 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={tier.level === 0}
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف ${tier.name}؟`)) {
                          adminDeleteVipTier(tier.level);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-20 active:scale-90 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS / TASKS MANAGEMENT */}
        {activeSubTab === "tasks" && (
          <div className="space-y-4 text-xs text-right" dir="rtl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider">
                {language === "ar" ? "إدارة منتجات ومهام التقييم" : "Manage Products & Tasks"}
              </h4>
              <button
                onClick={() => {
                  setIsEditingProduct(!isEditingProduct);
                  setProductIdInput("p_" + Date.now());
                  setProductNameInput("");
                  setProductPriceInput("");
                  setProductCommissionInput("");
                  setProductImageInput("");
                }}
                className="bg-amber-500 text-slate-950 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "إضافة منتج" : "Add Product"}</span>
              </button>
            </div>

            {/* Edit / Add Product Form */}
            {isEditingProduct && (
              <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl space-y-3">
                <h5 className="font-bold text-white">
                  {products.some(p => p.id === productIdInput) ? (language === "ar" ? "تعديل المنتج" : "Edit Product") : (language === "ar" ? "إضافة منتج جديد" : "Add New Product")}
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">اسم المنتج</label>
                    <input
                      type="text"
                      required
                      value={productNameInput}
                      onChange={(e) => setProductNameInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white text-right"
                      placeholder="e.g. Rolex Submariner"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">السعر ($)</label>
                    <input
                      type="number"
                      required
                      value={productPriceInput}
                      onChange={(e) => setProductPriceInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white text-right"
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">العمولة المقدرة ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productCommissionInput}
                      onChange={(e) => setProductCommissionInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white text-right"
                      placeholder="2.50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">رابط صورة المنتج</label>
                    <input
                      type="text"
                      required
                      value={productImageInput}
                      onChange={(e) => setProductImageInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono text-[10px] text-right"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!productNameInput || !productPriceInput || !productCommissionInput || !productImageInput) {
                        alert("يرجى ملء جميع الحقول المطلوبة.");
                        return;
                      }
                      
                      adminAddProduct({
                        id: productIdInput,
                        name: productNameInput,
                        price: parseFloat(productPriceInput),
                        commission: parseFloat(productCommissionInput),
                        image: productImageInput
                      });
                      
                      setIsEditingProduct(false);
                      setProductIdInput("");
                      setProductNameInput("");
                      setProductPriceInput("");
                      setProductCommissionInput("");
                      setProductImageInput("");
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2 rounded-xl text-xs cursor-pointer"
                  >
                    {language === "ar" ? "حفظ وتثبيت" : "Save Product"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProduct(false);
                      setProductIdInput("");
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-755 text-slate-400 font-bold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {products.map(product => (
                <div key={product.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                    />
                    <div className="text-right">
                      <span className="font-bold text-white text-xs block truncate max-w-[150px]">
                        {product.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        السعر: ${product.price.toFixed(2)} | عمولة مقدرة: ${product.commission.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setProductIdInput(product.id);
                        setProductNameInput(product.name);
                        setProductPriceInput(String(product.price));
                        setProductCommissionInput(String(product.commission));
                        setProductImageInput(product.image);
                        setIsEditingProduct(true);
                      }}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 active:scale-90 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (productDeleteConfirmId === product.id) {
                          adminDeleteProduct(product.id);
                          setProductDeleteConfirmId(null);
                          alert(language === "ar" ? "تم حذف المنتج بنجاح!" : "Product deleted successfully!");
                        } else {
                          setProductDeleteConfirmId(product.id);
                          setTimeout(() => setProductDeleteConfirmId(current => current === product.id ? null : current), 4000);
                        }
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        productDeleteConfirmId === product.id
                          ? "bg-red-500 text-white font-black animate-pulse"
                          : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {productDeleteConfirmId === product.id && (
                        <span>{language === "ar" ? "تأكيد الحذف؟" : "Confirm Delete?"}</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TECHNICAL SUPPORT CHATS MANAGER */}
        {activeSubTab === "support" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider">
                {language === "ar" ? "لوحة إدارة الدعم الفني المباشر" : "Customer Support Console"}
              </h4>
              {unreadSupportCountAdmin > 0 && (
                <span className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2.5 py-0.5 rounded-full text-[10px] animate-pulse">
                  {unreadSupportCountAdmin} {language === "ar" ? "محادثات غير مقروءة" : "Unread Thread(s)"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh] min-h-[400px]">
              {/* Left Column: Chats List */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl flex flex-col overflow-hidden h-full">
                <div className="p-3 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-black uppercase">
                    {language === "ar" ? "قائمة المحادثات النشطة" : "Active Conversations"}
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-300 font-mono font-bold px-1.5 py-0.5 rounded">
                    {supportChats.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 p-1 space-y-1">
                  {supportChats.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 italic text-[11px] flex flex-col items-center justify-center gap-2">
                      <div className="text-xl">📭</div>
                      <p>{language === "ar" ? "لا توجد أي محادثات دعم نشطة حالياً" : "No active support chats found."}</p>
                    </div>
                  ) : (
                    supportChats.map((chat) => {
                      const isSelected = selectedChatUserId === chat.id;
                      const hasUnreads = (chat.unreadCountAdmin || 0) > 0 && chat.status === "open";
                      return (
                        <button
                          key={chat.id}
                          onClick={() => setSelectedChatUserId(chat.id)}
                          className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-500/10 border border-amber-500/30 text-white font-black"
                              : "hover:bg-slate-900/60 border border-transparent text-slate-300"
                          }`}
                        >
                          {/* User Avatar Initials */}
                          <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-500 font-black uppercase text-xs">
                              {chat.username[0] || "U"}
                            </div>
                            {chat.status === "open" && (
                              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950"></span>
                            )}
                          </div>

                          {/* Chat Text Details */}
                          <div className="flex-1 min-w-0 text-right">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-black truncate">{chat.username}</span>
                              <span className="text-[8px] text-slate-500 font-mono">
                                {chat.lastMessageTime
                                  ? new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : ""}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{chat.phone}</p>
                            <p className={`text-[10px] truncate mt-0.5 ${hasUnreads ? "text-amber-400 font-black" : "text-slate-500"}`}>
                              {chat.lastMessageText || "..."}
                            </p>
                          </div>

                          {/* Unread Admin Badge */}
                          {hasUnreads && (
                            <span className="flex-shrink-0 h-4 w-4 bg-red-500 text-[8px] font-black text-white rounded-full flex items-center justify-center font-mono">
                              {chat.unreadCountAdmin}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Columns: Active Chat Thread View */}
              <div className="md:col-span-2 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col overflow-hidden h-full">
                {!selectedChatUserId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
                    <div className="w-16 h-16 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-3xl mb-3">
                      🎧
                    </div>
                    <h5 className="text-xs font-black text-slate-300">
                      {language === "ar" ? "مكتب مساعدة الدعم المباشر" : "Live Support Desk"}
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-normal mt-1 max-w-[240px]">
                      {language === "ar"
                        ? "يرجى تحديد محادثة من القائمة الجانبية لعرض رسائل العضو والرد عليه وحل مشكلته في الوقت الفعلي."
                        : "Select a user chat thread from the left menu to read messages and reply in real-time."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-between">
                    {/* Active Thread Header */}
                    <div className="p-3 bg-slate-900 border-b border-slate-850 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold uppercase text-xs">
                          {supportChats.find((c) => c.id === selectedChatUserId)?.username?.[0] || "U"}
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-white leading-none block">
                            {supportChats.find((c) => c.id === selectedChatUserId)?.username}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                            {supportChats.find((c) => c.id === selectedChatUserId)?.phone}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {supportChats.find((c) => c.id === selectedChatUserId)?.status === "open" ? (
                          <button
                            onClick={async () => {
                              if (confirm(language === "ar" ? "هل أنت متأكد من إنهاء وإغلاق محادثة الدعم هذه؟" : "Are you sure you want to close this support ticket?")) {
                                await closeSupportChat(selectedChatUserId);
                              }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-black px-2 py-1 rounded-lg cursor-pointer"
                          >
                            {language === "ar" ? "إنهاء المحادثة" : "Close Chat"}
                          </button>
                        ) : (
                          <span className="bg-slate-850 text-slate-400 border border-slate-800 text-[9px] font-black px-2 py-1 rounded-lg select-none">
                            {language === "ar" ? "تذكرة مغلقة" : "Ticket Closed"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                      {localMessages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
                          <p className="text-[10px] text-slate-600 italic">
                            {language === "ar" ? "لا توجد رسائل سابقة في هذه المحادثة" : "No message history."}
                          </p>
                        </div>
                      ) : (
                        localMessages.map((m) => {
                          const isMsgFromMe = m.isAdmin;
                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col max-w-[80%] ${
                                isMsgFromMe ? "self-end items-end" : "self-start items-start"
                              }`}
                            >
                              <div
                                className={`rounded-2xl px-3 py-2 text-xs leading-normal select-text ${
                                  isMsgFromMe
                                    ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-medium rounded-tr-none"
                                    : "bg-slate-800 text-slate-100 rounded-tl-none"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                              </div>
                              <span className="text-[8px] text-slate-500 font-mono mt-1 px-1">
                                {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                              </span>
                            </div>
                          );
                        })
                      )}
                      <div ref={adminMessagesEndRef} />
                    </div>

                    {/* Chat Reply Box */}
                    <div className="p-3 border-t border-slate-850 flex-shrink-0">
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!adminReplyText.trim() || isSendingReply) return;
                          setIsSendingReply(true);
                          await adminSendSupportMessage(selectedChatUserId, adminReplyText);
                          setAdminReplyText("");
                          setIsSendingReply(false);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          placeholder={language === "ar" ? "اكتب الرد هنا لمساعدة العضو..." : "Type reply to support member..."}
                          className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500 font-sans"
                          disabled={isSendingReply}
                        />
                        <button
                          type="submit"
                          disabled={isSendingReply || !adminReplyText.trim()}
                          className="p-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold transition-all disabled:opacity-40 disabled:hover:bg-amber-500 active:scale-95 cursor-pointer flex-shrink-0"
                        >
                          {isSendingReply ? (
                            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Manual Withdrawal Modal */}
      {manualWithdrawUserId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-black text-amber-500 uppercase text-center">
              {language === "ar" ? "إضافة سحب يدوي" : "Add Manual Withdrawal"}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">
                  {language === "ar" ? "المبلغ (USDT)" : "Amount (USDT)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={manualWithdrawAmount}
                  onChange={e => setManualWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-right"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">
                  {language === "ar" ? "عنوان المحفظة" : "Wallet Address"}
                </label>
                <input
                  type="text"
                  value={manualWithdrawAddress}
                  onChange={e => setManualWithdrawAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-right text-[10px]"
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">
                  {language === "ar" ? "التاريخ" : "Date"}
                </label>
                <input
                  type="date"
                  value={manualWithdrawDate}
                  onChange={e => setManualWithdrawDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-right"
                />
              </div>
              <div>
  <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">
    {language === "ar" ? "الوقت" : "Time"}
  </label>
  <input
    type="time"
    value={manualWithdrawTime}
    onChange={e => setManualWithdrawTime(e.target.value)}
    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-right"
  />
</div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1 text-right">
                  {language === "ar" ? "الحالة" : "Status"}
                </label>
                <select
                  value={manualWithdrawStatus}
                  onChange={e => setManualWithdrawStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-right cursor-pointer"
                >
                  <option value="approved">{language === "ar" ? "مكتمل" : "Approved"}</option>
                  <option value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</option>
                  <option value="rejected">{language === "ar" ? "مرفوض" : "Rejected"}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const user = users.find(u => u.id === manualWithdrawUserId);
                  if (!user) return;
                  const amount = parseFloat(manualWithdrawAmount);
                  if (isNaN(amount) || amount <= 0) {
                    alert(language === "ar" ? "يرجى إدخال مبلغ صحيح!" : "Please enter a valid amount!");
                    return;
                  }
                  const createdAt = manualWithdrawDate ? new Date(`${manualWithdrawDate}T${manualWithdrawTime || "00:00"}:00`).toISOString() : new Date().toISOString();
                  adminAddManualWithdrawal(user.id, user.username, user.phone, amount, manualWithdrawAddress, manualWithdrawStatus, createdAt).then(() => {
                    setManualWithdrawUserId(null);
                    setManualWithdrawAmount("");
                    setManualWithdrawAddress("");
                    alert(language === "ar" ? "تمت إضافة السحب بنجاح!" : "Withdrawal added successfully!");
                  });
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2 rounded-xl text-xs cursor-pointer"
              >
                {language === "ar" ? "حفظ" : "Save"}
              </button>
              <button
                onClick={() => setManualWithdrawUserId(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Image Modal for Screenshots */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={() => setExpandedImage(null)}
              className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white p-2 rounded-full cursor-pointer transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-full max-h-[85vh] overflow-auto flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40" onClick={e => e.stopPropagation()}>
            <img 
              src={expandedImage} 
              alt="Expanded Proof" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
          <p className="text-slate-400 text-xs mt-3 font-bold select-none text-center">
            {language === "ar" ? "اضغط على أي مكان بالخلفية للإغلاق" : "Click anywhere outside the image to close"}
          </p>
        </div>
      )}
    </div>
  );
};
