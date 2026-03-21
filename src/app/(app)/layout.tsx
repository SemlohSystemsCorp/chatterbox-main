import { getAuthUser } from "@/lib/data";
import { CommandPaletteProvider } from "@/components/command-palette-provider";
import { BanGuard } from "@/components/ban-guard";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Uses React cache() — deduped with any page-level getAuthUser() call.
  // Middleware already guards unauthenticated access, this is a safety net.
  await getAuthUser();

  return (
    <>
      {children}
      <BanGuard />
      <CommandPaletteProvider />
    </>
  );
}
