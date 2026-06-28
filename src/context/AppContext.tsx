import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AppSettings, DepositRequest, WithdrawRequest, Language, TeamReport, VipTier, Product } from "../types";
import { INITIAL_VIP_TIERS, PRODUCTS } from "../data/mockData";
import { collection, onSnapshot, doc, setDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: User | null;
  users: User[];
  settings: AppSettings;
  depositRequests: DepositRequest[];
  withdrawalRequests: WithdrawRequest[];
  login: (phone: string, password: string) => { success: boolean; error?: string };
  register: (phone: string, email: string, password: string, inviteCode?: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  rateProduct: (productId: string) => Promise<{ success: boolean; commission: number; error?: string }>;
  addDeposit: (amount: number, hash: string, network?: "trc20" | "polygon", screenshot?: string) => Promise<{ success: boolean; error?: string }>;
  addWithdrawal: (amount: number, address: string, network?: "trc20" | "polygon") => Promise<{ success: boolean; error?: string }>;
  upgradeVip: (level: number) => Promise<{ success: boolean; error?: string }>;
  updateUserWithdrawalAddress: (address: string, network?: "trc20" | "polygon") => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // Dynamic VIP levels & Tasks/Products
  vipTiers: VipTier[];
  products: Product[];
  adminAddVipTier: (tier: VipTier) => Promise<void>;
  adminUpdateVipTier: (level: number, fields: Partial<VipTier>) => Promise<void>;
  adminDeleteVipTier: (level: number) => Promise<void>;
  adminAddProduct: (product: Product) => Promise<void>;
  adminUpdateProduct: (id: string, fields: Partial<Product>) => Promise<void>;
  adminDeleteProduct: (id: string) => Promise<void>;
  
  // Admin functions
  isAdminMode: boolean;
  setIsAdminMode: (active: boolean) => void;
  adminApproveDeposit: (depositId: string) => Promise<void>;
  adminRejectDeposit: (depositId: string) => Promise<void>;
  adminApproveWithdrawal: (withdrawalId: string) => Promise<void>;
  adminRejectWithdrawal: (withdrawalId: string) => Promise<void>;
  adminUpdateUser: (userId: string, fields: Partial<User>) => Promise<void>;
  adminDeleteUser: (userId: string) => Promise<void>;
  adminUpdateSettings: (fields: Partial<AppSettings>) => Promise<void>;
  getTeamReport: (userId: string) => TeamReport;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  appName: "999 Ratings",
  usdtAddress: "T9zXvA23B94C8dEf7gHiJkLmNoPqRsTuVw",
  usdtAddressPolygon: "0x1234567890abcdef1234567890abcdef12345678",
  supportTelegram: "https://t.me/apexratings_support",
  supportWhatsApp: "https://wa.me/9647700000000",
  minDeposit: 10,
  minWithdraw: 1,
  isHolidayEnabled: false,
  holidayDays: [5, 6]
};

const isPhoneMatch = (dbPhone: string, inputPhone: string): boolean => {
  if (!dbPhone || !inputPhone) return false;
  
  // Clean both of non-digits
  let p1 = dbPhone.trim().replace(/\D/g, "");
  let p2 = inputPhone.trim().replace(/\D/g, "");
  
  // Strip leading zeros
  while (p1.startsWith("0")) p1 = p1.substring(1);
  while (p2.startsWith("0")) p2 = p2.substring(1);
  
  if (!p1 || !p2) return false;
  
  if (p1 === p2) return true;
  
  // If one of them has at least 8 digits, we can check suffix
  if (p1.length >= 8 && p2.length >= 8) {
    if (p1.endsWith(p2) || p2.endsWith(p1)) {
      return true;
    }
  }
  
  return false;
};

const SEED_USERS: User[] = [
  {
    id: "admin_u",
    username: "Admin",
    phone: "asd@gmail.com",
    email: "asd@gmail.com",
    balance: 99999.00,
    todayEarnings: 0,
    totalEarnings: 0,
    vipLevel: 5,
    completedTasksToday: 0,
    totalCompletedTasks: 0,
    invitationCode: "ADMIN",
    createdAt: new Date().toISOString(),
    isAdmin: true
  },
  {
    id: "u1",
    username: "haitham",
    phone: "07701234567",
    email: "haitham@example.com",
    balance: 5.00,
    todayEarnings: 0,
    totalEarnings: 0,
    vipLevel: 0,
    completedTasksToday: 0,
    totalCompletedTasks: 0,
    invitationCode: "VIP111",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    withdrawalAddress: "TXS888dd888jjf8888fff",
    isAdmin: true
  },
  {
    id: "u2",
    username: "ahmed_guest",
    phone: "777",
    email: "ahmed@example.com",
    balance: 5.00,
    todayEarnings: 0,
    totalEarnings: 0,
    vipLevel: 0,
    completedTasksToday: 0,
    totalCompletedTasks: 0,
    invitationCode: "INV777",
    referredBy: "VIP111",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("apex_lang") as Language) || "ar";
  });

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawRequest[]>([]);
  const [vipTiers, setVipTiers] = useState<VipTier[]>(INITIAL_VIP_TIERS);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync language selection locally
  useEffect(() => {
    localStorage.setItem("apex_lang", language);
  }, [language]);

  // Seed and Setup Realtime Firestore Synchronization
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];
    let isMounted = true;

    // A robust, absolute fallback to guarantee the app ALWAYS opens and never gets stuck!
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Firestore took too long to load. Falling back to default/cached data.");
        setIsLoading(false);
      }
    }, 1500);

    const setupRealtimeSync = async () => {
      // Run database seeding asynchronously in the background so it never blocks the app startup!
      seedDatabaseIfEmpty().catch((e) => {
        console.error("Background seeding failed or skipped:", e);
      });

      // 1. Settings Snapshot
      const unsubSettings = onSnapshot(
        doc(db, "settings", "global"),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSettings({
              ...DEFAULT_SETTINGS,
              ...data
            } as AppSettings);
          }
        },
        (error) => {
          console.error("Firestore settings snapshot error:", error);
        }
      );
      unsubscribes.push(unsubSettings);

      // 2. Users Snapshot
      const unsubUsers = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          const uList: User[] = [];
          snapshot.forEach((doc) => {
            uList.push(doc.data() as User);
          });
          setUsers(uList);
        },
        (error) => {
          console.error("Firestore users snapshot error:", error);
        }
      );
      unsubscribes.push(unsubUsers);

      // 3. Deposit Requests Snapshot
      const unsubDeposits = onSnapshot(
        collection(db, "depositRequests"),
        (snapshot) => {
          const dList: DepositRequest[] = [];
          snapshot.forEach((doc) => {
            dList.push(doc.data() as DepositRequest);
          });
          dList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setDepositRequests(dList);
        },
        (error) => {
          console.error("Firestore deposits snapshot error:", error);
        }
      );
      unsubscribes.push(unsubDeposits);

      // 4. Withdrawal Requests Snapshot
      const unsubWithdrawals = onSnapshot(
        collection(db, "withdrawalRequests"),
        (snapshot) => {
          const wList: WithdrawRequest[] = [];
          snapshot.forEach((doc) => {
            wList.push(doc.data() as WithdrawRequest);
          });
          wList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setWithdrawalRequests(wList);
        },
        (error) => {
          console.error("Firestore withdrawals snapshot error:", error);
        }
      );
      unsubscribes.push(unsubWithdrawals);

      // 5. VIP Tiers Snapshot
      const unsubVip = onSnapshot(
        collection(db, "vipTiers"),
        (snapshot) => {
          const vList: VipTier[] = [];
          snapshot.forEach((doc) => {
            vList.push(doc.data() as VipTier);
          });
          if (vList.length > 0) {
            vList.sort((a, b) => a.level - b.level);
            setVipTiers(vList);
          }
        },
        (error) => {
          console.error("Firestore vipTiers snapshot error:", error);
        }
      );
      unsubscribes.push(unsubVip);

      // 6. Products Snapshot
      const unsubProducts = onSnapshot(
        collection(db, "products"),
        (snapshot) => {
          const pList: Product[] = [];
          snapshot.forEach((doc) => {
            pList.push(doc.data() as Product);
          });
          if (pList.length > 0) {
            setProducts(pList);
          }
          if (isMounted) {
            clearTimeout(fallbackTimeout);
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Firestore products snapshot error:", error);
          if (isMounted) {
            clearTimeout(fallbackTimeout);
            setIsLoading(false);
          }
        }
      );
      unsubscribes.push(unsubProducts);
    };

    setupRealtimeSync();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  const seedDatabaseIfEmpty = async () => {
    // 1. Seed VIP Tiers
    const vipTiersCol = collection(db, "vipTiers");
    const vipTiersSnapshot = await getDocs(vipTiersCol);
    const existingVipLevels = vipTiersSnapshot.docs.map(d => d.id);
    for (const tier of INITIAL_VIP_TIERS) {
      if (!existingVipLevels.includes(String(tier.level))) {
        await setDoc(doc(db, "vipTiers", String(tier.level)), tier);
      }
    }

    // 2. Seed Products
    const productsCol = collection(db, "products");
    const productsSnapshot = await getDocs(productsCol);
    const existingProductIds = productsSnapshot.docs.map(d => d.id);
    for (const prod of PRODUCTS) {
      if (!existingProductIds.includes(prod.id)) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
    }

    // 3. Seed Users
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(usersCol);
    const existingUserIds = usersSnapshot.docs.map(d => d.id);
    for (const user of SEED_USERS) {
      if (!existingUserIds.includes(user.id)) {
        await setDoc(doc(db, "users", user.id), user);
      }
    }

    // 4. Seed Settings
    const settingsCol = collection(db, "settings");
    const settingsSnapshot = await getDocs(settingsCol);
    if (settingsSnapshot.empty) {
      await setDoc(doc(db, "settings", "global"), DEFAULT_SETTINGS);
    }
  };

  // Sync Logged-In User automatically with DB changes
  useEffect(() => {
    const loggedInId = localStorage.getItem("apex_logged_in_user_id");
    if (loggedInId && users.length > 0) {
      const matched = users.find(u => u.id === loggedInId);
      if (matched) {
        setCurrentUser(matched);
      } else {
        // Logged-in user deleted by admin
        setCurrentUser(null);
        localStorage.removeItem("apex_logged_in_user_id");
      }
    } else if (!loggedInId) {
      setCurrentUser(null);
    }
  }, [users]);

  // Periodic Reset only for the active logged-in user (saves writes)
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      const now = new Date().getTime();
      const lastReset = currentUser.lastTaskResetTime ? new Date(currentUser.lastTaskResetTime).getTime() : 0;
      const elapsed = now - lastReset;
      
      if (elapsed >= 24 * 60 * 60 * 1000 || !currentUser.lastTaskResetTime) {
        const userRef = doc(db, "users", currentUser.id);
        await updateDoc(userRef, {
          completedTasksToday: 0,
          todayEarnings: 0,
          lastTaskResetTime: new Date().toISOString()
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

  // Dynamic VIP levels & Tasks/Products Admin updates
  const adminAddVipTier = async (tier: VipTier) => {
    await setDoc(doc(db, "vipTiers", String(tier.level)), tier);
  };

  const adminUpdateVipTier = async (level: number, fields: Partial<VipTier>) => {
    await updateDoc(doc(db, "vipTiers", String(level)), fields);
  };

  const adminDeleteVipTier = async (level: number) => {
    await deleteDoc(doc(db, "vipTiers", String(level)));
  };

  const adminAddProduct = async (product: Product) => {
    await setDoc(doc(db, "products", product.id), product);
  };

  const adminUpdateProduct = async (id: string, fields: Partial<Product>) => {
    await updateDoc(doc(db, "products", id), fields);
  };

  const adminDeleteProduct = async (id: string) => {
    await deleteDoc(doc(db, "products", id));
  };

  // Login
  const login = (phone: string, password: string) => {
    const pTrim = phone.trim();
    if (pTrim === "asd@gmail.com") {
      if (password !== "123ASDasd") {
        return { success: false, error: language === "ar" ? "كلمة مرور المسؤول غير صحيحة!" : "Incorrect Admin password!" };
      }
      
      let adminUser = users.find(u => u.phone === "asd@gmail.com" || u.email === "asd@gmail.com" || u.id === "admin_u");
      if (!adminUser) {
        // If missing from current state, seed it on-the-fly both locally and in Firestore
        const fallbackAdmin: User = {
          id: "admin_u",
          username: "Admin",
          phone: "asd@gmail.com",
          email: "asd@gmail.com",
          balance: 99999.00,
          todayEarnings: 0,
          totalEarnings: 0,
          vipLevel: 5,
          completedTasksToday: 0,
          totalCompletedTasks: 0,
          invitationCode: "ADMIN",
          createdAt: new Date().toISOString(),
          isAdmin: true
        };
        
        // Save to Firestore asynchronously
        setDoc(doc(db, "users", fallbackAdmin.id), fallbackAdmin).catch(err => {
          console.error("Failed to dynamically write admin doc on-the-fly:", err);
        });
        
        adminUser = fallbackAdmin;
      }
      
      setCurrentUser(adminUser);
      setIsAdminMode(true);
      localStorage.setItem("apex_logged_in_user_id", adminUser.id);
      return { success: true };
    }

    const user = users.find(u => (u.phone && isPhoneMatch(u.phone, pTrim)) || (u.email && u.email.toLowerCase().trim() === pTrim.toLowerCase()));
    if (user) {
      if (user.isAdmin && password !== "123ASDasd") {
        return { success: false, error: language === "ar" ? "كلمة مرور المسؤول غير صحيحة!" : "Incorrect Admin password!" };
      }
      if (!user.isAdmin && user.password && user.password !== password) {
        return { success: false, error: language === "ar" ? "كلمة المرور غير صحيحة!" : "Incorrect password!" };
      }
      setCurrentUser(user);
      localStorage.setItem("apex_logged_in_user_id", user.id);
      return { success: true };
    } else {
      return { success: false, error: language === "ar" ? "رقم الهاتف / البريد الإلكتروني غير مسجل. يرجى إنشاء حساب أولاً." : "Phone number / Email not registered. Please create an account." };
    }
  };

  // Register
  const register = async (phone: string, email: string, password: string, inviteCode?: string, username?: string) => {
    if (!inviteCode || !inviteCode.trim()) {
      return { success: false, error: language === "ar" ? "رمز الدعوة مطلوب وإجباري للتسجيل!" : "Invitation code is mandatory!" };
    }

    const trimmedInvite = inviteCode.trim();
    const inviter = users.find(u => u.invitationCode.toUpperCase().trim() === trimmedInvite.toUpperCase());
    if (!inviter) {
      return { success: false, error: language === "ar" ? "رمز الدعوة غير صالح!" : "Invalid invitation code!" };
    }

    const cleanPhone = phone ? phone.trim() : "";
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    if (cleanPhone) {
      const exists = users.some(u => u.phone && u.phone.trim() !== "" && isPhoneMatch(u.phone, cleanPhone));
      if (exists) {
        return { success: false, error: language === "ar" ? "رقم الهاتف مسجل بالفعل!" : "Phone number already registered!" };
      }
    }
    if (cleanEmail) {
      const exists = users.some(u => u.email && u.email.trim() !== "" && u.email.trim().toLowerCase() === cleanEmail);
      if (exists) {
        return { success: false, error: language === "ar" ? "البريد الإلكتروني مسجل بالفعل!" : "Email already registered!" };
      }
    }

    const code = "INV" + Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: User = {
      id: "u_" + Date.now(),
      username: username?.trim() || (email ? email.split("@")[0] : "User_" + phone.slice(-4)),
      phone: phone || "",
      email: email || "",
      balance: 1.00, // Welcome gift
      todayEarnings: 0,
      totalEarnings: 0,
      vipLevel: 0,
      completedTasksToday: 0,
      totalCompletedTasks: 0,
      invitationCode: code,
      referredBy: inviter.invitationCode.toUpperCase().trim(),
      password: password,
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    await setDoc(doc(db, "users", newUser.id), newUser);

    // Reward the inviter with $5.00
    

    localStorage.setItem("apex_logged_in_user_id", newUser.id);
    setCurrentUser(newUser);

    return { success: true };
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    setIsAdminMode(false);
    localStorage.removeItem("apex_logged_in_user_id");
  };

  // Rate product task execution
  const rateProduct = async (productId: string) => {
    if (!currentUser) return { success: false, commission: 0, error: "Not logged in" };

    if (settings.isHolidayEnabled && settings.holidayDays && settings.holidayDays.includes(new Date().getDay())) {
      return { success: false, commission: 0, error: "holiday" };
    }

    const vipTier = vipTiers.find(v => v.level === currentUser.vipLevel);
    if (!vipTier) return { success: false, commission: 0, error: "Invalid VIP Tier" };

    if (currentUser.completedTasksToday >= vipTier.dailyTasks) {
      return { success: false, commission: 0, error: "limit_reached" };
    }

    const product = products.find(p => p.id === productId);
    if (!product) return { success: false, commission: 0, error: "Product not found" };

    const calculatedCommission = vipTier.singleTaskReward !== undefined 
      ? parseFloat(Number(vipTier.singleTaskReward).toFixed(2)) 
      : parseFloat((product.price * vipTier.commissionRate).toFixed(2));

    await updateDoc(doc(db, "users", currentUser.id), {
      balance: parseFloat((currentUser.balance + calculatedCommission).toFixed(2)),
      todayEarnings: parseFloat((currentUser.todayEarnings + calculatedCommission).toFixed(2)),
      totalEarnings: parseFloat((currentUser.totalEarnings + calculatedCommission).toFixed(2)),
      completedTasksToday: currentUser.completedTasksToday + 1,
      totalCompletedTasks: currentUser.totalCompletedTasks + 1
    });

    if (currentUser.referredBy) {
      await creditReferrers(currentUser.referredBy, calculatedCommission);
    }

    return { success: true, commission: calculatedCommission };
  };

  const creditReferrers = async (referrerCode: string, taskCommission: number) => {
    const rCodeTrimmed = referrerCode.toUpperCase().trim();
    const l1User = users.find(u => u.invitationCode.toUpperCase().trim() === rCodeTrimmed);
    if (!l1User) return;

    const l1Reward = parseFloat((taskCommission * 0.10).toFixed(3));
    await updateDoc(doc(db, "users", l1User.id), {
      balance: parseFloat((l1User.balance + l1Reward).toFixed(2)),
      todayEarnings: parseFloat((l1User.todayEarnings + l1Reward).toFixed(2)),
      totalEarnings: parseFloat((l1User.totalEarnings + l1Reward).toFixed(2))
    });

    if (l1User.referredBy) {
      const l2User = users.find(u => u.invitationCode.toUpperCase().trim() === l1User.referredBy.toUpperCase().trim());
      if (l2User) {
        const l2Reward = parseFloat((taskCommission * 0.05).toFixed(3));
        await updateDoc(doc(db, "users", l2User.id), {
          balance: parseFloat((l2User.balance + l2Reward).toFixed(2)),
          todayEarnings: parseFloat((l2User.todayEarnings + l2Reward).toFixed(2)),
          totalEarnings: parseFloat((l2User.totalEarnings + l2Reward).toFixed(2))
        });

        if (l2User.referredBy) {
          const l3User = users.find(u => u.invitationCode.toUpperCase().trim() === l2User.referredBy.toUpperCase().trim());
          if (l3User) {
            const l3Reward = parseFloat((taskCommission * 0.02).toFixed(3));
            await updateDoc(doc(db, "users", l3User.id), {
              balance: parseFloat((l3User.balance + l3Reward).toFixed(2)),
              todayEarnings: parseFloat((l3User.todayEarnings + l3Reward).toFixed(2)),
              totalEarnings: parseFloat((l3User.totalEarnings + l3Reward).toFixed(2))
            });
          }
        }
      }
    }
  };

  // Add Deposit request
  const addDeposit = async (amount: number, hash: string, network: "trc20" | "polygon" = "trc20", screenshot?: string) => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    if (amount < settings.minDeposit) {
      return { success: false, error: "min_limit" };
    }

    const newDeposit: DepositRequest = {
      id: "dep_" + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      phone: currentUser.phone,
      amount,
      status: "pending",
      hash,
      network,
      createdAt: new Date().toISOString(),
      screenshot: screenshot || ""
    };

    await setDoc(doc(db, "depositRequests", newDeposit.id), newDeposit);
    return { success: true };
  };

  // Add Withdrawal request
  const addWithdrawal = async (amount: number, address: string, network: "trc20" | "polygon" = "trc20") => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    if (amount < settings.minWithdraw) {
      return { success: false, error: "min_limit" };
    }
    if (currentUser.balance < amount) {
      return { success: false, error: "insufficient" };
    }

    await updateDoc(doc(db, "users", currentUser.id), {
      balance: parseFloat((currentUser.balance - amount).toFixed(2))
    });

    const newWithdrawal: WithdrawRequest = {
      id: "wth_" + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      phone: currentUser.phone,
      amount,
      address,
      status: "pending",
      network,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "withdrawalRequests", newWithdrawal.id), newWithdrawal);
    return { success: true };
  };

  // Upgrade VIP Tier
  const upgradeVip = async (level: number) => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    
    const targetTier = vipTiers.find(v => v.level === level);
    if (!targetTier) return { success: false, error: "Invalid Level" };

    if (currentUser.balance < targetTier.price) {
      return { success: false, error: "insufficient" };
    }

    await updateDoc(doc(db, "users", currentUser.id), {
      vipLevel: level,
      balance: parseFloat((currentUser.balance - targetTier.price).toFixed(2))
    });

    return { success: true };
  };

  // Update user's withdrawal address
  const updateUserWithdrawalAddress = async (address: string, network: "trc20" | "polygon" = "trc20") => {
    if (!currentUser) return;
    if (network === "polygon") {
      await updateDoc(doc(db, "users", currentUser.id), { withdrawalAddressPolygon: address });
    } else {
      await updateDoc(doc(db, "users", currentUser.id), { withdrawalAddress: address });
    }
  };

  // Change current user's password
  const changePassword = async (newPassword: string) => {
    if (!currentUser) return { success: false, error: language === "ar" ? "يجب تسجيل الدخول أولاً!" : "Must log in first!" };
    try {
      await updateDoc(doc(db, "users", currentUser.id), { password: newPassword });
      // Update local state current user password so it doesn't mismatch during current session
      setCurrentUser(prev => prev ? { ...prev, password: newPassword } : null);
      return { success: true };
    } catch (err: any) {
      console.error("Failed to change password:", err);
      return { success: false, error: err.message || "Failed to change password" };
    }
  };

  // Admin: Approve Deposit
  const adminApproveDeposit = async (depositId: string) => {
    const deposit = depositRequests.find(d => d.id === depositId);
    if (!deposit || deposit.status !== "pending") return;

    const depositor = users.find(u => u.id === deposit.userId);
    if (depositor) {
      const addedBalance = parseFloat((depositor.balance + deposit.amount).toFixed(2));
      await updateDoc(doc(db, "users", depositor.id), { balance: addedBalance });
      
      // Credit Level 1 referrer for deposit
      if (depositor.referredBy) {
        const referrer = users.find(u => u.invitationCode.toUpperCase().trim() === depositor.referredBy.toUpperCase().trim());
        if (referrer) {
          const depBonus = parseFloat((deposit.amount * 0.10).toFixed(2));
          await updateDoc(doc(db, "users", referrer.id), {
            balance: parseFloat((referrer.balance + depBonus).toFixed(2)),
            totalEarnings: parseFloat((referrer.totalEarnings + depBonus).toFixed(2))
          });
        }
      }
    }

    await updateDoc(doc(db, "depositRequests", depositId), { status: "approved" });
  };

  // Admin: Reject Deposit
  const adminRejectDeposit = async (depositId: string) => {
    await updateDoc(doc(db, "depositRequests", depositId), { status: "rejected" });
  };

  // Admin: Approve Withdrawal
  const adminApproveWithdrawal = async (withdrawalId: string) => {
    await updateDoc(doc(db, "withdrawalRequests", withdrawalId), { status: "approved" });
  };

  // Admin: Reject Withdrawal
  const adminRejectWithdrawal = async (withdrawalId: string) => {
    const withdrawal = withdrawalRequests.find(w => w.id === withdrawalId);
    if (!withdrawal || withdrawal.status !== "pending") return;

    const userToRefund = users.find(u => u.id === withdrawal.userId);
    if (userToRefund) {
      await updateDoc(doc(db, "users", withdrawal.userId), {
        balance: parseFloat((userToRefund.balance + withdrawal.amount).toFixed(2))
      });
    }

    await updateDoc(doc(db, "withdrawalRequests", withdrawalId), { status: "rejected" });
  };

  // Admin: Update User directly
  const adminUpdateUser = async (userId: string, fields: Partial<User>) => {
    await updateDoc(doc(db, "users", userId), fields);
  };

  // Admin: Delete User
  const adminDeleteUser = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
  };

  // Admin: Update global App Settings
  const adminUpdateSettings = async (fields: Partial<AppSettings>) => {
    await updateDoc(doc(db, "settings", "global"), fields);
  };

  // Dynamic calculation of referral statistics
  const getTeamReport = (userId: string): TeamReport => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      return {
        level1Count: 0, level2Count: 0, level3Count: 0,
        level1Deposit: 0, level2Deposit: 0, level3Deposit: 0,
        level1Commission: 0, level2Commission: 0, level3Commission: 0
      };
    }

    const level1 = users.filter(u => u.referredBy && u.referredBy.toUpperCase().trim() === user.invitationCode.toUpperCase().trim());
    const l1Ids = level1.map(u => u.id);

    const level2 = users.filter(u => u.referredBy && level1.some(l1 => l1.invitationCode.toUpperCase().trim() === u.referredBy.toUpperCase().trim()));
    const l2Ids = level2.map(u => u.id);

    const level3 = users.filter(u => u.referredBy && level2.some(l2 => l2.invitationCode.toUpperCase().trim() === u.referredBy.toUpperCase().trim()));
    const l3Ids = level3.map(u => u.id);

    const getDepositSum = (userIds: string[]) => {
      return depositRequests
        .filter(d => userIds.includes(d.userId) && d.status === "approved")
        .reduce((sum, d) => sum + d.amount, 0);
    };

    const l1Deposit = getDepositSum(l1Ids);
    const l2Deposit = getDepositSum(l2Ids);
    const l3Deposit = getDepositSum(l3Ids);

    const getCommissionSum = (subordinates: User[], multiplier: number) => {
      return subordinates.reduce((sum, u) => sum + (u.totalEarnings * multiplier), 0);
    };

    const l1Commission = parseFloat(getCommissionSum(level1, 0.10).toFixed(2));
    const l2Commission = parseFloat(getCommissionSum(level2, 0.05).toFixed(2));
    const l3Commission = parseFloat(getCommissionSum(level3, 0.02).toFixed(2));

    return {
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      level1Deposit: l1Deposit,
      level2Deposit: l2Deposit,
      level3Deposit: l3Deposit,
      level1Commission: l1Commission,
      level2Commission: l2Commission,
      level3Commission: l3Commission
    };
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currentUser,
        users,
        settings,
        depositRequests,
        withdrawalRequests,
        login,
        register,
        logout,
        rateProduct,
        addDeposit,
        addWithdrawal,
        upgradeVip,
        updateUserWithdrawalAddress,
        changePassword,
        vipTiers,
        products,
        adminAddVipTier,
        adminUpdateVipTier,
        adminDeleteVipTier,
        adminAddProduct,
        adminUpdateProduct,
        adminDeleteProduct,
        isAdminMode,
        setIsAdminMode,
        adminApproveDeposit,
        adminRejectDeposit,
        adminApproveWithdrawal,
        adminRejectWithdrawal,
        adminUpdateUser,
        adminDeleteUser,
        adminUpdateSettings,
        getTeamReport,
        isLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
