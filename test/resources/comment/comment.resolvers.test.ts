import { db, chai, app, handleError, expect } from './../../test-utils';
import { UserInstance } from '../../../src/models/UserModel';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../../src/utils/utils';
import { PostInstance } from '../../../src/models/PostModel';
import { CommentInstance } from '../../../src/models/CommentModel';

describe('Post', () => {

    let token: string;
    let userId: number;
    let postId: number;
    let commentId: number;

    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} })
                .then((rows: number) => db.User.destroy({ where: {} })
                    .then((rows: number) => db.User.create(
                        {
                            name: 'Peter Parker',
                            email: 'spider@spider.com',
                            password: '1234'
                        }
                    )).then((user: UserInstance) => {
                        userId = user.get('id');
                        const payload = { sub: userId };
                        token = jwt.sign(payload, JWT_SECRET);

                        return db.Post.create(
                            {
                                title: 'first Post',
                                content: 'content of first post',
                                author: userId,
                                photo: "1postPhoto.png"
                            }
                        );
                    }).then((post: PostInstance) => {
                        postId = post.get('id');

                        return db.Comment.bulkCreate([
                            {
                                comment: 'first comment',
                                user: userId,
                                post: postId
                            },
                            {
                                comment: 'second comment',
                                user: userId,
                                post: postId
                            },
                            {
                                comment: 'thord comment',
                                user: userId,
                                post: postId
                            }
                        ]);

                    }).then((comments: CommentInstance[]) => {
                        commentId = comments[0].get('id');
                    })));
    });

    describe('Queries', () => {

        describe('application/json', () => {

            describe('commentsByPost', () => {

                it('should return a list of comments', () => {
                    let body = {
                        query: `
                        query getCommentsListByPost($postId: ID!, $first: Int, $offset: Int) {
                            commentsByPost(postId: $postId, first: $first, offset: $offset) {
                                id
                                comment
                                user {
                                    id
                                    name
                                    email
                                }
                                post {
                                    id
                                    title
                                }
                            }
                        }`,
                        variables: {
                            postId: postId
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const commentsList = res.body.data.commentsByPost;
                            expect(res.body.data).to.be.an('object');
                            expect(commentsList).to.be.an('array');
                            expect(commentsList[0]).to.not.have.keys(['createdAt', 'updatedAt']);
                            expect(commentsList[0]).to.have.keys(['id', 'comment', 'user', 'post']);
                            expect(parseInt(commentsList[0].user.id)).to.be.equal(userId);
                            expect(parseInt(commentsList[0].post.id)).to.be.equal(postId);

                        })
                        .catch(handleError);
                });
            });

        });
    });

    describe('Mutations', () => {

        describe('application/json', () => {

            describe('createComment', () => {

                it('should create a new comment', () => {
                    let body = {
                        query: `
                        mutation createNewComment($input: CommentInput!) {
                            createComment(input: $input) {
                                comment
                                user{
                                    id
                                    name
                                }
                                post{
                                    id
                                    title
                                }
                            }
                        }`,
                        variables: {
                            input: {
                                comment: 'first comment',
                                post: postId
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body);
                            const createComment = res.body.data.createComment;
                            expect(res.body.data).to.be.an('object');
                            expect(createComment).to.be.an('object');
                            expect(createComment).to.not.have.keys(['id', 'createdAt', 'updatedAt']);
                            expect(createComment).to.have.keys(['comment', 'user', 'post']);
                            expect(parseInt(createComment.user.id)).to.be.equal(userId);
                            expect(parseInt(createComment.post.id)).to.be.equal(postId);
                            expect(createComment.post.title).to.be.equal('first Post');
                            expect(createComment.user.name).to.be.equal('Peter Parker');
                        })
                        .catch(handleError);
                });
            });

            describe('updateComment', () => {

                it('should update a comment', () => {
                    let body = {
                        query: `
                        mutation updateExistingComment($id: ID!, $input: CommentInput!) {
                            updateComment(id: $id, input: $input) {
                                id
                                comment
                            }
                        }`,
                        variables: {
                            id: commentId,
                            input: {
                                comment: 'Changed comment',
                                post: postId
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body);
                            const updateComment = res.body.data.updateComment;
                            expect(res.body.data).to.be.an('object');
                            expect(updateComment).to.be.an('object');
                            expect(updateComment).to.have.keys(['comment', 'id']);
                            expect(parseInt(updateComment.id)).to.be.equal(commentId);
                            expect(updateComment.comment).to.be.equal('Changed comment');
                        })
                        .catch(handleError);
                });
            });

            describe('deleteComment', () => {

                it('should delete a comment', () => {
                    let body = {
                        query: `
                        mutation deleteExistingComment($id: ID!) {
                            deleteComment(id: $id)
                        }`,
                        variables: {
                            id: commentId
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            // console.log(res.body);
                            const deleteComment = res.body.data.deleteComment;
                            expect(res.body.data).to.be.an('object');
                            expect(deleteComment).to.not.be.an('object');
                            expect(deleteComment).to.be.true;
                        })
                        .catch(handleError);
                });
            });

        });
    });

});