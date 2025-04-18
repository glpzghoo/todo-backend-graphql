export const typeDefs = `#graphql
type Tag {
    id: ID!
    name: String!
    todo: [Todo]!
}
type Todo {
    id: ID!
    description: String!
    isDone: Boolean!
    priority: Int!
    cancelled: Boolean!
    taskName: String!
    createdAt: String!
    user: UserNoPass!
    tag: Tag!
}
type Guest {
    id: ID!
    description: String!
    isDone: Boolean!
    priority: Int!
    cancelled: Boolean!
    taskName: String!
    createdAt: String!
    updatedAt: String!
    tag: Tag!
}
type User {
    id: ID!
    username: String!
    password: String!
    todo: [Todo]!
}
type UserNoPass {
    id: ID!
    username: String!
    todo: [Todo]!
}
type myResponse {
    success: Boolean!
    code: String!
    message: String!
    tag: Tag
    tags: [Tag]
    todo: Todo
    todos: [Todo]
    user: UserNoPass
    users: [UserNoPass]
    JWT: String
}
type Query {
    tag: myResponse
    todos: myResponse
    users: myResponse
    guests: [Guest]!
}
type Mutation {
    newUser(username: String!, password: String!): myResponse
    addTag(name: String!): myResponse
    loginUser(username: String!, password: String!): myResponse
    addTodo(description: String!, priority: Int!, taskName: String!, tagId: String!, jwt: String!): myResponse
    updateTodo(id: String!, description: String, priority: Int, taskName: String, jwt: String!, tagId: String): myResponse
    updateStatus(todoId: String!, jwt: String!): myResponse
    userTodo(jwt: String!): myResponse
    cancelTodo(jwt: String!, id: String!): myResponse
    addNewGuestTodo(description: String!, priority: Int!, taskName: String!, tagId: String!): Guest!
    editGuestTodo(id: String!, description: String, priority: Int, taskName: String, tagId: String): Guest!
    cancelGuestTodo(id:String!): Guest!
    doneGuestTodo(id:String!): Guest!
}
`;
