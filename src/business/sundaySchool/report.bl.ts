import { Injectable, Logger } from '@nestjs/common';
import { LevelProvider } from 'src/providers/sundaySchool/level.provider';
import { ChurchProvider } from 'src/providers/churches/church.provider';
import {
  SundaySchoolReportProvider,
  AttendanceReportRow,
} from 'src/providers/sundaySchool/report.provider';
import { AttendanceReportQueryDto } from 'src/schemas/sundaySchool/report.DTO';
import { calculatePagination } from 'src/dtos/pagination.dto';

export interface AttendanceReportResponse {
  summary: {
    totalAttendees: number;
    averagePerSunday: number;
    totalLevels: number;
    totalServices: number;
  };
  byService: { service: string; total: number }[];
  byLevel: { levelId: string; levelName?: string; total: number }[];
  records: AttendanceReportRow[];
  metadata: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
  };
}

@Injectable()
export class SundaySchoolReportBusiness {
  private readonly logger = new Logger(SundaySchoolReportBusiness.name);

  constructor(
    private readonly reportProvider: SundaySchoolReportProvider,
    private readonly levelProvider: LevelProvider,
    private readonly churchProvider: ChurchProvider,
  ) {}

  async getAttendanceReport(
    query: AttendanceReportQueryDto,
    churchId?: string,
  ): Promise<AttendanceReportResponse | null> {
    if (!churchId) {
      return null;
    }

    // The filtered level must belong to the current user church.
    if (query.levelId) {
      const level = await this.levelProvider.getById(query.levelId);

      if (!level || level.churchId.toString() !== churchId) {
        return null;
      }
    }

    const levelIds = await this.levelProvider.getLevelIdsByChurch(churchId);

    if (levelIds.length === 0) {
      return {
        summary: {
          totalAttendees: 0,
          averagePerSunday: 0,
          totalLevels: 0,
          totalServices: 0,
        },
        byService: [],
        byLevel: [],
        records: [],
        metadata: { currentPage: 1, totalPages: 0, totalRecords: 0 },
      };
    }

    const startDate = new Date(`${query.startDate}T00:00:00.000Z`);
    const endDate = new Date(`${query.endDate}T23:59:59.999Z`);

    const result = await this.reportProvider.getAttendanceReport({
      levelIds,
      startDate,
      endDate,
      levelId: query.levelId,
      service: query.service,
      teacherId: query.teacherId,
      page: query.page,
      limit: query.limit,
    });

    const summaryRow = result.summary?.[0];
    const totalAttendees = summaryRow?.totalAttendees ?? 0;
    const totalSundays = summaryRow?.totalSundays ?? 0;

    // Merge the church services so the chart always shows every configured
    // service (e.g. the 3 Sunday services), with 0 when there are no records.
    const church = await this.churchProvider.getById(churchId);
    const churchServices = (church?.services || []).map(
      (svc) => `${svc.day} ${svc.time}`,
    );
    const byServiceMap = new Map(
      (result.byService || []).map((entry) => [entry.service, entry.total]),
    );
    const byService = churchServices.map((service) => ({
      service,
      total: byServiceMap.get(service) ?? 0,
    }));

    // Merge the church levels so the chart always shows every level (with 0
    // when there are no records), consistent with byService.
    const levels = await this.levelProvider.getAllByChurch(churchId);
    const byLevelMap = new Map(
      (result.byLevel || []).map((entry) => [
        entry.levelId.toString(),
        entry.total,
      ]),
    );
    const byLevel = levels.map((level) => ({
      levelId: level._id.toString(),
      levelName: level.name,
      total: byLevelMap.get(level._id.toString()) ?? 0,
    }));

    this.logger.log(
      `[getAttendanceReport] church=${churchId} range=${query.startDate}..${query.endDate} attendees=${totalAttendees}`,
    );

    const { page: currentPage, limit: pageSize } = calculatePagination({
      page: query.page,
      limit: query.limit,
    });
    const totalPages = Math.ceil(result.totalRecords / pageSize);

    return {
      summary: {
        totalAttendees,
        averagePerSunday:
          totalSundays > 0 ? Math.round(totalAttendees / totalSundays) : 0,
        totalLevels: summaryRow?.totalLevels ?? 0,
        totalServices: summaryRow?.totalServices ?? 0,
      },
      byService,
      byLevel,
      records: result.records || [],
      metadata: {
        currentPage,
        totalPages,
        totalRecords: result.totalRecords,
      },
    };
  }
}
