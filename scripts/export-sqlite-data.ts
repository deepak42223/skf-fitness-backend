import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { MemberEntity } from '../src/members/member.entity';
import { ProfileEntity } from '../src/profile/profile.entity';
import { PaymentEntity } from '../src/payments/entities/payment.entity';
import { ClassBookingEntity } from '../src/bookings/entities/class-booking.entity';
import { TrainerBookingEntity } from '../src/bookings/entities/trainer-booking.entity';
import { ContactEntity } from '../src/contact/contact.entity';
import { ResetTokenEntity } from '../src/auth/entities/reset-token.entity';

/**
 * Export all data from SQLite database to JSON files
 * Run with: npm run db:export
 */
async function exportData() {
  console.log('📦 Starting SQLite data export...\n');

  // Connect to SQLite database
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: process.env.DB_PATH || './skf-data.sqlite',
    entities: [
      MemberEntity,
      ProfileEntity,
      PaymentEntity,
      ClassBookingEntity,
      TrainerBookingEntity,
      ContactEntity,
      ResetTokenEntity,
    ],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to SQLite database\n');

    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Export each table
    const entities = [
      { name: 'members', entity: MemberEntity, removeFields: ['password'] },
      { name: 'profiles', entity: ProfileEntity },
      { name: 'payments', entity: PaymentEntity },
      { name: 'class_bookings', entity: ClassBookingEntity },
      { name: 'trainer_bookings', entity: TrainerBookingEntity },
      { name: 'contact', entity: ContactEntity },
      { name: 'reset_tokens', entity: ResetTokenEntity },
    ];

    for (const { name, entity, removeFields } of entities) {
      const repository = dataSource.getRepository(entity);
      let data = await repository.find();

      // Remove sensitive fields if specified
      if (removeFields) {
        data = data.map((item: any) => {
          const cleaned = { ...item };
          removeFields.forEach(field => delete cleaned[field]);
          return cleaned;
        });
      }

      const filePath = path.join(exportsDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✅ Exported ${data.length} records from ${name} → ${filePath}`);
    }

    console.log('\n🎉 Export complete! Files saved in exports/ directory');
    console.log('\n⚠️  Remember: passwords are NOT exported for security reasons');
    console.log('   Users will need to reset their passwords after migration\n');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportData();
