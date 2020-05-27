import { DbConnection } from "../../interfaces/DbConnectionInterface";
import { DataLoaders } from "../../interfaces/DataLoadersInterface";
import * as DataLoader from 'dataloader';
import { PostInstance } from "../../models/PostModel";
import { UserInstance } from "../../models/UserModel";
import { UserLoader } from "./UserLoader";
import { PostLoader } from "./PostLoader.ts";
import { RequestedFields } from "../ast/RequestedFields";
import { DataLoaderParam } from "../../interfaces/DataLoaderParamInterface";

export class DataLoaderFactory {

    constructor(
        private db: DbConnection,
        private requestedFields: RequestedFields
    ) { }

    getLoaders(): DataLoaders {
        return {
            userLoader: new DataLoader<DataLoaderParam<number>, UserInstance>(
                (params: DataLoaderParam<number>[]) => UserLoader.batUsers(this.db.User, params, this.requestedFields),
                { cacheKeyFn: (param: DataLoaderParam<number[]>) => param.key }
            ),
            postLoader: new DataLoader<DataLoaderParam<number>, PostInstance>(
                (params: DataLoaderParam<number>[]) => PostLoader.batPosts(this.db.Post, params, this.requestedFields),
                { cacheKeyFn: (param: DataLoaderParam<number[]>) => param.key }
            )
        };
    }
}

