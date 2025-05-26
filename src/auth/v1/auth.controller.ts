import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Res,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
// import { UserService } from './user.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { Response, Request } from 'express';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      throw new UnauthorizedException('Refresh token missing');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = this.authService.verifyToken(refreshToken);

    const newAccessToken = this.authService.generateTokenWithExipry(
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        id: payload?.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        email: payload?.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        phone: payload?.email,
        password: '',
      },
      '5m',
    );

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });

    res.send({ message: 'Access token refreshed' });
    return newAccessToken;
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.login(loginUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000, // 5 minutes
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { message: 'Logged in successfully' };
  }
}
