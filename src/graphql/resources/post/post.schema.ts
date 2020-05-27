const postTypes = `
    #post def type
    type Post {
        #comentario campo ex
        id: ID!
        title: String!
        content: String!
        photo: String!
        createdAt: String!
        updateAt: String!
        author: User!
        comments(first: Int, offset: Int): [ Comment! ]!
    }

    input PostInput{
        title: String!
        content: String!
        photo: String!
    }
`;


const postQueries = `
    posts(first: Int, offset: Int): [ Post! ]!
    post(id: ID!): Post
`;

const postMutations = `
    createPost(input: PostInput!): Post
    updatePost(id: ID!, input: PostInput!): Post
    deletePost(id: ID!): Boolean
`;

export {
    postTypes,
    postQueries,
    postMutations
}