/**
 * Check if an email belongs to a super admin.
 * Server-side: reads SUPER_ADMIN_EMAILS.
 * Client-side: reads NEXT_PUBLIC_SUPER_ADMIN_EMAILS.
 */
export function isSuperAdmin(email: string): boolean {
  const envVar =
    process.env.SUPER_ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ||
    "";
  const adminEmails = envVar
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
