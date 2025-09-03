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

  async getUserStats(userId: string) {
    const user = await this.userModel.findById(userId).select('stats rating').exec();
    if (!user) throw new NotFoundException('User not found');
    return {
      stats: user.stats,
      rating: user.rating,
    };
  }

  async updateStatsAndRating(
    userId: string,
    result: 'win' | 'loss' | 'draw',
    opponentRating: number, // rating de l'adversaire
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // ==================== MISE À JOUR DES STATS ====================
    user.stats.gamesPlayed += 1;
    if (result === 'win') user.stats.wins += 1;
    else if (result === 'loss') user.stats.losses += 1;
    else if (result === 'draw') user.stats.draws += 1;

    // ==================== MISE À JOUR DU RATING ====================
    // On ignore le rating contre l'IA si opponentRating = 0
    if (opponentRating > 0) {
      const K = 32; // facteur K standard pour Elo
      const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - user.rating) / 400));
      let score = 0;
      if (result === 'win') score = 1;
      else if (result === 'draw') score = 0.5;
      else score = 0;

      user.rating = Math.round(user.rating + K * (score - expectedScore));
    }

    await user.save();
  }
}
