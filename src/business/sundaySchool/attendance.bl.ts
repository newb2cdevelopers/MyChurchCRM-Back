import { Injectable, Logger } from '@nestjs/common';
import { SundaySchoolAttendanceProvider } from 'src/providers/sundaySchool/attendance.provider';
import { LevelProvider } from 'src/providers/sundaySchool/level.provider';
import { StudentProvider } from 'src/providers/sundaySchool/student.provider';
import { SundaySchoolClassBusiness } from 'src/business/sundaySchool/class.bl';
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
    private readonly classBusiness: SundaySchoolClassBusiness,
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
    churchId?: string,
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

        // The logged-in teacher can only register attendance for their own
        // levels. The selected teacherId identifies who gave the class and
        // may differ from the logged-in user, so it is validated against the
        // level teachers below instead.
        if (!teacherLevelIds.includes(attendance.levelId)) {
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

    // level.teachers comes populated (full member documents), so each entry
    // is a Mongoose document and its ID lives in `_id`. Falling back to
    // toString() covers raw ObjectIds when the array is not populated.
    // Cast to { _id?: unknown } because the schema types teachers as
    // string[] even though getById populates them.
    const teacherIds = (level.teachers || []).map((teacher) => {
      const populated = teacher as unknown as { _id?: { toString(): string } };
      return populated._id
        ? populated._id.toString()
        : (teacher as unknown as { toString(): string }).toString();
    });

    if (!teacherIds.includes(attendance.teacherId)) {
      response.message =
        'El maestro seleccionado no está asignado a este nivel';

      return response;
    }

    const weekClass = await this.classBusiness.getForAttendanceDate(
      attendance.date,
      churchId,
      attendance.levelId,
    );

    if (!weekClass) {
      response.message =
        'No se ha subido la clase para esta semana. Comuníquese con el coordinador.';

      return response;
    }

    // The official lesson name comes from the class uploaded for the week,
    // regardless of what the teacher may send in the payload.
    attendance.lessonName = weekClass.lessonName;

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
