import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
  UsePipes,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { IssuesReportQueryDto } from './dto/issues-report-query.dto';
import { NoticesReportQueryDto } from './dto/notices-report-query.dto';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('issues')
  @ApiOperation({ summary: 'Consultar histórico e métricas de ocorrências e problemas gerais' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getIssuesReport(@Query() query: IssuesReportQueryDto, @Request() req: any) {
    const isPrivileged = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPERVISOR;
    return this.reportsService.getIssuesReport(query, isPrivileged);
  }

  @Get('notices')
  @ApiOperation({ summary: 'Consultar histórico e métricas de avisos e comunicados' })
  @UsePipes(new ValidationPipe({ transform: true }))
  getNoticesReport(@Query() query: NoticesReportQueryDto, @Request() req: any) {
    const isPrivileged = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPERVISOR;
    return this.reportsService.getNoticesReport(query, isPrivileged);
  }
}
