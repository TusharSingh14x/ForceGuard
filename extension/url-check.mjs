// URL signals adapted from mlp02/networksecurity/utils/ml_utils/url_features.py.
// No URL is fetched, persisted, or sent to a prediction service.
const SHORTENERS = new Set([
  "bit.ly", "goo.gl", "is.gd", "ow.ly", "t.co", "tinyurl.com",
  "buff.ly", "cutt.ly", "rebrand.ly",
]);
export const FEATURE_COLUMNS = [
  "having_IP_Address", "URL_Length", "Shortining_Service", "having_At_Symbol",
  "double_slash_redirecting", "Prefix_Suffix", "having_Sub_Domain", "SSLfinal_State",
  "Domain_registeration_length", "Favicon", "port", "HTTPS_token", "Request_URL",
  "URL_of_Anchor", "Links_in_tags", "SFH", "Submitting_to_email", "Abnormal_URL",
  "Redirect", "on_mouseover", "RightClick", "popUpWidnow", "Iframe", "age_of_domain",
  "DNSRecord", "web_traffic", "Page_Rank", "Google_Index", "Links_pointing_to_page",
  "Statistical_report",
];
const KNOWN_FEATURES = [0, 1, 2, 3, 4, 5, 6, 11];
const isIp = (host) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(":");

