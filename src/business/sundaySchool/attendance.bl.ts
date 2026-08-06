import { Injectable, Logger } from '@nestjs/common';
import { SundaySchoolAttendanceProvider } from 'src/providers/sundaySchool/attendance.provider';
import { LevelProvider } from 'src/providers/sundaySchool/level.provider';
import { StudentProvider } from 'src/providers/sundaySchool/student.provider';
import { RegisterAttendanceDto } from 'src/schemas/sundaySchool/attendance.DTO';
import { SundaySchoolAttendance } from 'src/schemas/sundaySchool/attendance.schema';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

const MAESTRO_ROLE = 'Maestro Escuela Dominical';

@Injectable()
export class AttendanceBusiness {
  private readonly logger = new Logger(AttendanceBusiness.name);

  constructor(
    private readonly provider: SundaySchoolAttendanceProvider,
    private readonly levelProvider: LevelProvider,
    private readonly studentProvider: StudentProvider,
  ) {}

  async getByLevel(
    levelId: string,
    userId?: string,
  ): Promise<SundaySchoolAttendance[]> {
    if (userId) {
      const { roleNames, memberId } = await this.levelProvider.getUserScopeInfo(
        userId,
      );

      if (roleNames.includes(MAESTRO_ROLE) && memberId) {
        const teacherLevelIds = await this.levelProvider.getLevelIdsByTeacher(
          memberId,
        );

        if (!teacherLevelIds.includes(levelId)) {
          return [];
        }
      }
    }

    return this.provider.getByLevel(levelId);
  }

  async register(
    attendance: RegisterAttendanceDto,
    userId?: string,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    if (userId) {
      const { roleNames, memberId } = await this.levelProvider.getUserScopeInfo(
        userId,
      );

      if (roleNames.includes(MAESTRO_ROLE) && memberId) {
        const teacherLevelIds = await this.levelProvider.getLevelIdsByTeacher(
          memberId,
        );

        if (
          attendance.teacherId !== memberId ||
          !teacherLevelIds.includes(attendance.levelId)
        ) {
          response.message =
            'Solo puedes registrar la asistencia de tus niveles asignados';

          return response;
        }
      }
    }

    const level = await this.levelProvider.getById(attendance.levelId);

    if (!level) {
      response.message = 'El nivel seleccionado no es válido';

      return response;
    }

    const teacherIds = (level.teachers || []).map((teacher) =>
      teacher.toString(),
    );

    if (!teacherIds.includes(attendance.teacherId)) {
      response.message =
        'El maestro seleccionado no está asignado a este nivel';

      return response;
    }

    if (attendance.studentsAttendance?.length) {
      const levelStudents = await this.studentProvider.getByLevel(
        attendance.levelId,
      );
      const levelStudentIds = levelStudents.map((student) =>
        student._id.toString(),
      );
      const comingStudentIds = attendance.studentsAttendance.map(
        (entry) => entry.studentId,
      );

      if (
        !comingStudentIds.every((studentId) =>
          levelStudentIds.includes(studentId),
        )
      ) {
        response.message = 'Algunos estudiantes no pertenecen a este nivel';

        return response;
      }
    }

    const existingAttendance = await this.provider.findByLevelAndDate(
      attendance.levelId,
      attendance.date,
    );

    if (existingAttendance) {
      response.data = await this.provider.updateByLevelAndDate(
        attendance.levelId,
        attendance.date,
        attendance,
      );
    } else {
      response.data = await this.provider.create(attendance);
    }

    response.isSuccessful = true;

    return response;
  }
}
