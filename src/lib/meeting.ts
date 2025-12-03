/**
 * Generate a unique room ID for meeting links
 * @param length - Length of the random string (default: 10)
 * @returns A random alphanumeric string
 */
export function generateRoomId(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a meeting link URL
 * @param roomId - The room ID to use
 * @returns Full meeting URL
 */
export function generateMeetingLink(roomId: string): string {
  return `https://meet.alignr.in/${roomId}`;
}

