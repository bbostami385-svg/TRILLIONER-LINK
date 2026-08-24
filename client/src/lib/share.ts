export type ShareTarget = "whatsapp" | "facebook" | "x" | "telegram" | "linkedin";

export type SharePayload = {
  title: string;
  text?: string;
  url: string;
};

export function getSocialShareUrl(target: ShareTarget, payload: SharePayload) {
  const encodedUrl = encodeURIComponent(payload.url);
  const encodedText = encodeURIComponent(payload.text || payload.title);
  switch (target) {
    case "whatsapp": return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "x": return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case "telegram": return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case "linkedin": return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  }
}

export async function shareOrCopy(payload: SharePayload) {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    await navigator.share(payload);
    return "shared" as const;
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(payload.url);
    return "copied" as const;
  }
  throw new Error("Sharing is unavailable in this browser.");
}
