"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import NewChatModal from "./NewChatModal";
import CreateGroup from "../group/CreateGroup";
import GroupSetting from "../group/GroupSetting";
import GlobalSearchModal from "./GlobalSearchModal";
import ProfileModal from "../profile/ProfileModal";
import IncomingCallModal from "../call/IncomingCallModal";
import VideoCallModal from "../call/VideoCallModal";
import NotificationBanner from "./NotificationBanner";
import LiveClock from "./LiveClock";
import WhatsAppTitleBar from "./WhatsAppTitleBar";
import WhatsAppSidebarDock from "./WhatsAppSidebarDock";
import WhatsAppEmptyState from "./WhatsAppEmptyState";
import DummyLLMChat from "./DummyLLMChat";
import WhatsAppSettingsModal from "./WhatsAppSettingsModal";
import CallsList from "../call/CallsList";
import ContactInfoSidebar from "./ContactInfoSidebar";
import StatusList from "../status/StatusList";
import ChannelsCommunitiesView from "./ChannelsCommunitiesView";
import ConfirmModal from "../ui/ConfirmModal";
import { getCallHistory } from "../../lib/callHistory";

import useAuthStore from "../../store/authStore";
import useChatStore from "../../store/chatStore";
import useSocket from "../../hooks/useSocket";
import useWebRTC from "../../hooks/useWebRTC";

import {
  getMyConversations,
  getConversationById,
  deleteConversation,
  clearChatMessages,
} from "../../services/conversationService";
import {
  getMessages,
  sendMessage,
  toggleReaction,
  markConversationAsRead,
  deleteMessage,
} from "../../services/messageService";
import { logoutUser } from "../../services/authService";
import { requestNotificationPermission } from "../../lib/notification";
import { getAvatarColor, getInitials, formatMessageTime, formatLiveLastSeen } from "../../lib/utils";
import socket from "../../lib/socket";

import {
  Users,
  Search,
  Bell,
  BellOff,
  Settings,
  LogOut,
  ChevronLeft,
  Info,
  WifiOff,
  Wifi,
  Sparkles,
  Shield,
  MessageSquare,
  Phone,
  Video,
  Trash2,
  UploadCloud,
  MoreVertical,
  CheckSquare,
  ChevronRight,
  Clock,
  Heart,
  FolderPlus,
  Download,
  XCircle,
  Link2,
  Calendar,
  UserPlus,
  ThumbsDown,
  Ban,
  MinusCircle,
  Check,
} from "lucide-react";

