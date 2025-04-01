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
    taskName: String!
    user: UserNoPass!
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
}
type Mutation {
    addTodo(description: String!, priority: Int!, taskName: String!, tagId: String!, jwt: String!): myResponse
    newUser(username: String!, password: String!): myResponse
    addTag(name: String!): myResponse
    loginUser(username: String!, password: String!): myResponse
    updateTodo(id: ID!, description: String, priority: Int, taskName: String, jwt: String!): myResponse
    userDoneTodo(jwt: String!): myResponse
    updateStatus(todoId: String!, isDone: Boolean!, jwt: String!): myResponse
    userTodo(jwt: String!): myResponse

}
`;
