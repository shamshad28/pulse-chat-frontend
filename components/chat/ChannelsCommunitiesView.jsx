"use client";

import { useState } from "react";
import {
  Radio,
  Users,
  Archive,
  Star,
  Search,
  Check,
  Plus,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Loader2,
  Sparkles,
  ChevronRight,
  Hash,
} from "lucide-react";
import { getInitials } from "../../lib/utils";
import { getOrCreateCommunity } from "../../services/conversationService";
import useChatStore from "../../store/chatStore";

const SAMPLE_CHANNELS = [
  {
    id: "ch-1",
    name: "WhatsApp Official",
    verified: true,
    followers: "128M followers",
    avatar: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&auto=format&fit=crop&q=60",
    lastUpdate: "New security & privacy features rolling out to all users this week.",
    time: "Yesterday",
    following: true,
  },
  {
    id: "ch-2",
    name: "Real Madrid C.F.",
    verified: true,
    followers: "42M followers",
    avatar: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=60",
    lastUpdate: "Matchday preparation in Madrid! ⚽ Hala Madrid!",
    time: "4h ago",
    following: false,
  },
  {
    id: "ch-3",
    name: "TechCrunch",
    verified: true,
    followers: "18M followers",
    avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&auto=format&fit=crop&q=60",
    lastUpdate: "AI advancements and developer tooling highlights for Q4.",
    time: "2h ago",
    following: true,
  },
  {
    id: "ch-4",
    name: "National Geographic",
    verified: true,
    followers: "31M followers",
    avatar: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=120&auto=format&fit=crop&q=60",
    lastUpdate: "Stunning photograph of the Aurora Borealis captured last night.",
    time: "1d ago",
    following: false,
  },
];

const SAMPLE_COMMUNITIES = [
  {
    id: "com-1",
    name: "Nexcore Tech Community",
    subgroups: ["General Announcements", "Frontend Guild", "DevOps & Cloud"],
    membersCount: 142,
    description: "Company-wide engineering discussion, team coordination, and announcements.",
  },
];

