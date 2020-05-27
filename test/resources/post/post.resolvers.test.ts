import { db, chai, app, handleError, expect } from './../../test-utils';
import { UserInstance } from '../../../src/models/UserModel';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../../src/utils/utils';
import { PostInstance } from '../../../src/models/PostModel';

describe('Post', () => {

    let token: string;
    let userId: number;
    let postId: number;


    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} })
                .then((rows: number) => db.User.destroy({ where: {} })
                    .then((rows: number) => db.User.create(
                        {
                            name: 'Rocket',
                            email: 'rocket@man.com',
                            password: '1234'
                        }
                    )).then((user: UserInstance) => {
                        userId = user.get('id');
                        const payload = { sub: userId };
                        token = jwt.sign(payload, JWT_SECRET);

                        return db.Post.bulkCreate([
                            {
                                title: 'first Post',
                                content: 'content of first post',
                                author: userId,
                                photo: "1postPhoto.png"
                            },
                            {
                                title: 'second Post',
                                content: 'content of second post',
                                author: userId,
                                photo: "2postPhoto.png"
                            },
                            {
                                title: 'third Post',
                                content: 'content of third post',
                                author: userId,
                                photo: "3postPhoto.png"
                            }
                        ]);
                    }).then((posts: PostInstance[]) => {
                        postId = posts[0].get('id');
                    })));
    });

    describe('Queries', () => {

        describe('application/json', () => {

            describe('posts', () => {

                it('should return a list of posts', () => {
                    let body = {
                        query: `
                        query{
                            posts{
                                title
                                content
                            }
                        }`
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const postsList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postsList).to.be.an('array');
                            expect(postsList[0]).to.not.have.keys(['id', 'photo', 'createdAt', 'updatedAt', 'author', 'comments']);
                            expect(postsList[0]).to.have.keys(['title', 'content']);
                            expect(postsList[0].title).to.be.equal('first Post');
                            expect(postsList[0].content).to.be.equal('content of first post');
                        })
                        .catch(handleError);
                });
            });

            describe('post', () => {

                it('should return a post of a author', () => {
                    let body = {
                        query: `
                        query getPost($id: ID!){
                            post(id: $id){
                                id
                                title
                                author{
                                    name 
                                    email
                                }
                                comments{
                                    comment
                                }
                            }
                        }`,
                        variables: {
                            id: postId
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const singlePost = res.body.data.post;
                            expect(res.body.data).to.be.an('object');
                            expect(res.body.data).to.have.key('post');
                            expect(singlePost).to.be.an('object');
                            expect(singlePost).to.have.keys(['id', 'title', 'author', 'comments']);
                            expect(singlePost).to.not.have.keys(['content', 'createdAt']);
                            expect(singlePost.title).to.be.equal('first Post');
                            expect(singlePost.author).to.be.an('object').with.keys(['name', 'email']);
                            expect(singlePost.author).to.be.an('object').not.with.keys(['id', 'createdAt']);
                            expect(singlePost.content).to.be.undefined;
                        })
                        .catch(handleError);
                });

            });
        });

        describe('application/graphql', () => {

            describe('posts', () => {

                it('should return a list of posts', () => {
                    let query = `
                        query{
                            posts{
                                title
                                content
                                photo
                            }
                        }`;

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/graphql')
                        .send(query)
                        .then(res => {
                            //console.log(res.body.data);
                            const postsList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postsList).to.be.an('array');
                            expect(postsList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt', 'author', 'comments']);
                            expect(postsList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postsList[0].title).to.be.equal('first Post');
                            expect(postsList[0].content).to.be.equal('content of first post');
                        })
                        .catch(handleError);
                });

                it('should paginate a list of posts', () => {
                    let query = `
                        query getPostsList($first: Int, $offset: Int){
                            posts (first: $first, offset: $offset){
                                title
                                content
                                photo
                            }
                        }`;

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/graphql')
                        .send(query)
                        .query({
                            variables: JSON.stringify({
                                first: 2,
                                offset: 1
                            })
                        })
                        .then(res => {
                            //console.log(res.body.data);
                            const postsList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postsList).to.be.an('array').with.length(2);
                            expect(postsList).to.have.length(2);
                            expect(postsList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt', 'author', 'comments']);
                            expect(postsList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postsList[0].title).to.be.equal('second Post');
                            expect(postsList[0].content).to.be.equal('content of second post');
                        })
                        .catch(handleError);
                });
            });
        });





    });

    describe('Mutations', () => {
        describe('application/json', () => {

            describe('createPost', () => {

                it('should create a new post', () => {
                    let body = {
                        query: `
                        mutation creatNewPost($input: PostInput!){
                            createPost(input: $input){
                                id
                                title
                                author{
                                    id
                                    name
                                    email
                                }
                            }
                        }`,
                        variables: {
                            input: {
                                title: 'fourth Post',
                                content: 'fourth content',
                                photo: '4post.png'
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const createPost = res.body.data.createPost;
                            expect(createPost).to.be.an('object');
                            expect(createPost).to.not.have.keys(['photo', 'createdAt', 'updatedAt', 'content', 'comments']);
                            expect(createPost).to.have.keys(['title', 'id', 'author']);
                            expect(createPost.title).to.be.equal('fourth Post');
                            expect(parseInt(createPost.author.id)).to.be.equal(userId);
                        })
                        .catch(handleError);
                });

            });
            describe('updatePost', () => {

                it('should update a post', () => {
                    let body = {
                        query: `
                        mutation updateExistingPost($id: ID!, $input: PostInput!){
                            updatePost(id: $id, input: $input){
                                content
                                title
                                photo
                            }
                        }`,
                        variables: {
                            id: postId,
                            input: {
                                title: 'Post changed',
                                content: 'changed content',
                                photo: '4post_changed.png'
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const updatePost = res.body.data.updatePost;
                            expect(updatePost).to.be.an('object');
                            expect(updatePost).to.not.have.keys(['id', 'createdAt', 'updatedAt', 'comments']);
                            expect(updatePost).to.have.keys(['title', 'content', 'photo']);
                            expect(updatePost.title).to.be.equal('Post changed');
                            expect(updatePost.content).to.be.equal('changed content');
                            expect(updatePost.photo).to.be.equal('4post_changed.png');
                        })
                        .catch(handleError);
                });

            });

            describe('deletePost', () => {


                it('should delete a post', () => {
                    let body = {
                        query: `
                        mutation deleteExistingPost($id: ID!){
                            deletePost(id: $id)
                        }`,
                        variables: {
                            id: postId
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const deletePost = res.body.data.deletePost;
                            expect(deletePost).to.be.true;
                            expect(deletePost).to.not.be.an('object');
                        })
                        .catch(handleError);
                });

            });
        });
    });
});