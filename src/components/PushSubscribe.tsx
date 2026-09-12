"use client";

import { useEffect, useState } from "react";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export default function PushSubscribe() {
  const [status, setStatus] = useState<"loading" | "enabled" | "needed">("loading");

  async function subscribe(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    const reg = await navigator.serviceWorker.register("/sw.js");

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      return false;
    }

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    const json = await res.json();
    return Boolean(res.ok && json.ok);
  }

  async function ensureSubscription() {
    try {
      setStatus((await subscribe()) ? "enabled" : "needed");
    } catch {
      setStatus("needed");
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await subscribe();
        if (!cancelled) setStatus(ok ? "enabled" : "needed");
      } catch {
        if (!cancelled) setStatus("needed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return null;

  if (status === "enabled") {
    return (
      <span className="text-sm text-emerald-400" title="Notifikasi aktif otomatis">
        🔔
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={ensureSubscription}
      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-emerald-400 hover:text-emerald-400"
      title="Aktifkan notifikasi"
    >
      🔕 Aktifkan Notifikasi
    </button>
  );
}
