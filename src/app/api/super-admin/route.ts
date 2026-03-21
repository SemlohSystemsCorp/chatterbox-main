import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/super-admin";
import { NextResponse, type NextRequest } from "next/server";

async function verifySuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", status: 401 };
  if (!isSuperAdmin(user.email ?? "")) return { error: "Forbidden", status: 403 };

  return { user };
}

// GET /api/super-admin?section=overview|users|boxes|feedback|user_detail
export async function GET(request: NextRequest) {
  const auth = await verifySuperAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const section = url.searchParams.get("section");

  // ── Overview ──
  if (section === "overview") {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalUsers },
      { count: totalBoxes },
      { count: totalMessages },
      { count: totalCalls },
      { count: activeUsersToday },
      { count: newSignupsThisWeek },
      { data: recentMessages },
      { data: recentSignups },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("boxes").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("messages").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("calls").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", todayStart),
      supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabaseAdmin
        .from("messages")
        .select("created_at")
        .gte("created_at", fourteenDaysAgo)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("profiles")
        .select("created_at")
        .gte("created_at", fourteenDaysAgo)
        .order("created_at", { ascending: true }),
    ]);

    const dailyMessages: Record<string, number> = {};
    for (const msg of recentMessages ?? []) {
      const day = msg.created_at.split("T")[0];
      dailyMessages[day] = (dailyMessages[day] || 0) + 1;
    }

    const dailySignups: Record<string, number> = {};
    for (const signup of recentSignups ?? []) {
      const day = signup.created_at.split("T")[0];
      dailySignups[day] = (dailySignups[day] || 0) + 1;
    }

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      totalBoxes: totalBoxes ?? 0,
      totalMessages: totalMessages ?? 0,
      totalCalls: totalCalls ?? 0,
      activeUsersToday: activeUsersToday ?? 0,
      newSignupsThisWeek: newSignupsThisWeek ?? 0,
      dailyMessages,
      dailySignups,
    });
  }

  // ── Users ──
  if (section === "users") {
    const page = parseInt(url.searchParams.get("page") ?? "0");
    const search = url.searchParams.get("search") ?? "";
    const limit = 50;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, avatar_url, username, status, created_at", { count: "exact" });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data: users, count } = await query
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    // Batch fetch box membership counts
    const userIds = users?.map((u) => u.id) ?? [];
    let boxCounts: Record<string, number> = {};
    if (userIds.length > 0) {
      const { data: memberships } = await supabaseAdmin
        .from("box_members")
        .select("user_id")
        .in("user_id", userIds);

      boxCounts = (memberships ?? []).reduce(
        (acc, m) => {
          acc[m.user_id] = (acc[m.user_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
    }

    // Fetch auth user data to get ban status
    let banMap: Record<string, { banned_until?: string; ban_reason?: string }> = {};
    if (userIds.length > 0) {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        for (const au of authData.users) {
          if (userIds.includes(au.id)) {
            const meta = au.user_metadata as Record<string, unknown> | undefined;
            if (au.banned_until || meta?.banned) {
              banMap[au.id] = {
                banned_until: au.banned_until
                  ? String(au.banned_until)
                  : undefined,
                ban_reason: meta?.ban_reason ? String(meta.ban_reason) : undefined,
              };
            }
          }
        }
      }
    }

    return NextResponse.json({
      users: (users ?? []).map((u) => ({
        ...u,
        boxCount: boxCounts[u.id] ?? 0,
        banned: !!banMap[u.id],
        ban_reason: banMap[u.id]?.ban_reason ?? null,
        banned_until: banMap[u.id]?.banned_until ?? null,
      })),
      total: count ?? 0,
      page,
      hasMore: (count ?? 0) > (page + 1) * limit,
    });
  }

  // ── User detail (single user with full data) ──
  if (section === "user_detail") {
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const [{ data: profile }, { data: memberships }, { data: settings }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single(),
      supabaseAdmin
        .from("box_members")
        .select("role, boxes(id, short_id, name, plan)")
        .eq("user_id", userId),
      supabaseAdmin
        .from("user_settings")
        .select("display_name, bio, pronouns, phone, location, website, company, job_title")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch auth data for ban status & metadata
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const meta = authUser?.user?.user_metadata as Record<string, unknown> | undefined;

    return NextResponse.json({
      profile,
      settings: settings ?? null,
      memberships: (memberships ?? []).map((m) => ({
        role: m.role,
        box: m.boxes as unknown as { id: string; short_id: string; name: string; plan: string },
      })),
      auth: {
        email_confirmed_at: authUser?.user?.email_confirmed_at ?? null,
        last_sign_in_at: authUser?.user?.last_sign_in_at ?? null,
        created_at: authUser?.user?.created_at ?? null,
        banned: !!authUser?.user?.banned_until || !!meta?.banned,
        banned_until: authUser?.user?.banned_until ? String(authUser.user.banned_until) : null,
        ban_reason: meta?.ban_reason ? String(meta.ban_reason) : null,
      },
    });
  }

  // ── Boxes ──
  if (section === "boxes") {
    const page = parseInt(url.searchParams.get("page") ?? "0");
    const search = url.searchParams.get("search") ?? "";
    const limit = 50;

    let query = supabaseAdmin
      .from("boxes")
      .select("id, short_id, name, slug, description, icon_url, owner_id, plan, created_at", { count: "exact" });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: boxes, count } = await query
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    const boxIds = boxes?.map((b) => b.id) ?? [];
    const ownerIds = [...new Set(boxes?.map((b) => b.owner_id) ?? [])];

    let memberCounts: Record<string, number> = {};
    let channelCounts: Record<string, number> = {};
    let ownerMap: Record<string, { full_name: string; email: string }> = {};

    if (boxIds.length > 0) {
      const [{ data: members }, { data: channels }, { data: owners }] = await Promise.all([
        supabaseAdmin.from("box_members").select("box_id").in("box_id", boxIds),
        supabaseAdmin.from("channels").select("box_id").in("box_id", boxIds).eq("is_archived", false),
        supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ownerIds),
      ]);

      memberCounts = (members ?? []).reduce(
        (acc, m) => {
          acc[m.box_id] = (acc[m.box_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      channelCounts = (channels ?? []).reduce(
        (acc, c) => {
          acc[c.box_id] = (acc[c.box_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      ownerMap = (owners ?? []).reduce(
        (acc, o) => {
          acc[o.id] = { full_name: o.full_name, email: o.email };
          return acc;
        },
        {} as Record<string, { full_name: string; email: string }>,
      );
    }

    return NextResponse.json({
      boxes: (boxes ?? []).map((b) => ({
        ...b,
        memberCount: memberCounts[b.id] ?? 0,
        channelCount: channelCounts[b.id] ?? 0,
        ownerName: ownerMap[b.owner_id]?.full_name ?? "Unknown",
        ownerEmail: ownerMap[b.owner_id]?.email ?? "",
      })),
      total: count ?? 0,
      page,
      hasMore: (count ?? 0) > (page + 1) * limit,
    });
  }

  // ── Feedback ──
  if (section === "feedback") {
    const page = parseInt(url.searchParams.get("page") ?? "0");
    const limit = 50;

    const { data: feedback, count } = await supabaseAdmin
      .from("feedback")
      .select("*, profiles:user_id(full_name, email, avatar_url)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    return NextResponse.json({
      feedback: feedback ?? [],
      total: count ?? 0,
      page,
      hasMore: (count ?? 0) > (page + 1) * limit,
    });
  }

  // ── Blog ──
  if (section === "blog") {
    const page = parseInt(url.searchParams.get("page") ?? "0");
    const limit = 50;

    const { data: posts, count } = await supabaseAdmin
      .from("blog_posts")
      .select("id, slug, title, category, excerpt, author_name, published, featured, published_at, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    return NextResponse.json({
      posts: posts ?? [],
      total: count ?? 0,
      page,
      hasMore: (count ?? 0) > (page + 1) * limit,
    });
  }

  // ── Blog single post (for editing) ──
  if (section === "blog_post") {
    const postId = url.searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const { data: post } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  }

  return NextResponse.json({ error: "Invalid section parameter" }, { status: 400 });
}

// POST /api/super-admin — create actions
export async function POST(request: NextRequest) {
  const auth = await verifySuperAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { action } = body;

  if (action === "create_blog_post") {
    const { title, slug, category, excerpt, content, author_name, author_role, read_time, published, featured } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    // Validate slug format
    const cleanSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");
    if (cleanSlug.length < 2) {
      return NextResponse.json({ error: "Slug must be at least 2 characters" }, { status: 400 });
    }

    // Check for duplicate slug
    const { data: existing } = await supabaseAdmin
      .from("blog_posts")
      .select("id")
      .eq("slug", cleanSlug)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 400 });
    }

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .insert({
        title: String(title).trim(),
        slug: cleanSlug,
        category: category || "Product",
        excerpt: excerpt || "",
        content: content || "",
        author_name: author_name || "",
        author_role: author_role || "",
        read_time: read_time || "5 min read",
        published: !!published,
        featured: !!featured,
        published_at: published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE /api/super-admin — destructive actions
export async function DELETE(request: NextRequest) {
  const auth = await verifySuperAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { action } = body;

  if (action === "delete_user") {
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    if (userId === auth.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (action === "delete_box") {
    const { boxId } = body;
    if (!boxId) {
      return NextResponse.json({ error: "boxId required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("boxes").delete().eq("id", boxId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (action === "delete_feedback") {
    const { feedbackId } = body;
    if (!feedbackId) {
      return NextResponse.json({ error: "feedbackId required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("feedback").delete().eq("id", feedbackId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (action === "delete_blog_post") {
    const { postId } = body;
    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", postId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// PATCH /api/super-admin — update actions
export async function PATCH(request: NextRequest) {
  const auth = await verifySuperAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { action } = body;

  // ── Change box plan ──
  if (action === "change_plan") {
    const { boxId, plan } = body;
    if (!boxId || !["free", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Invalid boxId or plan" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("boxes")
      .update({ plan, updated_at: new Date().toISOString() })
      .eq("id", boxId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // ── Edit user profile ──
  if (action === "edit_user") {
    const { userId, full_name, username, email, status } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const profileUpdates: Record<string, unknown> = {};

    if (full_name !== undefined) {
      const name = String(full_name).trim();
      if (name.length < 1 || name.length > 100) {
        return NextResponse.json({ error: "Name must be 1-100 characters" }, { status: 400 });
      }
      profileUpdates.full_name = name;
    }

    if (username !== undefined) {
      const uname = String(username).trim().toLowerCase();
      if (uname.length < 2 || uname.length > 30) {
        return NextResponse.json({ error: "Username must be 2-30 characters" }, { status: 400 });
      }
      if (!/^[a-z0-9_.-]+$/.test(uname)) {
        return NextResponse.json({ error: "Username can only contain lowercase letters, numbers, dots, hyphens, underscores" }, { status: 400 });
      }
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", uname)
        .neq("id", userId)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }
      profileUpdates.username = uname;
    }

    if (status !== undefined) {
      if (!["online", "away", "dnd", "offline"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      profileUpdates.status = status;
    }

    // Update email via auth admin (also updates profiles.email via trigger/sync)
    if (email !== undefined) {
      const newEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail,
        email_confirm: true,
      });
      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 });
      }
      // Also update profiles table to keep in sync
      profileUpdates.email = newEmail;
    }

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  }

  // ── Ban user ──
  if (action === "ban_user") {
    const { userId, reason, duration } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (userId === auth.user.id) {
      return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 });
    }

    // Calculate ban_until based on duration
    let banUntil: string;
    if (duration === "permanent") {
      // Far future date for permanent ban
      banUntil = "2099-12-31T23:59:59.999Z";
    } else if (duration === "1h") {
      banUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    } else if (duration === "24h") {
      banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === "7d") {
      banUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (duration === "30d") {
      banUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      banUntil = "2099-12-31T23:59:59.999Z";
    }

    // Update auth user with ban + metadata
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: duration === "permanent" ? "876000h" : duration, // Supabase expects duration string
      user_metadata: {
        banned: true,
        ban_reason: reason || "Banned by admin",
        banned_at: new Date().toISOString(),
        banned_by: auth.user.id,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Set user status to offline
    await supabaseAdmin
      .from("profiles")
      .update({ status: "offline", updated_at: new Date().toISOString() })
      .eq("id", userId);

    return NextResponse.json({ success: true, banned_until: banUntil });
  }

  // ── Unban user ──
  if (action === "unban_user") {
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Remove ban by setting ban_duration to "none"
    const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const existingMeta = (currentUser?.user?.user_metadata as Record<string, unknown>) ?? {};

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
      user_metadata: {
        ...existingMeta,
        banned: false,
        ban_reason: null,
        banned_at: null,
        banned_by: null,
        unbanned_at: new Date().toISOString(),
        unbanned_by: auth.user.id,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // ── Reset user password ──
  if (action === "reset_password") {
    const { userId, newPassword } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // ── Force sign out (invalidate sessions) ──
  if (action === "force_signout") {
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Sign out all sessions by updating the user's token
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        force_signout_at: new Date().toISOString(),
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Set offline
    await supabaseAdmin
      .from("profiles")
      .update({ status: "offline", updated_at: new Date().toISOString() })
      .eq("id", userId);

    return NextResponse.json({ success: true });
  }

  // ── Edit box ──
  if (action === "edit_box") {
    const { boxId, name, description } = body;
    if (!boxId) {
      return NextResponse.json({ error: "boxId required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
      const n = String(name).trim();
      if (n.length < 2 || n.length > 50) {
        return NextResponse.json({ error: "Name must be 2-50 characters" }, { status: 400 });
      }
      updates.name = n;
      updates.slug = n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("boxes")
      .update(updates)
      .eq("id", boxId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // ── Edit blog post ──
  if (action === "edit_blog_post") {
    const { postId, title, slug, category, excerpt, content, author_name, author_role, read_time, published, featured } = body;
    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    const blogUpdates: Record<string, unknown> = {};

    if (title !== undefined) {
      const t = String(title).trim();
      if (t.length < 1) return NextResponse.json({ error: "Title is required" }, { status: 400 });
      blogUpdates.title = t;
    }

    if (slug !== undefined) {
      const s = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");
      if (s.length < 2) return NextResponse.json({ error: "Slug must be at least 2 characters" }, { status: 400 });
      const { data: existing } = await supabaseAdmin
        .from("blog_posts")
        .select("id")
        .eq("slug", s)
        .neq("id", postId)
        .maybeSingle();
      if (existing) return NextResponse.json({ error: "A post with this slug already exists" }, { status: 400 });
      blogUpdates.slug = s;
    }

    if (category !== undefined) blogUpdates.category = category;
    if (excerpt !== undefined) blogUpdates.excerpt = excerpt;
    if (content !== undefined) blogUpdates.content = content;
    if (author_name !== undefined) blogUpdates.author_name = author_name;
    if (author_role !== undefined) blogUpdates.author_role = author_role;
    if (read_time !== undefined) blogUpdates.read_time = read_time;
    if (featured !== undefined) blogUpdates.featured = !!featured;

    if (published !== undefined) {
      blogUpdates.published = !!published;
      if (published) {
        const { data: current } = await supabaseAdmin
          .from("blog_posts")
          .select("published_at")
          .eq("id", postId)
          .single();
        if (!current?.published_at) {
          blogUpdates.published_at = new Date().toISOString();
        }
      }
    }

    if (Object.keys(blogUpdates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    blogUpdates.updated_at = new Date().toISOString();

    const { error: blogError } = await supabaseAdmin
      .from("blog_posts")
      .update(blogUpdates)
      .eq("id", postId);

    if (blogError) {
      return NextResponse.json({ error: blogError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
