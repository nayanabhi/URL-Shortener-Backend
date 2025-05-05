import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { URL } from './url.entity';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { User } from '../../user/v1/user.entity';
import { RedisModule } from 'src/redis/v1/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([URL, User]), RedisModule],
  providers: [UrlService],
  controllers: [UrlController],
})
export class UrlModule {}
