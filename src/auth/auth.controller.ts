import { BadRequestException, Body, Controller, Post, Res, UseGuards, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { ValidationPipe } from "../pipes/validation.pipe";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";
import { Cookies } from "../decorators/cookie.decorator";
import { toMs } from "ms-typescript";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
              private readonly configService: ConfigService) {}

  @ApiOperation({summary: 'Login as User'})
  @ApiResponse({status: 200})
  @UsePipes(ValidationPipe)
  @Post('login')
  async login(@Body() dto: CreateUserDto,
              @Res({ passthrough: true}) response: Response) {
    const result = await this.authService.login(dto);

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: toMs(this.configService.get<string>('REFRESH_TOKEN_LIFETIME') || '7d'),
    });

    return { access: result.accessToken, deviceId: result.deviceId}
  }

  @ApiOperation({summary: 'Logout'})
  @ApiResponse({status: 200})
  @Post('logout')
  async logout(@Cookies('refreshToken') refreshToken: string,
               @Res({ passthrough: true}) response: Response) {
    if(!refreshToken)
      throw new BadRequestException('Refresh token are required');

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    })

    await this.authService.logout(refreshToken);
    return { message: "Logged out" };
  }

  @ApiOperation({summary: 'Register new User'})
  @ApiResponse({status: 200})
  @UsePipes(ValidationPipe)
  @Post('register')
  async register(@Body() dto: CreateUserDto,
                 @Res({ passthrough: true}) response: Response){
    const result = await this.authService.register(dto);

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: toMs(this.configService.get<string>('REFRESH_TOKEN_LIFETIME') || '7d'),
    });

    return { access: result.accessToken, deviceId: result.deviceId}
  }

  @ApiOperation({summary: 'Refresh tokens'})
  @ApiResponse({status: 200})
  @Post('refresh')
  async refresh(@Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true}) response: Response) {
    if(!refreshToken)
      throw new BadRequestException('Refresh token are required');

    const result = await this.authService.refreshTokens(refreshToken);

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: toMs(this.configService.get<string>('REFRESH_TOKEN_LIFETIME') || '7d'),
    });

    return { access: result.accessToken }
  }
}
