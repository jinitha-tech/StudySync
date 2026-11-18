/**
 * Mock Prisma client for testing route handlers, response structures,
 * authentication, and CRUD operations deterministically without an active DB server.
 */

class MockPrisma {
  constructor() {
    this.users = new Map();
    this.notifications = new Map();
    this.tasks = new Map();
    this.taskIdCounter = 1;

    this.user = {
      findUnique: async ({ where }) => {
        if (where.email) {
          for (const u of this.users.values()) {
            if (u.email === where.email) return { ...u };
          }
        }
        if (where.id) {
          const u = this.users.get(where.id);
          return u ? { ...u } : null;
        }
        return null;
      },
      findFirst: async ({ where }) => {
        for (const u of this.users.values()) {
          let match = true;
          if (where.resetToken && u.resetToken !== where.resetToken) match = false;
          if (where.resetTokenExpires?.gt && (!u.resetTokenExpires || u.resetTokenExpires <= where.resetTokenExpires.gt)) match = false;
          if (match) return { ...u };
        }
        return null;
      },
      create: async ({ data }) => {
        const now = new Date();
        const record = {
          id: data.id,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          resetToken: data.resetToken || null,
          resetTokenExpires: data.resetTokenExpires || null,
          createdAt: data.createdAt || now,
          updatedAt: data.updatedAt || now,
        };
        this.users.set(record.id, record);
        return { ...record };
      },
      update: async ({ where, data }) => {
        const u = this.users.get(where.id);
        if (!u) throw new Error("User not found");
        Object.assign(u, data, { updatedAt: new Date() });
        this.users.set(u.id, u);
        return { ...u };
      },
      count: async () => this.users.size,
    };

    this.notification = {
      findMany: async ({ where, orderBy, take }) => {
        let results = Array.from(this.notifications.values());
        if (where?.OR) {
          const uId = where.OR.find((cond) => cond.userId !== null)?.userId;
          results = results.filter((n) => n.userId === uId || n.userId === null);
        }
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (take) results = results.slice(0, take);
        return results.map((r) => ({ ...r }));
      },
      create: async ({ data }) => {
        const record = {
          id: data.id,
          userId: data.userId || null,
          title: data.title,
          message: data.message,
          type: data.type || "general",
          read: Boolean(data.read),
          link: data.link || null,
          createdAt: data.createdAt || new Date(),
        };
        this.notifications.set(record.id, record);
        return { ...record };
      },
      createMany: async ({ data }) => {
        for (const item of data) {
          await this.notification.create({ data: item });
        }
        return { count: data.length };
      },
      update: async ({ where, data }) => {
        const n = this.notifications.get(where.id);
        if (!n) throw new Error("Notification not found");
        Object.assign(n, data);
        return { ...n };
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const n of this.notifications.values()) {
          let matches = true;
          if (where?.OR) {
            const uId = where.OR.find((cond) => cond.userId !== null)?.userId;
            matches = n.userId === uId || n.userId === null;
          }
          if (matches) {
            Object.assign(n, data);
            count++;
          }
        }
        return { count };
      },
      delete: async ({ where }) => {
        this.notifications.delete(where.id);
        return { id: where.id };
      },
      deleteMany: async ({ where }) => {
        let count = 0;
        for (const [id, n] of Array.from(this.notifications.entries())) {
          let matches = true;
          if (where?.OR) {
            const uId = where.OR.find((cond) => cond.userId !== null)?.userId;
            matches = n.userId === uId || n.userId === null;
          }
          if (matches) {
            this.notifications.delete(id);
            count++;
          }
        }
        return { count };
      },
    };

    this.task = {
      findMany: async ({ where, orderBy }) => {
        let results = Array.from(this.tasks.values());
        if (where?.userId) {
          results = results.filter((t) => t.userId === where.userId);
        }
        results.sort((a, b) => b.id - a.id);
        return results.map((r) => ({ ...r }));
      },
      findFirst: async ({ where }) => {
        for (const t of this.tasks.values()) {
          if (t.id === where.id) {
            if (where.userId && t.userId !== where.userId) continue;
            return { ...t };
          }
        }
        return null;
      },
      create: async ({ data }) => {
        const id = this.taskIdCounter++;
        const now = new Date();
        const record = {
          id,
          userId: data.userId || null,
          title: data.title,
          description: data.description || "",
          deadline: data.deadline || null,
          priority: data.priority || "medium",
          completed: Boolean(data.completed),
          createdAt: now,
          updatedAt: now,
        };
        this.tasks.set(id, record);
        return { ...record };
      },
      update: async ({ where, data }) => {
        const t = this.tasks.get(where.id);
        if (!t) throw new Error("Task not found");
        Object.assign(t, data, { updatedAt: new Date() });
        this.tasks.set(t.id, t);
        return { ...t };
      },
      delete: async ({ where }) => {
        this.tasks.delete(where.id);
        return { id: where.id };
      },
    };
  }

  $connect() { return Promise.resolve(); }
  $disconnect() { return Promise.resolve(); }
}

module.exports = MockPrisma;
