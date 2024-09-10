import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { ValidationPipe } from "../pipes/validation.pipe";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({summary: 'Login as User'})
  @ApiResponse({status: 200})
  @Post('login')
  login(@Body() dto: CreateUserDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({summary: 'Register new User'})
  @ApiResponse({status: 200})
  @UsePipes(ValidationPipe)
  @Post('register')
  register(@Body() dto: CreateUserDto){
    return this.authService.register(dto);
  }
}
