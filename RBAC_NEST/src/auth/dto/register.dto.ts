import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please enter the valid email address' })
  @IsNotEmpty({ message: 'email is not provided' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  public email: string;

  @IsString()
  @IsNotEmpty({ message: 'password is not provided' })
  @MinLength(8, { message: 'password must be at least 8 characters' })
  public password: string;

  @IsNumber()
  @IsNotEmpty({ message: 'role id is not provided' })
  public role_id: number;
}
