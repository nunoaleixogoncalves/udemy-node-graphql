import { db, chai, app, handleError, expect } from './../../test-utils';
import { UserInstance } from '../../../src/models/UserModel';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../../src/utils/utils';

describe('User', () => {

    let token: string;
    let userId: number;


    beforeEach(() => {
        return db.Comment.destroy({ where: {} })
            .then((rows: number) => db.Post.destroy({ where: {} })
                .then((rows: number) => db.User.destroy({ where: {} })
                    .then((rows: number) => db.User.bulkCreate([
                        {
                            name: 'Peter Parker',
                            email: 'spider@spider.com',
                            password: '123456'
                        },
                        {
                            name: 'Super Homem',
                            email: 'super@homem.com',
                            password: '123456'
                        },
                        {
                            name: 'Best World',
                            email: 'best@world.com',
                            password: '123456'
                        }
                    ]
                    )).then((users: UserInstance[]) => {
                        userId = users[0].get('id');
                        const payload = { sub: userId };
                        token = jwt.sign(payload, JWT_SECRET);
                    })));
    });

    describe('Queries', () => {

        describe('application/json', () => {

            describe('users', () => {

                it('should return a list of Users', () => {
                    let body = {
                        query: `
                        query{
                            users{
                                name
                                email
                            }
                        }`
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const usersList = res.body.data.users;
                            expect(res.body.data).to.be.an('object');
                            expect(usersList).to.be.an('array');
                            expect(usersList[0]).to.not.have.keys(['id', 'photo', 'createdAt', 'updatedAt', 'posts']);
                            expect(usersList[0]).to.have.keys(['name', 'email']);
                        })
                        .catch(handleError);
                });

                it('should paginate a list of Users', () => {
                    let body = {
                        query: `
                        query getUsersList($first: Int, $offset: Int){
                            users(first: $first, offset: $offset){
                                name
                                email
                                createdAt
                            }
                        }`,
                        variables: {
                            first: 2,
                            offset: 1
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const usersList = res.body.data.users;
                            expect(res.body.data).to.be.an('object');
                            expect(usersList).to.be.an('array').of.length(2);
                            expect(usersList[0]).to.not.have.keys(['id', 'photo', 'updatedAt', 'posts']);
                            expect(usersList[0]).to.have.keys(['name', 'email', 'createdAt']);
                        })
                        .catch(handleError);
                });

            });

            describe('user', () => {
                it('should return a user', () => {
                    let body = {
                        query: `
                        query getSingleUser($id: ID!){
                            user(id: $id){
                                id
                                name
                                email
                                posts{
                                    title
                                }
                            }
                        }`,
                        variables: {
                            id: userId
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const singleUser = res.body.data.user;
                            expect(res.body.data).to.be.an('object');
                            expect(singleUser).to.be.an('object');
                            expect(singleUser).to.have.keys(['id', 'name', 'email', 'posts']);
                            expect(singleUser.name).to.equal('Peter Parker');
                            expect(singleUser.email).to.equal('spider@spider.com');
                        })
                        .catch(handleError);
                });
                it('should only \'name\' attribute', () => {
                    let body = {
                        query: `
                        query getSingleUser($id: ID!){
                            user(id: $id){
                                name
                            }
                        }`,
                        variables: {
                            id: userId
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const singleUser = res.body.data.user;
                            expect(res.body.data).to.be.an('object');
                            expect(singleUser).to.be.an('object');
                            expect(singleUser).to.have.key('name');
                            expect(singleUser.name).to.equal('Peter Parker');
                            expect(singleUser.email).to.be.undefined;
                        })
                        .catch(handleError);
                });
                it('should return an error if user not exists \'name\' attribute', () => {
                    let body = {
                        query: `
                        query getSingleUser($id: ID!){
                            user(id: $id){
                                name
                            }
                        }`,
                        variables: {
                            id: -1
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const singleUser = res.body.data.user;
                            expect(res.body.data.user).to.be.null;
                            expect(res.body.errors).to.be.an('array');
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.errors[0].message).to.equal('Error: User with id:-1 not found!!');
                        })
                        .catch(handleError);
                });


            });

            describe('currentUser', () => {
                it('should return the current user from token', () => {
                    let body = {
                        query: `
                        query{
                            currentUser{
                                name
                                email
                            }
                        }`,
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data.currentUser);
                            const currentUser = res.body.data.currentUser;
                            expect(res.body.data).to.be.an('object');
                            expect(currentUser).to.be.an('object');
                            expect(currentUser).to.have.keys(['name', 'email']);
                            expect(currentUser.name).to.equal('Peter Parker');
                            expect(currentUser.email).to.equal('spider@spider.com');
                        })
                        .catch(handleError);
                });
            });
        });

    });

    describe('Mutations', () => {
        describe('application/json', () => {

            describe('createUser', () => {

                it('should create a new user', () => {
                    let body = {
                        query: `
                        mutation createNewUser($input: UserCreateInput!){
                            createUser(input: $input){
                                id
                                name
                                email
                            }
                        }`,
                        variables: {
                            input: {
                                name: 'Nuno Gonçalves',
                                email: 'nuno@goncalves.pt',
                                password: '123'
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            const createUser = res.body.data.createUser;
                            expect(createUser).to.not.be.null;
                            expect(createUser).to.be.an('object');
                            expect(createUser.name).to.be.equal('Nuno Gonçalves');
                            expect(createUser.email).to.be.equal('nuno@goncalves.pt');
                            expect(parseInt(createUser.id)).to.be.an('number');
                        })
                        .catch(handleError);
                });
            });
            describe('updateUser', () => {

                it('should update a existing user', () => {
                    let body = {
                        query: `
                        mutation updateExistingUser($input: UserUpdateInput!){
                            updateUser(input: $input){
                                name
                                email
                                photo
                            }
                        }`,
                        variables: {
                            input: {
                                name: 'Peter what Parker',
                                email: 'spider2@spider2.pt',
                                photo: 'teste.png'
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
                            const updateUser = res.body.data.updateUser;
                            expect(updateUser).to.not.be.null;
                            expect(updateUser).to.be.an('object');
                            expect(updateUser.name).to.be.equal('Peter what Parker');
                            expect(updateUser.email).to.be.equal('spider2@spider2.pt');
                            expect(updateUser.photo).to.not.be.null;
                            expect(updateUser.photo).to.be.equal('teste.png');
                            expect(updateUser.id).to.be.undefined;
                        })
                        .catch(handleError);
                });

                it('should block operation if invalid token', () => {
                    let body = {
                        query: `
                        mutation updateExistingUser($input: UserUpdateInput!){
                            updateUser(input: $input){
                                name
                                email
                                photo
                            }
                        }`,
                        variables: {
                            input: {
                                name: 'Peter what Parker',
                                email: 'spider2@spider2.pt',
                                photo: 'teste.png'
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer invalidtoken`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            expect(res.body.data.updateUser).to.be.null;
                            expect(res.body).to.have.keys(['errors', 'data']);
                            expect(res.body.errors).to.be.an('array');
                            expect(res.body.errors[0].message).to.be.equal('JsonWebTokenError: jwt malformed');
                        })
                        .catch(handleError);
                });

                it('should block operation if token not provided', () => {
                    let body = {
                        query: `
                        mutation updateExistingUser($input: UserUpdateInput!){
                            updateUser(input: $input){
                                name
                                email
                                photo
                            }
                        }`,
                        variables: {
                            input: {
                                name: 'Peter what Parker',
                                email: 'spider2@spider2.pt',
                                photo: 'teste.png'
                            }
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            expect(res.body.data.updateUser).to.be.null;
                            expect(res.body).to.have.keys(['errors', 'data']);
                            expect(res.body.errors).to.be.an('array');
                            expect(res.body.errors[0].message).to.be.equal('Unauthorized!! token not provided.');
                        })
                        .catch(handleError);
                });
            });

            describe('updateUserPassword', () => {

                it('should update password for a user', () => {
                    let body = {
                        query: `
                        mutation updateUserPassword($input: UserUpdatePasswordInput!){
                            updateUserPassword(input: $input)
                        }
                        `,
                        variables: {
                            input: {
                                password: 'peter123'
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
                            expect(res.body.data.updateUserPassword).to.be.true;
                        })
                        .catch(handleError);
                });

            });

            describe('deleteUser', () => {

                it('should delete a user', () => {
                    let body = {
                        query: `
                        mutation {
                            deleteUser
                        }
                        `
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            //console.log(res.body.data);
                            expect(res.body.data.deleteUser).to.be.true;
                        })
                        .catch(handleError);
                });

            });
        });
    });
});