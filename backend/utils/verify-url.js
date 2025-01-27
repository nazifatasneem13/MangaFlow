import { parse } from "tldts";
import { isValidIpAddress } from "./ip.js"; // Assuming you already have this function to validate IPs
import { verifyLegitimateDomain } from "./domain.js"; // Assuming you already have this function to validate domains
import { resolve } from "node:dns/promises";
import { URL } from "node:url";

// Whitelist of trusted domains
const whitelist = new Set([
  "plus.unsplash.com",
  "trusted-domain-1.com",
  "trusted-domain-2.com",
  // Add other trusted domains here...
]);

// Function to check if the URL resolves to localhost (loopback address)
async function doesResolveToLocalhost(url) {
  try {
    const { hostname } = new URL(url);
    const resolvedIps = await resolve(hostname, "A");

    // Check if any resolved IP is a loopback IP (127.x.x.x or ::1 for IPv6)
    return resolvedIps.some((ip) => ip.startsWith("127.") || ip === "::1");
  } catch (error) {
    return false;
  }
}

// Simple schema matching function to check if the schema is allowed
function matchesSchema(schema, allowedSchemas = ["https:", "wss:"]) {
  return allowedSchemas.includes(schema); // Direct check for https or wss
}

// Main URL verification function
export async function verifySafeUrl(userProvidedUrl) {
  const [urlSchema] = userProvidedUrl.split("//");

  // Checking if the schema is allowed (e.g., https or wss)
  if (!matchesSchema(urlSchema)) {
    return {
      isValid: false,
      message: "Unsupported URL schema", // If it's not https or wss
    };
  }

  // Parse the URL
  const { hostname, isIp } = parse(userProvidedUrl, {
    detectIp: true,
    validateHostname: true,
    allowPrivateDomains: false, // Disallow private domains (e.g., localhost, internal IPs)
  });

  try {
    // If it's an IP address, validate it
    if (isIp) {
      const ipAddress = hostname;

      // Block loopback IPs explicitly (127.x.x.x for IPv4, ::1 for IPv6)
      if (ipAddress.startsWith("127.") || ipAddress === "::1") {
        return {
          isValid: false,
          message: "URL resolves to localhost (loopback address)",
        };
      }

      // Validate other IP addresses (private or reserved IPs)
      return isValidIpAddress(ipAddress)
        ? {
            isValid: true,
            message: "Valid IP address",
          }
        : {
            isValid: false,
            message: "Unsafe IP address", // Invalid or reserved IP
          };
    }

    // If it's a domain, check if it's legitimate or in the whitelist
    const isDomainLegitimate = verifyLegitimateDomain(hostname);
    const isWhitelisted = whitelist.has(hostname);

    if (isWhitelisted && isDomainLegitimate) {
      return {
        isValid: true,
        message: "URL is valid and safe",
      };
    }

    return {
      isValid: false,
      message: "Unsafe URL provided", // URL is neither whitelisted nor legitimate
    };
  } catch (error) {
    console.error("Error verifying URL:", error);
    return {
      isValid: false,
      message: "Invalid URL or DNS resolution error", // Catch any unexpected errors
    };
  }
}
