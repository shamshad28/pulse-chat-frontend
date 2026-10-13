"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Settings as SettingsIcon,
  Shield,
  MessageSquare,
  Bell,
  Lock,
  Keyboard,
  HelpCircle,
  LogOut,
  Camera,
  Check,
  Edit2,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Globe,
  Wifi,
  Trash2,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { getAvatarColor, getInitials } from "../../lib/utils";

export default function WhatsAppSettingsModal({ isOpen, onClose, onLogout }) {
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'account' | 'chats' | 'notifications' | 'privacy' | 'shortcuts' | 'help'
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Editable Profile States
  const [name, setName] = useState(currentUser?.name || "Khan shamshad");
  const [about, setAbout] = useState(currentUser?.about || "Hey there! I am using WhatsApp.");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  // Live Settings States (Persisted in localStorage)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("wa_theme") || "dark";
    return "dark";
  });

  const [wallpaper, setWallpaper] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("wa_wallpaper") || "doodle-dark";
    return "doodle-dark";
  });

  const [enterIsSend, setEnterIsSend] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [securityNotifications, setSecurityNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [reactionNotifications, setReactionNotifications] = useState(true);
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState("Everyone");
  const [disappearingTimer, setDisappearingTimer] = useState("Off");
  const [lowDataMode, setLowDataMode] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Reset mobile view when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setMobileDetailOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("wa_theme", newTheme);
      if (newTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }
    }
  };

  const handleWallpaperChange = (wp) => {
    setWallpaper(wp);
    if (typeof window !== "undefined") {
      localStorage.setItem("wa_wallpaper", wp);
    }
  };

  const handleSaveProfile = () => {
    if (currentUser) {
      setUser({
        ...currentUser,
        name: name.trim() || currentUser.name,
        about: about.trim() || "Hey there! I am using WhatsApp.",
      });
    }
    setIsEditingName(false);
    setIsEditingAbout(false);
  };

  const tabLabels = {
    profile: "Profile",
    general: "General",
    account: "Account",
    chats: "Chats",
    notifications: "Notifications",
    privacy: "Privacy",
    shortcuts: "Keyboard Shortcuts",
    help: "Help",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl h-full sm:h-[88vh] md:h-[85vh] sm:max-h-[680px] rounded-none sm:rounded-2xl bg-[#111b21] border-0 sm:border border-[#222e35] shadow-2xl flex flex-col md:flex-row overflow-hidden text-[#e9edef] animate-in zoom-in-95 duration-150">
        
        {/* 1. Left Sidebar Menu (Full width on mobile when menu active, fixed width on desktop) */}
        <div
          className={`${
            mobileDetailOpen ? "hidden md:flex" : "flex"
          } w-full md:w-64 md:min-w-[240px] md:max-w-[260px] h-full bg-[#111b21] md:border-r border-[#222e35] flex-col justify-between flex-shrink-0 overflow-y-auto`}
        >
          <div>
            {/* Header */}
            <div className="p-4 border-b border-[#222e35] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#e9edef]">Settings</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] transition-colors"
                title="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Row in Navigation */}
            <div
              onClick={() => {
                setActiveTab("profile");
                setMobileDetailOpen(true);
              }}
              className={`p-3 mx-2 my-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                activeTab === "profile"
                  ? "bg-[#202c33] text-white"
                  : "hover:bg-[#202c33]/70 text-[#d1d7db]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[#534b3e] flex items-center justify-center font-bold text-base text-white">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate text-[#e9edef]">{name}</div>
                  <div className="text-xs text-[#8696a0] truncate mt-0.5">{about}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8696a0] flex-shrink-0 ml-2 md:hidden" />
            </div>

            {/* Navigation Tabs List */}
            <nav className="px-2 space-y-0.5">
              {[
                { id: "general", label: "General", icon: SettingsIcon },
                { id: "account", label: "Account", icon: Shield },
                { id: "chats", label: "Chats", icon: MessageSquare },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "privacy", label: "Privacy", icon: Lock },
                { id: "shortcuts", label: "Keyboard shortcuts", icon: Keyboard },
                { id: "help", label: "Help", icon: HelpCircle },
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileDetailOpen(true);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#202c33] text-[#00a884]"
                        : "text-[#aebac1] hover:bg-[#202c33]/70 hover:text-[#e9edef]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <IconComp className={`w-4 h-4 ${isActive ? "text-[#00a884]" : "text-[#8696a0]"}`} />
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8696a0] md:hidden" />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Log out button at bottom */}
          <div className="p-3 border-t border-[#222e35]">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* 2. Right Content Area (Takes 100% width on mobile when detail active, flex-1 on desktop) */}
        <div
          className={`${
            mobileDetailOpen ? "flex" : "hidden md:flex"
          } flex-1 flex-col h-full min-w-0 w-full overflow-y-auto bg-[#111b21] p-4 sm:p-6 text-[#d1d7db]`}
        >
          {/* Mobile Back / Title Bar */}
          <div className="md:hidden flex items-center justify-between pb-3 mb-4 border-b border-[#222e35] flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileDetailOpen(false)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#00a884] hover:text-[#25d366] -ml-1 py-1 px-2 rounded-lg hover:bg-[#202c33] active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Settings</span>
            </button>
            <span className="text-sm font-semibold text-white">
              {tabLabels[activeTab] || "Settings"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Right Header Close Icon */}
          <div className="hidden md:flex items-center justify-end mb-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-white transition-colors"
              title="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Profile Tab */}
          {activeTab === "profile" && (
            <div className="w-full max-w-full md:max-w-md mx-auto space-y-6">
              <h3 className="text-base sm:text-lg font-semibold text-white">Profile</h3>

              {/* Avatar section */}
              <div className="flex flex-col items-center">
                <div className="group relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-[#534b3e] flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-lg ring-4 ring-[#202c33]">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(name)
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] uppercase font-semibold">Change Photo</span>
                  </div>
                </div>
              </div>

              {/* Name Editor */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2">
                <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                  Your Name
                </label>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 min-w-0 bg-[#111b21] border border-[#00a884] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="p-2 rounded-lg bg-[#00a884] hover:bg-[#008069] text-white flex-shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white truncate">{name}</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 rounded-lg text-[#8696a0] hover:text-[#00a884] hover:bg-[#111b21] flex-shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-[#8696a0]">
                  This is not your username or pin. This name will be visible to your contacts.
                </p>
              </div>

              {/* About Editor */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2">
                <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                  About
                </label>
                {isEditingAbout ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="flex-1 min-w-0 bg-[#111b21] border border-[#00a884] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="p-2 rounded-lg bg-[#00a884] hover:bg-[#008069] text-white flex-shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white truncate">{about}</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingAbout(true)}
                      className="p-1.5 rounded-lg text-[#8696a0] hover:text-[#00a884] hover:bg-[#111b21] flex-shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Phone / Username */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-1">
                <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                  Username & Phone
                </label>
                <div className="text-sm font-mono text-white truncate">@{currentUser?.username || "user"}</div>
                <div className="text-xs text-[#8696a0]">+91 98765 43210</div>
              </div>
            </div>
          )}

          {/* 2. General Tab - Fully Responsive & Flexible */}
          {activeTab === "general" && (
            <div className="space-y-5 w-full max-w-full md:max-w-lg">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">General</h3>
                <p className="text-xs text-[#8696a0] mt-0.5">Manage startup, language, audio, and device performance</p>
              </div>

              <div className="space-y-3.5">
                {/* Startup Card */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-white">Startup</h4>
                      <p className="text-[11px] text-[#8696a0] mt-0.5">Start PulseChat automatically when your device boots</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 accent-[#00a884] rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Language Card */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00a884] flex-shrink-0" />
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Language</h4>
                  </div>
                  <select
                    defaultValue="English"
                    className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00a884] transition-colors"
                  >
                    <option value="English">English (United States)</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                    <option value="Spanish">Español (Spanish)</option>
                    <option value="French">Français (French)</option>
                    <option value="Arabic">العربية (Arabic)</option>
                    <option value="Urdu">اردو (Urdu)</option>
                  </select>
                </div>

                {/* Typing & Sounds Card */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-3">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#00a884] flex-shrink-0" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
                    )}
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Typing & Sounds</h4>
                  </div>

                  <label className="flex items-center justify-between gap-3 text-xs text-[#d1d7db] cursor-pointer pt-1">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">Outgoing message audio cues</span>
                      <p className="text-[11px] text-[#8696a0]">Play audio tone when messages are sent</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#00a884] rounded flex-shrink-0"
                    />
                  </label>
                </div>

                {/* Low Data Mode Card */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-white">Low data usage</h4>
                      <p className="text-[11px] text-[#8696a0] mt-0.5">Conserve mobile bandwidth during calls</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={lowDataMode}
                      onChange={(e) => setLowDataMode(e.target.checked)}
                      className="w-4 h-4 accent-[#00a884] rounded flex-shrink-0"
                    />
                  </div>
                </div>

                {/* Local Cache Card */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-white">Local storage & cache</h4>
                      <p className="text-[11px] text-[#8696a0] mt-0.5">Clear temporary cached images, audio and media</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCacheCleared(true);
                        setTimeout(() => setCacheCleared(false), 2500);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#2a3942] hover:bg-[#374248] text-xs font-medium text-[#d1d7db] active:scale-95 transition-all flex-shrink-0"
                    >
                      {cacheCleared ? "Cleared!" : "Clear Cache"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-5 w-full max-w-full md:max-w-lg">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Account</h3>
                <p className="text-xs text-[#8696a0] mt-0.5">Security, verification, and personal account data</p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white">Security notifications</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">
                      Show security alerts when end-to-end encryption keys change
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityNotifications}
                    onChange={(e) => setSecurityNotifications(e.target.checked)}
                    className="w-4 h-4 accent-[#00a884] rounded flex-shrink-0"
                  />
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white">Two-step verification</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">
                      Enabled with security PIN protection
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#00a884] bg-emerald-950/60 px-2 py-0.5 rounded border border-[#00a884]/30 flex-shrink-0">
                    Active
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3 cursor-pointer hover:bg-[#2a3942] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white">Request account information</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">
                      Download a verified report of your account records
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* 4. Chats Tab (Theme, Wallpaper, Enter is Send) */}
          {activeTab === "chats" && (
            <div className="space-y-5 w-full max-w-full md:max-w-lg">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Chats</h3>
                <p className="text-xs text-[#8696a0] mt-0.5">Theme, wallpapers, and chat composer preferences</p>
              </div>

              {/* Theme Selector */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-3">
                <h4 className="text-xs sm:text-sm font-semibold text-white">Theme</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "dark", label: "Dark (Default)", icon: Moon },
                    { id: "light", label: "Light", icon: Sun },
                    { id: "system", label: "System Default", icon: Monitor },
                    { id: "amoled", label: "AMOLED Black", icon: Moon },
                  ].map((t) => {
                    const IconC = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleThemeChange(t.id)}
                        className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all ${
                          theme === t.id
                            ? "bg-[#111b21] border-[#00a884] text-[#00a884]"
                            : "bg-[#111b21]/50 border-[#2a3942] text-[#8696a0] hover:text-white"
                        }`}
                      >
                        <IconC className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Wallpaper Chooser */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-3">
                <h4 className="text-xs sm:text-sm font-semibold text-white">Chat Wallpaper</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "doodle-dark", label: "Doodle Dark", bg: "bg-[#0b141a]" },
                    { id: "teal", label: "Forest Teal", bg: "bg-[#054740]" },
                    { id: "navy", label: "Midnight Navy", bg: "bg-[#0f172a]" },
                    { id: "charcoal", label: "Charcoal", bg: "bg-[#18181b]" },
                  ].map((wp) => (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => handleWallpaperChange(wp.id)}
                      className={`h-14 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center p-1 text-[10px] font-medium transition-all ${wp.bg} ${
                        wallpaper === wp.id ? "border-[#00a884] shadow-md scale-102" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      {wallpaper === wp.id && <Check className="w-3.5 h-3.5 text-[#00a884]" />}
                      <span className="text-white mt-0.5 truncate">{wp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enter is Send Toggle */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-medium text-white">Enter is Send</div>
                  <div className="text-[11px] text-[#8696a0] mt-0.5">
                    Pressing Enter on keyboard will dispatch your message
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enterIsSend}
                  onChange={(e) => setEnterIsSend(e.target.checked)}
                  className="w-4 h-4 accent-[#00a884] rounded flex-shrink-0"
                />
              </div>

              {/* Media Auto-Download */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2">
                <h4 className="text-xs sm:text-sm font-semibold text-white">Media auto-download</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#d1d7db]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#00a884]" />
                    <span>Photos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#00a884]" />
                    <span>Audio</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#00a884]" />
                    <span>Videos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#00a884]" />
                    <span>Documents</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 5. Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-5 w-full max-w-full md:max-w-lg">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Notifications</h3>
                <p className="text-xs text-[#8696a0] mt-0.5">Alerts, banners, and preview preferences</p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white">Message notifications</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">
                      Show in-app and system banners for incoming messages
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-[#00a884] rounded flex-shrink-0"
                  />
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white">Show message previews</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">
                      Display sender name and message snippet in popups
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={previewEnabled}
                    onChange={(e) => setPreviewEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#00a884] rounded flex-shrink-0"
                  />
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white">Reaction notifications</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">
                      Notify when contacts react to your sent messages
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reactionNotifications}
                    onChange={(e) => setReactionNotifications(e.target.checked)}
                    className="w-4 h-4 accent-[#00a884] rounded flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-5 w-full max-w-full md:max-w-lg">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Privacy</h3>
                <p className="text-xs text-[#8696a0] mt-0.5">Read receipts, activity visibility, and message timers</p>
              </div>

              <div className="space-y-3">
                {/* Read receipts */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white">Read receipts (Blue ticks)</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">
                      If turned off, read receipts won't be sent or received for 1:1 chats.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={(e) => setReadReceipts(e.target.checked)}
                    className="w-4 h-4 accent-[#00a884] rounded flex-shrink-0"
                  />
                </div>

                {/* Last seen & online */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white">Last seen & online</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">Control who can see your online presence</div>
                  </div>
                  <select
                    value={lastSeenPrivacy}
                    onChange={(e) => setLastSeenPrivacy(e.target.value)}
                    className="bg-[#111b21] border border-[#2a3942] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none flex-shrink-0"
                  >
                    <option value="Everyone">Everyone</option>
                    <option value="My contacts">My contacts</option>
                    <option value="Nobody">Nobody</option>
                  </select>
                </div>

                {/* Disappearing messages */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-white">Default message timer</div>
                    <div className="text-[11px] text-[#8696a0] mt-0.5">
                      Start new chats with auto-clearing timer
                    </div>
                  </div>
                  <select
                    value={disappearingTimer}
                    onChange={(e) => setDisappearingTimer(e.target.value)}
                    className="bg-[#111b21] border border-[#2a3942] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none flex-shrink-0"
                  >
                    <option value="Off">Off</option>
                    <option value="24 hours">24 hours</option>
                    <option value="7 days">7 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 7. Keyboard Shortcuts */}
          {activeTab === "shortcuts" && (
            <div className="space-y-5 w-full max-w-full md:max-w-lg">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Keyboard shortcuts</h3>
                <p className="text-xs text-[#8696a0] mt-0.5">Quick navigation hotkeys for desktop power users</p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] divide-y divide-[#2a3942]">
                {[
                  { action: "New chat", keys: ["Ctrl", "Alt", "N"] },
                  { action: "Search chats", keys: ["Ctrl", "Alt", "/"] },
                  { action: "Next chat", keys: ["Ctrl", "Alt", "Tab"] },
                  { action: "Previous chat", keys: ["Ctrl", "Alt", "Shift", "Tab"] },
                  { action: "Close chat", keys: ["Escape"] },
                  { action: "Mute conversation", keys: ["Ctrl", "Alt", "Shift", "M"] },
                  { action: "Archive conversation", keys: ["Ctrl", "Alt", "Shift", "E"] },
                  { action: "Open Settings", keys: ["Ctrl", "Alt", ","] },
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-xs gap-2">
                    <span className="text-[#d1d7db] truncate">{s.action}</span>
                    <div className="flex items-center gap-1 font-mono flex-shrink-0">
                      {s.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-1.5 sm:px-2 py-0.5 rounded bg-[#111b21] border border-[#2a3942] text-[10px] text-[#aebac1]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Help Tab */}
          {activeTab === "help" && (
            <div className="space-y-5 w-full max-w-full md:max-w-lg">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Help</h3>
                <p className="text-xs text-[#8696a0] mt-0.5">About PulseChat, license, and developer info</p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#00a884]">
                    PulseChat Desktop & Web
                  </div>
                  <span className="text-[10px] text-[#8696a0] bg-[#111b21] px-2 py-0.5 rounded-full border border-[#2a3942]">
                    v2.24.18
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#111b21] border border-[#2a3942] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    SK
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white">Made by Shamshad Khan</div>
                    <div className="text-[11px] text-[#8696a0] truncate">
                      Real-time messaging, audio & video calling
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#2a3942] pt-3 space-y-2">
                  <a href="#" className="block text-[#00a884] hover:underline">
                    Help Center & FAQs
                  </a>
                  <a href="#" className="block text-[#00a884] hover:underline">
                    Terms & Privacy Policy
                  </a>
                  <a href="#" className="block text-[#00a884] hover:underline">
                    Licenses & Third-Party Notices
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
