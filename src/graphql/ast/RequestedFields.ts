import { GraphQLResolveInfo, graphql } from "graphql";
import * as graphqlFields from 'graphql-fields';
import { difference, union } from 'lodash';

export class RequestedFields {

    getFields(info: GraphQLResolveInfo, options?: { keep?: string[], exclude?: string[] }): string[] {
        let fields: string[] = Object.keys(graphqlFields(info));
        if (!options) { return fields; }

        // verifica e junta campos adicionais ao array
        fields = (options.keep) ? union<string>(fields, options.keep) : fields;

        // verifica para casos de exclude se nao tiver na tabela esses campos
        fields = (options.exclude) ? difference<string>(fields, options.exclude) : fields;

        return fields;
    }

}