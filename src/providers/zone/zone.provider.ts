import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Zone, ZoneTextDocument } from 'src/schemas/zone/zone.schema';
import { withLegacyMemberFields } from 'src/utils/legacy-identity.util';

@Injectable()
export class ZoneProvider {
  constructor(
    @InjectModel(Zone.name) private zoneModel: Model<ZoneTextDocument>,
  ) {}

  async getAllZones() {
    const zones = await this.zoneModel
      .find()
      .populate({
        path: 'coordinators',
        populate: { path: 'personId', model: 'Person' },
      })
      .lean();

    return zones.map((zone) => ({
      ...zone,
      coordinators: Array.isArray(zone.coordinators)
        ? zone.coordinators.map((coordinator) =>
            coordinator && typeof coordinator === 'object'
              ? withLegacyMemberFields(coordinator as { personId?: unknown })
              : coordinator,
          )
        : zone.coordinators,
    }));
  }

  async CreateZone(newZone: Zone) {
    return this.zoneModel.create(newZone);
  }
}
