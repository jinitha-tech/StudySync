const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

// Inject mock prisma before loading app
const MockPrisma = require("./mockPrisma");
const mockPrisma = new MockPrisma();

// Seed initial users into mock DB
const bcrypt = require("bcryptjs");
const demoHash = bcrypt.hashSync("password123", 10);
mockPrisma.users.set("usr_demo_1", {
  id: "usr_demo_1",
  name: "Alex Johnson",
  email: "alex@studysync.io",
  passwordHash: demoHash,
  resetToken: null,
  resetTokenExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Seed Sushmitha from SQLite
const sushmithaHash = bcrypt.hashSync("password123", 10);
mockPrisma.users.set("usr_1794543765359_tl590", {
  id: "usr_1794543765359_tl590",
  name: "Sushmitha",
  email: "sushmitha11527@gmail.com",
  passwordHash: sushmithaHash,
  resetToken: null,
  resetTokenExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Override prisma module export with mock
const prismaModule = require("../src/db/prisma");
Object.assign(prismaModule, mockPrisma);

const app = require("../src/app");

let server;
let baseUrl = "http://localhost";
const pipePath = process.platform === "win32"
  ? `\\\\.\\pipe\\studysync-test-${Date.now()}`
  : null;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    if (pipePath) {
      server.listen(pipePath, () => {
        globalThis.fetch = async (url, options = {}) => {
          const parsedUrl = new URL(url);
          const method = options.method || "GET";
          const headers = options.headers || {};
          const body = options.body;

          return new Promise((resResolve, resReject) => {
            const reqHeaders = { ...headers };
            if (body && !reqHeaders["Content-Length"] && !reqHeaders["content-length"]) {
              reqHeaders["Content-Length"] = Buffer.byteLength(body);
            }

            const req = http.request(
              {
                socketPath: pipePath,
                path: parsedUrl.pathname + parsedUrl.search,
                method,
                headers: reqHeaders,
              },
              (res) => {
                const chunks = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () => {
                  const text = Buffer.concat(chunks).toString("utf8");
                  resResolve({
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    headers: {
                      get(key) {
                        return res.headers[key.toLowerCase()];
                      },
                    },
                    async json() {
                      return JSON.parse(text);
                    },
                    async text() {
                      return text;
                    },
                  });
                });
              }
            );

            req.on("error", resReject);
            if (body) req.write(body);
            req.end();
          });
        };
        resolve();
      });
    } else {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    }
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe("StudySync API & PostgreSQL/Prisma Integration Tests", () => {
  let authToken = null;
  let createdTaskId = null;
  let testUserId = null;

  test("1. User registration (POST /api/auth/signup)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: "student@studysync.test",
        password: "securepassword123",
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    assert.strictEqual(data.user.email, "student@studysync.test");
    assert.strictEqual(data.user.name, "Test Student");
    assert.ok(data.user.createdAt);
    authToken = data.token;
    testUserId = data.user.id;
  });

  test("2. Prevent duplicate user registration (POST /api/auth/signup)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: "student@studysync.test",
        password: "securepassword123",
      }),
    });

    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.ok(data.message.includes("already exists"));
  });

  test("3. User login (POST /api/auth/login)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "student@studysync.test",
        password: "securepassword123",
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    assert.strictEqual(data.user.email, "student@studysync.test");
  });

  test("4. Invalid credentials rejected (POST /api/auth/login)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "student@studysync.test",
        password: "wrongpassword",
      }),
    });

    assert.strictEqual(res.status, 401);
  });

  test("5. Authentication verification (GET /api/auth/me)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, "student@studysync.test");
  });

  test("6. Update profile (PUT /api/auth/profile)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name: "Updated Student Name" }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.name, "Updated Student Name");
  });

  test("7. Change password (PUT /api/auth/change-password)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        currentPassword: "securepassword123",
        newPassword: "brandnewpassword456",
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  test("8. Forgot password flow (POST /api/auth/forgot-password)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@studysync.test" }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data._dev_token);

    // Verify token
    const verifyRes = await fetch(
      `${baseUrl}/api/auth/verify-reset-token?token=${data._dev_token}`
    );
    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.valid, true);

    // Reset password
    const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: data._dev_token,
        newPassword: "resetpassword789",
      }),
    });
    assert.strictEqual(resetRes.status, 200);
  });

  test("9. Study Planner: Create task (POST /api/planner)", async () => {
    const res = await fetch(`${baseUrl}/api/planner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: "Study PostgreSQL Architecture",
        description: "Review indexing, query plans, and transactions",
        deadline: "2026-11-25",
        priority: "high",
        completed: false,
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.title, "Study PostgreSQL Architecture");
    assert.strictEqual(data.data.priority, "high");
    assert.strictEqual(data.data.completed, false);
    createdTaskId = data.data.id;
  });

  test("10. Study Planner: List tasks (GET /api/planner)", async () => {
    const res = await fetch(`${baseUrl}/api/planner`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.some((t) => t.id === createdTaskId));
  });

  test("11. Study Planner: Get task by ID (GET /api/planner/:id)", async () => {
    const res = await fetch(`${baseUrl}/api/planner/${createdTaskId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.id, createdTaskId);
  });

  test("12. Study Planner: Update task (PUT /api/planner/:id)", async () => {
    const res = await fetch(`${baseUrl}/api/planner/${createdTaskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: "Study PostgreSQL and Prisma",
        priority: "medium",
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.title, "Study PostgreSQL and Prisma");
    assert.strictEqual(data.data.priority, "medium");
  });

  test("13. Study Planner: Complete task (PATCH /api/planner/:id/complete)", async () => {
    const res = await fetch(`${baseUrl}/api/planner/${createdTaskId}/complete`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ completed: true }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.completed, true);
  });

  test("14. Study Planner: Delete task (DELETE /api/planner/:id)", async () => {
    const res = await fetch(`${baseUrl}/api/planner/${createdTaskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(res.status, 204);

    // Verify it is gone
    const getRes = await fetch(`${baseUrl}/api/planner/${createdTaskId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(getRes.status, 404);
  });

  test("15. Notifications: List notifications (GET /api/notifications)", async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  test("16. Notifications: Create notification (POST /api/notifications)", async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: "Test Alert",
        message: "This is a test notification message",
        type: "general",
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.title, "Test Alert");
    assert.strictEqual(data.data.read, false);
  });

  test("17. Notifications: Mark all read (PATCH /api/notifications/read-all)", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  test("18. System routes: Health check (GET /health)", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
  });
});
