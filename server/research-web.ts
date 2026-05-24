export interface WebFetchResult {
  url: string;
  title: string;
  content: string;
  contentLength: number;
  statusCode: number;
  fetchedAt: string;
  error?: string;
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

function extractTextContent(html: string): string {
  let text = html;

  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ");

  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "• ");
  text = text.replace(/<\/tr>/gi, "\n");
  text = text.replace(/<td[^>]*>/gi, " | ");

  text = text.replace(/<[^>]+>/g, " ");

  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&#\d+;/g, "");
  text = text.replace(/&\w+;/g, "");

  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  const maxChars = 50000;
  if (text.length > maxChars) {
    text = text.slice(0, maxChars) + "\n\n[Content truncated at 50,000 characters]";
  }

  return text;
}

import { pinnedFetch, SsrfError } from "./ssrf-guard.js";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; KAPPA-Research/1.0)",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
  "Accept-Language": "en-US,en;q=0.5",
};

const MAX_REDIRECTS = 5;

export async function fetchUrl(url: string): Promise<WebFetchResult> {
  const fetchedAt = new Date().toISOString();

  try {
    let currentUrl = url;

    const parsedUrl = new URL(currentUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { url, title: "", content: "", contentLength: 0, statusCode: 0, fetchedAt, error: "Only HTTP/HTTPS URLs are supported" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    let redirectsFollowed = 0;

    while (true) {
      response = await pinnedFetch(currentUrl, {
        headers: FETCH_HEADERS,
        signal: controller.signal,
        redirect: "manual",
      });

      const isRedirect = response.status >= 300 && response.status < 400;
      if (!isRedirect) break;

      if (redirectsFollowed >= MAX_REDIRECTS) {
        clearTimeout(timeout);
        return { url, title: "", content: "", contentLength: 0, statusCode: response.status, fetchedAt, error: "Too many redirects" };
      }

      const location = response.headers.get("location");
      if (!location) break;

      const nextUrl = new URL(location, currentUrl).toString();
      const nextParsed = new URL(nextUrl);

      if (!["http:", "https:"].includes(nextParsed.protocol)) {
        clearTimeout(timeout);
        return { url, title: "", content: "", contentLength: 0, statusCode: 0, fetchedAt, error: "Redirect to non-HTTP protocol blocked" };
      }

      currentUrl = nextUrl;
      redirectsFollowed++;
    }

    const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_RESPONSE_BYTES) {
      clearTimeout(timeout);
      return { url, title: "", content: "", contentLength: 0, statusCode: response.status, fetchedAt, error: `Response too large: ${(contentLength / 1024 / 1024).toFixed(1)}MB (max 2MB)` };
    }

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";
    const rawBody = await response.text();

    let title = "";
    let content = "";

    if (contentType.includes("text/html") || contentType.includes("application/xhtml")) {
      title = extractTitle(rawBody);
      content = extractTextContent(rawBody);
    } else if (contentType.includes("application/json")) {
      title = "JSON Response";
      try {
        content = JSON.stringify(JSON.parse(rawBody), null, 2);
      } catch {
        content = rawBody;
      }
    } else if (contentType.includes("text/")) {
      title = "Text Content";
      content = rawBody.slice(0, 50000);
    } else {
      title = "Binary Content";
      content = `[Binary content: ${contentType}, ${rawBody.length} bytes]`;
    }

    return {
      url,
      title,
      content,
      contentLength: content.length,
      statusCode: response.status,
      fetchedAt,
    };
  } catch (err: any) {
    if (err instanceof SsrfError) {
      return { url, title: "", content: "", contentLength: 0, statusCode: 0, fetchedAt, error: err.message };
    }
    return {
      url,
      title: "",
      content: "",
      contentLength: 0,
      statusCode: 0,
      fetchedAt,
      error: err.name === "AbortError" ? "Request timed out (15s)" : err.message,
    };
  }
}
