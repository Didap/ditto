import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/bookmarklet-token";
import { extractDesignData } from "@/lib/extractor/in-page";

/**
 * Serves the bookmarklet body — a self-contained JS that the user's browser
 * runs on the target (WAF-protected) site. It extracts design tokens locally,
 * then form-POSTs them to `/api/extract/client` in a new tab.
 *
 * The token is baked into the served script. If the token is expired/invalid,
 * we serve a harmless alert() so the stale bookmarklet fails loudly.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  const payload = token ? verifyToken(token) : null;

  const headers = {
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "no-store",
  };

  if (!payload) {
    return new NextResponse(
      `alert(${JSON.stringify(
        "Ditto bookmarklet: token expired or invalid. Regenerate it from your Add Design page."
      )});`,
      { status: 401, headers }
    );
  }

  const extractSource = extractDesignData.toString();
  const postUrl = `${url.origin}/api/extract/client`;

  const js = `(function(){
  try {
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
    setTimeout(function(){ try { form.remove(); } catch(_){} }, 2000);
  } catch (e) {
    alert("Ditto extraction error: " + (e && e.message ? e.message : e));
  }
})();`;

  return new NextResponse(js, { headers });
}
