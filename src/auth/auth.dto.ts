import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required.' })
  @MinLength(3, { message: 'Username must be at least 3 characters.' })
  @MaxLength(32, { message: 'Username must be at most 32 characters.' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username may only contain letters, numbers, hyphens, and underscores.',
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  @MaxLength(72, { message: 'Password must be at most 72 characters.' })
  password: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required.' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
