import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { Transaction } from "sequelize";
import { CommentInstance } from "../../../models/CommentModel";
import { handleError, throwError } from "../../../utils/utils";
import { authResolvers } from "../../composable/auth.resolver";
import { compose } from "../../composable/composable.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

export const commentResolvers = {
    Comment: {
        user: (parent, args, { db, dataloaders: { userLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return userLoader.load({ key: parent.get('user'), info: info }).catch(handleError);
            //return db.User.findById(parent.get('user')).catch(handleError);
        },
        post: (parent, args, { db, dataloaders: { postLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return postLoader.load({ key: parent.get('post'), info: info }).catch(handleError);
            //return db.Post.findById(parent.get('post')).catch(handleError);
        }
    },
    Query: {
        commentsByPost: compose()((parent, { postId, first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            postId = parseInt(postId);
            return context.db.Comment.findAll({
                where: { post: postId },
                limit: first,
                offset: offset,
                attributes: context.requestedFields.getFields(info, { keep: undefined })
            }).catch(handleError);
        })
    },
    Mutation: {
        createComment: compose(...authResolvers)((parent, args, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            args.input.user = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment.create(args.input, { transaction: t });
            }).catch(handleError);
        }),
        updateComment: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment.findById(id).then((comment: CommentInstance) => {
                    throwError(!comment, `Comment with id:${id} not found!!`);
                    throwError(comment.get('user') != authUser.id, 'Unauthorized! you can only edit your comments!');
                    return comment.update(input, { transaction: t });
                });
            }).catch(handleError);
        }),
        deleteComment: compose(...authResolvers)((parent, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment.findById(id).then((comment: CommentInstance) => {
                    throwError(!comment, `Comment with id:${id} not found!!`);
                    throwError(comment.get('user') != authUser.id, 'Unauthorized! you can only delete your comments!');
                    return comment.destroy({ transaction: t }).then(comment => !!comment);
                });
            }).catch(handleError);
        })
    }
}