/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { PhoneFrame } from "./components/PhoneFrame";
import { HomeView } from "./components/views/HomeView";
import { TaskView } from "./components/views/TaskView";
import { VipView } from "./components/views/VipView";
import { TeamView } from "./components/views/TeamView";
import { MineView } from "./components/views/MineView";
import { AdminView } from "./components/views/AdminView";
import { LoginPrompt } from "./components/LoginPrompt";
import { translations } from "./data/translations";
import { Home, PlayCircle, Award, Users, User, ShieldAlert, MessageCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[9999]">
      {/* Glow background */}
      <div className="absolute w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Logo ring */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex items-center justify-center mb-6"
      >
        <div className="w-24 h-24 rounded-full border-4 border-amber-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.25)]">
          <span className="text-4xl font-black bg-gradient-to-b from-amber-400 to-yellow-600 bg-clip-text text-transparent">★</span>
        </div>
        {/* Spinning ring */}
        <div className="absolute w-28 h-28 rounded-full border-4 border-transparent border-t-amber-500 animate-spin" />
      </motion.div>

      {/* App name */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-3xl font-black bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent tracking-widest mb-2"
      >
        BET
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-slate-500 text-xs tracking-widest uppercase font-bold mb-10"
      >
        Premium Platform
      </motion.p>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="w-40 h-1 bg-slate-800 rounded-full overflow-hidden"
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ delay: 1, duration: 1.6, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
        />
      </motion.div>
    </div>
  );
}

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const { language, isAdminMode, setIsAdminMode, currentUser, isLoading, settings } = useApp();
  const t = translations[language];
  const isRtl = language === "ar";

  // Automatically switch to the "mine" tab if there's an invite parameter in the URL
  React.useEffect(() => {
    const fullUrl = window.location.href;
    const hasInvite = /[?&]invite=([^&#/]+)/.test(fullUrl);
    if (hasInvite && !currentUser) {
      setActiveTab("mine");
    }
  }, [currentUser]);

  // Navigation tab definitions
  const tabs = [
    { id: "home", label: t.home, icon: Home },
    { id: "task", label: t.task, icon: PlayCircle },
    { id: "vip", label: t.vip, icon: Award },
    { id: "team", label: t.team, icon: Users },
    { id: "mine", label: t.mine, icon: User },
  ];

  if (isLoading) {
    return (
      <PhoneFrame activeTab={activeTab}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 min-h-[500px]">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin"></div>
            <div className="absolute text-amber-500 font-black text-xl animate-pulse">999</div>
          </div>
          <p className="text-amber-500 font-bold text-sm tracking-wider uppercase animate-pulse">
            {language === "ar" ? "جاري تحميل البيانات..." : "Loading premium experience..."}
          </p>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame
      activeTab={activeTab}
      footer={
        /* Persistent Bottom Tab Bar */
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 p-2 pb-4 flex justify-around items-center z-40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !isAdminMode;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setIsAdminMode(false); // Automatically leave admin view when user clicks standard tabs
                  setActiveTab(tab.id);
                }}
                className="flex flex-col items-center gap-1 py-1 relative flex-1 group transition-all"
              >
                {/* Glowing active indicator background ring */}
                {isActive && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-amber-500/5 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive 
                      ? "text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <span
                  className={`text-[9px] font-bold transition-colors ${
                    isActive ? "text-amber-400 font-extrabold" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </span>

                {/* Little active dot indicator */}
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full absolute -top-1 shadow-[0_0_6px_#f59e0b]"></span>
                )}
              </button>
            );
          })}
        </div>
      }
    >
      {/* Dynamic View Dispatcher */}
      <div className="flex-1 relative">
        {isAdminMode ? (
          <AdminView />
        ) : (
          <>
            {activeTab === "home" && <HomeView onNavigate={setActiveTab} />}
            {activeTab === "task" && (currentUser ? <TaskView /> : <LoginPrompt onLoginNavigate={() => setActiveTab("mine")} />)}
            {activeTab === "vip" && (currentUser ? <VipView /> : <LoginPrompt onLoginNavigate={() => setActiveTab("mine")} />)}
            {activeTab === "team" && (currentUser ? <TeamView /> : <LoginPrompt onLoginNavigate={() => setActiveTab("mine")} />)}
            {activeTab === "mine" && <MineView />}
          </>
        )}
      </div>
    </PhoneFrame>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AppProvider>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SplashScreen onDone={() => setShowSplash(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      {!showSplash && <MainAppContent />}
    </AppProvider>
  );
}
