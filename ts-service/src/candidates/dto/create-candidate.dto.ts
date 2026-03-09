import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  fullName!: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(160)
  email?: string;
}
