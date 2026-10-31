import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api client", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("fetches the CSRF token once and sends it on every POST", async () => {
    const { post } = await import("./client");
    fetchMock
      .mockResolvedValueOnce(json(200, { csrfToken: "t1" }))
      .mockResolvedValueOnce(json(200, { ok: 1 }))
      .mockResolvedValueOnce(json(200, { ok: 2 }));

    await post("/login", { identifier: "a" });
    const second = await post("/logout");

    expect(second).toEqual({ ok: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toBe("/csrf");
    expect(fetchMock.mock.calls[1][1].headers["X-CSRF-Token"]).toBe("t1");
    expect(fetchMock.mock.calls[2][1].headers["X-CSRF-Token"]).toBe("t1");
  });

  it("refetches the token and retries once on a 403", async () => {
    const { post } = await import("./client");
    fetchMock
      .mockResolvedValueOnce(json(200, { csrfToken: "old" }))
      .mockResolvedValueOnce(json(403, { code: 403, msg: "CSRF inválido o faltante" }))
      .mockResolvedValueOnce(json(200, { csrfToken: "new" }))
      .mockResolvedValueOnce(json(200, { ok: true }));

    await expect(post("/login")).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[3][1].headers["X-CSRF-Token"]).toBe("new");
  });

  it("throws ApiError with the backend msg and alerts", async () => {
    const { post, ApiError } = await import("./client");
    fetchMock
      .mockResolvedValueOnce(json(200, { csrfToken: "t" }))
      .mockResolvedValueOnce(json(400, { code: 400, msg: "Validation Error", alerts: ["a", "b"] }));

    const error = (await post("/toProccess").catch((e: unknown) => e)) as InstanceType<typeof ApiError>;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("Validation Error: a. b");
  });

  it("tx posts {tx, params} and returns data", async () => {
    const { tx } = await import("./client");
    fetchMock
      .mockResolvedValueOnce(json(200, { csrfToken: "t" }))
      .mockResolvedValueOnce(json(200, { code: 200, msg: "OK", data: [{ id: 1 }] }));

    await expect(tx(1054, { location_de: "x" })).resolves.toEqual([{ id: 1 }]);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ tx: 1054, params: { location_de: "x" } });
  });

  it("tx signals logout when the backend rejects the session", async () => {
    const { tx, UNAUTHORIZED_EVENT } = await import("./client");
    const onUnauthorized = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    fetchMock
      .mockResolvedValueOnce(json(200, { csrfToken: "t" }))
      .mockResolvedValueOnce(json(401, { code: 401, msg: "Debe iniciar sesión" }));

    await expect(tx(1034)).rejects.toThrow("Debe iniciar sesión");
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  });

  it("tx keeps the session when the user lacks privileges (403)", async () => {
    const { tx, UNAUTHORIZED_EVENT } = await import("./client");
    const onUnauthorized = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    const denied = () => json(403, { code: 403, msg: "No tiene privilegios" });
    fetchMock
      .mockResolvedValueOnce(json(200, { csrfToken: "t" }))
      .mockResolvedValueOnce(denied())
      .mockResolvedValueOnce(json(200, { csrfToken: "t2" }))
      .mockResolvedValueOnce(denied());

    await expect(tx(1113)).rejects.toThrow("No tiene privilegios");
    expect(onUnauthorized).not.toHaveBeenCalled();
    window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  });
});
