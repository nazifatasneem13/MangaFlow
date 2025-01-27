// ip.js or ip.mjs
import { Address4, Address6 } from "ip-address";

// **RFC 1918** local (private) IPv4 address ranges
const rfc1918Ranges = [
  new Address4("10.0.0.0/8"),
  new Address4("172.16.0.0/12"),
  new Address4("192.168.0.0/16"),
];

// **RFC 4193** local (private) IPv6 address range
const rfc4193Range = new Address6("fc00::/7");

const v4MappedIPv6 = new Address6("::ffff:0:0/96");
const unspecifiedIPv4 = new Address4("0.0.0.0/32");

// Function to verify an IPv4 address
export function verifyIPv4Address(hostname) {
  const parsed = new Address4(hostname);

  if (!parsed.isCorrect()) return false;

  // Block loopback addresses (127.0.0.1 and 127.x.x.x)
  if (parsed.address.startsWith("127.")) return false;

  // Block access to the unspecified network interface (0.0.0.0)
  if (parsed.isInSubnet(unspecifiedIPv4)) return false;

  // Block any address from the conventional (RFC 1918) private ranges
  for (const privateRange of rfc1918Ranges) {
    if (parsed.isInSubnet(privateRange)) {
      return false;
    }
  }
  return true;
}

// Function to verify an IPv6 address
export function verifyIPv6Address(hostname) {
  const parsed = new Address6(hostname);

  // Block Teredo addresses to avoid bypassing IPv4 restrictions
  if (!parsed.isCorrect() || parsed.isTeredo()) return false;

  // Block IPv6 loopback (::1)
  if (parsed.address.startsWith("::1")) return false;

  // Block IPv4-mapped IPv6 addresses
  if (parsed.isInSubnet(v4MappedIPv6)) return false;

  // Block Unique Local Addresses (ULAs)
  return !parsed.isInSubnet(rfc4193Range);
}

// Main function to verify whether an IP is valid
export function isValidIpAddress(hostname) {
  try {
    // First, try validating as IPv4
    return verifyIPv4Address(hostname);
  } catch {
    // If it's not IPv4, try validating as IPv6
    return verifyIPv6Address(hostname);
  }
}
