"use client";

import { useMemo, useState } from "react";
import useChatStore from "../../store/chatStore";
import useAuthStore from "../../store/authStore";
import { formatRelativeTime, getInitials } from "../../lib/utils";
import {
  Users,
  Image as ImageIcon,
  Pin,
  VolumeX,
  Check,
  CheckCheck,
  Sparkles,
  MoreVertical,
  Trash2,
  Eraser,
} from "lucide-react";

export default function ConversationItem({
  conversation,
  isSelected,
  onClick,
  onDelete,
  onClear,
}) {
  const currentUser = useAuthStore((state) => state.user);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const typingMap = useChatStore((state) => state.typingMap);

  const [menuOpen, setMenuOpen] = useState(false);

  const isGroup = conversation.type === "group";
  const isMetaAI = conversation.isMetaAI || conversation.name === "Meta AI";

  // Find other user in direct conversation
  const otherUser = useMemo(() => {
    if (isGroup || isMetaAI) return null;
    const currentId = currentUser?._id || currentUser?.id;
    return conversation.members?.find(
      (m) => (m._id || m.id)?.toString() !== currentId?.toString()
    );
  }, [conversation, currentUser, isGroup, isMetaAI]);

  // Online status check
  const isOnline = useMemo(() => {
    if (isMetaAI) return true;
    if (isGroup) return false;
    if (!otherUser) return false;
    const otherId = (otherUser._id || otherUser.id)?.toString();
    return onlineUsers.some((id) => id?.toString() === otherId);
  }, [isMetaAI, isGroup, otherUser, onlineUsers]);

  // Typing status in this conversation
  const typers = typingMap[conversation._id] || [];
  const isSomeoneTyping = typers.length > 0;

  // Title & Avatar (Dynamic based on logged in user)
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const isSelfChat =
    !isGroup &&
    (!otherUser ||
      (otherUser._id || otherUser.id)?.toString() === currentUserId);

  const title = isMetaAI
    ? "Meta AI"
    : isSelfChat
    ? `${currentUser?.name || "You"} (You)`
    : isGroup
    ? conversation.name || "Group Channel"
    : otherUser?.name || otherUser?.username || "Direct Chat";

  const avatarUrl = conversation.avatar || otherUser?.avatar;

  // Custom attributes based on conversation
  const isPinned = isSelfChat || conversation.isPinned;
  const isMuted = conversation.isMuted;
  const unreadCount = Number(conversation.unreadCount) || 0;
  const isLastMessageFromMe =
    conversation.lastMessage &&
    (conversation.lastMessage.sender?._id || conversation.lastMessage.sender)?.toString() ===
      currentUserId;
  const showDoubleBlueCheck =
    isLastMessageFromMe &&
    (conversation.lastMessage?.readBy?.length > 1 || isSelfChat);
  const showSingleCheck = isLastMessageFromMe && !showDoubleBlueCheck;

  // Real Dynamic Time Formatting
  const renderTime = () => {
    const timestamp =
      conversation.lastMessage?.createdAt || conversation.updatedAt;
    if (!timestamp) return "";
    return formatRelativeTime(timestamp);
  };

  // Real Dynamic Last Message Snippet
  const lastMessage = conversation.lastMessage;
  const renderLastMessageSnippet = () => {
    if (isSomeoneTyping) {
      const typerName = typers[0]?.name || "Someone";
      return (
        <span className="text-[#00a884] font-medium italic animate-pulse">
          {typerName} is typing...
        </span>
      );
    }

    if (isMetaAI) {
      return <span className="text-[#8696a0]">Ask Meta AI anything...</span>;
    }

    if (!lastMessage) {
      return <span className="text-[#8696a0] italic">No messages yet</span>;
    }

    const senderPrefix =
      isGroup && lastMessage.sender
        ? `${
            (lastMessage.sender?._id || lastMessage.sender?.id)?.toString() ===
            currentUserId
              ? "You"
              : lastMessage.sender.name || "Member"
          }: `
        : "";

    if (lastMessage.type === "image") {
      return (
        <span className="flex items-center gap-1 text-[#8696a0]">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{senderPrefix}Photo</span>
        </span>
      );
    }

    return (
      <span className="truncate text-[#8696a0]">
        {senderPrefix}
        {lastMessage.content || "Message"}
      </span>
    );
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onDelete) {
      onDelete(conversation._id);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onClear) {
      onClear(conversation._id);
    }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`group relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors duration-100 select-none border-b border-[#222e35]/60 ${
        isSelected
          ? "bg-[#2a3942]"
          : "bg-transparent hover:bg-[#202c33]"
      }`}
    >
      {/* Avatar Container */}
      <div className="relative flex-shrink-0">
        {isMetaAI ? (
          <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
            <div className="w-full h-full rounded-full bg-[#111b21] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt={title}
            className="w-12 h-12 rounded-full object-cover ring-1 ring-[#222e35]"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full bg-[#534b3e] flex items-center justify-center text-[#e9edef] font-semibold text-base shadow-xs`}
          >
            {isGroup ? (
              <Users className="w-5 h-5 text-[#d1d7db]" />
            ) : (
              getInitials(title)
            )}
          </div>
        )}

        {/* Presence Indicator */}
        {!isGroup && !isMetaAI && (
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] transition-colors ${
              isOnline ? "bg-[#25d366]" : "bg-[#8696a0]"
            }`}
            title={isOnline ? "Online" : "Offline"}
          />
        )}
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0">
        {/* Top Line: Contact Name & Timestamp */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <h3 className="font-medium text-sm truncate text-[#e9edef] flex items-center gap-1.5">
            {title}
          </h3>
          <span
            className={`text-[11px] flex-shrink-0 ${
              unreadCount > 0 ? "text-[#25d366] font-medium" : "text-[#8696a0]"
            }`}
          >
            {renderTime()}
          </span>
        </div>

        {/* Bottom Line: Read receipts, Snippet, Pin, Mute, Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0 flex-1 text-xs">
            {showDoubleBlueCheck && (
              <CheckCheck className="w-4 h-4 text-[#53bdeb] flex-shrink-0" />
            )}
            {!showDoubleBlueCheck && showSingleCheck && (
              <Check className="w-3.5 h-3.5 text-[#8696a0] flex-shrink-0" />
            )}
            <p className="truncate flex-1 leading-normal">
              {renderLastMessageSnippet()}
            </p>
          </div>

          {/* Right Status Badges & Quick Action Dropdown */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isMuted && <VolumeX className="w-3.5 h-3.5 text-[#8696a0]" />}
            {isPinned && <Pin className="w-3.5 h-3.5 text-[#8696a0] rotate-45" />}
            {unreadCount > 0 && (
              <span className="min-w-[19px] h-[19px] px-1 rounded-full bg-[#25d366] text-[#111b21] font-bold text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}

            {/* Hover Actions Menu for Delete / Clear */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                title="Options"
                className="p-1 rounded-full text-[#8696a0] hover:text-[#d1d7db] hover:bg-[#2a3942] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-6 w-36 py-1 rounded-lg bg-[#233138] border border-[#2a3942] shadow-2xl z-50 text-xs animate-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full px-3 py-2 text-left text-amber-400 hover:bg-[#182229] flex items-center gap-2"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete chat</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
