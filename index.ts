import { ApolloServer } from "@apollo/server";
import { GraphQLError } from "graphql";
import { startStandaloneServer } from "@apollo/server/standalone";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { typeDefs } from "./lib/schema";
import { prisma } from "./lib/prisma";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
dotenv.config();
export const resolvers = {
  Query: {
    users: async (p: any, {}, context?: { prisma: PrismaClient }) => {
      const users = await context?.prisma.user.findMany({
        include: { todo: true },
        omit: { password: true },
      });
      return {
        success: true,
        message: "Хүсэлт амжилттай!",
        code: "REQUEST_SUCCESS",
        users,
      };
    },
    todos: async (p: any, {}, context?: { prisma: PrismaClient }) => {
      const todos = await context?.prisma.todo.findMany({
        include: { user: true },
      });
      return {
        success: true,
        message: "Хүсэлт амжилттай!",
        code: "REQUEST_SUCCESS",
        todos,
      };
    },
    tag: async (p: any, {}, context?: { prisma: PrismaClient }) => {
      const tags = await context?.prisma.tag.findMany();
      return {
        success: true,
        message: "Хүсэлт амжилттай!",
        code: "REQUEST_SUCCESS",
        tags,
      };
    },
    // guest section
    guests: async (p: any, {}, context?: { prisma: PrismaClient }) => {
      const todos = await context?.prisma.guests.findMany({
        include: { tag: true },
        orderBy: [{ createdAt: "desc" }],
      });
      return todos;
    },
  },
  Mutation: {
    newUser: async (
      p: any,
      { username, password }: { username: string; password: string },
      context: { prisma: PrismaClient }
    ) => {
      const useExist = await context.prisma.user.findUnique({
        where: { username },
      });
      if (useExist) {
        throw new GraphQLError("Хэрэглэгч бүртгэлтэй байна!");
      }
      const encryptedPass = await bcrypt.hash(password, 15);
      const newUser = await context.prisma.user.create({
        data: { username, password: encryptedPass },
      });
      return {
        success: true,
        message: "Хүсэлт амжилттай!",
        code: "REQUEST_SUCCESS",
        user: newUser,
      };
    },
    addTag: async (
      p: any,
      { name }: { name: string },
      context?: { prisma: PrismaClient }
    ) => {
      const newTag = await context?.prisma.tag.create({ data: { name } });
      return {
        success: true,
        message: "Хүсэлт амжилттай!",
        code: "REQUEST_SUCCESS",
        tag: newTag,
      };
    },
    addTodo: async (
      p: any,
      {
        description,
        priority,
        taskName,
        tagId,
        jwt: jwtfromuser,
      }: {
        description: string;
        priority: number;
        taskName: string;
        tagId: string;
        jwt: string;
      },
      context?: { prisma: PrismaClient }
    ) => {
      try {
        const verify = jwt.verify(jwtfromuser, process.env.ACCESS_TOKEN!) as {
          id: string;
          username: string;
        };

        const user = await context?.prisma.user.findUnique({
          where: { id: verify.id },
        });
        if (!user) {
          throw new GraphQLError("Хэрэглэгч олдсонгүй!");
        }
        const todoexists = await context?.prisma.todo.findFirst({
          where: {
            AND: [{ taskName }, { cancelled: false }, { isDone: false }],
          },
        });
        if (todoexists) {
          throw new GraphQLError("Даалгавар аль хэдийн үүссэн байна!");
        }
        const newTodo = await context?.prisma.todo.create({
          data: {
            description,
            priority,
            taskName,
            userId: user.id,
            tagId,
          },
          include: { user: true, tag: true },
        });
        if (newTodo) {
          return {
            success: true,
            message: "Хүсэлт амжилттай!",
            code: "REQUEST_SUCCESS",
            todo: newTodo,
          };
        } else {
          throw new GraphQLError("Алдаа гарлаа!");
        }
      } catch (err) {
        throw new GraphQLError("Хүсэлт амжилтгүй боллоо!");
      }
    },
    loginUser: async (
      p: any,
      { username, password }: { username: string; password: string },
      context?: { prisma: PrismaClient }
    ) => {
      const user = await context?.prisma.user.findUnique({
        where: { username },
        include: { todo: { include: { tag: true } } },
      });
      if (!user) {
        throw new GraphQLError("Хэрэглэгч олдсонгүй!");
      }
      const verifyPass = await bcrypt.compare(password, user.password);
      if (!verifyPass) {
        throw new GraphQLError("Нууц үг таарсангүй!");
      }

      const accessToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
        },
        process.env.ACCESS_TOKEN!
      );
      return {
        success: true,
        message: "Хүсэлт амжилттай!",
        code: "REQUEST_SUCCESS",
        user,
        JWT: accessToken,
      };
    },
    updateTodo: async (
      p: any,
      {
        id,
        description,
        priority,
        taskName,
        tagId,
        jwt: jwtfromuser,
      }: {
        id: string;
        description: string;
        priority: number;
        tagId: string;
        taskName: string;
        jwt: string;
      },
      context?: { prisma: PrismaClient }
    ) => {
      try {
        const verify = jwt.verify(jwtfromuser, process.env.ACCESS_TOKEN!) as {
          id: string;
          username: string;
        };
        const user = await context?.prisma.user.findUnique({
          where: { id: verify.id },
        });

        if (!user) {
          throw new GraphQLError("Хэрэглэгч олдсонгүй!");
        }
        const todo = await context?.prisma.todo.findUnique({ where: { id } });
        if (!todo) {
          throw new GraphQLError("Todo олдсонгүй!");
        }
        const updatedTodo = await context?.prisma.todo.update({
          where: { id: todo.id },
          data: {
            ...(description ? { description } : {}),
            priority,
            ...(taskName ? { taskName } : {}),
            tagId,
          },
          include: { user: true, tag: true },
        });
        return {
          success: true,
          message: "Хүсэлт амжилттай!",
          code: "REQUEST_SUCCESS",
          todo: updatedTodo,
        };
      } catch (err) {
        throw new GraphQLError("Хүсэлт амжилтгүй боллоо!");
      }
    },
    updateStatus: async (
      p: any,
      { todoId, jwt: jwtfromuser }: { todoId: string; jwt: string },
      context?: { prisma: PrismaClient }
    ) => {
      try {
        const verify = jwt.verify(jwtfromuser, process.env.ACCESS_TOKEN!) as {
          id: string;
          username: string;
        };

        const user = await context?.prisma.user.findUnique({
          where: { id: verify.id },
        });
        if (!user) {
          throw new GraphQLError("Хэрэглэгч олдсонгүй!");
        }

        const todo = await context?.prisma.todo.findUnique({
          where: { id: todoId },
        });
        if (!todo) {
          throw new GraphQLError("Даалгавар олдсонгүй!");
        }
        if (todo.isDone === true) {
          throw new GraphQLError("Даалгавар аль хэдий нь дууссан байна!");
        }
        const isValid = todo.userId === verify.id;
        if (!isValid) {
          throw new GraphQLError("Даалгавар өөрчлөх эрх байхгүй!");
        }

        const updatedTodo = await context?.prisma.todo.update({
          where: { id: todo.id },
          data: { isDone: true },
          include: { user: true, tag: true },
        });
        return {
          success: true,
          message: "Хүсэлт амжилттай!",
          code: "REQUEST_SUCCESS",
          todo: updatedTodo,
        };
      } catch (err) {
        throw new GraphQLError("Хүсэлт амжилтгүй боллоо!");
      }
    },
    userTodo: async (
      p: any,
      { jwt: jwtfromuser }: { jwt: string },
      context?: { prisma: PrismaClient }
    ) => {
      try {
        const verify = jwt.verify(jwtfromuser, process.env.ACCESS_TOKEN!) as {
          id: string;
          username: string;
        };

        const user = await context?.prisma.user.findUnique({
          where: { id: verify.id },
        });
        if (!user) {
          throw new GraphQLError("Хэрэглэгч олдсонгүй!");
        }
        const todos = await context?.prisma.todo.findMany({
          where: { userId: verify.id },
          include: { tag: true, user: true },
          orderBy: [{ isDone: "asc" }, { createdAt: "desc" }],
        });
        return {
          success: true,
          message: "Хүсэлт амжилттай!",
          code: "REQUEST_SUCCESS",
          todos,
          user,
        };
      } catch (err) {
        throw new GraphQLError("Хүсэлт амжилтгүй боллоо!");
      }
    },
    cancelTodo: async (
      p: any,
      { jwt: jwtfromuser, id }: { jwt: string; id: string },
      context?: { prisma: PrismaClient }
    ) => {
      try {
        const verify = jwt.verify(jwtfromuser, process.env.ACCESS_TOKEN!) as {
          id: string;
          username: string;
        };
        const user = await context?.prisma.user.findUnique({
          where: { id: verify.id },
        });
        if (!user) {
          throw new GraphQLError("Хэрэглэгч олдсонгүй!");
        }

        const todo = await context?.prisma.todo.findUnique({ where: { id } });
        if (!todo) {
          throw new GraphQLError("Даалгавар олдсонгүй!");
        }
        if (todo.userId !== user.id) {
          throw new GraphQLError("Таны даалгавар биш байна!");
        }
        const updateTodo = await context?.prisma.todo.update({
          where: { id: todo.id },
          data: { cancelled: true },
        });
        return {
          success: true,
          message: "Хүсэлт амжилттай!",
          code: "REQUEST_SUCCESS",
          todo: updateTodo,
        };
      } catch (err) {
        console.log(err);
        throw new GraphQLError("Хүсэлт амжилтгүй боллоо!");
      }
    },
    // guest muttions
    addNewGuestTodo: async (
      p: any,
      {
        description,
        priority,
        taskName,
        tagId,
      }: {
        description: string;
        priority: number;
        taskName: string;
        tagId: string;
      },
      context?: { prisma: PrismaClient }
    ) => {
      try {
        const todoNameExists = await context?.prisma.guests.findFirst({
          where: {
            AND: [{ taskName }, { isDone: false }, { cancelled: false }],
          },
        });
        if (todoNameExists) {
          throw new GraphQLError("Даалгавар аль хэдийн үүссэн байна!");
        }
        const newTodo = await context?.prisma.guests.create({
          data: {
            description,
            priority,
            tagId,
            taskName,
          },
          include: { tag: true },
        });
        return newTodo;
      } catch (err) {
        throw new GraphQLError("Шинэ todo үүсгэхэд алдаа гарлаа!");
      }
    },
    editGuestTodo: async (
      p: any,
      {
        description,
        taskName,
        priority,
        id,
        tagId,
      }: {
        description: string;
        taskName: string;
        priority: number;
        id: string;
        tagId: string;
      },
      context?: { prisma: PrismaClient }
    ) => {
      try {
        const updateTodo = await context?.prisma.guests.update({
          where: { id },
          data: {
            ...(description ? { description } : {}),
            ...(taskName ? { taskName } : {}),
            priority,
            tagId,
          },
        });
        return updateTodo;
      } catch (err) {
        throw new GraphQLError("Засахад алдаа гарлаа!");
      }
    },
    cancelGuestTodo: async (
      p: any,
      { id }: { id: string },
      context?: { prisma: PrismaClient }
    ) => {
      try {
        const cancalTodo = await context?.prisma.guests.update({
          where: { id },
          data: { cancelled: true },
        });
        return cancalTodo;
      } catch (err) {
        throw new GraphQLError("Цуцлахад алдаа гарлаа");
      }
    },
    doneGuestTodo: async (
      p: any,
      { id }: { id: string },
      context?: { prisma: PrismaClient }
    ) => {
      try {
        const doneTodo = await context?.prisma.guests.update({
          where: { id },
          data: { isDone: true },
        });
        return doneTodo;
      } catch (err) {
        throw new GraphQLError("Өөрчлөхөд алдаа гарлаа");
      }
    },
  },
};
const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,

    introspection: process.env.NODE_ENV !== "production",
  });
  const { url } = await startStandaloneServer(server, {
    context: async () => ({ prisma }),
  });

  console.log("Сервер аслаа.", url);
};
if (process.env.NODE_ENV !== "test") {
  startServer();
}
