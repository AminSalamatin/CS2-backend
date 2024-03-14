/* eslint-disable node/no-extraneous-import */
require('dotenv').config();
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {ApolloServer} from '@apollo/server';
import {expressMiddleware} from '@apollo/server/express4';
import typeDefs from './api/schemas/index';
import resolvers from './api/resolvers/index';
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';
import {notFound, errorHandler} from './middlewares';
import authenticate from './functions/authenticate';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {applyMiddleware} from 'graphql-middleware';
import {MyContext} from './types/MyContext';
//import {GraphQLError} from 'graphql';

import {createRateLimitRule} from 'graphql-rate-limit';
import {shield, and, rule} from 'graphql-shield';

const app = express();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

(async () => {
  try {
    const rateLimitRule = createRateLimitRule({
      identifyContext: (ctx) => ctx.id,
    });

    const isPublic = rule()(() => true);

    const permissions = shield({
      Query: {
        // HLTV
        getStreams: and(rateLimitRule({max: 5, window: '1m'}), isPublic),
        getTeamRanking: and(rateLimitRule({max: 3, window: '1m'}), isPublic),
        getTeam: and(rateLimitRule({max: 10, window: '1m'}), isPublic),
        getPlayerRanking: and(rateLimitRule({max: 3, window: '1m'}), isPublic),
        getPlayer: and(rateLimitRule({max: 10, window: '1m'}), isPublic),
        getEvents: and(rateLimitRule({max: 5, window: '1m'}), isPublic),
        getEvent: and(rateLimitRule({max: 10, window: '1m'}), isPublic),
        getNews: and(rateLimitRule({max: 5, window: '1m'}), isPublic),
        getEventByName: and(rateLimitRule({max: 10, window: '1m'}), isPublic),
        getTeamByName: and(rateLimitRule({max: 10, window: '1m'}), isPublic),
        getPlayerByName: and(rateLimitRule({max: 10, window: '1m'}), isPublic),

        // Forum
        getPosts: and(rateLimitRule({max: 5, window: '1m'}), isPublic),
        postById: and(rateLimitRule({max: 10, window: '1m'}), isPublic),

        // User
        users: and(rateLimitRule({max: 5, window: '1m'}), isPublic),
        userById: and(rateLimitRule({max: 10, window: '1m'}), isPublic),
        checkToken: and(rateLimitRule({max: 1, window: '1s'}), isPublic),
      },
      Mutation: {
        // Forum
        createPost: and(rateLimitRule({max: 2, window: '1m'}), isPublic),
        createComment: and(rateLimitRule({max: 3, window: '1m'}), isPublic),
        deletePost: and(rateLimitRule({max: 2, window: '1m'}), isPublic),
        deleteComment: and(rateLimitRule({max: 3, window: '1m'}), isPublic),

        // User
        login: and(rateLimitRule({max: 5, window: '1m'}), isPublic),
        register: and(rateLimitRule({max: 5, window: '1m'}), isPublic),
        updateUser: and(rateLimitRule({max: 5, window: '1m'}), isPublic),
        deleteUser: and(rateLimitRule({max: 5, window: '1m'}), isPublic),
      },
    });

    const schema = applyMiddleware(
      makeExecutableSchema({
        typeDefs,
        resolvers,
      }),
      permissions,
    );

    const server = new ApolloServer<MyContext>({
      schema,
      introspection: true,
      plugins: [
        process.env.NODE_ENV === 'production'
          ? ApolloServerPluginLandingPageProductionDefault({
              embed: true as false,
            })
          : ApolloServerPluginLandingPageLocalDefault(),
      ],
      includeStacktraceInErrorResponses: false,
    });
    await server.start();

    app.use(
      '/graphql',
      cors<cors.CorsRequest>(),
      express.json(),
      expressMiddleware(server, {
        context: async ({req}) => authenticate(req),
      }),
    );

    app.use(notFound);
    app.use(errorHandler);
  } catch (error) {
    console.log(error);
  }
})();

export default app;
