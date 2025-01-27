// utils/domain.js
import isValidDomain from "is-valid-domain";

export function verifyLegitimateDomain(hostname) {
  return isValidDomain(hostname, {
    wildcard: false,
    subdomain: true,
    allowUnicode: false,
    topLevel: false,
  });
}