export default function ChatLayout({ initialConversationId = null }) {
  const router = useRouter();

  // Auth & Chat states
  const currentUser = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);

  const conversations = useChatStore((state) => state.conversations);
  const setConversations = useChatStore((state) => state.setConversations);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const removeConversation = useChatStore((state) => state.removeConversation);
  const clearMessagesInStore = useChatStore((state) => state.clearMessagesInStore);
  const deleteMessageInStore = useChatStore((state) => state.deleteMessageInStore);
  const activeConversation = useChatStore((state) => state.activeConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const prependMessages = useChatStore((state) => state.prependMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const updateMessageReactions = useChatStore((state) => state.updateMessageReactions);
  const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const typingMap = useChatStore((state) => state.typingMap);
  const socketConnected = useChatStore((state) => state.socketConnected);
  const setLoadingConversations = useChatStore((state) => state.setLoadingConversations);
  const setLoadingMessages = useChatStore((state) => state.setLoadingMessages);
  const loadingMoreMessages = useChatStore((state) => state.loadingMoreMessages);
  const setLoadingMoreMessages = useChatStore((state) => state.setLoadingMoreMessages);

  // Modal dialog states
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isGroupSettingOpen, setIsGroupSettingOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // WhatsApp Desktop navigation states
  const [activeDockView, setActiveDockView] = useState("chats");
  const [showMetaAIChat, setShowMetaAIChat] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  const [headerToast, setHeaderToast] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Delete",
    isDanger: true,
    onConfirm: null,
  });

  // Real-time missed calls calculation isolated per user
  const [missedCallsCount, setMissedCallsCount] = useState(0);
  useEffect(() => {
    const updateMissed = () => {
      const uid = (currentUser?._id || currentUser?.id)?.toString();
      if (!uid) {
        setMissedCallsCount(0);
        return;
      }
      const history = getCallHistory(uid);
      const count = history.filter(
        (c) => c.direction === "missed" || c.status === "missed"
      ).length;
      setMissedCallsCount(count);
    };

    updateMissed();
    window.addEventListener("wa_call_history_updated", updateMissed);
    window.addEventListener("storage", updateMissed);
    return () => {
      window.removeEventListener("wa_call_history_updated", updateMissed);
      window.removeEventListener("storage", updateMissed);
    };
  }, [currentUser]);

  // Close header 3-dots dropdown menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isHeaderMenuOpen) return;
    const handleClickOutside = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setIsHeaderMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsHeaderMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHeaderMenuOpen]);

  // Real unread messages calculation (never hardcoded!)
  const totalUnreadCount = useMemo(() => {
    return (conversations || []).reduce(
      (acc, c) => acc + (Number(c.unreadCount) || 0),
      0
    );
  }, [conversations]);

  // In-chat search
  const [isInChatSearchOpen, setIsInChatSearchOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState("");

  // Notification state
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // Responsive sidebar toggle for mobile
  const [showMobileSidebar, setShowMobileSidebar] = useState(!initialConversationId);

  // Flexible resizable sidebar width on desktop
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isDesktop, setIsDesktop] = useState(false);
  const isResizingRef = useRef(false);

  // Drag and drop file upload states
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);
  const [stagedDroppedFiles, setStagedDroppedFiles] = useState(null);

  // Check desktop viewport width
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Split-pane sidebar resize handlers
  const handleStartResize = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(Math.max(moveEvent.clientX - 54, 280), 580);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Drag & drop file upload handlers across chat workspace
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setStagedDroppedFiles({ id: Date.now(), files });
    }
  };

  // Initialize socket hook
  useSocket();

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        const data = await getMyConversations();
        setConversations(data.conversations || []);

        if (initialConversationId) {
          const found = (data.conversations || []).find(
            (c) => c._id === initialConversationId
          );
          if (found) {
            handleSelectConversation(found);
          } else {
            const single = await getConversationById(initialConversationId);
            if (single.conversation) {
              handleSelectConversation(single.conversation);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoadingConversations(false);
      }
    };

    if (currentUser) {
      loadConversations();
    }
  }, [currentUser, initialConversationId]);

  // Check notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    if (!granted && Notification.permission === "denied") {
      alert("Notification permission is blocked in your browser settings.");
    }
  };

  // Select conversation & load messages
  const handleSelectConversation = async (conversation) => {
    setShowMetaAIChat(false);
    setActiveDockView("chats");
    setActiveConversation(conversation);
    setShowMobileSidebar(false);
    setIsInChatSearchOpen(false);
    setInChatSearchQuery("");
    setIsContactInfoOpen(false);

    // Immediately mark conversation unread count as 0 in store to drop unread badge
    updateConversation({ ...conversation, unreadCount: 0 });

    // Join socket room
    socket.emit("joinConversation", conversation._id);

    try {
      setLoadingMessages(true);
      const res = await getMessages(conversation._id, 1, 30);
      setMessages(res.messages || [], res.hasMore || false);

      // Mark as read in DB and via socket
      markConversationAsRead(conversation._id).catch(() => {});
      socket.emit("markAsRead", {
        conversationId: conversation._id,
        userId: currentUser?._id || currentUser?.id,
      });
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Jump to conversation from in-app notification toast
  const handleSelectConversationById = (conversationId) => {
    const found = conversations.find(
      (c) => (c._id || c.id)?.toString() === conversationId?.toString()
    );
    if (found) {
      handleSelectConversation(found);
    }
  };

  // Live time ticker every 15s to update relative times & last seen
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  // Infinite scroll load earlier messages

  const handleLoadMoreMessages = async () => {
    if (!activeConversation || !hasMoreMessages || loadingMoreMessages || messages.length === 0) {
      return;
    }

    try {
      setLoadingMoreMessages(true);
      const oldestMessage = messages[0];
      const res = await getMessages(
        activeConversation._id,
        1,
        30,
        oldestMessage.createdAt
      );

      prependMessages(res.messages || [], res.hasMore || false);
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  // Optimistic message send
  const handleSendMessage = async (payload) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      tempId,
      conversation: payload.conversationId,
      sender: {
        _id: currentUser._id || currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      content: payload.content,
      type: payload.type,
      attachments: payload.attachments || [],
      replyTo: payload.replyTo ? messages.find((m) => m._id === payload.replyTo) : null,
      reactions: [],
      readBy: [currentUser._id || currentUser.id],
      deliveredTo: [currentUser._id || currentUser.id],
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistically add to UI immediately
    addMessage(optimisticMessage);

    try {
      const res = await sendMessage(payload);
      if (res.data) {
        // Replace optimistic message with confirmed server message
        res.data.tempId = tempId;
        addMessage(res.data);
      }
    } catch (err) {
      console.error("Send message failed:", err);
      alert(err.response?.data?.message || "Failed to send message. Please retry.");
      // Remove temporary message on failure
      useChatStore.setState((state) => ({
        messages: state.messages.filter((m) => m._id !== tempId),
      }));
    }
  };

  // Toggle message reaction
  const handleReactToMessage = async (messageId, emoji) => {
    try {
      // Optimistically update reactions
      const targetMsg = messages.find((m) => m._id === messageId);
      if (targetMsg) {
        const curUserId = (currentUser._id || currentUser.id)?.toString();
        const existingReactions = [...(targetMsg.reactions || [])];
        const existIdx = existingReactions.findIndex(
          (r) =>
            (r.user?._id || r.user)?.toString() === curUserId &&
            r.emoji === emoji
        );

        if (existIdx > -1) {
          existingReactions.splice(existIdx, 1);
        } else {
          existingReactions.push({ user: currentUser, emoji });
        }
        updateMessageReactions(messageId, existingReactions);
      }

      await toggleReaction(messageId, emoji);
    } catch (err) {
      console.error("Toggle reaction error:", err);
    }
  };

  // Reply handler
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
  };

  // Delete entire conversation with confirmation
  const promptDeleteConversation = (conversationId = activeConversation?._id) => {
    setIsHeaderMenuOpen(false);
    if (!conversationId) return;

    setConfirmModal({
      isOpen: true,
      title: isGroup ? "Exit & delete group?" : "Delete this chat?",
      message: "Are you sure you want to delete this chat? All messages and attachments will be permanently removed.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteConversation(conversationId);
          removeConversation(conversationId);
          if (activeConversation?._id === conversationId) {
            setActiveConversation(null);
            setShowMobileSidebar(true);
          }
        } catch (err) {
          alert(err.response?.data?.message || "Failed to delete conversation");
        }
      },
    });
  };

  // Clear all messages in conversation with confirmation
  const promptClearChat = (conversationId = activeConversation?._id) => {
    setIsHeaderMenuOpen(false);
    if (!conversationId) return;

    setConfirmModal({
      isOpen: true,
      title: "Clear this chat?",
      message: "Are you sure you want to clear all messages in this chat? Messages cannot be recovered.",
      confirmText: "Clear chat",
      isDanger: true,
      onConfirm: async () => {
        try {
          await clearChatMessages(conversationId);
          clearMessagesInStore(conversationId);
        } catch (err) {
          alert(err.response?.data?.message || "Failed to clear chat");
        }
      },
    });
  };

  // Delete single message with confirmation
  const promptDeleteMessage = (messageId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete message?",
      message: "Are you sure you want to delete this message? It will be permanently removed for everyone.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteMessage(messageId);
          deleteMessageInStore(messageId);
        } catch (err) {
          alert(err.response?.data?.message || "Failed to delete message");
        }
      },
    });
  };

  // Export chat messages to .txt file
  const handleExportChat = () => {
    setIsHeaderMenuOpen(false);
    if (!activeConversation || messages.length === 0) {
      setHeaderToast("No messages to export");
      setTimeout(() => setHeaderToast(""), 2500);
      return;
    }

    const lines = messages.map((m) => {
      const time = new Date(m.createdAt).toLocaleString();
      const sender = m.sender?.name || m.sender?.username || "Contact";
      const body = m.content || (m.type === "image" ? "<Photo>" : "<Attachment>");
      return `[${time}] ${sender}: ${body}`;
    });

    const title = conversationTitle || "chat";
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WhatsApp_Chat_${title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setHeaderToast("Chat exported successfully");
    setTimeout(() => setHeaderToast(""), 2500);
  };

  // Copy call link
  const handleSendCallLink = () => {
    setIsHeaderMenuOpen(false);
    const link = `${window.location.origin}/chat?call_link=wa-${Date.now()}`;
    navigator.clipboard.writeText(link);
    setHeaderToast("Call link copied to clipboard!");
    setTimeout(() => setHeaderToast(""), 3000);
  };

  // Block contact confirmation
  const promptBlockUser = () => {
    setIsHeaderMenuOpen(false);
    setConfirmModal({
      isOpen: true,
      title: `Block ${conversationTitle}?`,
      message: "Blocked contacts will no longer be able to call you or send you messages.",
      confirmText: "Block",
      isDanger: true,
      onConfirm: () => {
        setHeaderToast(`Blocked ${conversationTitle}`);
        setTimeout(() => setHeaderToast(""), 3000);
      },
    });
  };

  // Report contact confirmation
  const promptReportUser = () => {
    setIsHeaderMenuOpen(false);
    setConfirmModal({
      isOpen: true,
      title: `Report ${conversationTitle}?`,
      message: "The last 5 messages from this chat will be forwarded to security. This contact will not be notified.",
      confirmText: "Report",
      isDanger: true,
      onConfirm: () => {
        setHeaderToast("Report submitted to security.");
        setTimeout(() => setHeaderToast(""), 3000);
      },
    });
  };

  // Logout with confirmation
  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: "Log out?",
      message: "Are you sure you want to log out of PulseChat?",
      confirmText: "Log out",
      isDanger: false,
      onConfirm: async () => {
        try {
          await logoutUser();
          clearUser();
          socket.disconnect();
          router.push("/login");
        } catch (err) {
          clearUser();
          router.push("/login");
        }
      },
    });
  };

  // In-chat filtered messages
  const displayedMessages = useMemo(() => {
    if (!inChatSearchQuery.trim()) return messages;
    const q = inChatSearchQuery.toLowerCase();
    return messages.filter((m) => m.content?.toLowerCase().includes(q));
  }, [messages, inChatSearchQuery]);

  // Info for active conversation header
  const isGroup = activeConversation?.type === "group";
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

  const otherUser = useMemo(() => {
    if (!activeConversation || isGroup) return null;
    return activeConversation.members?.find(
      (m) => (m._id || m.id)?.toString() !== currentUserId
    );
  }, [activeConversation, isGroup, currentUserId]);

  const isOtherUserOnline = useMemo(() => {
    if (!otherUser) return false;
    const oId = (otherUser._id || otherUser.id)?.toString();
    return onlineUsers.some((id) => id?.toString() === oId);
  }, [otherUser, onlineUsers]);

  const conversationTitle = isGroup
    ? activeConversation.name
    : otherUser?.name || otherUser?.username || "Chat";

  const conversationAvatar = isGroup ? activeConversation.avatar : otherUser?.avatar;
  const conversationAvatarId = isGroup ? activeConversation._id : otherUser?._id;

  const currentTypers = activeConversation ? typingMap[activeConversation._id] || [] : [];

  // WhatsApp WebRTC Video & Voice Calls
  const {
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleScreenShare,
    isScreenSharing,
  } = useWebRTC();

  const handleStartVoiceCall = () => {
    if (!activeConversation) return;
    const target = isGroup
      ? activeConversation.members?.find(
          (m) => (m._id || m.id)?.toString() !== currentUserId
        ) || activeConversation.members?.[0]
      : otherUser;
    if (!target) return;
    startCall({
      recipient: target,
      conversationId: activeConversation._id,
      isVideo: false,
      isGroup,
    });
  };

  const handleStartVideoCall = () => {
    if (!activeConversation) return;
    const target = isGroup
      ? activeConversation.members?.find(
          (m) => (m._id || m.id)?.toString() !== currentUserId
        ) || activeConversation.members?.[0]
      : otherUser;
    if (!target) return;
    startCall({
      recipient: target,
      conversationId: activeConversation._id,
      isVideo: true,
      isGroup,
    });
  };

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[#111b21] text-[#e9edef] font-sans">
      {/* 1. NATIVE-LOOKING WINDOW TITLE BAR (Desktop Only) */}
      <div className="hidden md:block flex-shrink-0">
        <WhatsAppTitleBar />
      </div>

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* A. Far Left Vertical Dock (Desktop) & Bottom Navigation Bar (Mobile) */}
        <WhatsAppSidebarDock
          activeView={showMetaAIChat ? "meta-ai" : activeDockView}
          onSelectView={(view) => {
            setActiveDockView(view);
            if (view === "meta-ai") {
              setShowMetaAIChat(true);
              setActiveConversation(null);
            } else {
              setShowMetaAIChat(false);
            }
            if (view === "calls") {
              setMissedCallsCount(0);
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          currentUser={currentUser}
          unreadChatsCount={totalUnreadCount}
          missedCallsCount={missedCallsCount}
          showMobileBar={showMobileSidebar && !showMetaAIChat}
        />

        {/* B. Middle Sidebar Column (Chats / Calls / Status / Channels / Communities) */}
        <aside
          style={isDesktop ? { width: `${sidebarWidth}px`, minWidth: "280px", maxWidth: "580px" } : {}}
          className={`${
            showMobileSidebar && !showMetaAIChat ? "flex" : "hidden"
          } md:flex flex-col w-full flex-shrink-0 bg-[#111b21] md:border-r border-[#222e35] z-10 pb-[56px] md:pb-0 h-full`}
        >
          {/* Resilience Socket Status Warning */}
          {!socketConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/70 border-b border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Connecting to real-time chat server...</span>
            </div>
          )}

          {/* Dynamic Middle Panel View based on Dock Selection */}
          <div className="flex-1 overflow-hidden bg-[#111b21]">
            {activeDockView === "chats" && (
              <ConversationList
                onSelectConversation={(conv) => {
                  setShowMetaAIChat(false);
                  setActiveDockView("chats");
                  handleSelectConversation(conv);
                }}
                onOpenNewChat={() => setIsNewChatOpen(true)}
                onOpenNewGroup={() => setIsNewGroupOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenMetaAI={() => {
                  setShowMetaAIChat(true);
                  setActiveDockView("meta-ai");
                  setActiveConversation(null);
                }}
                onLogout={handleLogout}
                onDeleteConversation={promptDeleteConversation}
                onClearConversation={promptClearChat}
              />
            )}

            {activeDockView === "calls" && (
              <CallsList
                conversations={conversations}
                onStartVoiceCall={(target, convId) => {
                  startCall({
                    recipient: target,
                    conversationId: convId || target?.conversationId || activeConversation?._id || "call",
                    isVideo: false,
                    isGroup: target?.isGroup,
                  });
                }}
                onStartVideoCall={(target, convId) => {
                  startCall({
                    recipient: target,
                    conversationId: convId || target?.conversationId || activeConversation?._id || "call",
                    isVideo: true,
                    isGroup: target?.isGroup,
                  });
                }}
                onSelectContactForChat={(conv) => {
                  setActiveDockView("chats");
                  handleSelectConversation(conv);
                }}
              />
            )}

            {activeDockView === "status" && (
              <StatusList
                currentUser={currentUser}
                onSendReply={(contactName, reply) => {
                  const matchingConv = conversations.find(
                    (c) =>
                      c.name === contactName ||
                      (c.members || []).some((m) => m.name === contactName)
                  );
                  if (matchingConv) {
                    handleSelectConversation(matchingConv);
                    handleSendMessage({
                      conversationId: matchingConv._id,
                      content: reply,
                      type: "text",
                    });
                  }
                }}
              />
            )}

            {(activeDockView === "channels" ||
              activeDockView === "communities" ||
              activeDockView === "archived" ||
              activeDockView === "starred") && (
              <ChannelsCommunitiesView
                viewType={activeDockView}
                conversations={conversations}
                onSelectConversation={(conv) => {
                  setActiveDockView("chats");
                  handleSelectConversation(conv);
                }}
              />
            )}
          </div>
        </aside>

        {/* Draggable Resizer Bar (Desktop Only - Flexible Split Pane) */}
        <div
          onMouseDown={handleStartResize}
          onDoubleClick={() => setSidebarWidth(380)}
          title="Drag to resize sidebar width (Double click to reset)"
          className="hidden md:flex w-1 hover:w-1.5 bg-transparent hover:bg-[#00a884] active:bg-[#00a884] cursor-col-resize select-none h-full z-20 transition-all items-center justify-center group flex-shrink-0"
        >
          <div className="w-0.5 h-8 rounded-full bg-[#2a3942] group-hover:bg-[#00a884] transition-colors" />
        </div>

        {/* C. Right Main Pane: Meta AI Chat / Active Chat / WhatsApp Empty State */}
        <main
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`${
            !showMobileSidebar || showMetaAIChat ? "flex" : "hidden"
          } md:flex flex-1 flex-col h-full overflow-hidden bg-[#0b141a] relative`}
        >
          {/* Drag & Drop Visual Overlay */}
          {isDraggingOver && activeConversation && (
            <div className="absolute inset-0 z-50 bg-[#0b141a]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#00a884] m-3 rounded-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <div className="w-20 h-20 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884] mb-4 shadow-[0_0_30px_rgba(0,168,132,0.3)] animate-pulse">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#e9edef] tracking-tight">
                Drop files here to send
              </h3>
              <p className="text-sm text-[#8696a0] mt-1.5 max-w-xs text-center">
                Photos, videos, audio, and documents will be attached instantly
              </p>
              <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#202c33] border border-[#2a3942] text-xs text-[#25d366] font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready to attach</span>
              </div>
            </div>
          )}
          {showMetaAIChat ? (
            /* Interactive Dummy LLM Meta AI Chat */
            <DummyLLMChat
              onClose={() => {
                setShowMetaAIChat(false);
                setActiveDockView("chats");
              }}
            />
          ) : activeConversation ? (
            <>
              {/* Active Conversation Header (WhatsApp Dark Desktop Style) */}
              <header className="flex items-center justify-between px-2.5 sm:px-6 h-[60px] min-h-[60px] max-h-[60px] border-b border-[#222e35] bg-[#202c33] z-10 flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden p-1.5 -ml-1 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Clickable Avatar & Contact Info */}
                  <div
                    onClick={() => setIsContactInfoOpen(true)}
                    className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0 flex-1"
                  >
                    <div className="relative flex-shrink-0">
                      {conversationAvatar ? (
                        <img
                          src={conversationAvatar}
                          alt={conversationTitle}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-[#222e35] group-hover:ring-[#00a884] transition-all"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#534b3e] flex items-center justify-center text-[#e9edef] font-semibold text-xs sm:text-sm shadow-xs group-hover:ring-1 group-hover:ring-[#00a884] transition-all"
                        >
                          {isGroup ? <Users className="w-4 h-4 sm:w-5 sm:h-5" /> : getInitials(conversationTitle)}
                        </div>
                      )}

                      {!isGroup && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[#202c33] ${
                            isOtherUserOnline
                              ? "bg-[#25d366] shadow-xs"
                              : "bg-[#8696a0]"
                          }`}
                        />
                      )}
                    </div>

                    {/* Contact Title & Status */}
                    <div className="min-w-0 flex flex-col justify-center flex-1">
                      <h1 className="font-semibold text-sm sm:text-base text-[#e9edef] group-hover:text-white truncate flex items-center gap-1.5 leading-tight transition-colors">
                        <span className="truncate">{conversationTitle}</span>
                        {isGroup && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#103629] text-[#25d366] border border-[#25d366]/20 flex-shrink-0">
                            Group
                          </span>
                        )}
                      </h1>

                      <p className="text-xs text-[#8696a0] truncate flex items-center gap-1.5 leading-tight mt-0.5">
                        {isGroup ? (
                          <span>{activeConversation.members?.length || 0} members</span>
                        ) : currentTypers.some((t) => (t._id || t.id)?.toString() === (otherUser?._id || otherUser?.id)?.toString()) ? (
                          <span className="text-[#00a884] font-medium flex items-center gap-1 animate-pulse">
                            typing...
                          </span>
                        ) : isOtherUserOnline ? (
                          <span className="text-[#00a884] font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse" />
                            online
                          </span>
                        ) : (
                          <span className="text-[#8696a0] font-normal truncate">
                            {formatLiveLastSeen(otherUser?.lastSeen)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Actions: Call Buttons & In-Chat Search & Contact Info */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <LiveClock className="hidden lg:inline-flex" />

                  <div className="flex items-center gap-0.5 sm:gap-1 text-[#aebac1]">
                    {/* 1. Video Call Button */}
                    <button
                      type="button"
                      onClick={handleStartVideoCall}
                      title={isGroup ? "Start group video call" : "Video call"}
                      className="p-1.5 sm:p-2 rounded-full hover:text-[#00a884] hover:bg-[#2a3942] active:scale-95 transition-all"
                    >
                      <Video className="w-4 h-4" />
                    </button>

                    {/* 2. Voice Call Button */}
                    <button
                      type="button"
                      onClick={handleStartVoiceCall}
                      title={isGroup ? "Start group voice call" : "Voice call"}
                      className="p-1.5 sm:p-2 rounded-full hover:text-[#00a884] hover:bg-[#2a3942] active:scale-95 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                    </button>

                    {/* 3. Search Button */}
                    <button
                      type="button"
                      title="Search in this conversation"
                      onClick={() => setIsInChatSearchOpen(!isInChatSearchOpen)}
                      className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                        isInChatSearchOpen
                          ? "text-[#00a884] bg-[#103629]"
                          : "text-[#aebac1] hover:text-[#e9edef] hover:bg-[#2a3942]"
                      }`}
                    >
                      <Search className="w-4 h-4" />
                    </button>

                    {/* 4. WhatsApp 3-Dots Dropdown Menu */}
                    <div className="relative" ref={headerMenuRef}>
                      <button
                        type="button"
                        title="More options"
                        onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                        className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                          isHeaderMenuOpen
                            ? "text-[#00a884] bg-[#2a3942]"
                            : "text-[#aebac1] hover:text-[#e9edef] hover:bg-[#2a3942]"
                        }`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isHeaderMenuOpen && (
                        <div className="absolute right-0 top-11 w-64 max-h-[85vh] overflow-y-auto py-1.5 rounded-2xl bg-[#233138] border border-[#2a3942] shadow-2xl z-50 text-xs text-[#d1d7db] animate-in zoom-in-95 duration-150 scrollbar-thin divide-y divide-[#2a3942]/70">
                          {/* Group 1: Contact & Chat Actions */}
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setIsContactInfoOpen(true);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <Info className="w-4 h-4 text-[#8696a0]" />
                              <span>Contact info</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setIsInChatSearchOpen(true);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <Search className="w-4 h-4 text-[#8696a0]" />
                              <span>Search</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setHeaderToast("Select messages enabled");
                                setTimeout(() => setHeaderToast(""), 2500);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <CheckSquare className="w-4 h-4 text-[#8696a0]" />
                              <span>Select messages</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setHeaderToast("Notifications muted");
                                setTimeout(() => setHeaderToast(""), 2500);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <BellOff className="w-4 h-4 text-[#8696a0]" />
                                <span>Mute notifications</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-[#8696a0]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setHeaderToast("Disappearing messages: Off");
                                setTimeout(() => setHeaderToast(""), 2500);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <Clock className="w-4 h-4 text-[#8696a0]" />
                              <span>Disappearing messages</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setHeaderToast("Added to favourites");
                                setTimeout(() => setHeaderToast(""), 2500);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <Heart className="w-4 h-4 text-[#8696a0]" />
                              <span>Add to favourites</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setHeaderToast("Added to custom list");
                                setTimeout(() => setHeaderToast(""), 2500);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FolderPlus className="w-4 h-4 text-[#8696a0]" />
                                <span>Add to list</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-[#8696a0]" />
                            </button>

                            <button
                              type="button"
                              onClick={handleExportChat}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <Download className="w-4 h-4 text-[#8696a0]" />
                              <span>Export chat</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setActiveConversation(null);
                                setShowMobileSidebar(true);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <XCircle className="w-4 h-4 text-[#8696a0]" />
                              <span>Close chat</span>
                            </button>
                          </div>

                          {/* Group 2: Call Options */}
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={handleSendCallLink}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <Link2 className="w-4 h-4 text-[#8696a0]" />
                              <span>Send call link</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                setHeaderToast("Call scheduled");
                                setTimeout(() => setHeaderToast(""), 2500);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <Calendar className="w-4 h-4 text-[#8696a0]" />
                              <span>Schedule call</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                handleStartVoiceCall();
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-[#182229] hover:text-white flex items-center gap-3 transition-colors"
                            >
                              <UserPlus className="w-4 h-4 text-[#8696a0]" />
                              <span>New group call</span>
                            </button>
                          </div>

                          {/* Group 3: Privacy, Clear & Delete */}
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={promptReportUser}
                              className="w-full px-4 py-2.5 text-left hover:bg-rose-500/10 flex items-center gap-3 text-rose-400 hover:text-rose-300 transition-colors"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              <span>Report</span>
                            </button>

                            <button
                              type="button"
                              onClick={promptBlockUser}
                              className="w-full px-4 py-2.5 text-left hover:bg-rose-500/10 flex items-center gap-3 text-rose-400 hover:text-rose-300 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                              <span>Block</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => promptClearChat(activeConversation._id)}
                              className="w-full px-4 py-2.5 text-left hover:bg-amber-500/10 flex items-center gap-3 text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              <MinusCircle className="w-4 h-4" />
                              <span>Clear chat</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => promptDeleteConversation(activeConversation._id)}
                              className="w-full px-4 py-2.5 text-left hover:bg-rose-500/10 flex items-center gap-3 text-rose-400 hover:text-rose-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete chat</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </header>

              {/* In-Chat Search Bar Drawer */}
              {isInChatSearchOpen && (
                <div className="flex items-center gap-2 px-6 py-2 bg-[#202c33] border-b border-[#222e35] animate-in slide-in-from-top-2 duration-150">
                  <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
                  <input
                    type="text"
                    value={inChatSearchQuery}
                    onChange={(e) => setInChatSearchQuery(e.target.value)}
                    placeholder="Filter messages in this conversation..."
                    className="flex-1 bg-[#111b21] px-3 py-1.5 rounded-lg border border-[#2a3942] text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                    autoFocus
                  />
                  {inChatSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setInChatSearchQuery("")}
                      className="text-xs text-[#8696a0] hover:text-[#e9edef]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Message Feed & Right Contact Info Drawer Container */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Message Feed with WhatsApp Wallpaper Pattern */}
                  <div className="flex-1 overflow-hidden flex flex-col wa-chat-pattern">
                    <MessageList
                      messages={displayedMessages}
                      currentUser={currentUser}
                      isGroup={isGroup}
                      typers={currentTypers}
                      hasMore={hasMoreMessages && !inChatSearchQuery}
                      loadingMore={loadingMoreMessages}
                      onLoadMore={handleLoadMoreMessages}
                      onReply={handleReplyToMessage}
                      onReact={handleReactToMessage}
                      onDeleteMessage={promptDeleteMessage}
                    />
                  </div>

                  {/* Message Composer Input */}
                  <MessageInput
                    conversationId={activeConversation._id}
                    onSendMessage={handleSendMessage}
                    droppedFiles={stagedDroppedFiles}
                  />
                </div>

                {/* WhatsApp Contact / Group Info Right Sidebar */}
                {isContactInfoOpen && (
                  <ContactInfoSidebar
                    isOpen={isContactInfoOpen}
                    onClose={() => setIsContactInfoOpen(false)}
                    conversation={activeConversation}
                    currentUser={currentUser}
                    isOtherUserOnline={isOtherUserOnline}
                    messages={messages}
                    onStartVoiceCall={handleStartVoiceCall}
                    onStartVideoCall={handleStartVideoCall}
                    onOpenSearch={() => setIsInChatSearchOpen(true)}
                    onOpenGroupSettings={() => setIsGroupSettingOpen(true)}
                    onClearChat={promptClearChat}
                    onDeleteChat={promptDeleteConversation}
                  />
                )}
              </div>
            </>
          ) : (
            /* WhatsApp Desktop Empty State matching screenshot */
            <WhatsAppEmptyState
              onSendDocument={() => setIsNewChatOpen(true)}
              onAddContact={() => setIsNewChatOpen(true)}
              onAskMetaAI={() => {
                setShowMetaAIChat(true);
                setActiveDockView("meta-ai");
              }}
            />
          )}
        </main>
      </div>

      {/* 3. MODAL DIALOGS */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectConversation={(conv) => handleSelectConversation(conv)}
      />

      <CreateGroup
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
        onGroupCreated={(conv) => handleSelectConversation(conv)}
      />

      <GroupSetting
        isOpen={isGroupSettingOpen}
        onClose={() => setIsGroupSettingOpen(false)}
        conversation={activeConversation}
        onConversationUpdated={(updated) => setActiveConversation(updated)}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        activeConversationId={activeConversation?._id}
        onSelectMessageResult={(msg) => {
          const targetConv =
            typeof msg.conversation === "object"
              ? msg.conversation
              : conversations.find((c) => c._id === msg.conversation);

          if (targetConv) {
            handleSelectConversation(targetConv);
            setTimeout(() => {
              const el = document.getElementById(`msg-${msg._id}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("ring-2", "ring-violet-500");
                setTimeout(() => el.classList.remove("ring-2", "ring-violet-500"), 2000);
              }
            }, 300);
          }
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* WhatsApp Desktop Settings Modal */}
      <WhatsAppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={handleLogout}
      />

      {/* WhatsApp Voice & Video Call Modals */}
      <IncomingCallModal onAccept={acceptCall} onDecline={declineCall} />
      <VideoCallModal
        onEndCall={endCall}
        onToggleScreenShare={toggleScreenShare}
        isScreenSharing={isScreenSharing}
      />

      {/* WhatsApp-Style In-App Notification Toasts */}
      <NotificationBanner onSelectConversation={handleSelectConversationById} />

      {/* Reusable WhatsApp Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Floating Action Feedback Toast Pill */}
      {headerToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#202c33] border border-[#2a3942] text-xs font-medium text-[#e9edef] shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check className="w-3.5 h-3.5 text-[#00a884]" />
          <span>{headerToast}</span>
        </div>
      )}
    </div>
  );
}
