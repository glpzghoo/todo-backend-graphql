import { Prisma, PrismaClient } from "@prisma/client";
import { resolvers } from "../..";
const fakeUser = {
  id: `tested`,
  username: `glpzghoo`,
  password: `passwordmagic`,
};
const fakejwt: string = "fakeJWT";
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("fakeJWT"),
  verify: jest.fn().mockReturnValue({ id: `tested`, username: `glpzghoo` }),
}));
jest.mock("bcrypt", () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue("fakeCriptoPass"),
}));
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
    // console.log(response);
    expect(response.success).toBeTruthy();
    expect(response.JWT).toBe(fakejwt);
    if (response.user) {
      expect(response.user.username).toBe(fakeUser.username);
    }
  });
  it("add todo", async () => {
    const fakeTodo = {
      description: "testing desc",
      priority: 10,
      taskName: "testing taskName",
      tagId: `tested`,
    };
    const mockedPrisma = {
      prisma: {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            username: fakeUser.username,
            password: fakeUser.password,
          }),
        },
        todo: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(fakeTodo),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.addTodo(
      {},
      { ...fakeTodo, jwt: fakejwt },
      mockedPrisma
    );
    expect(response.success).toBeTruthy();
    if (response.todo) {
      expect(response.todo.description).toBe(fakeTodo.description);
      expect(response.todo.priority).toBe(fakeTodo.priority);
      expect(response.todo.taskName).toBe(fakeTodo.taskName);
      expect(response.todo.tagId).toBe(fakeTodo.tagId);
    }
  });
  it("update todo", async () => {
    const fakeTodo = {
      id: `faketodoid`,
      description: "testing desc",
      priority: 5,
      taskName: "testing taskName",
      tagId: `tested`,
      jwt: fakejwt,
    };
    const updatedTodo = {
      description: "testing desc updated",
      priority: 5,
      taskName: "testing taskName update",
      tagId: `tested updated`,
      jwt: fakejwt,
      id: `faketodoid test update`,
    };

    const mockedPrisma = {
      prisma: {
        user: {
          findUnique: jest.fn().mockResolvedValue(fakeUser),
        },
        todo: {
          findUnique: jest.fn().mockResolvedValue(fakeTodo),
          update: jest.fn().mockResolvedValue(updatedTodo),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.updateTodo(
      {},
      fakeTodo,
      mockedPrisma
    );
    expect(response.success).toBeTruthy();
    if (response.todo) {
      expect(response.todo.description).toBe(updatedTodo.description);
      expect(response.todo.id).toBe(updatedTodo.id);
      expect(response.todo.priority).toBe(updatedTodo.priority);
      expect(response.todo.taskName).toBe(updatedTodo.taskName);
      expect(response.todo.tagId).toBe(updatedTodo.tagId);
    }
  });
  it("update status - false valuetai isDone true boloh ystoi", async () => {
    const fakeTodo = {
      id: `faketodoid`,
      description: "testing desc",
      priority: 5,
      isDone: false,
      userId: `tested`,
      taskName: "testing taskName",
      tagId: `tested`,
      jwt: fakejwt,
    };
    const mockedPrisma = {
      prisma: {
        user: {
          findUnique: jest.fn().mockResolvedValue(fakeUser),
        },
        todo: {
          findUnique: jest.fn().mockResolvedValue(fakeTodo),
          update: jest.fn().mockResolvedValue({ ...fakeTodo, isDone: true }),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.updateStatus(
      {},
      { todoId: fakeTodo.id, jwt: fakejwt },
      mockedPrisma
    );
    // console.log({ response });
    expect(response.success).toBeTruthy();
    if (response.todo) {
      expect(response.todo.isDone).toBeTruthy();
    }
  });
  it("userTodo", async () => {
    const fakeTodos = [
      {
        id: `faketodoid 1`,
        description: "testing desc",
        priority: 5,
        isDone: false,
        userId: `tested`,
        taskName: "testing taskName",
        tagId: `tested`,
        jwt: fakejwt,
      },
      {
        id: `faketodoid 2`,
        description: "testing desc",
        priority: 5,
        isDone: false,
        userId: `tested`,
        taskName: "testing taskName",
        tagId: `tested`,
        jwt: fakejwt,
      },
      {
        id: `faketodoid 3`,
        description: "testing desc",
        priority: 5,
        isDone: false,
        userId: `tested`,
        taskName: "testing taskName",
        tagId: `tested`,
        jwt: fakejwt,
      },
    ];
    const mockedPrisma = {
      prisma: {
        user: {
          findUnique: jest.fn().mockResolvedValue(fakeUser),
        },
        todo: {
          findMany: jest.fn().mockResolvedValue(fakeTodos),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.userTodo(
      {},
      { jwt: fakejwt },
      mockedPrisma
    );
    expect(response.success).toBeTruthy();
    if (response.todos && response.user) {
      expect(response.todos[0].id).toBe(fakeTodos[0].id);
      expect(response.todos[1].id).toBe(fakeTodos[1].id);
      expect(response.todos[2].id).toBe(fakeTodos[2].id);
      expect(response.user.username).toBe(fakeUser.username);
    }
  });
  it("cancel todo - false valuetai cancelled true boloh ystoi", async () => {
    const fakeTodo = {
      id: `fakeid`,
      description: "testing desc",
      priority: 4,
      userId: `tested`,
      taskName: "testing taskName",
      tagId: `tested`,
      cancelled: false,
    };
    const mockedPrisma = {
      prisma: {
        user: {
          findUnique: jest.fn().mockResolvedValue(fakeUser),
        },
        todo: {
          findUnique: jest.fn().mockResolvedValue(fakeTodo),
          update: jest.fn().mockResolvedValue({ ...fakeTodo, cancelled: true }),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.cancelTodo(
      {},
      { id: fakeTodo.id, jwt: fakejwt },
      mockedPrisma
    );
    // console.log(response);
    expect(response.success).toBeTruthy();
    if (response.todo) {
      expect(response.todo.cancelled).toBeTruthy();
      expect(response.todo.id).toBe(fakeTodo.id);
      expect(response.todo.description).toBe(fakeTodo.description);
      expect(response.todo.taskName).toBe(fakeTodo.taskName);
      expect(response.todo.priority).toBe(fakeTodo.priority);
    }
  });
  it("zochnii todo nemeh", async () => {
    const fakeTodo = {
      description: "testing desc",
      priority: 4,
      taskName: "testing taskName",
      tagId: `tested`,
    };
    const mockedPrisma = {
      prisma: {
        guests: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(fakeTodo),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.addNewGuestTodo(
      {},
      fakeTodo,
      mockedPrisma
    );
    console.log(response);
    expect(response).toBeDefined();
    if (response) {
      expect(response.description).toBe(fakeTodo.description);
      expect(response.priority).toBe(fakeTodo.priority);
      expect(response.taskName).toBe(fakeTodo.taskName);
    }
  });
  it("zochnii todo zasah", async () => {
    const fakeTodo = {
      id: `fakeid`,
      description: "testing desc",
      priority: 4,
      taskName: "testing taskName",
      tagId: `tested`,
      cancelled: false,
      isDone: false,
    };
    const updateTodo = {
      id: `fakeid`,
      description: "testing desc upadte",
      priority: 3,
      taskName: "testing taskName update",
      tagId: `tested`,
      cancelled: false,
      isDone: false,
    };
    const mockedPrisma = {
      prisma: {
        guests: {
          update: jest.fn().mockResolvedValue(updateTodo),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.editGuestTodo(
      {},
      fakeTodo,
      mockedPrisma
    );
    // console.log(response);
    expect(response).toBeDefined();
    if (response) {
      expect(response.description).toBe(updateTodo.description);
      expect(response.taskName).toBe(updateTodo.taskName);
      expect(response.priority).toBe(updateTodo.priority);
    }
  });
  it("zochnii false utgatai cancelled true boloh ystoi", async () => {
    const fakeTodo = {
      id: `fakeid`,
      description: "testing desc",
      priority: 4,
      taskName: "testing taskName",
      tagId: `tested`,
      cancelled: false,
      isDone: false,
    };
    const mockedPrisma = {
      prisma: {
        guests: {
          update: jest.fn().mockResolvedValue({ ...fakeTodo, cancelled: true }),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.cancelGuestTodo(
      {},
      { id: fakeTodo.id },
      mockedPrisma
    );
    expect(response).toBeDefined();
    if (response) {
      expect(response.id).toBe(fakeTodo.id);
      expect(response.description).toBe(fakeTodo.description);
      expect(response.priority).toBe(fakeTodo.priority);
      expect(response.taskName).toBe(fakeTodo.taskName);
      expect(response.tagId).toBe(fakeTodo.tagId);
      expect(response.cancelled).toBeTruthy();
      expect(response.isDone).toBeFalsy();
    }
  });
  it("zochnii false utgatai isDone true boloh ystoi", async () => {
    const fakeTodo = {
      id: `fakeid`,
      description: "testing desc",
      priority: 4,
      taskName: "testing taskName",
      tagId: `tested`,
      cancelled: false,
      isDone: false,
    };

    const mockedPrisma = {
      prisma: {
        guests: {
          update: jest.fn().mockResolvedValue({ ...fakeTodo, isDone: true }),
        },
      },
    } as unknown as { prisma: PrismaClient };
    const response = await resolvers.Mutation.doneGuestTodo(
      {},
      { id: fakeTodo.id },
      mockedPrisma
    );

    expect(response).toBeDefined();
    if (response) {
      expect(response.isDone).toBeTruthy();
    }
  });
});
