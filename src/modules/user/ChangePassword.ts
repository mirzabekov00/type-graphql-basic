import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { User } from "./../../entity/User";
import { redis } from "./../../redis";
import { forgotPasswordPrefix } from "./constants/redisPrefixes";
import { ChangePasswordInput } from "./changePassword/ChangePasswordInput";
import { hash } from "bcryptjs";
import { MyContext } from "@main/types/MyContext";

@Resolver()
export class ChangePasswordResolver {
  @Mutation(() => User, { nullable: true })
  async changePassword(
    @Arg("data") { token, password }: ChangePasswordInput,
    @Ctx() ctx: MyContext
  ): Promise<User | null> {
    const userId = await redis.get(forgotPasswordPrefix + token);

    if (!userId) {
      return null;
    }

    const user = await User.findOne(userId);

    if (!user) {
      return null;
    }

    await redis.del(forgotPasswordPrefix + token);

    user.password = await hash(password, 10);

    await user.save();

    (ctx.req.session as any).userId = user.id;

    return user;
  }
}