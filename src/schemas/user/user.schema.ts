import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Schema()
export class Users {
  _id: number;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workfront',
  })
  workfront: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  churchId: string;

  @Prop({ required: true })
  confirmToken: string;

  @Prop({default: false })
  active: boolean;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'Role' })
  roles: string [] 

  comparePassword: (candidatePassword: string) => boolean;
}

export type UserDocument = Users & mongoose.Document;

export const UserSchema = SchemaFactory.createForClass(Users);

UserSchema.index({ email: 1 });

UserSchema.pre('save', async function (next: any) {
  const user = this as UserDocument;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }

  // Random additional data
  const salt = await bcrypt.genSalt(10);

  const hash = bcrypt.hashSync(user.password, salt);

  // Replace the password with the hash
  user.password = hash;

  return next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  const user = this as UserDocument;
  return bcrypt.compare(candidatePassword, user.password).catch(() => false);
};
