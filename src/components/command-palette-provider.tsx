"use client";

import { useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";
import { SearchModal } from "./modals/search-modal";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

export function CommandPaletteProvider() {
  const [boxes, setBoxes] = useState<{ id: string; short_id: string; name: string; icon_url: string | null }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  // Extract active box short_id and UUID from the URL
  const boxMatch = pathname.match(/^\/box\/([^/]+)/);
  const activeBoxShortId = boxMatch?.[1];
  const activeBox = boxes.find((b) => b.short_id === activeBoxShortId);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("box_members")
        .select("box_id, boxes(id, short_id, name, icon_url)")
        .eq("user_id", user.id)
        .then(({ data }) => {
          setBoxes(
            (data ?? []).map((m) => {
              const box = m.boxes as unknown as { id: string; short_id: string; name: string; icon_url: string | null };
              return box;
            })
          );
        });
    });
  }, []);

  return (
    <>
      <CommandPalette
        boxes={boxes}
        activeBoxId={activeBoxShortId}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        boxShortId={activeBoxShortId}
        boxId={activeBox?.id}
      />
    </>
  );
}
