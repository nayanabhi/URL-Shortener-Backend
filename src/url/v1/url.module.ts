import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { URL } from './url.entity';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { User } from '../../user/v1/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([URL, User])],
  providers: [UrlService],
  controllers: [UrlController],
})
export class UrlModule {}
