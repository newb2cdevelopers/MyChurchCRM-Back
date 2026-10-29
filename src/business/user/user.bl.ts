import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { UserProvider } from 'src/providers/user/user.provider';
import { MemberProvider } from 'src/providers/members/member.provider';
import { PersonProvider } from 'src/providers/person/person.provider';
import { UserDTO, UpdateUserDTO } from 'src/schemas/user/user.DTO';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
import { PaginatedResult } from 'src/dtos/pagination.dto';

function normalizeForCompare(value?: string): string {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getNameTokens(value?: string): string[] {
  const normalized = normalizeForCompare(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

@Injectable()
export class UserBusiness {
  private readonly logger = new Logger(UserBusiness.name);

  constructor(
    private readonly userProvider: UserProvider,
    private readonly memberProvider: MemberProvider,
    private readonly personProvider: PersonProvider,
  ) {}

  async getAllUsers(
    churchId: string,
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Users & { isMember: boolean }>> {
    if (!churchId) {
      throw new ConflictException('churchId is required');
    }

    const filter: FilterQuery<UserDocument> = {};
    filter.churchId = churchId;

    if (search) {
      const regex = new RegExp(search, 'i');

      filter.$or = [{ name: regex }, { lastName: regex }, { email: regex }];
    }

    const result = await this.userProvider.getAllUsers(filter, page, limit);

    // Get the personIds of the users in the result
    const personIds = result.data
      .map((u) => (u as { personId?: unknown }).personId)
      .filter((personId): personId is unknown => Boolean(personId));

    let memberPersonIds = new Set<string>();

    if (personIds.length > 0) {
      const personIdStrings = personIds.map((personId) => String(personId));

      const memberPersonIdList = await this.memberProvider.findMemberPersonIds(
        personIdStrings,
        churchId,
      );

      memberPersonIds = new Set(memberPersonIdList);
    }

    const data = result.data.map((u) => {
      const userWithPerson = u as Users & {
        isMember: boolean;
        personId?: unknown;
      };

      return {
        ...userWithPerson,
        isMember: userWithPerson.personId
          ? memberPersonIds.has(String(userWithPerson.personId))
          : false,
      };
    });

    return { data, metadata: result.metadata };
  }

  async getUserById(id: string): Promise<Users> {
    return this.userProvider.getUserById(id) as unknown as Promise<Users>;
  }

  async getUserByEmail(email: string) {
    return this.userProvider.getUserByEmail(email) as unknown as Promise<Users>;
  }

  async userExistByEmail(email: string) {
    const user = await this.userProvider.getUserByEmail(email);
    return user !== null;
  }

  async newUser(user: UserDTO): Promise<Users> {
    this.logger.log(
      `[newUser] Checking if user exists with email: ${user.email}`,
    );

    const userExist = await this.userProvider.getUserByEmail(user.email);

    if (userExist) {
      this.logger.warn(
        `[newUser] User already exists with email: ${user.email}`,
      );

      throw new ConflictException('Email is already registered in the system');
    }

    this.logger.log(`[newUser] Creating new user with email: ${user.email}`);

    try {
      // Resolve or create canonical person per document (single source of truth)
      const person = await this.personProvider.resolveOrCreate({
        documentType: user.documentType,
        documentNumber: user.documentNumber,
        firstName:
          (user as { firstName?: string }).firstName ||
          (user as { name?: string }).name ||
          '',
        secondName: (user as { secondName?: string }).secondName || '',
        firstLastName:
          (user as { firstLastName?: string }).firstLastName ||
          (user as { lastName?: string }).lastName ||
          '',
        secondLastName:
          (user as { secondLastName?: string }).secondLastName || '',
        email: user.email,
        createdByChurchId: user.churchId,
      });

      // If the person already has active membership in another church, reject registration
      const activeMember = await this.memberProvider.findActiveMemberByPersonId(
        String(person._id),
      );

      if (
        activeMember &&
        String(activeMember.churchId) !== String(user.churchId)
      ) {
        throw new ConflictException(
          'Ya figuras como miembro activo en otra iglesia. Para registrarte, solicita al administrador de esa iglesia que gestione tu retiro.',
        );
      }

      // Avoid creating two accounts for the same person
      const existingUserByPerson = await this.userProvider.getUserByPersonId(
        String(person._id),
      );

      if (existingUserByPerson) {
        throw new ConflictException('Ya existe una cuenta con este documento');
      }

      const registrationSnapshot = {
        firstName:
          (user as { firstName?: string }).firstName ||
          (user as { name?: string }).name ||
          '',
        secondName: (user as { secondName?: string }).secondName || '',
        firstLastName:
          (user as { firstLastName?: string }).firstLastName ||
          (user as { lastName?: string }).lastName ||
          '',
        secondLastName:
          (user as { secondLastName?: string }).secondLastName || '',
      };

      const newUser = await this.userProvider.newUser({
        ...user,
        personId: String(person._id),
        status: 'pending',
        active: false,
        registrationSnapshot,
      } as unknown as UserDTO);

      this.logger.log(
        `[newUser] User created successfully with ID: ${newUser._id}`,
      );

      return newUser as unknown as Promise<Users>;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[newUser] Error creating user: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async updateUser(id: string, user: UpdateUserDTO): Promise<Users> {
    this.logger.log(`[updateUser] Updating user with ID: ${id}`);
    return this.userProvider.updateUser(id, user) as unknown as Promise<Users>;
  }

  async deleteUser(id: string): Promise<void> {
    this.logger.log(`[deleteUser] Deleting user with ID: ${id}`);
    this.userProvider.deleteUser(id);
  }

  async getActivationPreview(userId: string, churchId: string) {
    if (!churchId) {
      throw new ConflictException('churchId is required');
    }

    // Preview the user, canonical file and differences with the snapshot
    const user = await this.userProvider.getUserByIdWithPerson(
      userId,
      churchId,
    );

    if (!user) {
      throw new ConflictException('Usuario no encontrado');
    }

    const person = (user as Record<string, unknown>).personId || null;
    const snapshot =
      (user as Record<string, unknown>).registrationSnapshot || null;
    const conflicts: string[] = [];

    if (person && snapshot) {
      const personObj = person as Record<string, unknown>;
      const snapshotObj = snapshot as Record<string, unknown>;
      const personLastName = normalizeForCompare(
        personObj.firstLastName as string,
      );
      const snapshotLastName = normalizeForCompare(
        snapshotObj.firstLastName as string,
      );
      const personTokens = getNameTokens(
        `${personObj.firstName || ''} ${personObj.secondName || ''} ${
          personObj.firstLastName || ''
        } ${personObj.secondLastName || ''}`,
      );
      const snapshotTokens = getNameTokens(
        `${snapshotObj.firstName || ''} ${snapshotObj.secondName || ''} ${
          snapshotObj.firstLastName || ''
        } ${snapshotObj.secondLastName || ''}`,
      );

      const lastNameDiffers =
        personLastName &&
        snapshotLastName &&
        personLastName !== snapshotLastName;
      const hasNameOverlap = personTokens.some((token) =>
        snapshotTokens.includes(token),
      );

      if (lastNameDiffers && !hasNameOverlap) {
        conflicts.push(
          'Los datos del registro no coinciden con la ficha del miembro',
        );
      } else if (lastNameDiffers && hasNameOverlap) {
        conflicts.push(
          'Posible diferencia en nombres/apellidos. Verificar identidad',
        );
      }
    }

    return {
      user,
      person,
      snapshot,
      conflicts,
    };
  }

  async activateRegistration(
    userId: string,
    churchId: string,
    action: 'confirm_same' | 'update_person' | 'reject',
    payload?: {
      personData?: Record<string, unknown>;
      rejectReason?: string;
    },
  ) {
    if (!churchId) {
      throw new ConflictException('churchId is required');
    }

    const user = await this.userProvider.getUserByIdWithPerson(
      userId,
      churchId,
    );

    if (!user) {
      throw new ConflictException('Usuario no encontrado');
    }

    const person = (user as Record<string, unknown>).personId;

    if (action === 'reject') {
      await this.userProvider.rejectUser(userId, payload?.rejectReason);

      this.logger.log(`[activateRegistration] User ${userId} rejected`);

      return { status: 'rejected' };
    }

    if (action === 'update_person' && person && payload?.personData) {
      // Update canonical file with the data confirmed by the admin
      await this.personProvider.updateBasicInfo(
        String((person as Record<string, unknown>)._id || person),
        payload.personData,
      );
    }

    // Confirm/Activate: Canonical token prevails
    await this.userProvider.activateUser(userId);
    this.logger.log(`[activateRegistration] User ${userId} activated`);
    return { status: 'active' };
  }
}
