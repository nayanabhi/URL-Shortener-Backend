import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { URL } from './url.entity';
import { ShortenUrlDto } from './dto/createUrl.dto';
// import { nanoid } from 'nanoid';
import { User } from '../../user/v1/user.entity';
import { RedisService } from 'src/redis/v1/redis.service';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(URL)
    private urlRepo: Repository<URL>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private redisService: RedisService,
  ) {}

  async createShortUrl(shortenUrlDto: ShortenUrlDto, userId: number) {
    const shortUrlPathInRedis = await this.redisService.get(
      `alias:${shortenUrlDto?.shortUrlPath}`,
    );
    if (shortUrlPathInRedis) {
      throw new HttpException(
        'Endpoint Already taken',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const shortUrlPathInDatabase = await this.urlRepo.findOne({
      where: { shortUrlPath: shortenUrlDto?.shortUrlPath },
    });
    if (shortUrlPathInDatabase) {
      await this.redisService.set(
        `alias:${shortenUrlDto?.shortUrlPath}`,
        'taken',
      );
      throw new HttpException(
        'Endpoint Already taken',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    shortenUrlDto.userId = userId;
    await this.urlRepo.save(shortenUrlDto);
  }

  async getOriginalUrl(endPoint: string): Promise<string | undefined> {
    const fetchUrlFromRedis = await this.getCachedValue(endPoint);
    if (fetchUrlFromRedis) {
      return fetchUrlFromRedis;
    }
    const url = await this.urlRepo.findOne({
      select: ['originalUrl'],
      where: { shortUrlPath: endPoint },
    });
    if (!url) {
      throw new HttpException(
        'No url match with the end point',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.setCachedValue(endPoint, url.originalUrl);
    return url?.originalUrl;
  }

  async getCachedValue(key: string) {
    return this.redisService.get(key);
  }

  async setCachedValue(key: string, value: string) {
    return this.redisService.set(key, value);
  }
}
