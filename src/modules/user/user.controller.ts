import {
  Controller,
  Get,
  Patch,
  Req,
  Param,
  UseGuards,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/dtos/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface UserJwtPayload {
  userId: string; // userId
  username: string;
}

interface JwtAuthRequest {
  user: UserJwtPayload;
}

@Controller('user')
export class UserController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req: JwtAuthRequest) {
    console.log('Payload JWT reçu fetche me :', req.user);

    if (!req.user?.userId) {
      throw new NotFoundException('JWT invalide : userId manquant');
    }
    // console.log('ID reçu du JWT :', req.user.userId);

    const user = await this.userService.getCurrentUser(req.user.userId);

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateCurrentUser(@Req() req: JwtAuthRequest, @Body() updateData: UpdateUserDto) {
    if (!req.user?.userId) {
      throw new NotFoundException('JWT invalide : userId manquant');
    }

    const user = await this.userService.updateCurrentUser(req.user.userId, updateData);

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  @Get(':id')
  async getUserPublicProfile(@Param('id') id: string) {
    const user = await this.userService.getById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
