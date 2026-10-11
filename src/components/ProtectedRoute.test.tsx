import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({
  auth: {
    user: { id: "test" },
    userRole: null as null | string,
    isLoading: false,
  },
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => fake.auth }));
import { ProtectedRoute } from "./ProtectedRoute";
afterEach(cleanup);
describe("Protected routes", () => {
  function mount() {
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
            <Route path="/private" element={<p>Protected records</p>} />
          </Route>
          <Route path="/franchise/dashboard" element={<p>Owner dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    );
  }
  it("blocks a logged-in account with no verified role", () => {
    fake.auth.userRole = null;
    mount();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Account access could not be verified",
    );
    expect(screen.queryByText("Protected records")).not.toBeInTheDocument();
  });
  it("redirects an owner away from administrative data", () => {
    fake.auth.userRole = "franchise_owner";
    mount();
    expect(screen.getByText("Owner dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Protected records")).not.toBeInTheDocument();
  });
});
