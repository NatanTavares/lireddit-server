import { Field, ObjectType, Query } from "type-graphql";
import { MyContext } from "src/types/myContext";
import argon2 from "argon2";
import { Arg, Ctx, ID, InputType, Mutation, Resolver } from "type-graphql";

@InputType()
class ParamsRegister {
  @Field({ description: "Complete the field with the user's name" })
  username: string;
  @Field({ description: "Fill in the field with a valid password" })
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType({ description: "The user model" })
class User {
  @Field(() => ID, { description: "The user id" })
  id: number;

  @Field({ description: "The user name" })
  username: string;

  // @Field({ description: "The user password" })
  // password: string;

  @Field({ description: "The timestamp of when the user was created" })
  createdAt: Date;

  @Field({ description: "The timestamp of when the user was updated" })
  updatedAt: Date;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @Query(() => UserResponse, { nullable: true })
  async me(@Ctx() { prisma, req }: MyContext): Promise<UserResponse> {
    const id = req.session.userId;
    if (!id) {
      return {
        errors: [
          {
            field: "Logged out",
            message: "You need to be logged in to make this request",
          },
        ],
      };
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return {
        errors: [
          {
            field: "Non-existent user",
            message: "This user is not in our database",
          },
        ],
      };
    }

    return { user };
  }

  @Mutation(() => UserResponse)
  async registerUser(
    @Arg("credentials", () => ParamsRegister) credentials: ParamsRegister,
    @Ctx() { prisma, req }: MyContext
  ): Promise<UserResponse> {
    if (credentials.username.trim().length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "Length must be greater than 2",
          },
        ],
      };
    }

    if (credentials.password.trim().length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "Length must be greater than 2",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(credentials.password.trim());
    try {
      const user = await prisma.user.create({
        data: {
          username: credentials.username.trim(),
          password: hashedPassword,
        },
      });

      req.session.userId = user.id;
      return { user };
    } catch (err) {
      if (err.message.includes("Unique constraint failed")) {
        // duplicate username error
        return {
          errors: [
            {
              field: "username",
              message: "Username not available",
            },
          ],
        };
      }

      return {
        errors: [
          {
            field: err.meta.target,
            message: err.message,
          },
        ],
      };
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("credentials", () => ParamsRegister) credentials: ParamsRegister,
    @Ctx() { prisma, req }: MyContext
  ): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: {
        username: credentials.username,
      },
    });

    if (!user) {
      return {
        errors: [{ field: "username", message: "That username doesn't exist" }],
      };
    }

    const valid = await argon2.verify(user.password, credentials.password);
    if (!valid) {
      return {
        errors: [{ field: "password", message: "Incorrect password" }],
      };
    }

    req.session.userId = user.id;

    return { user };
  }
}
