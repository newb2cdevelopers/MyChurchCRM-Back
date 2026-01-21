import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider } from 'src/providers/auth/auth.provider';
import { UserProvider } from 'src/providers/user/user.provider';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';
import { Users } from 'src/schemas/user/user.schema';
import { key } from '../../modules/auth/constants';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { sendEmail } from 'src/utilities/emailUtils';
import {
  UserNotFoundException,
  InvalidTokenException,
  InactiveUserException,
  EmailSendFailedException,
  PasswordUpdateFailedException,
} from 'src/exceptions/auth.exceptions';
import {
  TokenPayload,
  RoleWithFunctionalities,
  FunctionalityWithModule,
  GroupedFunctionality,
} from 'src/interfaces/auth.interfaces';

@Injectable()
export class AuthBusiness {
  private readonly logger = new Logger(AuthBusiness.name);

  constructor(
    private readonly provider: AuthProvider,
    private readonly userProvider: UserProvider,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<boolean> {
    const user = (await this.provider.getUserByEmail(
      username,
    )) as unknown as Users;
    if (user && user.active) return user.comparePassword(pass);
    else return false;
  }

  /**
   * Validates recovery token and updates user password
   * @param newPassword - The new password to set (must meet complexity requirements)
   * @param token - JWT token received via email (expires in 10 minutes)
   * @returns GeneralResponse indicating success or failure
   * @throws InvalidTokenException if token is invalid or expired
   * @throws UserNotFoundException if user doesn't exist
   * @throws PasswordUpdateFailedException if password update fails
   */
  async checkTokenUser(
    newPassword: string,
    token: string,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    try {
      // Verify and decode the JWT token
      const tokenInfo = this.jwtService.verify<TokenPayload>(token);

      if (!tokenInfo || !tokenInfo.userId) {
        throw new InvalidTokenException('Invalid token structure');
      }

      // Update password - the pre-save hook in User schema will hash it automatically
      await this.userProvider.updatePassword(tokenInfo.userId, newPassword);

      // Send confirmation email to user
      const user = await this.provider.getUserByEmail('', false);
      if (user && (user as unknown as Users).email) {
        const userEmail = (user as unknown as Users).email;
        try {
          await sendEmail(
            userEmail,
            'Password Changed Successfully',
            this.getPasswordChangedEmailTemplate(),
          );
        } catch (emailError) {
          // Log warning but don't fail the request if confirmation email fails
          this.logger.warn(
            'Failed to send password change confirmation email',
            emailError,
          );
        }
      }

      this.logger.log(
        `Password updated successfully for user: ${tokenInfo.userId}`,
      );
      response.message = 'Password updated successfully';

      return response;
    } catch (error) {
      this.logger.error('Error updating password', error);

      if (error instanceof InvalidTokenException) {
        throw error;
      }

      response.isSuccessful = false;

      if (typeof error === 'object' && error !== null && 'message' in error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('expired')) {
          response.message =
            'The recovery link has expired, please request a new one';
          throw new InvalidTokenException(response.message);
        }
        if (errorMessage.includes('User not found')) {
          response.message = 'User not found';
          throw new UserNotFoundException();
        }
      }

      response.message = 'An error occurred while updating the password';
      throw new PasswordUpdateFailedException(response.message);
    }
  }

  /**
   * Generates a password recovery token and sends it via email
   * @param email - User's email address
   * @returns GeneralResponse with success message
   * @throws UserNotFoundException if email doesn't exist in the system
   * @throws InactiveUserException if user account is inactive
   * @throws EmailSendFailedException if email fails to send
   */
  async generateTokenForRecovery(email: string): Promise<GeneralResponse> {
    const response: GeneralResponse = {
      isSuccessful: true,
      message: 'Recovery email sent successfully, please check your inbox',
    };

    // Verify user exists
    const user = (await this.provider.getUserByEmail(
      email,
      false,
    )) as unknown as Users;

    if (!user) {
      this.logger.warn(
        `Password recovery attempted for non-existent email: ${email}`,
      );
      throw new UserNotFoundException('Email not found in our system');
    }

    // Verify user is active
    if (!user.active) {
      this.logger.warn(
        `Password recovery attempted for inactive user: ${email}`,
      );
      throw new InactiveUserException();
    }

    // Generate JWT token valid for 10 minutes
    const payload: JWTPayload = { userId: user._id.toString() };

    const token = this.jwtService.sign(payload, {
      expiresIn: '10m',
      secret: key,
    });

    const emailBody = this.getRecoveryEmailTemplate(token);

    try {
      const emailResponse = await sendEmail(
        email,
        'Password Recovery Request',
        emailBody,
      );
      if (!emailResponse) {
        this.logger.error(`Failed to send recovery email to: ${email}`);
        throw new EmailSendFailedException('Could not send recovery email');
      }

      this.logger.log(`Password recovery email sent to: ${email}`);
      return response;
    } catch (error) {
      this.logger.error('Error sending recovery email', error);
      throw new EmailSendFailedException('Could not send recovery email');
    }
  }

  async generateAccessToken(name: string) {
    const user = (await this.provider.getUserByEmail(
      name,
      true,
    )) as unknown as Users;
    const payload: JWTPayload = { userId: user.email };

    return {
      access_token: this.jwtService.sign(payload),
      churchId: user.churchId,
      roles: this.generateDashboardInfo(
        user.roles as unknown as RoleWithFunctionalities[],
      ),
      workfront: user.workfront || null,
    };
  }

  /**
   * Organizes user functionalities by module for dashboard display
   * @param roles - Array of roles with their functionalities
   * @returns Array of functionalities grouped by module
   */
  generateDashboardInfo(
    roles: RoleWithFunctionalities[],
  ): GroupedFunctionality[] {
    let functionalities: FunctionalityWithModule[] = [];

    // Collect all functionalities from all roles
    roles?.forEach((role) => {
      functionalities = functionalities.concat(role.Functionalities);
    });

    // Group functionalities by module name
    const groupByModule = functionalities.reduce(
      (group: Record<string, FunctionalityWithModule[]>, functionality) => {
        const { module } = functionality;
        group[module.name] = group[module.name] ?? [];
        group[module.name].push(functionality);
        return group;
      },
      {},
    );

    const groupArray = Object.entries(groupByModule);

    const rolesArray: GroupedFunctionality[] = [];

    // Transform grouped data into final format
    groupArray.forEach(([key, value]) => {
      rolesArray.push({
        module: key,
        accesses: value,
      });
    });

    return rolesArray;
  }

  /**
   * Generates HTML template for password recovery email
   * @param token - JWT token for password recovery
   * @returns HTML string with recovery link
   */
  private getRecoveryEmailTemplate(token: string): string {
    const recoveryUrl = `${process.env.APP_URL_BASE}/recoveryPassword?token_id=${token}`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Recovery</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Password Recovery Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${recoveryUrl}" 
               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #e74c3c; font-size: 14px;">
            <strong>Important:</strong> This link will expire in 10 minutes for security reasons.
          </p>
          <p style="font-size: 14px; color: #7f8c8d;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #95a5a6;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates HTML template for password change confirmation email
   * @returns HTML string confirming password change
   */
  private getPasswordChangedEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h2 style="color: #27ae60; margin-bottom: 20px;">Password Changed Successfully</h2>
          <p>Hello,</p>
          <p>Your password has been changed successfully. You can now log in with your new password.</p>
          <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 3px;">
            <p style="margin: 0; color: #155724;">
              <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately.
            </p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #95a5a6;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}
