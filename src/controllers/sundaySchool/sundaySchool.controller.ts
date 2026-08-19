import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AuthGuard } from 'src/modules/auth/auth.guard';
import { PermissionGuard } from 'src/modules/auth/permission.guard';
import { Permission } from 'src/modules/auth/permission.decorator';
import { Auth } from 'src/modules/auth/auth.decorator';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';

import { LevelBusiness } from 'src/business/sundaySchool/level.bl';
import { StudentBusiness } from 'src/business/sundaySchool/student.bl';
import { AttendanceBusiness } from 'src/business/sundaySchool/attendance.bl';
import { SundaySchoolClassBusiness } from 'src/business/sundaySchool/class.bl';

import { CreateLevelDto, UpdateLevelDto } from 'src/schemas/level/level.DTO';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from 'src/schemas/student/student.DTO';
import { RegisterAttendanceDto } from 'src/schemas/sundaySchool/attendance.DTO';
import {
  CreateClassDto,
  UpdateClassDto,
} from 'src/schemas/sundaySchool/class.DTO';

import { GeneralResponse } from 'src/dtos/genericResponse.dto';

interface ClassUploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@ApiTags('Sunday School')
@Controller('sundaySchool')
export class SundaySchoolController {
  constructor(
    private readonly levelBusiness: LevelBusiness,
    private readonly studentBusiness: StudentBusiness,
    private readonly attendanceBusiness: AttendanceBusiness,
    private readonly classBusiness: SundaySchoolClassBusiness,
  ) {}

  // ------------------- LEVELS -------------------

