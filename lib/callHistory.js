/**
 * WhatsApp-style call history management (isolated per user)
 */

export const getCallHistoryKey = (userId) => {
  return userId ? `wa_call_history_${userId}` : "wa_call_history_guest";
};

export const formatCallTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today, ${timeStr}`;

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;

  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
};

export const getCallHistory = (userId) => {
  if (typeof window === "undefined") return [];
  try {
    const key = getCallHistoryKey(userId);
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (err) {
    console.error("Error loading call history:", err);
    return [];
  }
};

export const saveCallHistory = (userId, calls) => {
  if (typeof window === "undefined") return;
  try {
    const key = getCallHistoryKey(userId);
    localStorage.setItem(key, JSON.stringify(calls));
  } catch (err) {
    console.error("Error saving call history:", err);
  }
};

export const addCallLog = (userId, callData) => {
  const current = getCallHistory(userId);
  const newCall = {
    id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: formatCallTime(new Date()),
    createdAt: new Date().toISOString(),
    ...callData,
  };
  const updated = [newCall, ...current];
  saveCallHistory(userId, updated);
  return updated;
};

export const deleteCallLog = (userId, callId) => {
  const current = getCallHistory(userId);
  const updated = current.filter((c) => c.id !== callId);
  saveCallHistory(userId, updated);
  return updated;
};

export const clearCallHistory = (userId) => {
  if (typeof window === "undefined") return [];
  try {
    const key = getCallHistoryKey(userId);
    localStorage.removeItem(key);
    // Remove legacy shared mock key
    localStorage.removeItem("wa_call_history");
  } catch (err) {
    console.error("Error clearing call history:", err);
  }
  return [];
};
