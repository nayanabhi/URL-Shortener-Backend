import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/v1/user.entity';
import { RegisterUserDto } from './dto/registerUser.dto';
import { ExistingUserDto } from './dto/existingUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  generateToken(loginUserDto: LoginUserDto) {
    return this.jwtService.sign({ email: loginUserDto?.email });
  }

  verifyToken(token: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.jwtService.verify(token);
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
    if (loginUserDto.password !== alreadyExistingUser.password) {
      throw new HttpException(
        'Unauthorized access: Please check your credentials and try again.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.generateToken(loginUserDto);
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
