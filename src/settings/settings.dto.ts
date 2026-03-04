import { IsString, IsBoolean, IsOptional, IsEmail, MaxLength, Matches } from 'class-validator';

const HOSTNAME_OR_IP = /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/;

export class UpdateHaaleSettingsDto {
  @IsString() @IsOptional() @MaxLength(253)
  @Matches(HOSTNAME_OR_IP, { message: 'Enter a valid domain or IP address.' })
  serverDomain?: string;

  @IsBoolean() @IsOptional()
  isSubdomain?: boolean;

  @IsString() @IsOptional() @MaxLength(45)
  publicIp?: string;

  @IsBoolean() @IsOptional()
  httpsEnabled?: boolean;

  @IsEmail({}, { message: 'Enter a valid email address.' }) @IsOptional()
  certEmail?: string;

  @IsBoolean() @IsOptional()
  forceHttps?: boolean;

  @IsBoolean() @IsOptional()
  wwwRedirect?: boolean;
}

export class ProvisionDomainDto {
  @IsBoolean() @IsOptional()
  dryRun?: boolean;
}
