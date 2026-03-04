import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(username: string, plainPassword: string): Promise<User> {
    const existing = await this.usersRepo.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException(`Username "${username}" is already taken.`);
    }

    const password = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    const user = this.usersRepo.create({ username, password });
    return this.usersRepo.save(user);
  }

  // ─── Find ────────────────────────────────────────────────────────────────

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  // ─── Validate password ───────────────────────────────────────────────────

  async validatePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
