import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { URL } from './url.entity';
import { ShortenUrlDto } from './dto/createUrl.dto';
// import { nanoid } from 'nanoid';
import { User } from '../../user/v1/user.entity';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(URL)
    private urlRepo: Repository<URL>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createShortUrl(shortenUrlDto: ShortenUrlDto) {
    shortenUrlDto.userId = Number(1);
    await this.urlRepo.save(shortenUrlDto);
  }

  async getOriginalUrl(endPoint: string): Promise<string | undefined> {
    const url = await this.urlRepo.findOne({
      select: ['originalUrl'],
      where: { shortUrlPath: endPoint },
    });
    return url?.originalUrl;
  }
}
