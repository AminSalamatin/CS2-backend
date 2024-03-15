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

//import {createRateLimitRule} from 'graphql-rate-limit';
//import {shield} from 'graphql-shield';

const app = express();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

(async () => {
  try {
    /*
    const rateLimitRule = createRateLimitRule({
      identifyContext: (ctx) => ctx.id,
    });

    const permissions = shield({
      Query: {
        // HLTV
        getStreams: rateLimitRule({max: 5, window: '1m'}),
        getTeamRanking: rateLimitRule({max: 3, window: '1m'}),
        getTeam: rateLimitRule({max: 10, window: '1m'}),
        getPlayerRanking: rateLimitRule({max: 3, window: '1m'}),
        getPlayer: rateLimitRule({max: 10, window: '1m'}),
        getEvents: rateLimitRule({max: 5, window: '1m'}),
        getEvent: rateLimitRule({max: 10, window: '1m'}),
        getNews: rateLimitRule({max: 5, window: '1m'}),
        getEventByName: rateLimitRule({max: 10, window: '1m'}),
        getTeamByName: rateLimitRule({max: 10, window: '1m'}),
        getPlayerByName: rateLimitRule({max: 10, window: '1m'}),

        // Forum
        getPosts: rateLimitRule({max: 5, window: '1m'}),
        postById: rateLimitRule({max: 10, window: '1m'}),

        // User
        users: rateLimitRule({max: 5, window: '1m'}),
        userById: rateLimitRule({max: 10, window: '1m'}),
        checkToken: rateLimitRule({max: 1, window: '1s'}),
      },
      Mutation: {
        // Forum
        createPost: rateLimitRule({max: 2, window: '1m'}),
        createComment: rateLimitRule({max: 3, window: '1m'}),
        deletePost: rateLimitRule({max: 2, window: '1m'}),
        deleteComment: rateLimitRule({max: 3, window: '1m'}),

        // User
        login: rateLimitRule({max: 5, window: '1m'}),
        register: rateLimitRule({max: 5, window: '1m'}),
        updateUser: rateLimitRule({max: 5, window: '1m'}),
        deleteUser: rateLimitRule({max: 5, window: '1m'}),
      },
    });
    */

    const schema = applyMiddleware(
      makeExecutableSchema({
        typeDefs,
        resolvers,
      }),
      //permissions,
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
