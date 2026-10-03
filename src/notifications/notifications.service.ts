import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';

export interface BookingDetails {
  memberName: string;
  memberEmail: string;
  bookingType: 'class' | 'trainer';
  name: string; // className or trainerName
  date: string;
  time: string;
  duration?: number;
  amount: number;
}

export interface PaymentDetails {
  memberName: string;
  memberEmail: string;
  amount: number;
  currency: string;
  purpose: string;
  razorpayPaymentId: string;
  paidAt: Date;
}

export interface MembershipDetails {
  memberName: string;
  memberEmail: string;
  planName: string;
  amount: number;
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private emailService: EmailService) {}

  async sendBookingConfirmation(details: BookingDetails): Promise<void> {
    const html = this.generateBookingConfirmationEmail(details);
    
    await this.emailService.sendEmail({
      to: details.memberEmail,
      subject: `Booking Confirmed: ${details.name}`,
      html,
    });
  }

  async sendPaymentSuccess(details: PaymentDetails): Promise<void> {
    const html = this.generatePaymentSuccessEmail(details);
    
    await this.emailService.sendEmail({
      to: details.memberEmail,
      subject: `Payment Successful - ₹${details.amount}`,
      html,
    });
  }

  async sendMembershipActivated(details: MembershipDetails): Promise<void> {
    const html = this.generateMembershipActivatedEmail(details);
    
    await this.emailService.sendEmail({
      to: details.memberEmail,
      subject: `Welcome to SKF Fitness ${details.planName} Plan!`,
      html,
    });
  }

  private generateBookingConfirmationEmail(details: BookingDetails): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .detail-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2563EB; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${details.memberName},</p>
            <p>Great news! Your ${details.bookingType} booking has been confirmed.</p>
            
            <div class="detail-box">
              <h3>${details.bookingType === 'class' ? '📅 Class Details' : '💪 Training Session Details'}</h3>
              <div class="detail-row">
                <span class="label">${details.bookingType === 'class' ? 'Class' : 'Trainer'}:</span>
                <span class="value">${details.name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${details.date}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${details.time}</span>
              </div>
              ${details.duration ? `
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">${details.duration} minutes</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">Amount Paid:</span>
                <span class="value">₹${details.amount}</span>
              </div>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Arrive 10 minutes early to check in</li>
              <li>Bring your water bottle and towel</li>
              <li>Wear comfortable workout attire</li>
              ${details.bookingType === 'class' ? '<li>Find your spot and get ready to sweat!</li>' : '<li>Your trainer will guide you through the session</li>'}
            </ul>
            
            <p>Need to make changes? Log in to your dashboard to manage your bookings.</p>
            
            <div style="text-align: center;">
              <a href="https://skf-fitness.netlify.app/dashboard" class="button">View My Bookings</a>
            </div>
          </div>
          <div class="footer">
            <p>SKF Fitness | Building Strength, Inspiring Lives</p>
            <p>Questions? Reply to this email or call us at +91 98765 43210</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentSuccessEmail(details: PaymentDetails): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .detail-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .total-row { font-size: 18px; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 2px solid #10B981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful!</h1>
          </div>
          <div class="content">
            <p>Hi ${details.memberName},</p>
            <p>Thank you for your payment. Your transaction was successful!</p>
            
            <div class="detail-box">
              <h3>💳 Payment Receipt</h3>
              <div class="detail-row">
                <span class="label">Payment For:</span>
                <span class="value">${details.purpose}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">₹${details.amount}</span>
              </div>
              <div class="detail-row">
                <span class="label">Currency:</span>
                <span class="value">${details.currency}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment ID:</span>
                <span class="value">${details.razorpayPaymentId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date & Time:</span>
                <span class="value">${details.paidAt.toLocaleString()}</span>
              </div>
              <div class="detail-row total-row">
                <span class="label">Total Paid:</span>
                <span class="value">₹${details.amount}</span>
              </div>
            </div>
            
            <p><em>This is your payment confirmation. Please save this email for your records.</em></p>
            
            <p>If you have any questions about this payment, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>SKF Fitness | Building Strength, Inspiring Lives</p>
            <p>Support: support@skffitness.com | +91 98765 43210</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateMembershipActivatedEmail(details: MembershipDetails): string {
    const daysRemaining = Math.ceil((details.endDate.getTime() - details.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .plan-box { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 30px; margin: 20px 0; border-radius: 10px; text-align: center; }
          .plan-name { font-size: 32px; font-weight: bold; margin: 10px 0; }
          .detail-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #8B5CF6; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .benefits { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .benefit-item { margin: 10px 0; padding-left: 25px; position: relative; }
          .benefit-item:before { content: "✓"; position: absolute; left: 0; color: #10B981; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎊 Welcome to SKF Fitness!</h1>
            <p>Your membership is now active</p>
          </div>
          <div class="content">
            <p>Hi ${details.memberName},</p>
            <p>Congratulations! Your membership has been successfully activated. Welcome to the SKF Fitness family!</p>
            
            <div class="plan-box">
              <div class="plan-name">${details.planName}</div>
              <p>${daysRemaining} days of unlimited fitness</p>
            </div>
            
            <div class="detail-box">
              <h3>📋 Membership Details</h3>
              <div class="detail-row">
                <span class="label">Plan:</span>
                <span class="value">${details.planName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Start Date:</span>
                <span class="value">${details.startDate.toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Valid Until:</span>
                <span class="value">${details.endDate.toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount Paid:</span>
                <span class="value">₹${details.amount}</span>
              </div>
            </div>
            
            <div class="benefits">
              <h3>🎁 Your Membership Benefits</h3>
              ${this.getMembershipBenefits(details.planName)}
            </div>
            
            <p><strong>Ready to Start Your Journey?</strong></p>
            <p>Log in to your dashboard to:</p>
            <ul>
              <li>Book your first class</li>
              <li>Schedule a trainer session</li>
              <li>Complete your fitness profile</li>
              <li>Explore our facility</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://skf-fitness.netlify.app/dashboard" class="button">Go to Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>SKF Fitness | Building Strength, Inspiring Lives</p>
            <p>Need help getting started? Contact us at support@skffitness.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getMembershipBenefits(planName: string): string {
    const benefits = {
      'Basic': [
        'Gym access (6AM - 10PM)',
        'Cardio & strength equipment',
        'Locker room access',
        'Free fitness assessment',
      ],
      'Pro': [
        'All Basic features',
        '24/7 gym access',
        'All group classes included',
        '2 personal training sessions',
        'Nutrition consultation',
      ],
      'Elite': [
        'All Pro features',
        'Unlimited personal training',
        'Custom meal plans',
        'Recovery sessions',
        'Priority class booking',
      ],
    };

    const planBenefits = benefits[planName] || benefits['Basic'];
    return planBenefits.map(benefit => `<div class="benefit-item">${benefit}</div>`).join('');
  }
}
