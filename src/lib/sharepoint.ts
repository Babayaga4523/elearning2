/**
 * SharePoint Video URL Converter
 *
 * Converts various SharePoint/OneDrive URL formats into embeddable URLs.
 *
 * SharePoint stream.aspx has CSP frame-ancestors 'none' and CANNOT be
 * embedded. We must convert it to embed.aspx or use EmbedRedirect.aspx.
 *
 * Supported conversions:
 *  - stream.aspx?id=...       → embed.aspx?id=... + action=embedview
 *  - /sites/.../video.mp4    → embed.aspx?id=... (direct file)
 *  - /:v:/s/SITE/DOCID?e=    → EmbedRedirect.aspx (sharing links)
 *  - /:v:/g/personal/...     → embed.aspx via id extraction
 *  - OneDrive embed links     → Direct video URL extraction
 *  - sharepoint.com/_layouts/15/embed.aspx → return as-is
 */

export function getEmbedUrl(url: string | null | undefined): string {
  if (!url) return "";

  // Clean the URL first
  const cleanUrl = url.trim();

  try {
    const uri = new URL(cleanUrl);

    // ── 1. YouTube ────────────────────────────────────────────────────────────
    if (isYouTubeUrl(uri)) {
      return convertYouTubeToEmbed(cleanUrl, uri);
    }

    // ── 2. SharePoint / OneDrive ──────────────────────────────────────────────
    if (isSharePointUrl(uri)) {
      return convertSharePointToEmbedUrl(cleanUrl, uri);
    }

    // ── 3. Direct video files (.mp4, .webm, etc.) ────────────────────────────
    if (isDirectVideoUrl(cleanUrl)) {
      return cleanUrl;
    }

    return cleanUrl;
  } catch {
    return url;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// YouTube Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function isYouTubeUrl(uri: URL): boolean {
  return (
    uri.hostname.includes("youtube.com") ||
    uri.hostname.includes("youtu.be") ||
    uri.hostname.includes("youtube-nocookie.com")
  );
}

function convertYouTubeToEmbed(url: string, uri: URL): string {
  let videoId = "";

  if (uri.hostname.includes("youtu.be")) {
    videoId = uri.pathname.substring(1).split("?")[0];
  } else if (uri.pathname.includes("/embed/")) {
    return url; // Already an embed URL
  } else {
    videoId = uri.searchParams.get("v") || "";
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
  }

  return url;
}

// ─────────────────────────────────────────────────────────────────────────────
// SharePoint Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function isSharePointUrl(uri: URL): boolean {
  return (
    uri.hostname.includes("sharepoint.com") ||
    uri.hostname.includes("1drv.ms") ||
    uri.hostname.includes("onedrive.live.com") ||
    uri.hostname.includes("clipchamp.com")
  );
}

function isDirectVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.match(/\.(mp4|webm|ogg|mov|avi|mkv|m4v)(\?.*)?$/) !== null ||
    lower.includes("/video/") ||
    lower.includes("/videos/")
  );
}

