//Português - Importa o "PartialType" do pacote Swagger para manter a documentação de campos opcionais.
import { PartialType } from '@nestjs/swagger';
import { CreateNoticeDto } from './create-notice.dto';

//Português - Herda todos os campos do "CreateNoticeDto" como opcionais para atualizações parciais.
export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {}