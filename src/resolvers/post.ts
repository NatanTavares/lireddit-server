import { Arg, Ctx, ID, Int, Mutation, Query, Resolver } from "type-graphql";
import { Field, ObjectType } from "type-graphql";
import { MyContext } from "src/types/myContext";

@ObjectType({ description: "The Post model" })
class Post {
  @Field(() => ID, { description: "The id of the post" })
  id: number;

  @Field({ description: "The title of the post" })
  title: string;

  @Field({ description: "The timestamp of when the post was created" })
  createdAt: Date;

  @Field({ description: "The timestamp of when the post was updated" })
  updatedAt: Date;
}

@Resolver(Post)
export class PostResolver {
  @Query(() => [Post])
  async posts(
    @Arg("perPage", () => Int) perPage: number,
    @Ctx() { prisma }: MyContext
  ): Promise<Post[]> {
    const posts = await prisma.post.findMany({ take: perPage });
    return posts;
  }

  @Query(() => Post, { nullable: true })
  async post(
    @Arg("id", () => Int) id: number,
    @Ctx() { prisma }: MyContext
  ): Promise<Post | null> {
    const post = await prisma.post.findUnique({ where: { id } });
    return post;
  }

  @Mutation(() => Post)
  async createPost(
    @Arg("title") title: string,
    @Ctx() { prisma }: MyContext
  ): Promise<Post> {
    const post = await prisma.post.create({
      data: {
        title,
      },
    });

    return post;
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() { prisma }: MyContext
  ): Promise<Post | null> {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return null;
    }

    if (!!title) {
      const updatedPost = await prisma.post.update({
        where: { id },
        data: { title },
      });

      return updatedPost;
    }

    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { prisma }: MyContext
  ): Promise<boolean> {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return false;
    }

    const deletedPost = await prisma.post.delete({ where: { id } });
    return !!deletedPost;
  }
}
