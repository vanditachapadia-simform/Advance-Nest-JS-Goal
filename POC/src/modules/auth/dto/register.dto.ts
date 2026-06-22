import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/** Public self-registration. Always provisions a base USER role server-side. */
export class RegisterDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