function parseAddress(input) {
  if (typeof input !== "string" || !input.trim())
    throw new Error("Enter a website address, such as example.com.");
  let candidate = input.trim();
  if (candidate.length > 2048) throw new Error("Use an address of at most 2,048 characters.");
  if (/[\s\\\u0000-\u001f\u007f]/u.test(candidate))
    throw new Error("Remove spaces, control characters, or backslashes from the address.");
  if (candidate.startsWith("//")) candidate = "https:" + candidate;
  else if (!/^https?:\/\//i.test(candidate)) {
    // A port on a bare host is not a URL scheme.
    if (/^[a-z][a-z\d+.-]*:/i.test(candidate) && !/^(?:localhost|[^/?#:]*(?:\.[^/?#:]+)):\d+(?:[/?#]|$)/i.test(candidate))
      throw new Error("Use an HTTP or HTTPS website address.");
    candidate = "https://" + candidate;
  }
  if (!/^https?:\/\/[^/?#]/i.test(candidate))
    throw new Error("Enter a valid HTTP or HTTPS address with a hostname.");
  let url;
  try { url = new URL(candidate); }
  catch { throw new Error("Enter a valid website address and port."); }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || (!isIp(host) && !/^(?=.{1,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*$/i.test(host)))
    throw new Error("The address has an invalid hostname.");
  return { candidate, url, host };
}

function internalAddress(host) {
  if (!host.includes(".") && !host.includes(":")) return true;
  if (host === "localhost" || /\.(?:localhost|local|internal|test|invalid|example)$/.test(host)) return true;
  if (host.includes(":")) {
    const address = host.replace(/^\[|\]$/g, "");
    return address === "::1" || address === "::" || /^(?:f[cd]|fe[89ab])/.test(address) || address.startsWith("::ffff:");
  }
  if (!isIp(host)) return false;
  const [a, b] = host.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

export function auditUrl(input) {
  const { candidate, url, host } = parseAddress(input);
  const flags = [];
  const add = (level, text) => flags.push({ level, text });
  if (url.username || url.password)
    add("high", "Text before @ can disguise the destination. The actual host is shown above.");
  if (url.protocol === "http:") add("medium", "HTTP traffic is not encrypted in transit.");
  if (host.includes("xn--")) add("medium", "Internationalized hostname: check for lookalike characters.");
  if (isIp(host)) add("medium", "This address uses an IP literal instead of a domain name.");
  if (host.split(".").length >= 5) add("low", "Many subdomain labels: inspect the destination carefully.");
  if (url.port && !["80", "443"].includes(url.port)) add("low", "This address uses a non-standard port.");
  if ([...SHORTENERS].some((domain) => host === domain || host.endsWith("." + domain)))
    add("medium", "A URL shortener hides the final destination. Redirects have not been followed.");
  if (candidate.length > 75) add("low", "Long address: inspect the hostname separately from the path and query.");
  if (url.pathname.includes("//")) add("low", "Repeated slashes in the path can make an address harder to read.");
  if (host.includes("https")) add("low", "The word https in a hostname does not establish trust.");
  const highest = flags.some((flag) => flag.level === "high") ? "high"
    : flags.some((flag) => flag.level === "medium") ? "medium" : flags.length ? "low" : "none";
  return {
    host, encrypted: url.protocol === "https:", flags,
    assessment: highest === "high" ? "Strong address warning" : highest === "none" ? "No obvious address warnings" : "Review this address",
    level: highest,
    internal: internalAddress(host),
    metrics: { length: candidate.length, labels: host.split(".").length, pathSegments: url.pathname.split("/").filter(Boolean).length },
  };
}

// Parity with the supplied Python extractor, including its legacy proxy features.
// Prediction bounds below use only observed lexical features, never those proxies.
export function extractModelFeatures(input) {
  const { candidate, url, host } = parseAddress(input);
  const authority = candidate.split("://")[1].split(/[/?#]/)[0];
  const portText = authority.match(/:(\d+)$/)?.[1];
  const labels = host.split(".").filter(Boolean);
  const originalPath = candidate.split("://")[1].replace(/^[^/?#]+/, "").split(/[?#]/)[0];
  const values = Array(30).fill(0);
  values[0] = isIp(host) ? -1 : 1;
  values[1] = candidate.length > 75 ? -1 : candidate.length > 54 ? 0 : 1;
  values[2] = SHORTENERS.has(host) ? -1 : 1;
  values[3] = candidate.includes("@") ? -1 : 1;
  values[4] = originalPath.includes("//") ? -1 : 1;
  values[5] = host.includes("-") ? -1 : 1;
  values[6] = labels.length > 3 ? -1 : labels.length === 3 ? 0 : 1;
  values[7] = url.protocol === "https:" ? 1 : -1;
  values[10] = portText && ![80, 443].includes(Number(portText)) ? -1 : 1;
  values[11] = host.includes("https") ? -1 : 1;
  values[16] = candidate.toLowerCase().includes("mailto:") ? -1 : 1;
  values[17] = authority !== host ? -1 : 1;
  // Keep raw path depth, matching Python rather than URL's dot-segment normalization.
  values[18] = originalPath.split("/").length - 1 > 3 ? -1 : 1;
  values[29] = 1;
  return values;
}

export function validateForest(model) {
  if (model?.format !== "focusguard-random-forest-v1" || model.phishingClass !== 0 ||
      JSON.stringify(model.features) !== JSON.stringify(FEATURE_COLUMNS) ||
      JSON.stringify(model.classes) !== "[0,1]" || !Array.isArray(model.trees) || !model.trees.length)
    throw new Error("The bundled URL model has an unsupported format.");
  for (const nodes of model.trees) {
    if (!Array.isArray(nodes) || !nodes.length) throw new Error("Invalid model tree.");
    // Exported sklearn trees number children after their parent. This also excludes cycles.
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      if (!Array.isArray(node) || node.length !== 5 || node.some((n) => !Number.isFinite(n)) || node[4] < 0 || node[4] > 1)
        throw new Error("Invalid model node.");
      if (node[0] === -1 && node[1] === -1) continue;
      if (![node[0], node[1]].every((child) => Number.isInteger(child) && child > index && child < nodes.length) ||
          !Number.isInteger(node[2]) || node[2] < 0 || node[2] >= 30)
        throw new Error("Invalid model branch.");
    }
  }
  return model;
}

export function predictForest(model, values) {
  if (!Array.isArray(values) || values.length !== 30 || values.some((n) => !Number.isFinite(n)))
    throw new Error("The model requires 30 finite feature values.");
  return model.trees.reduce((sum, nodes) => {
    let index = 0;
    while (nodes[index][0] !== -1) {
      const [left, right, feature, threshold] = nodes[index];
      index = Math.fround(values[feature]) <= threshold ? left : right;
    }
    return sum + nodes[index][4];
  }, 0) / model.trees.length;
}

export function forestBounds(model, observed) {
  const allowed = Array.from({ length: 30 }, (_, index) =>
    observed[index] === undefined ? [-1, 0, 1] : [observed[index]]);
  const range = (nodes, index) => {
    const [left, right, feature, threshold, score] = nodes[index];
    if (left === -1) return [score, score];
    const original = allowed[feature];
    const branches = [
      [left, original.filter((value) => Math.fround(value) <= threshold)],
      [right, original.filter((value) => Math.fround(value) > threshold)],
    ];
    let low = 1, high = 0;
    for (const [child, possible] of branches) {
      if (!possible.length) continue;
      allowed[feature] = possible;
      const result = range(nodes, child);
      low = Math.min(low, result[0]); high = Math.max(high, result[1]);
    }
    allowed[feature] = original;
    return [low, high];
  };
  const sum = model.trees.reduce((acc, nodes) => {
    const result = range(nodes, 0);
    return [acc[0] + result[0], acc[1] + result[1]];
  }, [0, 0]);
  // Separate tree bounds are conservative; joint assignments can yield a narrower range.
  return { lower: sum[0] / model.trees.length, upper: sum[1] / model.trees.length };
}

let modelPromise;
async function bundledModel() {
  if (!modelPromise) {
    const path = typeof chrome !== "undefined" && chrome.runtime?.id
      ? chrome.runtime.getURL("models/url-forest.json") : "/focusguard-url-model.json";
    modelPromise = fetch(path).then(async (response) => {
      if (!response.ok) throw new Error("The bundled URL model could not be loaded.");
      return validateForest(await response.json());
    }).catch((error) => { modelPromise = undefined; throw error; });
  }
  return modelPromise;
}

export async function checkUrl(input, loadModel = bundledModel) {
  const audit = auditUrl(input);
  if (audit.internal) return { ...audit, model: { status: "skipped", summary: "Internal address — model not applicable", detail: "Address checks still work. The public-site model is not used for local or internal hosts." } };
  try {
    const model = await loadModel();
    const values = extractModelFeatures(input);
    const observed = Object.fromEntries(KNOWN_FEATURES.map((index) => [index, values[index]]));
    const bounds = forestBounds(model, observed);
    return { ...audit, model: {
      status: "experimental", summary: bounds.lower > 0.5 ? "Phishing-leaning model signal"
        : bounds.upper < 0.5 ? "Legitimate-leaning model signal" : "Inconclusive — more evidence needed",
      ...bounds, observed: KNOWN_FEATURES.length, total: 30, trees: model.trees.length,
      detail: "Experimental score range, not a confidence interval or safety verdict. Certificate, content, DNS and reputation features are unknown; they are not replaced with zero.",
    } };
  } catch {
    return { ...audit, model: { status: "unavailable", summary: "Model unavailable — address checks completed", detail: "Reload the workspace or reinstall the latest extension package. No model result has been substituted." } };
  }
}
