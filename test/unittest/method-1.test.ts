import { Prisma, PrismaClient } from "@prisma/client";
import { resolvers } from "../..";
describe("unit test going hard", () => {
  it("query - users", async () => {
    const mockedPrisma = {
      prisma: {
        user: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: "tested", username: "tested" }]),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Query.users({}, {}, mockedPrisma);
    expect(response.success).toBeTruthy();
    expect(response.users).toBeDefined();
    if (response.users) {
      expect(response.users[0].username).toBe("tested");
    }
  });
  // --
  it("query - tag", async () => {
    const mockedPrisma = {
      prisma: {
        tag: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: "tested", name: "tested" }]),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Query.tag({}, {}, mockedPrisma);
    expect(response.success).toBeTruthy();
    if (response.tags) {
      expect(response.tags[0].id).toBe("tested");
      expect(response.tags[0].name).toBe("tested");
    }
  });
  // --
  it("query - todos", async () => {
    const mockedPrisma = {
      prisma: {
        todo: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: "test", taskName: "test taskName" }]),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Query.todos({}, {}, mockedPrisma);
    expect(response.success).toBeTruthy();
    if (response.todos) {
      expect(response.todos[0].taskName).toBe("test taskName");
    }
  });
  it("query - guests", async () => {
    const mockedPrisma = {
      prisma: {
        guests: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ taskName: "tested", id: "tested" }]),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Query.guests({}, {}, mockedPrisma);
    expect(response).toBeDefined();
    if (response) {
      expect(response[0].taskName).toBe("tested");
    }
  });
  it("mutation - addNewGuestTodo + addTag", async () => {
    const response = await resolvers.Mutation.addTag(
      {},
      { name: `test tag ${Math.floor(Math.random() * 50000)}` }
    );
    expect(response.success).toBeTruthy();
    const response2 = await resolvers.Mutation.addNewGuestTodo(
      {},
      {
        description: "Test task desc",
        priority: 4,
        taskName: `test task ${Math.floor(Math.random() * 50000)}`,
        tagId: response.tag.id,
      }
    );
    expect(response2.taskName).toBeDefined();
    expect(response2.description).toBe("Test task desc");
  });
});
