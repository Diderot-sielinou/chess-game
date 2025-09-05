//update-user.dto.ts
import { IsOptional, IsString, IsUrl } from 'class-validator';
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid profile Image URL.' })
  avatarUrl?: string;
}
