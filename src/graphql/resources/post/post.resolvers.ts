import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { Transaction } from "sequelize";
import { PostInstance } from "../../../models/PostModel";
import { handleError, throwError } from "../../../utils/utils";
import { authResolvers } from "../../composable/auth.resolver";
import { compose } from "../../composable/composable.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import * as graphqlFields from 'graphql-fields';
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

export const postResolvers = {
    Post: {
        author: (post, args, { db, dataloaders: { userLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return userLoader.load({ key: post.get('author'), info: info }).catch(handleError);
            //return db.User.findById(post.get('author')).catch(handleError);
        },
        comments: (post, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            return context.db.Comment.findAll({
                where: { post: post.get('id') },
                limit: first,
                offset: offset,
                attributes: context.requestedFields.getFields(info)
            }).catch(handleError)
        }
    },
    Query: {
        posts: (parent, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            return context.db.Post.findAll({
                limit: first,
                offset: offset,
                /*attributes: Object.keys(graphqlFields(info))*/
                attributes: context.requestedFields.getFields(info, { keep: ['id'], exclude: ['comments'] })
            }).catch(handleError);
        },
        post: (parent, { id }, context: ResolverContext, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return context.db.Post.findById(id, {
                attributes: context.requestedFields.getFields(info, { keep: ['id'], exclude: ['comments'] })
            }).then((post: PostInstance) => {
                if (!post) {
                    throwError(!post, `Post with id:${id} not found!!`);
                }
                return post;
            }).catch(handleError);
        }
    },
    Mutation: {
        createPost: compose(...authResolvers)((parent, args, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            args.input.author = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post.create(args.input, { transaction: t });
            }).catch(handleError);
        }),
        updatePost: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post.findById(id).then((post: PostInstance) => {
                    throwError(!post, `Post with id:${id} not found!!`);
                    throwError(post.get('author') != authUser.id, 'Unauthorized! you can only edit your posts!');
                    input.author = authUser.id;
                    return post.update(input, { transaction: t });
                });
            }).catch(handleError);
        }),
        deletePost: compose(...authResolvers)((parent, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post.findById(id).then((post: PostInstance) => {
                    throwError(!post, `Post with id:${id} not found!!`);
                    throwError(post.get('author') != authUser.id, 'Unauthorized! you can only delete your posts!');
                    return post.destroy({ transaction: t }).then(post => !!post);
                });
            }).catch(handleError);
        })
    }
}