import "reflect-metadata";
import express from "express";
import { buildSchema } from "type-graphql";
import { PrismaClient } from "@prisma/client";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { HelloResolver } from "./resolvers/hello";
import { ApolloServer } from "apollo-server-express";

async function main() {
  const prisma = new PrismaClient();
  const app = express();
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: () => ({ prisma }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("Server started on localhost:4000");
  });
}

main().catch((err) => {
  console.error(err);
});
