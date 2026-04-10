/**
 * Utility to transform various media URLs into embeddable formats
 * Specifically handles BNI Finance SharePoint/OneDrive links and YouTube links
 */

export function getEmbedUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const uri = new URL(url);

    // 1. YouTube Handling
    if (uri.hostname.includes("youtube.com") || uri.hostname.includes("youtu.be")) {
      let videoId = "";
      if (uri.hostname.includes("youtu.be")) {
        videoId = uri.pathname.substring(1);
      } else {
        videoId = uri.searchParams.get("v") || "";
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // 2. SharePoint / OneDrive Handling
    if (uri.hostname.includes("sharepoint.com")) {
      // Logic for Video links (usually contains /:v:/)
      if (url.includes("/:v:/") || url.includes("/:v/")) {
        // Pattern: https://org.sharepoint.com/:v:/g/personal/user/ID
        // To: https://org.sharepoint.com/personal/user/_layouts/15/videoembedhost.aspx?extdocid=ID
        
        const match = url.match(/(https:\/\/.*?\/)(?::v:\/g\/)?personal\/(.*?)\/(.*)/);
        if (match) {
          const baseUrl = match[1];
          const userPath = match[2];
          const docId = match[3].split("?")[0]; // Remove query params if any
          return `${baseUrl}personal/${userPath}/_layouts/15/videoembedhost.aspx?extdocid=${docId}`;
        }
      }

      // Logic for Document links (PDF/PPT - usually contains /:b:/ or /:p:/)
      if (url.includes("/:b:/") || url.includes("/:p:/") || url.includes("/:x:/")) {
        // Just append action=embedview or transform to Doc.aspx
        if (!uri.searchParams.has("action")) {
          uri.searchParams.set("action", "embedview");
        }
        return uri.toString();
      }

      // Fallback: If it's a share link but not caught above, try adding action=embedview
      if (uri.searchParams.has("id") || url.includes("sourcedoc")) {
         uri.searchParams.set("action", "embedview");
         return uri.toString();
      }
    }

    return url;
  } catch (e) {
    return url;
  }
}

/**
 * Checks if a URL is likely a SharePoint link
 */
export function isSharePointUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("sharepoint.com");
}
