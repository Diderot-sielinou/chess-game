/* eslint-disable no-unused-vars */
import {
  Controller,
  Get,
  Patch,
  Req,
  Param,
  UseGuards,
  Body,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/dtos/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service'; // Import the service
import { ImageValidationPipe } from '../../common/middleware/image-validator.pipe';
import { MulterFile } from '../../types/multer-file';
interface UserJwtPayload {
  userId: string; // userId
  username: string;
}

interface JwtAuthRequest {
  user: UserJwtPayload;
}

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService, // Inject the service
  ) {}

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

  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('file')) // 'file' is the field name from the frontend
  async uploadAvatar(
    @Req() req: JwtAuthRequest,
    @UploadedFile(new ImageValidationPipe()) file: MulterFile,
  ) {
    // 1. Upload the file to a specific folder, like 'avatars'
    const result = await this.cloudinaryService.uploadFile(file, 'avatars');

    // 2. Update the user in the database with the new URLs
    const userId = req.user.userId;
    return this.userService.updateAvatar(userId, result.secure_url, result.public_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  async updateStatsAndRating(@Req() req: JwtAuthRequest) {
    return this.userService.updateStatsAndRating(req.user.userId, 'win', 0); // Example values: 'win' and 0
  }

  @Get(':id')
  async getUserPublicProfile(@Param('id') id: string) {
    const user = await this.userService.getById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
