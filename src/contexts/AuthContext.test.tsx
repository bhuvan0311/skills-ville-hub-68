import { act, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: unknown) => void),
  getSession: vi.fn(),
  getUserRole: vi.fn(),
  getUserProfile: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((callback) => {
        fake.listener = callback;
        return { data: { subscription: { unsubscribe: fake.unsubscribe } } };
      }),
      getSession: fake.getSession,
    },
  },
  getUserRole: fake.getUserRole,
  getUserProfile: fake.getUserProfile,
}));
import { AuthProvider, useAuth } from "./AuthContext";
function Probe() {
  const auth = useAuth();
  return (
    <div data-testid="auth">
      {JSON.stringify({
        user: auth.user?.id || null,
        role: auth.userRole,
        loading: auth.isLoading,
      })}
    </div>
  );
}
const session = { user: { id: "test-account" } };
const state = () => JSON.parse(screen.getByTestId("auth").textContent!);

describe("Account verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fake.getSession.mockResolvedValue({ data: { session: null }, error: null });
    fake.getUserProfile.mockResolvedValue(null);
  });
  afterEach(cleanup);
  it("does not invent franchise-owner permissions for an account without a role", async () => {
    fake.getSession.mockResolvedValue({ data: { session }, error: null });
    fake.getUserRole.mockResolvedValue(null);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(state().loading).toBe(false));
    expect(state().role).toBe(null);
  });
  it("cannot restore a signed-out account from a stale role response", async () => {
    let resolveRole: (role: string) => void;
    fake.getUserRole.mockReturnValue(
      new Promise((resolve) => {
        resolveRole = resolve;
      }),
    );
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(state().loading).toBe(false));
    act(() => fake.listener!("SIGNED_IN", session));
    await waitFor(() => expect(fake.getUserRole).toHaveBeenCalled());
    act(() => fake.listener!("SIGNED_OUT", null));
    await act(async () => resolveRole!("super_admin"));
    expect(state()).toEqual({ user: null, role: null, loading: false });
  });
  it("denies access if database verification fails", async () => {
    fake.getSession.mockResolvedValue({ data: { session }, error: null });
    fake.getUserRole.mockRejectedValue(new Error("Database unavailable"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(state().loading).toBe(false));
    expect(state().role).toBe(null);
  });
});
