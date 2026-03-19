import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CommandPaletteProvider } from "@/components/command-palette-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      {children}
      <CommandPaletteProvider />
    </>
  );
}
