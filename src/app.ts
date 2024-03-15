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
import {shield, and} from 'graphql-shield';

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

    const permissions = shield({
      Query: {
        // HLTV
        getStreams: and(rateLimitRule({max: 5, window: '1m'})),
        getTeamRanking: and(rateLimitRule({max: 3, window: '1m'})),
        getTeam: and(rateLimitRule({max: 10, window: '1m'})),
        getPlayerRanking: and(rateLimitRule({max: 3, window: '1m'})),
        getPlayer: and(rateLimitRule({max: 10, window: '1m'})),
        getEvents: and(rateLimitRule({max: 5, window: '1m'})),
        getEvent: and(rateLimitRule({max: 10, window: '1m'})),
        getNews: and(rateLimitRule({max: 5, window: '1m'})),
        getEventByName: and(rateLimitRule({max: 10, window: '1m'})),
        getTeamByName: and(rateLimitRule({max: 10, window: '1m'})),
        getPlayerByName: and(rateLimitRule({max: 10, window: '1m'})),

        // Forum
        getPosts: and(rateLimitRule({max: 5, window: '1m'})),
        postById: and(rateLimitRule({max: 10, window: '1m'})),

        // User
        users: and(rateLimitRule({max: 5, window: '1m'})),
        userById: and(rateLimitRule({max: 10, window: '1m'})),
        checkToken: and(rateLimitRule({max: 1, window: '1s'})),
      },
      Mutation: {
        // Forum
        createPost: and(rateLimitRule({max: 2, window: '1m'})),
        createComment: and(rateLimitRule({max: 3, window: '1m'})),
        deletePost: and(rateLimitRule({max: 2, window: '1m'})),
        deleteComment: and(rateLimitRule({max: 3, window: '1m'})),

        // User
        login: and(rateLimitRule({max: 5, window: '1m'})),
        register: and(rateLimitRule({max: 5, window: '1m'})),
        updateUser: and(rateLimitRule({max: 5, window: '1m'})),
        deleteUser: and(rateLimitRule({max: 5, window: '1m'})),
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
