import "reflect-metadata";
import cors from "cors";
import redis from "redis";
import express from "express";
import session from "express-session";
import connectRedis from "connect-redis";
import { buildSchema } from "type-graphql";
import { MyContext } from "./types/myContext";
import { PrismaClient } from "@prisma/client";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { ApolloServer } from "apollo-server-express";

async function main() {
  const prisma = new PrismaClient();

  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: "qid",
      // name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", //csrf
        // secure: true // cookie only works in http
        secure: false,
      },
      saveUninitialized: false,
      secret: "kfjwelkfewlkmfçakdpifeowrnk",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ prisma, req, res }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    console.log("Server started on localhost:4000");
  });
}

main().catch((err) => {
  console.error(err);
});
