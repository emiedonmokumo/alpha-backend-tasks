import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  storageKey?: string;

  @IsString()
  @IsNotEmpty()
  rawText!: string;
}
