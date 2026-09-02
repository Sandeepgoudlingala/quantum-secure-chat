/**
 * Frontend Client-Side Cryptographic Helper Module.
 * Provides Base64 conversions, ArrayBuffer utilities, and SHA-256 integrity hash helpers.
 */

// Convert ArrayBuffer to Base64 String
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 String to Uint8Array
export function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Compute SHA-256 hex digest using Web Crypto API
export async function computeSHA256(dataBuffer) {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate Cryptographically Secure Random 96-bit IV
export function generateRandomIV() {
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  return arrayBufferToBase64(iv);
}
