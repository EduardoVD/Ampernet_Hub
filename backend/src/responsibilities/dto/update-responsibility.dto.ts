import { PartialType } from '@nestjs/swagger';
import { CreateResponsibilityDto } from './create-responsibility.dto';

export class UpdateResponsibilityDto extends PartialType(CreateResponsibilityDto) {}
