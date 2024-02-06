import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User, Bookmark } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDto) {
    // generate password hash
    const hash = await argon.hash(dto.password);
    // save the new user in the db
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
        //   select : {
        //     id: true,
        //     email: true,
        //     createAt : true
        //   }
      });
      delete user.hash;
      return user;
    } catch (error) {
      if (
        error instanceof
        PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'Email utilizado',
          );
        }
      }
    }
    // return the saved user
    // return {msg: 'I am singup'}
  }

  async signin(dto: AuthDto) {
    // find user by email
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });
    // if user does not exist throw execption
    if (!user)
      throw new ForbiddenException(
        'Credentials Incorret',
      );
    // compare password
    const pwMatches = await argon.verify(
      user.hash,
      dto.password,
    );

    // if password incorrect throw execption
    if (!pwMatches)
      throw new ForbiddenException(
        'Wrong Password',
      );

    // send back the user
    delete user.hash;
    return { user };
    // return { msg: 'I am singin' };
  }

  infodata() {
    return { Data: new Date().getTime() };
  }
}
