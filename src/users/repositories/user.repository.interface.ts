import { BaseRepositoryInterface } from '../../common/repositories/base.repository.interface';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

export interface UserRepositoryInterface extends BaseRepositoryInterface<User> {
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  createUser(createUserDto: CreateUserDto): Promise<User>;
  updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User>;
  createOrUpdateGoogleUser(profile: any): Promise<User>;
}
