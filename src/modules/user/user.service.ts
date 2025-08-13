import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IUser } from 'src/models';
import { UserSchemaName } from 'src/models/user.schema';

@Injectable()
export class UserService {
  // eslint-disable-next-line no-unused-vars
  constructor(@InjectModel(UserSchemaName) private readonly userModel: Model<IUser>) {}

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid user ID');
    const user = await this.userModel.findById(id).select('-__v -stats -phone -email').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getByIdFull(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid user ID');
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getCurrentUser(userId: string) {
    return this.getByIdFull(userId);
  }

  async updateCurrentUser(userId: string, updateData: Partial<IUser>) {
    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
      .select('-__v')
      .exec();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findByPhone(phone: string) {
    return this.userModel.findOne({ phone }).exec();
  }
}
