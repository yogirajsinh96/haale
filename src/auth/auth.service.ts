import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────

  async register(username: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.create(username, password);
    return this.buildResponse(user);
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  async login(username: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const valid = await this.usersService.validatePassword(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.buildResponse(user);
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  private buildResponse(user: User): AuthResponse {
    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);
    return {
      token,
      user: { id: user.id, username: user.username },
    };
  }
}
