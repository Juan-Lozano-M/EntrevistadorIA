import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { login, getProfessions, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("api client", () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null }));

  it("login returns the auth payload", async () => {
    server.use(http.post(`${BASE}/auth/login`, () =>
      HttpResponse.json({ token: "t1", name: "Ana", email: "ana@test.com" })));
    const res = await login({ email: "ana@test.com", password: "secret123" });
    expect(res.token).toBe("t1");
    expect(res.name).toBe("Ana");
  });

  it("maps an error body to ApiError with status", async () => {
    server.use(http.post(`${BASE}/auth/login`, () =>
      HttpResponse.json({ message: "Credenciales inválidas" }, { status: 401 })));
    await expect(login({ email: "x@test.com", password: "bad" }))
      .rejects.toBeInstanceOf(ApiError);
    await expect(login({ email: "x@test.com", password: "bad" }))
      .rejects.toMatchObject({ name: "ApiError", status: 401, message: "Credenciales inválidas" });
  });

  it("attaches the bearer token from the auth store", async () => {
    useAuthStore.setState({ token: "abc", user: { name: "A", email: "a@test.com", plan: "FREE" } });
    let seen: string | null = null;
    server.use(http.get(`${BASE}/professions`, ({ request }) => {
      seen = request.headers.get("authorization");
      return HttpResponse.json([]);
    }));
    await getProfessions();
    expect(seen).toBe("Bearer abc");
  });
});
