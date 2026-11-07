import { currentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) return null;
  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Settings</h1>
      <p>You are signed in as {user.email}. The role on this account is {user.role}.</p>
      <p>Password changes are not offered in the demo. Sign out and register a new example.com address if you need another login.</p>
    </>
  );
}
