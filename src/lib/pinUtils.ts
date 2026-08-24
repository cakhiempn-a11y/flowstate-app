export async function hashPin(pin: string, uid: string): Promise<string> {
  const encoder = new TextEncoder();
  // Use UID as salt to prevent rainbow table attacks, though 4-6 digits are small anyway
  const data = encoder.encode(pin + uid);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
