import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Project name is required.' })
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  @MaxLength(64, { message: 'Name must be at most 64 characters.' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Name may only contain letters, numbers, hyphens, and underscores.',
  })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Repository URL is required.' })
  @MaxLength(512)
  repoUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  branch?: string;

  @IsInt({ message: 'Port must be an integer.' })
  @Min(1, { message: 'Port must be at least 1.' })
  @Max(65535, { message: 'Port must be at most 65535.' })
  @Type(() => Number)
  port: number;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(64)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  repoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  branch?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  port?: number;
}
