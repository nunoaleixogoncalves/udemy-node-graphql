import { makeExecutableSchema } from 'graphql-tools'
import { Query } from './query';
import { Mutation } from './mutation';
import { userTypes } from './resources/user/user.schema';
import { postTypes } from './resources/post/post.schema';
import { commentTypes } from './resources/comment/comment.schema';

import { merge } from 'lodash';
import { commentResolvers } from './resources/comment/comment.resolvers';
import { postResolvers } from './resources/post/post.resolvers';
import { userResolvers } from './resources/user/user.resolvers';
import { tokenTypes } from './resources/token/token.schema';
import { tokenResolvers } from './resources/token/token.resolvers';

const resolvers = merge(
    commentResolvers,
    postResolvers,
    tokenResolvers,
    userResolvers
);

const SchemaDefinition = `
    type Schema {
        query: Query
        mutation: Mutation
    }
`;

export default makeExecutableSchema({
    typeDefs: [
        SchemaDefinition,
        Query,
        Mutation,
        userTypes,
        postTypes, ,
        tokenTypes,
        commentTypes
    ],
    resolvers
});








/* inicial do curso
const users: any = [
    {
        id: 1,
        name: 'isa',
        email: 'isa@email.pt'
    },
    {
        id: 2,
        name: 'nuno',
        email: 'nuno@email.pt'
    }
];

const typeDefs = `
    type User {
        id: ID!
        name: String!
        email: String!
    }

    type Query{
        allUsers:[User!]!
    }

    type Mutation{
        createUser(name: String!, email: String!): User
    }
`;

const resolvers = {
    //user é resolver trivial não é preciso implementar
    User: {
        id: (user) => user.id,
        name: (user) => user.name,
        email: (user) => user.email,
    },
    Query: {
        allUsers: () => users
    },
    Mutation: {
        createUser: (parent, args) => {
            const newUser = Object.assign({ id: users.length + 1 }, args)
            users.push(newUser);
            return newUser;
        }
    }


};
*/