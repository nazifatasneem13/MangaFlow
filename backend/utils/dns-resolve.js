// utils/dns-resolve.js
import { resolve } from "node:dns/promises";
import { URL } from "node:url";

export async function doesResolveToLocalhost(url) {
  try {
    const { hostname } = new URL(url);
    const resolvedIps = await resolve(hostname, "A");
    return resolvedIps.some((ip) => ip.startsWith("127."));
  } catch {
    return false;
  }
}
