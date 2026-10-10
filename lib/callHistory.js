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
    window.dispatchEvent(
      new CustomEvent("wa_call_history_updated", { detail: { userId, count: calls.length } })
    );
  } catch (err) {
    console.error("Error saving call history:", err);
  }
};

export const addCallLog = (userId, callData) => {
  if (!userId) return [];
  const current = getCallHistory(userId);
  const newCall = {
    id: callData.id || `call-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: formatCallTime(new Date()),
    createdAt: new Date().toISOString(),
    ...callData,
  };
  // Avoid duplicating if call with same ID already added
  const filtered = current.filter((c) => c.id !== newCall.id);
  const updated = [newCall, ...filtered];
  saveCallHistory(userId, updated);
  return updated;
};

export const updateCallLog = (userId, callId, patch) => {
  if (!userId || !callId) return [];
  const current = getCallHistory(userId);
  const updated = current.map((c) => (c.id === callId ? { ...c, ...patch } : c));
  saveCallHistory(userId, updated);
  return updated;
};

export const deleteCallLog = (userId, callId) => {
  if (!userId) return [];
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
    window.dispatchEvent(
      new CustomEvent("wa_call_history_updated", { detail: { userId, count: 0 } })
    );
  } catch (err) {
    console.error("Error clearing call history:", err);
  }
  return [];
};