  @UseGuards(AuthGuard)
  @Get('level')
  @ApiOperation({
    summary: 'Get levels of the current user church',
    description:
      'Returns the Sunday School levels of the church resolved from the JWT, optionally filtered by name search. Teachers only see the levels they are assigned to.',
  })
  @ApiOkResponse({
    description: 'List of levels',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          name: 'Párvulos',
          minAge: 3,
          maxAge: 5,
          teachers: [{ _id: '123', fullName: 'Carlos Mario' }],
          churchId: '679d017daf1fff94edac0c1a',
        },
      ],
    },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by level name',
  })
  async getAllLevels(
    @Query('search') search?: string,
    @Auth() user?: JWTPayload,
  ) {
    return this.levelBusiness.getAllByChurch(
      user?.churchId,
      search,
      user?.userId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('level/:id')
  @ApiOperation({ summary: 'Get level by ID' })
  @ApiOkResponse({ description: 'Level details' })
  @ApiBadRequestResponse({ description: 'Invalid level ID' })
  @ApiParam({ name: 'id', required: true, description: 'Level ID' })
  async getLevelById(@Param('id') id: string, @Auth() user?: JWTPayload) {
    return this.levelBusiness.getById(id, user?.userId);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-levels', 'create_level')
  @Post('level')
  @ApiOperation({
    summary: 'Create a Sunday School level',
    description:
      'Creates a new level. The church is resolved from the JWT token.',
  })
  @ApiCreatedResponse({
    description: 'Level created successfully',
    schema: {
      example: { isSuccessful: true, data: { _id: '123', name: 'Párvulos' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'Duplicate name or invalid ages',
    schema: {
      example: {
        isSuccessful: false,
        message: 'Ya existe un nivel con este nombre en la iglesia',
      },
    },
  })
  @ApiBody({ type: CreateLevelDto })
  async createLevel(
    @Body() level: CreateLevelDto,
    @Auth() user?: JWTPayload,
  ): Promise<GeneralResponse> {
    return this.levelBusiness.create(level, user?.churchId);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-levels', 'edit_level')
  @Put('level/:id')
  @ApiOperation({ summary: 'Update a Sunday School level' })
  @ApiOkResponse({
    description: 'Level updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: { _id: '123', name: 'Párvulos', minAge: 3, maxAge: 5 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid level ID or duplicate name',
    schema: {
      example: { isSuccessful: false, message: 'El nivel no es válido' },
    },
  })
  @ApiParam({ name: 'id', required: true, description: 'Level ID' })
  @ApiBody({ type: UpdateLevelDto })
  async updateLevel(
    @Param('id') id: string,
    @Body() level: UpdateLevelDto,
  ): Promise<GeneralResponse> {
    return this.levelBusiness.update(id, level);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-levels', 'delete_level')
  @Delete('level/:id')
  @ApiOperation({ summary: 'Delete a Sunday School level' })
  @ApiOkResponse({
    description: 'Level deleted successfully',
    schema: {
      example: {
        isSuccessful: true,
        message: 'Nivel eliminado correctamente',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Level has students assigned',
    schema: {
      example: {
        isSuccessful: false,
        message:
          'No se puede eliminar el nivel porque tiene estudiantes asignados',
      },
    },
  })
  @ApiParam({ name: 'id', required: true, description: 'Level ID' })
  async deleteLevel(@Param('id') id: string): Promise<GeneralResponse> {
    return this.levelBusiness.remove(id);
  }

  // ------------------- STUDENTS -------------------

  @UseGuards(AuthGuard)
  @Get('student')
  @ApiOperation({
    summary: 'Get students of the current user church',
    description:
      'Returns a paginated list of Sunday School students of the church resolved from the JWT. Supports filtering by level and search, plus pagination. Teachers only see students of the levels they are assigned to.',
  })
  @ApiOkResponse({
    description: 'Paginated list of students',
    schema: {
      example: {
        data: [
          {
            _id: '679d017daf1fff94edac0c1a',
            name: 'Valentina',
            lastName: 'Pérez',
            documentNumber: '1053847291',
            levelId: { _id: '123', name: 'Párvulos' },
          },
        ],
        metadata: { currentPage: 1, totalPages: 2, totalRecords: 15 },
      },
    },
  })
  @ApiQuery({
    name: 'levelId',
    required: false,
    description: 'Filter by level ID',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, lastName or documentNumber',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 100)',
  })
  async getAllStudents(
    @Query('levelId') levelId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Auth() user?: JWTPayload,
  ) {
    return this.studentBusiness.getAll(
      user?.churchId,
      levelId,
      search,
      page,
      limit,
      user?.userId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('student/:id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiOkResponse({ description: 'Student details' })
  @ApiBadRequestResponse({ description: 'Invalid student ID' })
  @ApiParam({ name: 'id', required: true, description: 'Student ID' })
  async getStudentById(@Param('id') id: string, @Auth() user?: JWTPayload) {
    return this.studentBusiness.getById(id, user?.userId);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-students', 'create_student')
  @Post('student')
  @ApiOperation({
    summary: 'Create a Sunday School student',
    description:
      'Creates a new student. The church is resolved from the JWT token.',
  })
  @ApiCreatedResponse({
    description: 'Student created successfully',
    schema: {
      example: { isSuccessful: true, data: { _id: '123', name: 'Valentina' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid level or duplicate document',
    schema: {
      example: {
        isSuccessful: false,
        message: 'Ya existe un estudiante con este número de documento',
      },
    },
  })
  @ApiBody({ type: CreateStudentDto })
  async createStudent(
    @Body() student: CreateStudentDto,
    @Auth() user?: JWTPayload,
  ): Promise<GeneralResponse> {
    return this.studentBusiness.create(student, user?.churchId);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-students', 'edit_student')
  @Put('student/:id')
  @ApiOperation({ summary: 'Update a Sunday School student' })
  @ApiOkResponse({
    description: 'Student updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: { _id: '123', name: 'Valentina', lastName: 'Pérez' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid student ID, level or duplicate document',
    schema: {
      example: { isSuccessful: false, message: 'El estudiante no es válido' },
    },
  })
  @ApiParam({ name: 'id', required: true, description: 'Student ID' })
  @ApiBody({ type: UpdateStudentDto })
  async updateStudent(
    @Param('id') id: string,
    @Body() student: UpdateStudentDto,
  ): Promise<GeneralResponse> {
    return this.studentBusiness.update(id, student);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-students', 'delete_student')
  @Delete('student/:id')
  @ApiOperation({ summary: 'Delete a Sunday School student' })
  @ApiOkResponse({
    description: 'Student deleted successfully',
    schema: {
      example: {
        isSuccessful: true,
        message: 'Estudiante eliminado correctamente',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid student ID' })
  @ApiParam({ name: 'id', required: true, description: 'Student ID' })
  async deleteStudent(@Param('id') id: string): Promise<GeneralResponse> {
    return this.studentBusiness.remove(id);
  }

  // ------------------- ATTENDANCE -------------------

  @UseGuards(AuthGuard)
  @Get('attendance/:levelId')
  @ApiOperation({
    summary: 'Get attendance records of a level',
    description:
      'Returns all attendance records of a Sunday School level, sorted by date descending. Teachers only see records of the levels they are assigned to.',
  })
  @ApiOkResponse({
    description: 'Attendance records',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          date: '2025-08-27',
          lessonName: 'Lección 5',
          teacherId: '679d017daf1fff94edac0c1a',
          studentsAttendance: [{ studentId: 'abc123', hasAttended: true }],
          levelId: '679d017daf1fff94edac0c1a',
          comments: 'Todos asistieron',
        },
      ],
    },
  })
  @ApiBadRequestResponse({ description: 'No attendance records found' })
  @ApiParam({ name: 'levelId', required: true, description: 'Level ID' })
  async getAttendanceByLevel(
    @Param('levelId') levelId: string,
    @Auth() user?: JWTPayload,
  ) {
    return this.attendanceBusiness.getByLevel(levelId, user?.userId);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-levels', 'register_attendance')
  @Post('registerAttendance')
  @ApiOperation({
    summary: 'Register or update attendance',
    description:
      'Creates a new attendance record or updates the existing one matched by levelId + date. Teachers can only register attendance for the levels they are assigned to.',
  })
  @ApiCreatedResponse({
    description: 'Attendance registered successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: {
          _id: '679d017daf1fff94edac0c1a',
          date: '2025-08-27',
          lessonName: 'Lección 5',
          levelId: '679d017daf1fff94edac0c1a',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid level, teacher or students',
    schema: {
      example: {
        isSuccessful: false,
        message: 'Algunos estudiantes no pertenecen a este nivel',
      },
    },
  })
  @ApiBody({ type: RegisterAttendanceDto })
  async registerAttendance(
    @Body() attendance: RegisterAttendanceDto,
    @Auth() user?: JWTPayload,
  ): Promise<GeneralResponse> {
    return this.attendanceBusiness.register(
      attendance,
      user?.userId,
      user?.churchId,
    );
  }

  // ------------------- CLASSES -------------------

  @UseGuards(AuthGuard)
  @Get('class')
  @ApiOperation({
    summary: 'Get classes of the current user church',
    description:
      'Returns a paginated list of Sunday School classes of the church resolved from the JWT, optionally filtered by level.',
  })
  @ApiOkResponse({
    description: 'Paginated list of classes',
    schema: {
      example: {
        data: [
          {
            _id: '679d017daf1fff94edac0c1a',
            lessonName: 'Lección 5',
            pdfUrl: 'https://res.cloudinary.com/.../class.pdf',
            levelIds: [{ _id: '123', name: 'Párvulos' }],
            date: '2026-08-09',
            churchId: '679d017daf1fff94edac0c1a',
          },
        ],
        metadata: { currentPage: 1, totalPages: 1, totalRecords: 5 },
      },
    },
  })
  @ApiQuery({
    name: 'levelId',
    required: false,
    description: 'Filter by level ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 100)',
  })
  async getAllClasses(
    @Query('levelId') levelId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Auth() user?: JWTPayload,
  ) {
    return this.classBusiness.getAll(
      user?.churchId,
      levelId,
      page,
      limit,
      user?.userId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('class/forWeek')
  @ApiOperation({
    summary: 'Get the class assigned for the attendance week',
    description:
      'Returns the Sunday School class whose week (Sunday-Saturday) contains the given date, optionally filtered by level. Used to prefill the attendance form.',
  })
  @ApiOkResponse({
    description: 'Class of the week or null',
    schema: {
      example: {
        _id: '679d017daf1fff94edac0c1a',
        lessonName: 'Lección 5',
        pdfUrl: 'https://res.cloudinary.com/.../class.pdf',
        levelIds: [{ _id: '123', name: 'Párvulos' }],
        date: '2026-08-16',
        churchId: '679d017daf1fff94edac0c1a',
      },
    },
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Attendance date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'levelId',
    required: false,
    description: 'Filter by level ID',
  })
  async getClassForWeek(
    @Query('date') date: string,
    @Query('levelId') levelId?: string,
    @Auth() user?: JWTPayload,
  ) {
    return this.classBusiness.getForAttendanceDate(
      date,
      user?.churchId,
      levelId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('class/:id')
  @ApiOperation({ summary: 'Get class by ID' })
  @ApiOkResponse({ description: 'Class details' })
  @ApiBadRequestResponse({ description: 'Invalid class ID' })
  @ApiParam({ name: 'id', required: true, description: 'Class ID' })
  async getClassById(@Param('id') id: string, @Auth() user?: JWTPayload) {
    return this.classBusiness.getById(id, user?.userId);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-classes', 'create_class')
  @Post('class')
  @ApiOperation({
    summary: 'Create a Sunday School class',
    description:
      'Creates a new class with its lesson PDF. The church is resolved from the JWT token.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lessonName: { type: 'string', example: 'Lección 5' },
        date: { type: 'string', example: '2026-08-09' },
        levelIds: {
          type: 'string',
          example: '["679d017daf1fff94edac0c1a","679d017daf1fff94edac0c1b"]',
          description: 'JSON array of level IDs',
        },
        pdf: {
          type: 'string',
          format: 'binary',
          description: 'Lesson PDF file',
        },
      },
      required: ['lessonName', 'date', 'levelIds', 'pdf'],
    },
  })
  @ApiCreatedResponse({
    description: 'Class created successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: {
          _id: '679d017daf1fff94edac0c1a',
          lessonName: 'Lección 5',
          date: '2026-08-09',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid levels, date or PDF',
    schema: {
      example: {
        isSuccessful: false,
        message: 'Algunos niveles no pertenecen a esta iglesia',
      },
    },
  })
  @UseInterceptors(FileInterceptor('pdf', { storage: memoryStorage() }))
  async createClass(
    @Body() body: CreateClassDto,
    @UploadedFile() pdf?: ClassUploadFile,
    @Auth() user?: JWTPayload,
  ): Promise<GeneralResponse> {
    return this.classBusiness.create(body, user?.churchId, pdf);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-classes', 'edit_class')
  @Put('class/:id')
  @ApiOperation({
    summary: 'Update a Sunday School class',
    description:
      'Updates the class fields. A new PDF can be uploaded optionally.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lessonName: { type: 'string', example: 'Lección 5' },
        date: { type: 'string', example: '2026-08-09' },
        levelIds: {
          type: 'string',
          example: '["679d017daf1fff94edac0c1a","679d017daf1fff94edac0c1b"]',
          description: 'JSON array of level IDs',
        },
        pdf: {
          type: 'string',
          format: 'binary',
          description: 'Lesson PDF file (optional)',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Class updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: {
          _id: '679d017daf1fff94edac0c1a',
          lessonName: 'Lección 6',
          date: '2026-08-16',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid class, levels, date or PDF',
    schema: {
      example: { isSuccessful: false, message: 'La clase no es válida' },
    },
  })
  @ApiParam({ name: 'id', required: true, description: 'Class ID' })
  @UseInterceptors(FileInterceptor('pdf', { storage: memoryStorage() }))
  async updateClass(
    @Param('id') id: string,
    @Body() body: UpdateClassDto,
    @UploadedFile() pdf?: ClassUploadFile,
    @Auth() user?: JWTPayload,
  ): Promise<GeneralResponse> {
    return this.classBusiness.update(id, body, user?.churchId, pdf);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('sunday-school-classes', 'delete_class')
  @Delete('class/:id')
  @ApiOperation({ summary: 'Delete a Sunday School class' })
  @ApiOkResponse({
    description: 'Class deleted successfully',
    schema: {
      example: {
        isSuccessful: true,
        message: 'Clase eliminada correctamente',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid class ID',
    schema: {
      example: { isSuccessful: false, message: 'La clase no es válida' },
    },
  })
  @ApiParam({ name: 'id', required: true, description: 'Class ID' })
  async deleteClass(@Param('id') id: string): Promise<GeneralResponse> {
    return this.classBusiness.remove(id);
  }
}
