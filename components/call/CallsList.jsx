"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Link2,
  Plus,
  Search,
  X,
  Trash2,
  MessageSquare,
  Users,
  Check,
  Loader2,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useChatStore from "../../store/chatStore";
import { getAvatarColor, getInitials } from "../../lib/utils";
import ConfirmModal from "../ui/ConfirmModal";
import {
  getCallHistory,
  deleteCallLog,
  clearCallHistory,
} from "../../lib/callHistory";
import { getAllUsers, searchUsers } from "../../services/userService";

export default function CallsList({
  onStartVoiceCall,
  onStartVideoCall,
  onSelectContactForChat,
  conversations = [],
}) {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const onlineUsers = useChatStore((state) => state.onlineUsers);

  const [calls, setCalls] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'missed'
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedCallDetail, setSelectedCallDetail] = useState(null);
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);
  const [modalUsers, setModalUsers] = useState([]);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [loadingModalUsers, setLoadingModalUsers] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Delete",
    onConfirm: null,
  });

  // Load call history isolated for current logged-in user + listen to real-time call updates
  useEffect(() => {
    const refreshHistory = () => {
      if (currentUserId) {
        setCalls(getCallHistory(currentUserId));
      } else {
        setCalls([]);
      }
    };

    refreshHistory();
    window.addEventListener("wa_call_history_updated", refreshHistory);
    window.addEventListener("storage", refreshHistory);

    return () => {
      window.removeEventListener("wa_call_history_updated", refreshHistory);
      window.removeEventListener("storage", refreshHistory);
    };
  }, [currentUserId]);

  // Load registered contacts when "New Call" modal opens
  useEffect(() => {
    if (!isNewCallModalOpen) return;

    let isMounted = true;
    const fetchContacts = async () => {
      try {
        setLoadingModalUsers(true);
        if (modalSearchQuery.trim()) {
          const res = await searchUsers(modalSearchQuery.trim());
          if (isMounted) setModalUsers(res.users || []);
        } else {
          const res = await getAllUsers();
          if (isMounted) setModalUsers(res.users || []);
        }
      } catch (err) {
        console.error("Failed to load contacts for calling:", err);
      } finally {
        if (isMounted) setLoadingModalUsers(false);
      }
    };

    const timer = setTimeout(fetchContacts, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isNewCallModalOpen, modalSearchQuery]);

  const filteredCalls = useMemo(() => {
    let list = [...calls];
    if (activeFilter === "missed") {
      list = list.filter((c) => c.direction === "missed");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.contactName?.toLowerCase().includes(q) ||
          c.contactUsername?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [calls, activeFilter, searchQuery]);

  // Combined selectable contacts for "New Call" modal
  const selectableContacts = useMemo(() => {
    const list = [];
    const seenUserIds = new Set();

    // 1. First include other users from active conversations
    (conversations || []).forEach((conv) => {
      if (conv.type === "direct") {
        const other = conv.members?.find(
          (m) => (m._id || m.id)?.toString() !== currentUserId
        );
        if (other) {
          const uId = (other._id || other.id)?.toString();
          if (uId && !seenUserIds.has(uId)) {
            seenUserIds.add(uId);
            list.push({
              _id: uId,
              id: uId,
              name: other.name || other.username || "Contact",
              username: other.username || "",
              avatar: other.avatar || null,
              conversationId: conv._id,
              isGroup: false,
            });
          }
        }
      } else if (conv.type === "group") {
        // Also support groups in the call modal
        list.push({
          _id: conv._id,
          id: conv._id,
          name: conv.name || "Group Call",
          username: `${conv.members?.length || 0} members`,
          avatar: conv.avatar || null,
          conversationId: conv._id,
          isGroup: true,
          members: conv.members,
        });
      }
    });

    // 2. Include all registered users from modalUsers not already added
    (modalUsers || []).forEach((u) => {
      const uId = (u._id || u.id)?.toString();
      if (uId && uId !== currentUserId && !seenUserIds.has(uId)) {
        seenUserIds.add(uId);
        // Find if an active direct conversation exists for this user
        const matchingConv = (conversations || []).find(
          (c) =>
            c.type === "direct" &&
            (c.members || []).some((m) => (m._id || m.id)?.toString() === uId)
        );

        list.push({
          _id: uId,
          id: uId,
          name: u.name || u.username || "User",
          username: u.username || "",
          avatar: u.avatar || null,
          conversationId: matchingConv?._id || "call",
          isGroup: false,
        });
      }
    });

    // Filter by modal search query
    if (modalSearchQuery.trim()) {
      const q = modalSearchQuery.toLowerCase();
      return list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.username?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [conversations, modalUsers, currentUserId, modalSearchQuery]);

  const handleCreateCallLink = () => {
    const link = `${window.location.origin}/chat?call_link=wa-${Date.now()}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCallUser = (targetItem, isVideo = false) => {
    let recipientId =
      targetItem?._id ||
      targetItem?.id ||
      targetItem?.contactId;
    let targetName = targetItem?.name || targetItem?.contactName || "Contact";
    let targetUsername = targetItem?.username || targetItem?.contactUsername || "";
    let targetAvatar = targetItem?.avatar || null;
    let convId = targetItem?.conversationId;
    let isGroup = !!targetItem?.isGroup;

    // 1. If recipientId is missing, resolve it from conversations
    if (!recipientId && (conversations || []).length > 0) {
      const match = conversations.find((c) => {
        if (c.name && c.name === targetName) return true;
        return (c.members || []).some(
          (m) =>
            m.name === targetName ||
            (targetUsername && m.username === targetUsername)
        );
      });

      if (match) {
        convId = convId || match._id;
        isGroup = isGroup || match.type === "group";
        if (match.type === "direct") {
          const other = match.members?.find(
            (m) => (m._id || m.id)?.toString() !== currentUserId
          );
          if (other) {
            recipientId = other._id || other.id;
            targetName = other.name || targetName;
            targetUsername = other.username || targetUsername;
            targetAvatar = other.avatar || targetAvatar;
          }
        } else {
          const other =
            match.members?.find(
              (m) => (m._id || m.id)?.toString() !== currentUserId
            ) || match.members?.[0];
          if (other) {
            recipientId = other._id || other.id;
          }
        }
      }
    }

    // 2. Fallback: check modalUsers list
    if (!recipientId && (modalUsers || []).length > 0) {
      const uMatch = modalUsers.find(
        (u) =>
          u.name === targetName ||
          (targetUsername && u.username === targetUsername)
      );
      if (uMatch) {
        recipientId = uMatch._id || uMatch.id;
        targetName = uMatch.name || targetName;
        targetUsername = uMatch.username || targetUsername;
        targetAvatar = uMatch.avatar || targetAvatar;
      }
    }

    if (!recipientId) {
      console.warn("Could not find a valid user ID to call:", targetItem);
      return;
    }

    const recipientObj = {
      _id: recipientId,
      id: recipientId,
      name: targetName,
      username: targetUsername,
      avatar: targetAvatar,
      isGroup,
      conversationId: convId || "call",
    };

    if (selectedCallDetail) {
      setSelectedCallDetail(null);
    }

    // Trigger call - useWebRTC's startCall will log the call properly in history
    if (isVideo) {
      if (onStartVideoCall) onStartVideoCall(recipientObj, convId);
    } else {
      if (onStartVoiceCall) onStartVoiceCall(recipientObj, convId);
    }
  };

  const handleDeleteCall = (e, callId) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Delete call log?",
      message: "Do you want to delete this call from your history?",
      confirmText: "Delete",
      onConfirm: () => {
        if (currentUserId) {
          const updated = deleteCallLog(currentUserId, callId);
          setCalls(updated);
        } else {
          setCalls((prev) => prev.filter((c) => c.id !== callId));
        }
        if (selectedCallDetail?.id === callId) {
          setSelectedCallDetail(null);
        }
      },
    });
  };

  const handleClearHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: "Clear all calls?",
      message: "Do you want to clear your entire call log history? This action cannot be undone.",
      confirmText: "Clear all",
      onConfirm: () => {
        clearCallHistory(currentUserId);
        setCalls([]);
        setSelectedCallDetail(null);
      },
    });
  };

  const handleOpenChatFromCall = (callItem) => {
    if (!onSelectContactForChat) return;

    if (callItem.conversationId) {
      const matchingConv = conversations.find(
        (c) => c._id?.toString() === callItem.conversationId?.toString()
      );
      if (matchingConv) {
        onSelectContactForChat(matchingConv);
        return;
      }
    }

    if (callItem.contactId) {
      const matchingConv = conversations.find(
        (c) =>
          c.type === "direct" &&
          (c.members || []).some(
            (m) => (m._id || m.id)?.toString() === callItem.contactId?.toString()
          )
      );
      if (matchingConv) {
        onSelectContactForChat(matchingConv);
        return;
      }
    }

    const matchingConv = conversations.find(
      (c) =>
        c.name === callItem.contactName ||
        (c.members || []).some(
          (m) =>
            m.name === callItem.contactName ||
            (callItem.contactUsername && m.username === callItem.contactUsername)
        )
    );
    if (matchingConv) {
      onSelectContactForChat(matchingConv);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-[#e9edef] select-none border-r border-[#222e35]">
      {/* 1. Header: Calls Title, Search, and New Call Button */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h1 className="text-xl font-bold tracking-tight text-[#e9edef]">Calls</h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsNewCallModalOpen(true)}
            title="Start a new call"
            className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008069] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="px-3 py-1.5">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#8696a0] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search call logs"
            className="w-full pl-10 pr-8 py-1.5 rounded-lg bg-[#202c33] text-xs text-[#d1d7db] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]/80 transition-all border border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-[#8696a0] hover:text-[#d1d7db]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter Pills: All / Missed & Clear Log */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#222e35]/60">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            activeFilter === "all"
              ? "bg-[#103629] text-[#25d366]"
              : "bg-[#202c33] text-[#8696a0] hover:text-[#d1d7db] hover:bg-[#2a3942]"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("missed")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeFilter === "missed"
              ? "bg-[#103629] text-[#25d366]"
              : "bg-[#202c33] text-[#8696a0] hover:text-[#d1d7db] hover:bg-[#2a3942]"
          }`}
        >
          <span>Missed</span>
          {calls.filter((c) => c.direction === "missed").length > 0 && (
            <span className="text-[11px] font-bold text-rose-400">
              {calls.filter((c) => c.direction === "missed").length}
            </span>
          )}
        </button>

        {calls.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="ml-auto text-[11px] text-[#8696a0] hover:text-rose-400 transition-colors"
          >
            Clear log
          </button>
        )}
      </div>

      {/* 4. Call History Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]/40">
        {/* Create Call Link Banner */}
        <div
          onClick={handleCreateCallLink}
          className="flex items-center gap-3 px-3 py-3 hover:bg-[#202c33] cursor-pointer transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <Link2 className="w-5 h-5 -rotate-45" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-[#e9edef] flex items-center gap-2">
              <span>Create call link</span>
              {copiedLink && (
                <span className="text-[10px] text-[#25d366] font-normal flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Copied link
                </span>
              )}
            </div>
            <p className="text-xs text-[#8696a0] truncate mt-0.5">
              Share a link for your PulseChat call
            </p>
          </div>
        </div>

        <div className="px-3 py-2 text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider bg-[#111b21]">
          Recent Calls
        </div>

        {filteredCalls.length === 0 ? (
          <div className="py-20 px-4 text-center text-[#8696a0]">
            <div className="w-12 h-12 rounded-full bg-[#202c33] flex items-center justify-center mx-auto mb-3 text-xl">
              📞
            </div>
            <p className="text-sm font-semibold text-[#e9edef]">No calls in history</p>
            <p className="text-xs text-[#8696a0] mt-1 max-w-xs mx-auto">
              {searchQuery
                ? "No calls match your search query."
                : "Calls with other contacts will appear here. Click 'Start a Call' to begin."}
            </p>
            <button
              type="button"
              onClick={() => setIsNewCallModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-full bg-[#00a884] hover:bg-[#008069] text-white text-xs font-medium shadow-md transition-all active:scale-95"
            >
              Start a Call
            </button>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const isMissed = call.direction === "missed";

            return (
              <div
                key={call.id}
                onClick={() => setSelectedCallDetail(call)}
                className={`group flex items-center justify-between px-3 py-2.5 hover:bg-[#202c33] cursor-pointer transition-colors ${
                  selectedCallDetail?.id === call.id ? "bg-[#2a3942]" : ""
                }`}
              >
                {/* Left: Avatar */}
                <div className="relative flex-shrink-0 mr-3">
                  {call.avatar ? (
                    <img
                      src={call.avatar}
                      alt={call.contactName}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-[#222e35]"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#534b3e] flex items-center justify-center text-[#e9edef] font-semibold text-sm shadow-xs">
                      {call.isGroup ? (
                        <Users className="w-5 h-5 text-[#d1d7db]" />
                      ) : (
                        getInitials(call.contactName)
                      )}
                    </div>
                  )}
                </div>

                {/* Middle: Name, Direction Arrow, Timestamp */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-medium truncate ${
                      isMissed ? "text-rose-400" : "text-[#e9edef]"
                    }`}
                  >
                    {call.contactName}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mt-0.5">
                    {/* Direction Arrow */}
                    {isMissed ? (
                      <PhoneMissed className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    ) : call.direction === "incoming" ? (
                      <PhoneIncoming className="w-3.5 h-3.5 text-[#25d366] flex-shrink-0" />
                    ) : (
                      <PhoneOutgoing className="w-3.5 h-3.5 text-[#25d366] flex-shrink-0" />
                    )}

                    <span className="truncate">{call.timestamp}</span>
                    {call.duration && call.duration !== "0s" && (
                      <span className="text-[10px] text-[#8696a0]/70">
                        ({call.duration})
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Quick Action Buttons (Call, Video, Delete) */}
                <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCallUser(call, false);
                    }}
                    title="Voice call"
                    className="p-2 rounded-full text-[#00a884] hover:bg-[#2a3942] active:scale-95 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCallUser(call, true);
                    }}
                    title="Video call"
                    className="p-2 rounded-full text-[#00a884] hover:bg-[#2a3942] active:scale-95 transition-all"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  {/* Delete this single call log entry */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCall(e, call.id)}
                    title="Delete call from log"
                    className="p-2 rounded-full text-[#8696a0] hover:text-rose-400 hover:bg-[#2a3942] active:scale-95 transition-all opacity-80 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Call Detail Popup / Modal Drawer */}
      {selectedCallDetail && (
        <div className="p-4 bg-[#202c33] border-t border-[#222e35] animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
              Call Details
            </span>
            <button
              type="button"
              onClick={() => setSelectedCallDetail(null)}
              className="text-[#8696a0] hover:text-[#e9edef]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-sm text-white">
                {selectedCallDetail.contactName}
              </div>
              <div className="text-xs text-[#8696a0] mt-0.5">
                {selectedCallDetail.type === "video" ? "Video call" : "Voice call"} •{" "}
                {selectedCallDetail.timestamp}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {/* Message Contact Button */}
              <button
                type="button"
                onClick={() => handleOpenChatFromCall(selectedCallDetail)}
                title="Open chat"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#2a3942] hover:bg-[#374248] text-[#d1d7db] text-xs font-medium"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>

              {/* Call */}
              <button
                type="button"
                onClick={() => handleCallUser(selectedCallDetail, false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#008069] hover:bg-[#00a884] text-white text-xs font-medium"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>

              {/* Video */}
              <button
                type="button"
                onClick={() => handleCallUser(selectedCallDetail, true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#2a3942] hover:bg-[#374248] text-[#00a884] text-xs font-medium border border-[#2a3942]"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video</span>
              </button>

              {/* Delete this call */}
              <button
                type="button"
                onClick={(e) => handleDeleteCall(e, selectedCallDetail.id)}
                title="Delete call"
                className="p-1.5 rounded-full text-[#8696a0] hover:text-rose-400 hover:bg-[#2a3942]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Start New Call Modal */}
      {isNewCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-[#111b21] border border-[#222e35] p-5 shadow-2xl animate-in zoom-in-95 duration-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base text-white">New Call</h3>
              <button
                type="button"
                onClick={() => {
                  setIsNewCallModalOpen(false);
                  setModalSearchQuery("");
                }}
                className="text-[#8696a0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8696a0] mb-3">
              Select a contact to start an encrypted voice or video call:
            </p>

            {/* Search Input inside Modal */}
            <div className="relative flex items-center mb-3">
              <Search className="absolute left-3 w-3.5 h-3.5 text-[#8696a0] pointer-events-none" />
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder="Search contacts by name or username"
                className="w-full pl-9 pr-7 py-1.5 rounded-lg bg-[#202c33] text-xs text-[#d1d7db] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]/80 transition-all border border-transparent"
              />
              {modalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setModalSearchQuery("")}
                  className="absolute right-2 text-[#8696a0] hover:text-[#d1d7db]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Contact list */}
            <div className="overflow-y-auto flex-1 divide-y divide-[#222e35] space-y-1">
              {loadingModalUsers ? (
                <div className="py-10 flex flex-col items-center justify-center text-[#00a884]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs text-[#8696a0] mt-2">Loading contacts...</span>
                </div>
              ) : selectableContacts.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8696a0]">
                  {modalSearchQuery
                    ? "No contacts match your search."
                    : "No contacts available. Start a chat first."}
                </div>
              ) : (
                selectableContacts.map((contact) => {
                  const isOnline =
                    !contact.isGroup &&
                    onlineUsers.some((id) => id?.toString() === contact._id?.toString());

                  return (
                    <div
                      key={contact._id}
                      className="flex items-center justify-between py-2.5 px-2 hover:bg-[#202c33] rounded-xl transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {contact.avatar ? (
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-[#222e35]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#202c33] flex items-center justify-center text-[#e9edef] font-semibold text-xs border border-[#2a3942]">
                              {contact.isGroup ? (
                                <Users className="w-4 h-4 text-[#00a884]" />
                              ) : (
                                getInitials(contact.name)
                              )}
                            </div>
                          )}
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25d366] ring-2 ring-[#111b21]" />
                          )}
                        </div>

                        {/* Name and username */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#e9edef] truncate">
                            {contact.name}
                          </p>
                          <p className="text-[11px] text-[#8696a0] truncate mt-0.2">
                            {contact.isGroup
                              ? contact.username
                              : isOnline
                              ? "Online"
                              : contact.username
                              ? `@${contact.username}`
                              : "Offline"}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewCallModalOpen(false);
                            setModalSearchQuery("");
                            handleCallUser(contact, false);
                          }}
                          title="Voice call"
                          className="p-2 rounded-full text-[#00a884] hover:bg-[#2a3942] active:scale-95 transition-all"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewCallModalOpen(false);
                            setModalSearchQuery("");
                            handleCallUser(contact, true);
                          }}
                          title="Video call"
                          className="p-2 rounded-full text-[#00a884] hover:bg-[#2a3942] active:scale-95 transition-all"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
