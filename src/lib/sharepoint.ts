/**
 * Utility to transform various media URLs into embeddable formats.
 * Handles BNI Finance SharePoint/OneDrive and YouTube links.
 *
 * KEY FIX: SharePoint stream.aspx has CSP frame-ancestors 'none' and CANNOT
 * be embedded in an iframe. We must convert it to embed.aspx which allows framing.
 *
 * Supported conversions:
 *  - stream.aspx?id=...     → embed.aspx?id=...
 *  - /_layouts/15/...       → embed.aspx equivalent
 *  - /:v:/g/personal/...    → embed.aspx via id extraction
 *  - Sharing links (guestaccess.aspx) → embed.aspx
 */

export function getEmbedUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const uri = new URL(url);

    // ── 1. YouTube ────────────────────────────────────────────────────────────
    if (
      uri.hostname.includes("youtube.com") ||
      uri.hostname.includes("youtu.be") ||
      uri.hostname.includes("youtube-nocookie.com")
    ) {
      let videoId = "";
      if (uri.hostname.includes("youtu.be")) {
        videoId = uri.pathname.substring(1).split("?")[0];
      } else if (uri.pathname.includes("/embed/")) {
        // Already embed URL
        return url;
      } else {
        videoId = uri.searchParams.get("v") || "";
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    }

    // ── 2. SharePoint / OneDrive ──────────────────────────────────────────────
    if (
      uri.hostname.includes("sharepoint.com") ||
      uri.hostname.includes("1drv.ms") ||
      uri.hostname.includes("onedrive.live.com")
    ) {
      return convertSharePointToEmbedUrl(url, uri);
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Convert any SharePoint URL variant to the embeddable embed.aspx format.
 *
 * CSP issue background:
 *   stream.aspx  → X-Frame-Options: DENY / frame-ancestors 'none'  ❌
 *   embed.aspx   → Allows framing from trusted origins             ✅
 */
function convertSharePointToEmbedUrl(url: string, uri: URL): string {
  const baseOrigin = uri.origin; // e.g. https://bnimultifinance.sharepoint.com

  // ── A. Already an embed.aspx URL — return as-is ───────────────────────────
  if (uri.pathname.toLowerCase().includes("embed.aspx")) {
    return url;
  }

  // ── B. stream.aspx?id=<path> ──────────────────────────────────────────────
  //    This is the most common case from the error log.
  //    embed.aspx?id=... often fails with "File Not Found" if a UniqueId isn't used.
  //    The most reliable way is to build the absolute file URL and append ?action=embedview
  if (uri.pathname.toLowerCase().includes("stream.aspx")) {
    const fileId = uri.searchParams.get("id");
    if (fileId && fileId.includes("/")) {
      const normalizedPath = fileId.startsWith("/") ? fileId : `/${fileId}`;
      const absoluteFileUrl = new URL(normalizedPath, baseOrigin);
      absoluteFileUrl.searchParams.set("action", "embedview");
      // Optional: parameters to improve video viewing experience
      absoluteFileUrl.searchParams.set("wdStartOn", "1");
      return absoluteFileUrl.toString();
    }
  }

  // ── C. /_layouts/15/... (any other layout page) ──────────────────────────
  if (uri.pathname.toLowerCase().includes("/_layouts/15/")) {
    const fileId = uri.searchParams.get("id") || uri.searchParams.get("sourcedoc");
    if (fileId) {
      if (fileId.includes("/")) {
        // If it's a file path, use the absolute path + action=embedview
        const normalizedPath = fileId.startsWith("/") ? fileId : `/${fileId}`;
        const absoluteFileUrl = new URL(normalizedPath, baseOrigin);
        absoluteFileUrl.searchParams.set("action", "embedview");
        return absoluteFileUrl.toString();
      } else {
        // If it's a GUID, embed.aspx might work
        const sitesMatch = uri.pathname.match(/^(\/sites\/[^/]+)/i);
        const sitePrefix = sitesMatch ? sitesMatch[1] : "";
        return `${baseOrigin}${sitePrefix}/_layouts/15/embed.aspx?UniqueId=${encodeURIComponent(fileId)}`;
      }
    }
  }

  // ── D. Short sharing links /:v:/ /:b:/ /:p:/ /:x:/ ──────────────────────
  // Pattern: https://org.sharepoint.com/:v:/g/personal/user/DOCID?e=TOKEN
  const sharingMatch = url.match(
    /^(https:\/\/[^/]+)(\/sites\/[^/]+)?\/:[vbpxf]:\/(?:g\/)?(?:personal\/([^/]+)\/)?([^?]+)/i
  );
  if (sharingMatch) {
    const [, host, sitePath, , docId] = sharingMatch;
    const cleanDocId = docId.split("?")[0];
    if (url.includes("/:v:/")) {
      // Video — use videoembedhost.aspx
      const site = sitePath || "";
      if (url.includes("/personal/")) {
        const userMatch = url.match(/\/personal\/([^/]+)\//);
        const user = userMatch ? userMatch[1] : "";
        return `${host}/personal/${user}/_layouts/15/embed.aspx?id=${encodeURIComponent(cleanDocId)}`;
      }
      return `${host}${site}/_layouts/15/embed.aspx?id=${encodeURIComponent(cleanDocId)}`;
    }
    // Document — use embedview action
    const embedUri = new URL(url);
    embedUri.searchParams.set("action", "embedview");
    return embedUri.toString();
  }

  // ── E. Already has ?embed=1 or ?action=embedview ─────────────────────────
  if (uri.searchParams.get("embed") === "1" || uri.searchParams.get("action") === "embedview") {
    return url;
  }

  // ── F. Fallback: append embed=1 and hope for the best ────────────────────
  uri.searchParams.set("embed", "1");
  return uri.toString();
}

/**
 * Checks if a URL is a SharePoint link
 */
export function isSharePointUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("sharepoint.com") ||
    url.includes("1drv.ms") ||
    url.includes("onedrive.live.com")
  );
}

/**
 * Check if a SharePoint URL is using the problematic stream.aspx (non-embeddable)
 */
export function isStreamAspxUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.toLowerCase().includes("stream.aspx");
}
