import { User } from "../entities/User";
import { Resolver, Mutation, Arg } from "type-graphql";
import argon2 from "argon2";
import { UserMutationResponse } from "../types/UserMutationResponse";
import { RegisterInput } from "../types/RegisterInput";
import { validateRegisterInput } from "../utils/validateRegisterInput";

@Resolver()
export class UserResolver {
  @Mutation((_returns) => UserMutationResponse)
  async register(
    @Arg("registerInput") registerInput: RegisterInput
  ): Promise<UserMutationResponse> {
    const validateRegisterInputErrors = validateRegisterInput(registerInput);
    if (validateRegisterInputErrors !== null)
      return { code: 400, success: false, ...validateRegisterInputErrors };

    try {
      const { username, email, password } = registerInput;
      const userExist = await User.findOne({
        where: [{ username }, { email }],
      });
      if (userExist) {
        return {
          code: 400,
          success: false,
          message: "Duplicated username or email",
          errors: [
            {
              field: userExist.username === username ? "username" : "email",
              message: `${
                userExist.username === username ? "Username" : "Email"
              } already taken.`,
            },
          ],
        };
      }

      const hashedPassword = await argon2.hash(password);

      const newUser = User.create({
        username,
        email,
        password: hashedPassword,
      });

      return {
        code: 200,
        success: true,
        message: "User registration successful",
        user: await User.save(newUser),
      };
    } catch (error) {
      return {
        code: 500,
        success: false,
        message: `Inernal server error ${error.message}`,
      };
    }
  }
}
