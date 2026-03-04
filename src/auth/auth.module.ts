import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'haale-secret',
      signOptions: {
        expiresIn: (process.env.jwt_expires_in ?? '7d') as '7d',
      },
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '../../', 'public'),
    // })
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
