"use client";

import { useState, useEffect } from "react";
import {
  CircleDot,
  Plus,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Eye,
  Trash2,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { getInitials } from "../../lib/utils";
import socket from "../../lib/socket";

// Priya Mali is the only preset status kept
const INITIAL_STATUSES = [
  {
    id: "st-priya",
    contactName: "Priya Mali",
    contactUsername: "priyamali",
    avatar: null,
    caption: "Coffee & Code ☕💻 Sprint goals progressing smoothly!",
    mediaUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=60",
    timestamp: "Today, 9:45 AM",
    createdAt: new Date().toISOString(),
    viewed: false,
    isMine: false,
  },
];

const PRESET_BACKGROUNDS = [
  { id: "bg-1", url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=60", label: "Nature" },
  { id: "bg-2", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60", label: "Ocean" },
  { id: "bg-3", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=60", label: "Mountains" },
  { id: "bg-4", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60", label: "Tech" },
];

export default function StatusList({ currentUser, onSendReply }) {
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

  const [statuses, setStatuses] = useState(INITIAL_STATUSES);
  const [activeStory, setActiveStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [myStatus, setMyStatus] = useState(null);

  const [isAddStatusOpen, setIsAddStatusOpen] = useState(false);
  const [newStatusText, setNewStatusText] = useState("");
  const [newStatusMedia, setNewStatusMedia] = useState("");
  const [selectedBg, setSelectedBg] = useState("");

  // Load My Status from localStorage
  useEffect(() => {
    if (!currentUserId) return;
    try {
      const saved = localStorage.getItem(`wa_my_status_${currentUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const created = new Date(parsed.createdAt || 0).getTime();
        // Expire status after 24 hours
        if (!created || Date.now() - created < 24 * 60 * 60 * 1000) {
          setMyStatus(parsed);
        } else {
          localStorage.removeItem(`wa_my_status_${currentUserId}`);
          setMyStatus(null);
        }
      } else {
        setMyStatus(null);
      }
    } catch (e) {
      console.error("Error reading my status:", e);
    }
  }, [currentUserId]);

  // Load community statuses (ONLY Priya + real user-posted statuses; clean out any old dummy data)
  useEffect(() => {
    const loadCommunityStatuses = () => {
      try {
        const saved = localStorage.getItem("wa_community_statuses");
        let extra = [];
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Strictly exclude any old dummy statuses for Afreen, Vaibhav, Muaz
            extra = parsed.filter((s) => {
              const name = (s.contactName || "").toLowerCase();
              if (
                name.includes("afreen") ||
                name.includes("vaibhav") ||
                name.includes("muaz")
              ) {
                return false;
              }
              const created = new Date(s.createdAt || 0).getTime();
              return !created || Date.now() - created < 24 * 60 * 60 * 1000;
            });
          }
        }

        // Resave cleaned list without old dummy names
        localStorage.setItem("wa_community_statuses", JSON.stringify(extra));

        // Merge INITIAL_STATUSES (only Priya) with active user-posted statuses
        const all = [...INITIAL_STATUSES];
        extra.forEach((st) => {
          if (!all.some((item) => item.id === st.id)) {
            // Exclude current user's own status from other contacts list
            if (st.userId !== currentUserId) {
              all.unshift(st);
            }
          }
        });

        setStatuses(all);
      } catch (e) {
        console.error("Error loading statuses:", e);
        setStatuses(INITIAL_STATUSES);
      }
    };

    loadCommunityStatuses();

    // Listen for real-time status broadcasts from other connected users
    const handleStatusBroadcast = (newStatus) => {
      if (!newStatus || !newStatus.id) return;
      if (newStatus.userId === currentUserId) return;

      const name = (newStatus.contactName || "").toLowerCase();
      if (
        name.includes("afreen") ||
        name.includes("vaibhav") ||
        name.includes("muaz")
      ) {
        return;
      }

      setStatuses((prev) => {
        if (prev.some((s) => s.id === newStatus.id)) return prev;
        const updated = [newStatus, ...prev];
        try {
          const saved = localStorage.getItem("wa_community_statuses");
          const list = saved ? JSON.parse(saved) : [];
          if (!list.some((s) => s.id === newStatus.id)) {
            localStorage.setItem("wa_community_statuses", JSON.stringify([newStatus, ...list]));
          }
        } catch (err) {}
        return updated;
      });
    };

    socket.on("status:broadcast", handleStatusBroadcast);

    const onStorage = () => loadCommunityStatuses();
    window.addEventListener("storage", onStorage);
    window.addEventListener("wa_status_updated", onStorage);

    return () => {
      socket.off("status:broadcast", handleStatusBroadcast);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("wa_status_updated", onStorage);
    };
  }, [currentUserId]);

  // Story auto-advance timer
  useEffect(() => {
    if (!activeStory) {
      setStoryProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          // Advance to next unviewed status or close
          const currentIdx = statuses.findIndex((s) => s.id === activeStory.id);
          if (currentIdx !== -1 && currentIdx < statuses.length - 1) {
            setActiveStory(statuses[currentIdx + 1]);
            return 0;
          } else {
            setActiveStory(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory, statuses]);

  const handleOpenStory = (statusItem) => {
    setActiveStory(statusItem);
    setStoryProgress(0);

    if (!statusItem.isMine) {
      // Mark contact's status as viewed
      setStatuses((prev) =>
        prev.map((s) => (s.id === statusItem.id ? { ...s, viewed: true } : s))
      );
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory) return;
    if (onSendReply) {
      onSendReply(
        activeStory.contactName,
        `Replying to status: "${activeStory.caption}"\n\n${replyText}`
      );
    }
    setReplyText("");
    setActiveStory(null);
  };

  const handleAddStatus = (e) => {
    e.preventDefault();
    if (!newStatusText.trim() && !newStatusMedia && !selectedBg) return;

    const newStatusItem = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: currentUserId,
      contactName: currentUser?.name || "You",
      contactUsername: currentUser?.username || "you",
      avatar: currentUser?.avatar || null,
      caption: newStatusText.trim() || "Status update",
      mediaUrl: newStatusMedia.trim() || selectedBg || null,
      timestamp: "Just now",
      createdAt: new Date().toISOString(),
      viewed: false,
      isMine: true,
      viewsCount: 0,
    };

    // 1. Update My Status
    setMyStatus(newStatusItem);
    if (currentUserId) {
      localStorage.setItem(`wa_my_status_${currentUserId}`, JSON.stringify(newStatusItem));
    }

    // 2. Persist in community statuses
    try {
      const saved = localStorage.getItem("wa_community_statuses");
      const list = saved ? JSON.parse(saved) : [];
      const updatedList = [newStatusItem, ...list.filter((s) => s.id !== newStatusItem.id)];
      localStorage.setItem("wa_community_statuses", JSON.stringify(updatedList));
    } catch (err) {}

    // 3. Broadcast to all users in real-time
    socket.emit("status:new", newStatusItem);
    window.dispatchEvent(new CustomEvent("wa_status_updated"));

    setNewStatusText("");
    setNewStatusMedia("");
    setSelectedBg("");
    setIsAddStatusOpen(false);
  };

  const handleDeleteMyStatus = () => {
    setMyStatus(null);
    if (currentUserId) {
      localStorage.removeItem(`wa_my_status_${currentUserId}`);
    }
    try {
      const saved = localStorage.getItem("wa_community_statuses");
      if (saved) {
        const list = JSON.parse(saved);
        const filtered = list.filter((s) => s.userId !== currentUserId);
        localStorage.setItem("wa_community_statuses", JSON.stringify(filtered));
      }
    } catch (err) {}

    if (activeStory?.isMine) {
      setActiveStory(null);
    }
    window.dispatchEvent(new CustomEvent("wa_status_updated"));
  };

  // Contacts' statuses (exclude own status from other contacts' section)
  const contactStatuses = statuses.filter((s) => !s.isMine && s.userId !== currentUserId);
  const recentStatuses = contactStatuses.filter((s) => !s.viewed);
  const viewedStatuses = contactStatuses.filter((s) => s.viewed);

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-[#e9edef] select-none border-r border-[#222e35]">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h1 className="text-xl font-bold tracking-tight text-[#e9edef]">Status</h1>
        <button
          type="button"
          onClick={() => setIsAddStatusOpen(true)}
          title="Add status update"
          className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008069] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. Scrollable Status List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]/40">
        {/* My Status */}
        <div className="flex items-center justify-between px-3 py-3 hover:bg-[#202c33] cursor-pointer transition-colors group">
          <div
            onClick={() => {
              if (myStatus && myStatus.caption) {
                handleOpenStory(myStatus);
              } else {
                setIsAddStatusOpen(true);
              }
            }}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <div className="relative flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm ${
                  myStatus ? "p-[2.5px] border-2 border-[#25d366]" : "bg-[#534b3e]"
                }`}
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(currentUser?.name || "You")
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddStatusOpen(true);
                }}
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00a884] border-2 border-[#111b21] flex items-center justify-center text-white text-[10px] font-bold hover:scale-110 transition-transform"
                title="Add new status"
              >
                +
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-[#e9edef]">My status</div>
              <p className="text-xs text-[#8696a0] truncate mt-0.5">
                {myStatus?.caption
                  ? `${myStatus.caption} • ${myStatus.timestamp || "Today"}`
                  : "Tap to add status update"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {myStatus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMyStatus();
                }}
                className="p-1.5 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-rose-400 transition-colors"
                title="Delete my status"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddStatusOpen(true);
              }}
              className="p-1.5 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-[#00a884] transition-colors"
              title="Add status update"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent Updates */}
        {recentStatuses.length > 0 && (
          <div>
            <div className="px-3 py-2 text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider bg-[#111b21]">
              Recent updates
            </div>
            {recentStatuses.map((st) => (
              <div
                key={st.id}
                onClick={() => handleOpenStory(st)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#202c33] cursor-pointer transition-colors"
              >
                {/* Green Ring Avatar */}
                <div className="relative p-[2.5px] rounded-full border-2 border-[#25d366] flex-shrink-0 shadow-xs">
                  {st.avatar ? (
                    <img
                      src={st.avatar}
                      alt={st.contactName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#534b3e] flex items-center justify-center text-white font-bold text-xs">
                      {getInitials(st.contactName)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white truncate">
                    {st.contactName}
                  </div>
                  <p className="text-xs text-[#8696a0] truncate mt-0.5">
                    {st.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Viewed Updates */}
        {viewedStatuses.length > 0 && (
          <div>
            <div className="px-3 py-2 text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider bg-[#111b21]">
              Viewed updates
            </div>
            {viewedStatuses.map((st) => (
              <div
                key={st.id}
                onClick={() => handleOpenStory(st)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#202c33] cursor-pointer transition-colors opacity-75 hover:opacity-100"
              >
                {/* Gray Ring Avatar */}
                <div className="relative p-[2px] rounded-full border-2 border-[#8696a0]/50 flex-shrink-0">
                  {st.avatar ? (
                    <img
                      src={st.avatar}
                      alt={st.contactName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#534b3e] flex items-center justify-center text-white font-bold text-xs">
                      {getInitials(st.contactName)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[#d1d7db] truncate">
                    {st.contactName}
                  </div>
                  <p className="text-xs text-[#8696a0] truncate mt-0.5">
                    {st.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state when no contact updates exist */}
        {contactStatuses.length === 0 && (
          <div className="py-16 px-4 text-center text-[#8696a0]">
            <div className="w-12 h-12 rounded-full bg-[#202c33] flex items-center justify-center mx-auto mb-2.5 text-lg">
              <CircleDot className="w-6 h-6 text-[#00a884]" />
            </div>
            <p className="text-sm font-semibold text-[#e9edef]">No recent updates</p>
            <p className="text-xs text-[#8696a0] mt-1 max-w-xs mx-auto">
              When your contacts post status updates, they will appear here.
            </p>
          </div>
        )}
      </div>

      {/* 3. Fullscreen Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-150">
          <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:max-h-[720px] rounded-none sm:rounded-2xl overflow-hidden bg-[#111b21] border-0 sm:border border-[#2a3942] flex flex-col justify-between shadow-2xl">
            {/* Top Progress Bar */}
            <div className="absolute top-0 left-0 right-0 p-3 z-20 space-y-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{ width: `${storyProgress}%` }}
                />
              </div>

              {/* Story Header */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#534b3e] flex items-center justify-center text-xs font-bold ring-2 ring-[#00a884] overflow-hidden">
                    {activeStory.avatar ? (
                      <img
                        src={activeStory.avatar}
                        alt={activeStory.contactName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(activeStory.contactName)
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm">
                      {activeStory.contactName} {activeStory.isMine && "(You)"}
                    </div>
                    <div className="text-[10px] text-white/70">{activeStory.timestamp}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeStory.isMine && (
                    <button
                      type="button"
                      onClick={handleDeleteMyStatus}
                      className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-rose-400 transition-colors"
                      title="Delete status"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveStory(null)}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Media / Image */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#0c1317]">
              {activeStory.mediaUrl ? (
                <img
                  src={activeStory.mediaUrl}
                  alt={activeStory.caption}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-8 text-center text-lg sm:text-xl font-medium text-white max-w-sm leading-relaxed">
                  {activeStory.caption}
                </div>
              )}

              {/* Caption Overlay */}
              {activeStory.mediaUrl && (
                <div className="absolute bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-center text-sm font-medium text-white">
                  {activeStory.caption}
                </div>
              )}
            </div>

            {/* Bottom Actions: Reply if other contact's story, views counter if own story */}
            <div className="p-3 bg-[#202c33] border-t border-[#222e35] z-20">
              {activeStory.isMine ? (
                <div className="flex items-center justify-between text-xs text-[#8696a0] px-2 py-1">
                  <div className="flex items-center gap-1.5 text-[#00a884]">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">Viewed by contacts</span>
                  </div>
                  <span className="text-[11px] text-[#8696a0]">Disappears in 24 hours</span>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${activeStory.contactName}...`}
                    className="flex-1 bg-[#111b21] border border-[#2a3942] rounded-full px-4 py-2 text-xs text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-2 rounded-full bg-[#00a884] hover:bg-[#008069] text-white disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Status Dialog */}
      {isAddStatusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#111b21] border border-[#222e35] p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-semibold text-base text-white">New Status Update</h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddStatusOpen(false);
                  setSelectedBg("");
                }}
                className="text-[#8696a0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStatus} className="space-y-4">
              <div>
                <textarea
                  value={newStatusText}
                  onChange={(e) => setNewStatusText(e.target.value)}
                  placeholder="What's on your mind? Type a status update..."
                  rows={3}
                  className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-3 text-sm text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                  autoFocus
                />
              </div>

              {/* Background photo choice */}
              <div>
                <label className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider block mb-1.5">
                  Optional Background Image
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        setSelectedBg(selectedBg === bg.url ? "" : bg.url);
                        setNewStatusMedia("");
                      }}
                      className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedBg === bg.url
                          ? "border-[#00a884] shadow-md scale-102"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-medium text-white">
                        {bg.label}
                      </span>
                      {selectedBg === bg.url && (
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#00a884] flex items-center justify-center text-white text-[8px]">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Or Custom Image URL */}
              <div>
                <input
                  type="text"
                  value={newStatusMedia}
                  onChange={(e) => {
                    setNewStatusMedia(e.target.value);
                    setSelectedBg("");
                  }}
                  placeholder="Or paste an image URL (optional)..."
                  className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-3 py-2 text-xs text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddStatusOpen(false);
                    setSelectedBg("");
                  }}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[#8696a0] hover:bg-[#202c33]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newStatusText.trim() && !newStatusMedia && !selectedBg}
                  className="px-5 py-2 rounded-full bg-[#00a884] hover:bg-[#008069] text-white text-xs font-semibold disabled:opacity-40 active:scale-95 transition-all shadow-md"
                >
                  Post Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