function convertSharePointToEmbedUrl(url: string, uri: URL): string {
  const baseOrigin = uri.origin;
  const pathLower = uri.pathname.toLowerCase();

  // ── A. Already embed.aspx URL ─────────────────────────────────────────────
  if (pathLower.includes("embed.aspx") || pathLower.includes("embedredirect.aspx")) {
    return url;
  }

  // ── B. stream.aspx URL (common SharePoint video link) ─────────────────────
  if (pathLower.includes("stream.aspx")) {
    const fileId = uri.searchParams.get("id");
    if (fileId) {
      // Build direct file URL with embedview action
      const normalizedPath = fileId.startsWith("/") ? fileId : `/${fileId}`;
      const absoluteFileUrl = new URL(normalizedPath, baseOrigin);
      absoluteFileUrl.searchParams.set("action", "embedview");
      return absoluteFileUrl.toString();
    }
  }

  // ── C. /_layouts/15/ other pages ──────────────────────────────────────────
  if (pathLower.includes("/_layouts/")) {
    const fileId = uri.searchParams.get("id") || uri.searchParams.get("sourcedoc") || uri.searchParams.get("uniqueid");
    if (fileId) {
      const normalizedPath = fileId.includes("/")
        ? (fileId.startsWith("/") ? fileId : `/${fileId}`)
        : fileId;

      if (normalizedPath.includes("/")) {
        // It's a path, use embedview action
        const absoluteFileUrl = new URL(normalizedPath, baseOrigin);
        absoluteFileUrl.searchParams.set("action", "embedview");
        return absoluteFileUrl.toString();
      } else {
        // It's a GUID, use embed.aspx with UniqueId
        const sitesMatch = uri.pathname.match(/^\/sites\/([^/]+)/i);
        const sitePrefix = sitesMatch ? `/sites/${sitesMatch[1]}` : "";
        return `${baseOrigin}${sitePrefix}/_layouts/15/embed.aspx?UniqueId=${encodeURIComponent(fileId)}`;
      }
    }
  }

  // ── D. SharePoint sharing links with ?e=TOKEN ────────────────────────────
  // Format: https://org.sharepoint.com/:v:/s/SITE/DOCID?e=TOKEN
  // This is an encrypted sharing link - needs special handling
  const eToken = uri.searchParams.get("e");
  if (eToken && (url.includes("/:v:/") || url.includes("/:b:/") || url.includes("/:p:/"))) {
    // Method 1: Try EmbedRedirect.aspx (works for some SharePoint versions)
    const encodedSrc = encodeURIComponent(url);
    return `${baseOrigin}/_layouts/15/EmbedRedirect.aspx?src=${encodedSrc}`;
  }

  // ── E. SharePoint short links /:v:/s/SITE/DOCID (without e=TOKEN) ────────
  // Format: https://org.sharepoint.com/:v:/s/elearning/DOCID
  const shortLinkMatch = url.match(/^(https:\/\/[^/]+)\/:[vbpxf]:\/s\/([^?]+)/i);
  if (shortLinkMatch) {
    const [, host, docId] = shortLinkMatch;
    const cleanDocId = docId.split("?")[0];

    // Check if it's a file path or GUID
    if (cleanDocId.includes("/")) {
      // It's a path like "Shared Documents/folder/video.mp4"
      return `${host}/_layouts/15/embed.aspx?id=${encodeURIComponent("/" + cleanDocId)}`;
    } else {
      // It's likely a SharePoint GUID
      return `${host}/_layouts/15/embed.aspx?UniqueId=${encodeURIComponent(cleanDocId)}`;
    }
  }

  // ── F. OneDrive embed links ────────────────────────────────────────────────
  // Format: https://1drv.ms/v/s!XXXXX?e=XXXXX
  if (url.includes("1drv.ms")) {
    const videoId = uri.searchParams.get("resid");
    if (videoId) {
      // OneDrive videos can be embedded with the resid
      return `${baseOrigin}/_layouts/15/embed.aspx?resid=${encodeURIComponent(videoId)}`;
    }
  }

  // ── G. Direct file path in SharePoint site ────────────────────────────────
  // Format: https://org.sharepoint.com/sites/SITE/Shared Documents/video.mp4
  const siteFileMatch = url.match(/\/sites\/([^/]+)\/([^?]+)/i);
  if (siteFileMatch) {
    const filePath = "/" + siteFileMatch[1] + "/" + siteFileMatch[2];
    return `${baseOrigin}/_layouts/15/embed.aspx?id=${encodeURIComponent(filePath)}`;
  }

  // ── H. OneDrive direct view link ──────────────────────────────────────────
  // Format: https://org-my.sharepoint.com/.../video.mp4
  if (uri.pathname.match(/\.[a-zA-Z0-9]+$/)) {
    // Ends with a file extension, might be a direct file
    return `${baseOrigin}/_layouts/15/embed.aspx?id=${encodeURIComponent(uri.pathname)}`;
  }

  // ── I. Already has embed=1 or action=embedview ────────────────────────────
  if (uri.searchParams.get("embed") === "1" || uri.searchParams.get("action") === "embedview") {
    return url;
  }

  // ── J. Last resort: try adding embed=1 ────────────────────────────────────
  uri.searchParams.set("embed", "1");
  return uri.toString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks if a URL is a SharePoint link
 */
export function isSharePointVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("sharepoint.com") ||
    lower.includes("1drv.ms") ||
    lower.includes("onedrive.live.com")
  );
}

/**
 * Check if a SharePoint URL is using the problematic stream.aspx
 */
export function isStreamAspxUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.toLowerCase().includes("stream.aspx");
}

/**
 * Check if URL is a SharePoint sharing link with encrypted token
 */
export function isSharePointSharingLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    (url.includes("/:v:/") || url.includes("/:b:/") || url.includes("/:p:")) &&
    url.includes("?e=")
  );
}

/**
 * Extract the original video path from SharePoint embed URL
 */
export function extractSharePointPath(embedUrl: string): string | null {
  try {
    const uri = new URL(embedUrl);
    const id = uri.searchParams.get("id");
    const uniqueId = uri.searchParams.get("UniqueId");
    const resid = uri.searchParams.get("resid");

    if (id) return decodeURIComponent(id);
    if (uniqueId) return uniqueId;
    if (resid) return resid;

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if the embed URL is valid (not a fallback/error URL)
 */
export function isValidEmbedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (!url.includes("sharepoint.com") && !url.includes("1drv.ms") && !url.includes("onedrive.live.com")) {
    return false;
  }
  // Check if it has embed-related parameters
  return (
    url.includes("embed.aspx") ||
    url.includes("embedredirect.aspx") ||
    url.includes("action=embedview") ||
    url.includes("embed=1")
  );
}

/**
 * Get a fallback download URL for videos that can't be embedded
 */
export function getSharePointDownloadUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const uri = new URL(url);

    // For sharing links, we can try to use the download endpoint
    if (url.includes("/:v:/") || url.includes("1drv.ms")) {
      // Return the original URL as a fallback - browser will handle it
      return url;
    }

    return null;
  } catch {
    return null;
  }
}