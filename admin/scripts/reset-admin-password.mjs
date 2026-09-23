// Reset an admin user's Supabase Auth password + ensure admin role/profile.
// Usage (PowerShell, from C:\cateringapp-main\admin):
//   $env:VITE_SUPABASE_URL="https://trgfpdhfiyxezmeobrgs.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<copy from Supabase Dashboard > Project Settings > API > service_role (secret)>"
//   node scripts/reset-admin-password.mjs admin@caterconnect.com "admin@123"
//
// Never commit the service_role key. It bypasses RLS.

import { createClient } from "@supabase/supabase-js";

const url =
  process.env.VITE_SUPABASE_URL ?? "https://trgfpdhfiyxezmeobrgs.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, newPassword] = process.argv.slice(2);

if (!serviceKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Export it first (never hardcode or commit it):\n" +
      '  PowerShell:  $env:SUPABASE_SERVICE_ROLE_KEY="<service_role key>"\n' +
      "  Get it from Supabase Dashboard > Project Settings > API > service_role (secret).",
  );
  process.exit(1);
}

if (!url || !serviceKey) {
  console.error(
    "Missing env: set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.",
  );
  process.exit(1);
}
if (!email || !newPassword) {
  console.error(
    'Usage: node scripts/reset-admin-password.mjs <email> "<new-password>"',
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// 1. Find user by email (paginate; listUsers has no email filter on all versions)
let target = null;
let page = 1;
while (!target) {
  const { data, error } = await admin.auth.admin.listUsers({
    page,
    perPage: 200,
  });
  if (error) {
    console.error("listUsers failed:", error.message);
    process.exit(1);
  }
  target =
    data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ??
    null;
  if (data.users.length < 200) break;
  page += 1;
}

if (!target) {
  console.error(
    `No Supabase Auth user found for ${email}. Create it in Dashboard > Authentication > Users first.`,
  );
  process.exit(1);
}

// 2. Set password
const { error: updateError } = await admin.auth.admin.updateUserById(
  target.id,
  {
    password: newPassword,
    email_confirm: true,
  },
);
if (updateError) {
  console.error("Password update failed:", updateError.message);
  process.exit(1);
}

// 3. Ensure admin role
const { error: roleError } = await admin
  .from("user_roles")
  .upsert(
    { user_id: target.id, role: "admin" },
    { onConflict: "user_id,role" },
  );
if (roleError) console.warn("Role upsert warning:", roleError.message);

// 4. Ensure profile exists (login UI reads it)
const { data: profile } = await admin
  .from("profiles")
  .select("id")
  .eq("user_id", target.id)
  .maybeSingle();
if (!profile) {
  const { error: profileError } = await admin.from("profiles").insert({
    user_id: target.id,
    name: "Admin",
    email,
  });
  if (profileError)
    console.warn("Profile insert warning:", profileError.message);
}

console.log(
  `OK: password reset for ${email} (user ${target.id}). You can now log in to the admin app.`,
);
