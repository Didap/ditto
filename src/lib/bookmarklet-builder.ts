import { extractDesignData } from "@/lib/extractor/in-page";

/**
 * Builds the self-contained JS body the bookmarklet runs in the user's tab.
 * Used both by the thin-loader endpoint (script tag) and by the fat inline
 * bookmarklet (javascript: URI) served as `bookmarkletHref`.
 *
 * Shows a fixed-position notice so the user gets immediate visual feedback —
 * strict CSP on the target site can silently drop injected scripts and the
 * user otherwise sees "nothing happens".
 */
export function buildBookmarkletBody(token: string, origin: string): string {
  const extractSource = extractDesignData.toString();
  const postUrl = `${origin}/api/extract/client`;

  return `(function(){
var notice;
function showNotice(text, bg){
  try {
    if (!notice) {
      notice = document.createElement("div");
      notice.style.cssText = "position:fixed;top:16px;right:16px;z-index:2147483647;padding:12px 16px;color:#0f172a;border-radius:8px;font:14px/1.4 system-ui,-apple-system,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,0.2);max-width:320px;";
      document.body.appendChild(notice);
    }
    notice.style.background = bg || "#C4A8D8";
    notice.textContent = text;
  } catch(_){}
}
function removeNotice(){
  try { if (notice) notice.remove(); } catch(_){}
}
try {
  showNotice("Ditto: extracting design tokens...");
  var extractFn = ${extractSource};
  var data = extractFn();
  var favEl = document.querySelector('link[rel*="icon"]');
  var descEl = document.querySelector('meta[name="description"]');
  data.meta = {
    url: location.href,
    title: document.title || location.hostname,
    description: descEl ? descEl.getAttribute("content") || "" : "",
    favicon: favEl ? favEl.href : "",
    screenshot: ""
  };
  data.downloadedFonts = [];
  showNotice("Ditto: sending to server...");
  var form = document.createElement("form");
  form.method = "POST";
  form.action = ${JSON.stringify(postUrl)};
  form.target = "_blank";
  form.enctype = "application/x-www-form-urlencoded";
  form.style.display = "none";
  var t = document.createElement("input");
  t.type = "hidden"; t.name = "token"; t.value = ${JSON.stringify(token)};
  form.appendChild(t);
  var d = document.createElement("input");
  d.type = "hidden"; d.name = "data"; d.value = JSON.stringify(data);
  form.appendChild(d);
  document.body.appendChild(form);
  form.submit();
  setTimeout(function(){
    try { form.remove(); } catch(_){}
    showNotice("Ditto: done. Check the new tab.", "#16a34a");
    setTimeout(removeNotice, 3000);
  }, 800);
} catch (e) {
  showNotice("Ditto error: " + (e && e.message ? e.message : e), "#dc2626");
  setTimeout(removeNotice, 5000);
}
})();`;
}

/** Returns the fat `javascript:...` href for the given token + origin. */
export function buildBookmarkletHref(token: string, origin: string): string {
  return `javascript:${encodeURIComponent(buildBookmarkletBody(token, origin))}`;
}
