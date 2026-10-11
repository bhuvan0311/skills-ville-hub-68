export const previewRole = [
  "super_admin",
  "franchise_owner",
  "teacher",
  "receptionist",
  "parent",
].includes(new URLSearchParams(window.location.search).get("role") || "")
  ? new URLSearchParams(window.location.search).get("role")!
  : "super_admin";
export function useAuth() {
  return {
    userRole: previewRole as
      "super_admin" | "franchise_owner" | "teacher" | "receptionist" | "parent",
    userProfile: { full_name: "Preview Admin", franchise_id: "centre-a" },
    user: { id: "preview-admin", email: "preview@example.invalid" },
    signOut: async () => {
      throw new Error(
        "This is a design preview. No user account is signed in.",
      );
    },
  };
}
