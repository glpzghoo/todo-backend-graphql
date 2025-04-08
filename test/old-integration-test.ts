import { ApolloServer } from "@apollo/server";
import { typeDefs } from "../lib/schema";
import { resolvers } from "..";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
describe("integ test goes brr", () => {
  let prisma: PrismaClient;
  let server: ApolloServer;
  let testTagId: string;
  let testTagName: string;
  let userId: string = "";
  let guestTodoId: string = "";
  let todoId: string = "";
  let jwt: string = "";
  beforeAll(async () => {
    prisma = new PrismaClient();

    const testTag = await prisma.tag.create({
      data: { name: `Test Tag ${Math.floor(Math.random() * 50000)}` },
    });
    testTagId = testTag.id;
    testTagName = testTag.name;

    server = new ApolloServer({ typeDefs, resolvers });
  });

  afterAll(async () => {
    await server.stop();
    await prisma.$disconnect();
  });
  // guest todo
  it("shine zochnii todo uusgeh", async () => {
    const ADD_GUEST_TODO = `#graphql
      mutation AddGuestTodo($description: String!, $priority: Int!, $taskName: String!, $tagId: String!) {
        addNewGuestTodo(description: $description, priority: $priority, taskName: $taskName, tagId: $tagId) {
          id
          taskName
          description
          priority
          isDone
          cancelled
          tag {
            id
            name
          }
        }
      }
    `;
    const variables = {
      description: `Test task desc`,
      priority: 1,
      taskName: `test task ${Math.floor(Math.random() * 50000)}`,
      tagId: testTagId,
    };

    type AddGuestTodoData = {
      addNewGuestTodo: {
        id: string;
        taskName: string;
        description: string;
        priority: number;
        isDone: boolean;
        cancelled: boolean;
        tag: { id: string; name: string };
      };
    };

    const response = await server.executeOperation<AddGuestTodoData>({
      query: ADD_GUEST_TODO,
      variables,
    });
    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      const data = response.body.singleResult.data;
      expect(data).toBeDefined();
      const newTodo = data!.addNewGuestTodo;
      expect(newTodo.taskName).toBe(variables.taskName);
      expect(newTodo.description).toBe(variables.description);
      expect(newTodo.priority).toBe(variables.priority);
      expect(newTodo.isDone).not.toBeTruthy;
      expect(newTodo.cancelled).not.toBeTruthy;
      expect(newTodo.tag.id).toBe(testTagId);
      expect(newTodo.tag.name).toBe(testTagName);
      const inDb = await prisma.guests.findUnique({
        where: { id: newTodo.id },
      });
      expect(inDb).not.toBeNull();
      expect(inDb!.taskName).toBe(variables.taskName);
      guestTodoId = newTodo.id;
    }
  });
  it("todo zasah", async () => {
    const EDIT_TODO = `#graphql
    mutation editTodo($id: String!, $description: String!, $priority: Int!, $taskName: String!, $tagId: String!){
      editGuestTodo(id: $id, description: $description, priority: $priority, taskName: $taskName, tagId: $tagId){
         id
    description
    isDone
    priority
    cancelled
    taskName
      }
    }`;
    const variables = {
      id: guestTodoId,
      description: "edited description",
      priority: Math.floor(Math.random() * 5),
      taskName: `name edited testing ${Math.floor(Math.random() * 50000)}`,
      tagId: testTagId,
    };
    type reponseType = {
      editGuestTodo: {
        id: string;
        description: string;
        isDone: boolean;
        priority: number;
        cancelled: boolean;
        taskName: string;
      };
    };
    const response = await server.executeOperation<reponseType>({
      query: EDIT_TODO,
      variables,
    });
    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      expect(response.body.singleResult.data?.editGuestTodo.description).toBe(
        variables.description
      );
      expect(response.body.singleResult.errors).not.toBeDefined();
      expect(response.body.singleResult.data?.editGuestTodo.taskName).toBe(
        variables.taskName
      );
      expect(response.body.singleResult.data?.editGuestTodo.id).toBe(
        variables.id
      );
      expect(response.body.singleResult.data?.editGuestTodo.priority).toBe(
        variables.priority
      );
    }
  });
  it("zochnii todo tsutslah", async () => {
    const CANCEL_GUEST_TODO = `#graphql
    mutation cancelGuestTodo($id: String!){
cancelGuestTodo(id: $id){
           id
    description
    isDone
    priority
    cancelled
    taskName
}
    }`;
    const variables = {
      id: guestTodoId,
    };
    type reponseType = {
      cancelGuestTodo: {
        id: string;
        description: string;
        isDone: boolean;
        priority: number;
        cancelled: boolean;
        taskName: string;
      };
    };
    const response = await server.executeOperation<reponseType>({
      query: CANCEL_GUEST_TODO,
      variables,
    });
    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      console.log(response.body.singleResult.errors);
      expect(
        response.body.singleResult.data?.cancelGuestTodo.cancelled
      ).toBeTruthy();
    }
  });
  it("guest todo (isDone)", async () => {
    const DONE_GUEST_TODO = `#graphql
    mutation don($id: String!){
      doneGuestTodo(id: $id){
                   id
    description
    isDone
    priority
    cancelled
    taskName
      }
    }`;
    const variables = {
      id: guestTodoId,
    };
    type reponseType = {
      doneGuestTodo: {
        id: string;
        description: string;
        isDone: boolean;
        priority: number;
        cancelled: boolean;
        taskName: string;
      };
    };
    const response = await server.executeOperation<reponseType>({
      query: DONE_GUEST_TODO,
      variables,
    });
    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      console.log(response.body.singleResult.errors);
      expect(response.body.singleResult.errors).not.toBeDefined();
      expect(
        response.body.singleResult.data?.doneGuestTodo.isDone
      ).toBeTruthy();
    }
  });
  // user todo
  it("shine hereglech", async () => {
    const NEW_USER = `#graphql
    mutation addNewUser($username: String!, $password: String!){
        newUser(username: $username, password: $password){
          success
          message
          code
          user {
              id
            username
          }
        }
    }`;

    const variables = {
      username: `testing ${Math.floor(Math.random() * 50000)}`,
      password: `passwordmagic`,
    };
    const response = await server.executeOperation<user>({
      query: NEW_USER,
      variables,
    });
    type user = {
      newUser: {
        success: boolean;
        message: string;
        code: "string";
        user: { id: string; username: string; password: string };
      };
    };
    console.log({ response });
    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      const data = response.body.singleResult.data;
      expect(data).toBeDefined();
      expect(data?.newUser.success).toBeTruthy();
      const newUser = data!.newUser;
      expect(newUser.user.username).toBe(variables.username);

      const indb = await prisma.user.findUnique({
        where: { id: newUser.user.id },
      });
      expect(indb).not.toBeNull();
      expect(indb?.username).toBe(variables.username);
    }
  });
  it("shine tag nemeh", async () => {
    const NEW_TAG = `#graphql
    mutation newTag($name: String!){
      addTag(name: $name){
        success
        code
        message
        tag {
          id 
          name
        }
      }
    }
    `;
    const variables = {
      name: `test tag ${Math.floor(Math.random() * 50000)}`,
    };
    type tag = {
      addTag: {
        success: boolean;
        message: string;
        code: string;
        tag: { id: string; name: string };
      };
    };
    const response = await server.executeOperation<tag>({
      query: NEW_TAG,
      variables,
    });

    expect(response.body.kind).toBe("single");

    if (response.body.kind === "single") {
      expect(response.body.singleResult.data?.addTag.tag.name).toBe(
        variables.name
      );

      const indb = await prisma.tag.findUnique({
        where: { id: response.body.singleResult.data?.addTag.tag.id },
      });
      expect(indb).not.toBeNull();
    }
  });
  it("login user omg fu", async () => {
    const LOGIN_USER = `#graphql
    mutation login($username: String!, $password: String!){
      loginUser(username: $username, password: $password){
        success 
        code 
        message 
        JWT 
        user {
          username 
          id
          }
      }
    }
    `;
    const variables = {
      username: `glpzghoo`,
      password: `passwordmagic`,
    };
    type responseType = {
      loginUser: {
        success: boolean;
        message: string;
        code: string;
        JWT: string;
        user: { id: string; username: string };
      };
    };
    const response = await server.executeOperation<responseType>({
      query: LOGIN_USER,
      variables,
    });
    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      console.log({ response: response.body.singleResult.errors });
      expect(response.body.singleResult.data?.loginUser.success).toBeTruthy();
      expect(response.body.singleResult.data?.loginUser.user.username).toBe(
        variables.username
      );

      const indb = await prisma.user.findUnique({
        where: { id: response.body.singleResult.data?.loginUser.user.id },
      });
      expect(indb).not.toBeNull();
      jwt = response.body.singleResult.data?.loginUser.JWT || "";
      userId = response.body.singleResult.data?.loginUser.user.id || "";
    }
  });
  it("shine todo", async () => {
    const NEW_TODO = `#graphql
    mutation newTodo($description: String!, $priority: Int!, $taskName: String!, $jwt:String!, $tagId: String!){
   addTodo(description: $description, priority: $priority, taskName: $taskName, jwt: $jwt, tagId: $tagId){
       success
      message
      code
      todo{
        id
        description
        priority
        taskName
      }
   }

    }
    `;
    const variables = {
      description: "test description",
      priority: 5,
      taskName: `Testing ${Math.floor(Math.random() * 50000)}`,
      jwt,
      tagId: testTagId,
    };

    type todoResponse = {
      addTodo: {
        success: boolean;
        message: string;
        code: string;
        todo: {
          id: string;
          description: string;
          taskName: string;
          priority: number;
        };
      };
    };
    const response = await server.executeOperation<todoResponse>({
      query: NEW_TODO,
      variables,
    });
    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      const todod = response.body.singleResult.data?.addTodo.todo;
      console.log(response.body.singleResult.errors);
      expect(response.body.singleResult.data?.addTodo.success).toBeTruthy();
      expect(todod?.taskName).toBe(variables.taskName);
      expect(todod?.description).toBe(variables.description);
      expect(todod?.priority).toBe(variables.priority);
      const ind = await prisma.todo.findUnique({ where: { id: todod?.id } });
      expect(ind).not.toBeNull();
      todoId = todod?.id || "";
    }
  });
  it("todo zasah", async () => {
    const UPDATE_TODO = `#graphql
    mutation updateTodo($id: String!, $description: String!, $priority: Int!, $taskName: String!, $jwt: String!, $tagId: String!){
        updateTodo(id: $id, description: $description, priority: $priority, taskName: $taskName, jwt: $jwt, tagId: $tagId){
            success
            message
            code
            todo {
              id
              description
              priority
              taskName
            }
      }
    }`;
    const variables = {
      description: "description edited",
      id: todoId,
      priority: 1,
      taskName: `testing edit ${Math.floor(Math.random() * 50000)}`,
      jwt,
      tagId: testTagId,
    };
    type reponseType = {
      updateTodo: {
        message: string;
        code: string;
        success: boolean;
        todo: {
          id: string;
          description: string;
          priority: number;
          taskName: string;
        };
      };
    };
    const response = await server.executeOperation<reponseType>({
      query: UPDATE_TODO,
      variables,
    });

    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      expect(response.body.singleResult.data?.updateTodo.success).toBeTruthy();
      const todo = response.body.singleResult.data?.updateTodo.todo;
      expect(todo?.description).toBe(variables.description);
      expect(todo?.priority).toBe(variables.priority);
      expect(todo?.taskName).toBe(variables.taskName);
      const indb = await prisma.todo.findUnique({ where: { id: todo?.id } });
      expect(indb).not.toBeNull();
    }
  });
  it("nevtersen hereglegchiin todonuud", async () => {
    const USER_TODOS = `#graphql
    mutation userTodos ($jwt: String!){
      userTodo(jwt: $jwt){
        success
        code
        message
        todos {
          id
          taskName
          description
        }
      }
    }`;
    type todo = {
      id: string;
      taskName: string;
      description: string;
    };
    type responseType = {
      userTodo: {
        success: boolean;
        message: string;
        code: string;
        todos: todo[];
      };
    };
    const response = await server.executeOperation<responseType>({
      query: USER_TODOS,
      variables: { jwt },
    });
    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      console.log(response.body.singleResult.errors);
      expect(response.body.singleResult.data?.userTodo.success).toBeTruthy();
      expect(response.body.singleResult.data?.userTodo.todos).toBeDefined();
      expect(response.body.singleResult.errors).not.toBeDefined();
    }
  });
  it("status oorchlog (isDone)", async () => {
    const UPDATE_STATUS = `#graphql
    mutation update($todoId: String!, $jwt: String!){
      updateStatus(todoId: $todoId, jwt: $jwt){
        success
        code
        message
        todo {
          id
          taskName
          description
          isDone
        }
      }
    }`;
    const variables = {
      jwt,
      todoId,
    };
    type responseType = {
      updateStatus: {
        success: boolean;
        code: string;
        message: string;
        todo: {
          id: string;
          taskName: string;
          description: string;
          isDone: boolean;
        };
      };
    };
    const response = await server.executeOperation<responseType>({
      query: UPDATE_STATUS,
      variables,
    });
    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      console.log(response.body.singleResult.errors);
      expect(response.body.singleResult.data).toBeDefined();
      const todo = response.body.singleResult.data?.updateStatus.todo;
      expect(todo?.isDone).toBeTruthy();
      const indb = await prisma.todo.findUnique({
        where: { id: variables.todoId },
      });
      expect(indb).not.toBeNull();
    }
  });
  it("todo tsutslag (cancelled)", async () => {
    const CANCEL_TODO = `#graphql
    mutation cancelTodo($jwt: String!, $id: String!){
      cancelTodo(jwt: $jwt, id: $id){
        success
        code
        message
        todo {
          id
          taskName
          description
          cancelled
        }
      }
    }`;
    const variables = {
      jwt,
      id: todoId,
    };
    type responseType = {
      cancelTodo: {
        success: boolean;
        message: string;
        code: string;
        todo: {
          id: string;
          taskName: string;
          description: string;
          cancelled: boolean;
        };
      };
    };
    const response = await server.executeOperation<responseType>({
      query: CANCEL_TODO,
      variables,
    });

    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      expect(response.body.singleResult.data?.cancelTodo.success).toBeTruthy();
      const todo = response.body.singleResult.data?.cancelTodo.todo;
      expect(todo?.cancelled).toBeTruthy();
    }
  });
});
