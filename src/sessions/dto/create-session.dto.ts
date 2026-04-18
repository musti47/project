import { IsInt, Min } from 'class-validator';

export class CreateSessionDto {
  @IsInt()
  @Min(1)
  tableId!: number;
}