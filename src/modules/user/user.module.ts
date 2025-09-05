import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, UserSchemaName } from 'src/models';
import { MyLoggerModule } from '../my-logger/my-logger.module';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserSchemaName, schema: UserSchema }]),
    MyLoggerModule,
    CloudinaryModule,
    forwardRef(() => AuthModule), // <-- ici
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
