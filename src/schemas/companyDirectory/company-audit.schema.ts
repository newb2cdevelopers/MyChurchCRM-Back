import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CompanyDirectory } from 'src/schemas/companyDirectory/companyDirectory.schema';

@Schema({ timestamps: true })
export class CompanyAudit {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: CompanyDirectory.name,
    required: true,
    index: true,
  })
  companyDirectoryId: string;
}

export const CompanyAuditSchema = SchemaFactory.createForClass(CompanyAudit);

// Composite index to optimize aggregations by company and date
CompanyAuditSchema.index({ companyDirectoryId: 1, createdAt: -1 });

export type CompanyAuditDocument = CompanyAudit & mongoose.Document;
