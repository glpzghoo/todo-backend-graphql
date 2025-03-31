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
    user: User!
    tag: Tag!
}
type User {
    id: ID!
    username: String!
    password: String!
    todo: [Todo]!
}
type JWT {
    user: User!
    jwt: String!
}
type Query {
    tag: [Tag]
    todos: [Todo]
    users: [User]
    
}
type Mutation {
    addTodo(description: String!, priority: Int!, taskName: String!, tagId: String!, jwt: String!): Todo
    newUser(username: String!, password: String!): User
    addTag(name: String!): Tag
    loginUser(username: String!, password: String!): JWT!
    updateTodo(id: ID!, description: String, isDone: Boolean, priority: Int, taskName: String, tagId: String, jwt: String!): Todo
    userDoneTodo(jwt: String!): [Todo]!
    updateStatus(todoId: String!, isDone: Boolean!, jwt: String!): Todo
}
`;