export default function ChannelsCommunitiesView({
  viewType = "channels", // 'channels' | 'communities' | 'archived' | 'starred'
  onSelectConversation,
  conversations = [],
  onOpenNewGroup,
}) {
  const [channels, setChannels] = useState(SAMPLE_CHANNELS);
  const [openingId, setOpeningId] = useState(null);

  const toggleFollow = (id) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, following: !c.following } : c))
    );
  };

  // Open a community or subgroup and jump straight into chat
  const handleOpenCommunity = async (community, subgroup = null) => {
    const targetName = subgroup ? `${community.name} - ${subgroup}` : community.name;
    const trackingKey = subgroup ? `${community.id}-${subgroup}` : community.id;
    setOpeningId(trackingKey);

    try {
      // 1. Check if matching conversation already exists in user's loaded conversations
      const existing = (conversations || []).find((c) => {
        if (!c) return false;
        const cName = (c.name || "").toLowerCase();
        if (subgroup) {
          return (
            cName === targetName.toLowerCase() ||
            cName.includes(subgroup.toLowerCase()) ||
            cName.includes("nexcore")
          );
        }
        return cName.includes("nexcore") || cName === community.name.toLowerCase();
      });

      if (existing) {
        onSelectConversation?.(existing);
        setOpeningId(null);
        return;
      }

      // 2. Fetch or create community conversation on server
      const res = await getOrCreateCommunity({
        name: community.name,
        subgroup: subgroup || "",
      });

      if (res?.success && res?.conversation) {
        useChatStore.getState().addConversation(res.conversation);
        onSelectConversation?.(res.conversation);
      } else {
        // Fallback: Create instant local active group if server call fails
        const fallbackConv = {
          _id: `comm_${Date.now()}`,
          name: targetName,
          type: "group",
          members: [],
          admins: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessage: {
            content: `Welcome to ${targetName}!`,
            createdAt: new Date().toISOString(),
          },
        };
        useChatStore.getState().addConversation(fallbackConv);
        onSelectConversation?.(fallbackConv);
      }
    } catch (err) {
      console.error("Error opening community:", err);
      const fallbackConv = {
        _id: `comm_${Date.now()}`,
        name: targetName,
        type: "group",
        members: [],
        admins: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useChatStore.getState().addConversation(fallbackConv);
      onSelectConversation?.(fallbackConv);
    } finally {
      setOpeningId(null);
    }
  };

  const titles = {
    channels: "Channels",
    communities: "Communities",
    archived: "Archived",
    starred: "Starred messages",
  };

  // Extract all existing group conversations from user store
  const userGroups = (conversations || []).filter((c) => c?.type === "group");

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-[#e9edef] select-none border-r border-[#222e35]">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-[#222e35]/60 bg-[#111b21]">
        <h1 className="text-xl font-bold tracking-tight text-[#e9edef]">
          {titles[viewType] || "Updates"}
        </h1>
      </div>

      {/* 2. CHANNELS VIEW */}
      {viewType === "channels" && (
        <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]/40 custom-scrollbar">
          <div className="p-3 bg-[#202c33]/40 border-b border-[#222e35]">
            <p className="text-xs text-[#8696a0] leading-relaxed">
              Stay updated on topics you care about. Find channels to follow below.
            </p>
          </div>

          <div className="px-3 py-2 text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider bg-[#111b21]">
            Followed Channels
          </div>

          {channels.map((ch) => (
            <div
              key={ch.id}
              className="p-3.5 hover:bg-[#202c33] transition-colors flex items-start gap-3 cursor-pointer"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={ch.avatar}
                  alt={ch.name}
                  className="w-11 h-11 rounded-full object-cover ring-1 ring-[#222e35]"
                />
                {ch.verified && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[9px] font-bold border border-[#111b21]">
                    ✓
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-[#e9edef] truncate">
                    {ch.name}
                  </h4>
                  <span className="text-[11px] text-[#8696a0] flex-shrink-0">{ch.time}</span>
                </div>

                <p className="text-xs text-[#8696a0] line-clamp-2 mt-0.5 leading-relaxed">
                  {ch.lastUpdate}
                </p>

                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[11px] text-[#8696a0]">{ch.followers}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(ch.id);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      ch.following
                        ? "bg-[#202c33] text-[#00a884] border border-[#2a3942] hover:border-rose-500/40 hover:text-rose-400"
                        : "bg-[#00a884] hover:bg-[#008069] text-white shadow-xs"
                    }`}
                  >
                    {ch.following ? "Following" : "+ Follow"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. COMMUNITIES VIEW */}
      {viewType === "communities" && (
        <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]/50 custom-scrollbar">
          {/* New Community Action Button */}
          <button
            type="button"
            onClick={() => onOpenNewGroup?.()}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#202c33] transition-colors text-left group"
          >
            <div className="relative w-11 h-11 rounded-xl bg-[#00a884] text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-white" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#111b21] flex items-center justify-center">
                <Plus className="w-3 h-3 text-[#00a884]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[#e9edef] group-hover:text-[#00a884] transition-colors">
                New community
              </h3>
              <p className="text-xs text-[#8696a0] truncate mt-0.5">
                Bring your groups and teams together
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8696a0] group-hover:text-white transition-colors" />
          </button>

          {/* Communities List */}
          <div className="p-3 bg-[#111b21]">
            <div className="px-2 py-1 text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider">
              Your Communities
            </div>
          </div>

          {SAMPLE_COMMUNITIES.map((com) => (
            <div
              key={com.id}
              className="p-4 bg-[#111b21] hover:bg-[#182229] transition-colors border-b border-[#222e35]/60"
            >
              {/* Community Card Header (Clickable) */}
              <div
                onClick={() => handleOpenCommunity(com)}
                className="flex items-start gap-3.5 cursor-pointer group mb-2.5"
              >
                <div className="w-12 h-12 rounded-xl bg-[#103629] text-[#25d366] flex items-center justify-center font-bold text-lg border border-[#25d366]/30 flex-shrink-0 group-hover:border-[#25d366] transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#e9edef] group-hover:text-[#25d366] transition-colors truncate">
                      {com.name}
                    </h4>
                    {openingId === com.id ? (
                      <Loader2 className="w-4 h-4 text-[#00a884] animate-spin flex-shrink-0" />
                    ) : (
                      <span className="text-[11px] font-medium text-[#00a884] group-hover:underline flex-shrink-0">
                        Open Chat
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#8696a0]">
                    {com.membersCount} members • {com.subgroups.length} groups
                  </span>
                  <p className="text-xs text-[#8696a0] line-clamp-2 mt-1 leading-relaxed">
                    {com.description}
                  </p>
                </div>
              </div>

              {/* Subgroups / Channels */}
              <div className="mt-3 space-y-1.5 pl-4 border-l-2 border-[#2a3942]">
                <div className="text-[10px] uppercase font-semibold text-[#8696a0] tracking-wider mb-1">
                  Community Groups
                </div>
                {com.subgroups.map((sub, sIdx) => {
                  const trackingKey = `${com.id}-${sub}`;
                  const isOpening = openingId === trackingKey;

                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => handleOpenCommunity(com, sub)}
                      disabled={isOpening}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-md text-xs text-[#d1d7db] hover:bg-[#202c33] hover:text-[#00a884] transition-colors group cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs">📣</span>
                        <span className="font-medium truncate">{sub}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0] group-hover:text-[#00a884] flex-shrink-0 ml-2">
                        {isOpening ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00a884]" />
                        ) : (
                          <>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                              Enter
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* User's existing active group conversations */}
          {userGroups.length > 0 && (
            <div className="p-3 bg-[#111b21]">
              <div className="px-2 py-1 text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider">
                Joined Group Chats ({userGroups.length})
              </div>
              <div className="mt-1 divide-y divide-[#222e35]/40">
                {userGroups.map((group) => (
                  <button
                    key={group._id}
                    type="button"
                    onClick={() => onSelectConversation?.(group)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#202c33] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1f3540] text-[#00a884] flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {getInitials(group.name || "Group")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-semibold text-[#e9edef] group-hover:text-[#00a884] truncate">
                        {group.name}
                      </h5>
                      <span className="text-[11px] text-[#8696a0] truncate block">
                        {(group.members || []).length} members
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8696a0] group-hover:text-[#00a884] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ARCHIVED VIEW */}
      {viewType === "archived" && (
        <div className="flex-1 overflow-y-auto p-4 text-center custom-scrollbar">
          <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center mx-auto mb-3 text-[#8696a0]">
            <Archive className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-sm text-white">No archived chats</h3>
          <p className="text-xs text-[#8696a0] mt-1 max-w-xs mx-auto leading-relaxed">
            Archive chats you don&apos;t need right now to keep your chat list clean. Archived chats
            remain archived when new messages arrive.
          </p>
        </div>
      )}

      {/* 5. STARRED MESSAGES VIEW */}
      {viewType === "starred" && (
        <div className="flex-1 overflow-y-auto p-4 text-center custom-scrollbar">
          <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center mx-auto mb-3 text-amber-400">
            <Star className="w-8 h-8 fill-current" />
          </div>
          <h3 className="font-semibold text-sm text-white">No starred messages</h3>
          <p className="text-xs text-[#8696a0] mt-1 max-w-xs mx-auto leading-relaxed">
            Tap and hold any message to star it so you can easily find it later.
          </p>
        </div>
      )}
    </div>
  );
}
