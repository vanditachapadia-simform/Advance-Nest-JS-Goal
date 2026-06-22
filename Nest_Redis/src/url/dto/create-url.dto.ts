import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({
    description: 'The long URL to shorten',
    example: 'https://nestjs.com/documentation',
  })
  @IsNotEmpty()
  @IsUrl({ require_protocol: true }, { message: 'url must be a valid URL including http(s)://' })
  url: string;
}
