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
                    )).catch(handleError)));
    });

    describe('Mutations', () => {
        describe('application/json', () => {
            describe('createToken', () => {
                it('should create a valid token', () => {
                    let body = {
                        query: `
                        mutation createNewToken($email: String!, $password: String!) {
                            createToken(email: $email, password: $password) {
                                token
                            }
                        }`,
                        variables: {
                            email: 'spider@spider.com',
                            password: '1234'
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const createToken = res.body.data.createToken;
                            expect(res.body.data).to.be.an('object');
                            expect(createToken).to.have.key('token');
                            expect(createToken.token).to.be.string;
                            expect(res.body.errors).to.be.undefined;
                        })
                        .catch(handleError);
                });

                it('should not create a token wrong password', () => {
                    let body = {
                        query: `
                        mutation createNewToken($email: String!, $password: String!) {
                            createToken(email: $email, password: $password) {
                                token
                            }
                        }`,
                        variables: {
                            email: 'spider@spider.com',
                            password: 'wrongpass'
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            expect(res.body.data.createToken).to.be.null;
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.errors).to.be.an('array').with.length(1);
                            expect(res.body.errors[0].message).to.be.equal('Unauthorized! wrong email or password!');
                        })
                        .catch(handleError);
                });

                it('should return error wrong email', () => {
                    let body = {
                        query: `
                        mutation createNewToken($email: String!, $password: String!) {
                            createToken(email: $email, password: $password) {
                                token
                            }
                        }`,
                        variables: {
                            email: 'wrong@email.com',
                            password: '123'
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            expect(res.body.data.createToken).to.be.null;
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.errors).to.be.an('array').with.length(1);
                            expect(res.body.errors[0].message).to.be.equal('Unauthorized! wrong email or password!');
                        })
                        .catch(handleError);
                });
            });
        });
    });

});