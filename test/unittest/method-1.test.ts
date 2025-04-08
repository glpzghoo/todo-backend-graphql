import { Prisma, PrismaClient } from "@prisma/client";
import { resolvers } from "../..";
import jwt from "jsonwebtoken";
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("fakeJWT"),
}));
jest.mock("bcrypt", () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue("fakeCriptoPass"),
}));
describe("unit test going hard", () => {
  let fakejwt: string = "fakeJWT";
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
  it("mutation - newUser", async () => {
    const mockuser = {
      username: `testing new user ${Math.floor(Math.random() * 50000)}`,
      password: `passwordmagic`,
    };
    const mockedPrisma = {
      prisma: {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            username: mockuser.username,
            password: "fakeCriptoPass",
          }),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.newUser(
      {},
      { username: mockuser.username, password: mockuser.password },
      mockedPrisma
    );
    expect(response.success).toBeTruthy();
    if (response.user) {
      expect(response.user.username).toBe(mockuser.username);
      expect(response.user.password).toBe("fakeCriptoPass");
    }
  });
  it("mutation - addTag", async () => {
    const mocktag = { id: "tested", name: "tested" };
    const mockedPrisma = {
      prisma: {
        tag: {
          create: jest.fn().mockResolvedValue(mocktag),
        },
      },
    } as unknown as { prisma: PrismaClient };

    const response = await resolvers.Mutation.addTag({}, mocktag, mockedPrisma);
    expect(response.success).toBeTruthy();
    expect(response.tag).toBeDefined();
    if (response.tag) {
      expect(response.tag.id).toBe(mocktag.id);
      expect(response.tag.name).toBe(mocktag.name);
    }
  });
  it("login user", async () => {
    // const jwt = {
    //   sign: jest.fn().mockResolvedValue("fakeJWT"),
    // };
    const fakeUser = {
      username: "glpzghoo",
      password: "passwordmagic",
    };
    const mockedPrisma = {
      prisma: {
        user: {
          findUnique: jest.fn().mockResolvedValue(fakeUser),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.loginUser(
      {},
      fakeUser,
      mockedPrisma
    );
    console.log(response);
    expect(response.success).toBeTruthy();
    expect(response.JWT).toBe("fakeJWT");
    if (response.user) {
      expect(response.user.username).toBe(fakeUser.username);
    }
  });
});
