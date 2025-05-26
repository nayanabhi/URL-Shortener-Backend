import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/v1/user.entity';
import { RegisterUserDto } from './dto/registerUser.dto';
import { ExistingUserDto } from './dto/existingUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  generateTokenWithExipry(loginUserDto: LoginUserDto, expiry: string) {
    return this.jwtService.sign(
      {
        email: loginUserDto?.email,
        userId: loginUserDto?.id,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: `${expiry}`,
      },
    );
  }

  generateToken(loginUserDto: LoginUserDto) {
    const accessToken = this.generateTokenWithExipry(loginUserDto, '5m');
    const refreshToken = this.generateTokenWithExipry(loginUserDto, '7d');
    return { accessToken, refreshToken };
  }

  verifyToken(token: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.jwtService.verify(token, {
      secret: `${process.env.JWT_SECRET}`,
    });
  }

  async register(registerUserDto: RegisterUserDto) {
    this.validateRegisterRequest(registerUserDto);
    const alreadyExistingUser =
      await this.findUserByEmailOrPhone(registerUserDto);
    if (alreadyExistingUser) {
      throw new HttpException(
        'Registration failed: Email or phone number already in use.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const saltRounds = 10;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(
      registerUserDto.password,
      saltRounds,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    registerUserDto.password = hashedPassword;
    await this.userRepo.save(registerUserDto);
  }

  validateRegisterRequest(registerUserDto: RegisterUserDto) {
    if (!registerUserDto.phone) {
      throw new HttpException(
        'Registration failed: Phone number is missing in the request.',
        HttpStatus.BAD_REQUEST,
      );
    } else if (!registerUserDto.email) {
      throw new HttpException(
        'Registration failed: Email is missing in the request.',
        HttpStatus.BAD_REQUEST,
      );
    } else if (!registerUserDto.fullName) {
      throw new HttpException(
        'Registration failed: Full name is missing in the request.',
        HttpStatus.BAD_REQUEST,
      );
    } else if (!registerUserDto.password) {
      throw new HttpException(
        'Registration failed: Password is missing in the request.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const alreadyExistingUser = await this.findUserByEmailOrPhone(loginUserDto);
    if (!alreadyExistingUser) {
      throw new HttpException(
        'Unauthorized access: Email or phone number not found in our records.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const isMatch = await bcrypt.compare(
      loginUserDto?.password,
      alreadyExistingUser?.password,
    );

    if (!isMatch) {
      throw new HttpException(
        'Unauthorized access: Please check your credentials and try again.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    loginUserDto.id = alreadyExistingUser?.id;
    const { accessToken, refreshToken } = this.generateToken(loginUserDto);
    return { accessToken, refreshToken };
  }

  async findUserByEmailOrPhone(
    exitingUserDto: ExistingUserDto,
  ): Promise<User | null> {
    const existingUser = await this.userRepo.findOne({
      where: [
        { email: exitingUserDto?.email },
        { phone: exitingUserDto?.phone },
      ],
    });
    if (!existingUser) {
      return null;
    }
    return existingUser;
  }
}
