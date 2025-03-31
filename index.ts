import { ApolloServer } from "@apollo/server";
import { GraphQLError } from "graphql";
import { startStandaloneServer } from "@apollo/server/standalone";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { typeDefs } from "./lib/schema";
import { prisma } from "./lib/prisma";

const resolvers = {
  Query: {
    users: async () => {
      const users = await prisma.user.findMany({
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
    todos: async () => {
      const todos = await prisma.todo.findMany({ include: { user: true } });
      return {
        success: true,
        message: "Хүсэлт амжилттай!",
        code: "REQUEST_SUCCESS",
        todos,
      };
    },
    tag: async () => {
      const tags = await prisma.tag.findMany();
      return {
        success: true,
        message: "Хүсэлт амжилттай!",
        code: "REQUEST_SUCCESS",
        tags,
      };
    },
  },
  Mutation: {
    newUser: async (
      p: any,
      { username, password }: { username: string; password: string }
    ) => {
      const useExist = await prisma.user.findUnique({ where: { username } });
      if (useExist) {
        throw new GraphQLError("Хэрэглэгч бүртгэлтэй байна!");
      }
      const encryptedPass = await bcrypt.hash(password, 15);
      const newUser = await prisma.user.create({
        data: { username, password: encryptedPass },
      });
      return {
        success: true,
        message: "Хүсэлт амжилттай!",
        code: "REQUEST_SUCCESS",
        user: newUser,
      };
    },
    addTag: async (p: any, { name }: { name: string }) => {
      const newTag = await prisma.tag.create({ data: { name } });
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
      }
    ) => {
      try {
        if (!process.env.ACCESS_TOKEN) {
          throw new GraphQLError(
            "Серверийн тохиргоо асуудалтай байгаа бололтой. Дараа оролдоно уу~!"
          );
        }
        const verify = jwt.verify(jwtfromuser, process.env.ACCESS_TOKEN) as {
          id: string;
          username: string;
        };

        const user = await prisma.user.findUnique({ where: { id: verify.id } });
        if (!user) {
          throw new GraphQLError("Хэрэглэгч олдсонгүй!");
        }
        const newTodo = await prisma.todo.create({
          data: {
            description,
            priority,
            taskName,
            userId: user.id,
            tagId,
          },
          include: { user: true },
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
      { username, password }: { username: string; password: string }
    ) => {
      if (!process.env.ACCESS_TOKEN) {
        throw new GraphQLError(
          "Серверийн тохиргоо асуудалтай байгаа бололтой. Дараа оролдоно уу~!"
        );
      }
      const user = await prisma.user.findUnique({
        where: { username },
        include: { todo: true },
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
        process.env.ACCESS_TOKEN,
        { expiresIn: "1h" }
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
        jwt: jwtfromuser,
      }: {
        id: string;
        description: string;
        priority: number;
        taskName: string;
        jwt: string;
      }
    ) => {
      try {
        if (!process.env.ACCESS_TOKEN) {
          throw new GraphQLError(
            "Серверийн тохиргоо асуудалтай байгаа бололтой. Дараа оролдоно уу~!"
          );
        }
        const verify = jwt.verify(jwtfromuser, process.env.ACCESS_TOKEN) as {
          id: string;
          username: string;
        };
        const user = await prisma.user.findUnique({
          where: { id: verify.id },
        });

        if (!user) {
          throw new GraphQLError("Хэрэглэгч олдсонгүй!");
        }
        const todo = await prisma.todo.findUnique({ where: { id } });
        if (!todo) {
          throw new GraphQLError("Todo олдсонгүй!");
        }
        const updatedTodo = await prisma.todo.update({
          where: { id: todo.id },
          data: {
            ...(description ? { description } : {}),
            priority,
            ...(taskName ? { taskName } : {}),
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
    userDoneTodo: async (p: any, { jwt: jwtfromuser }: { jwt: string }) => {
      if (!process.env.ACCESS_TOKEN) {
        throw new GraphQLError(
          "Серверийн тохиргоо асуудалтай байгаа бололтой. Дараа оролдоно уу~!"
        );
      }
      try {
        const verify = jwt.verify(jwtfromuser, process.env.ACCESS_TOKEN) as {
          id: string;
          username: string;
        };
        const user = await prisma.user.findUnique({
          where: { id: verify.id },
        });
        if (!user) {
          throw new GraphQLError("Хэрэглэгч олдсонгүй!");
        }
        const todos = await prisma.todo.findMany({
          where: { userId: verify.id, isDone: true },
          include: { user: true, tag: true },
        });
        return {
          success: true,
          message: "Хүсэлт амжилттай!",
          code: "REQUEST_SUCCESS",
          todos,
        };
      } catch (err) {
        throw new GraphQLError("Хүсэлт амжилтгүй боллоо!");
      }
    },
    updateStatus: async (
      p: any,
      {
        todoId,
        isDone,
        jwt: jwtfromuser,
      }: { todoId: string; isDone: boolean; jwt: string }
    ) => {
      try {
        if (!process.env.ACCESS_TOKEN) {
          throw new GraphQLError(
            "Серверийн тохиргоо асуудалтай байгаа бололтой. Дараа оролдоно уу~!"
          );
        }
        const verify = jwt.verify(jwtfromuser, process.env.ACCESS_TOKEN) as {
          id: string;
          username: string;
        };

        const user = await prisma.user.findUnique({ where: { id: verify.id } });
        if (!user) {
          throw new GraphQLError("Хэрэглэгч олдсонгүй!");
        }

        const todo = await prisma.todo.findUnique({ where: { id: todoId } });
        if (!todo) {
          throw new GraphQLError("Todo олдсонгүй!");
        }
        const isValid = todo.userId === verify.id;
        if (!isValid) {
          throw new GraphQLError("Todo өөрчлөх эрх байхгүй!");
        }

        const updatedTodo = await prisma.todo.update({
          where: { id: todo.id },
          data: { isDone },
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
  },
};
const startServer = async () => {
  const server = new ApolloServer({ typeDefs, resolvers });
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log("Сервер аслаа.", url);
};
startServer();
