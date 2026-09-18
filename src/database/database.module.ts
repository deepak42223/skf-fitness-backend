import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MemberEntity } from '../members/member.entity';
import { ContactEntity } from '../contact/contact.entity';
import { ProfileEntity } from '../profile/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_PATH', './skf-data.sqlite'),
        entities: [MemberEntity, ContactEntity, ProfileEntity],
        synchronize: true, // auto-creates tables — fine for SQLite/dev; use migrations for PostgreSQL prod
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
