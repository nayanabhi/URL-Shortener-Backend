import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { URL } from './url.entity';
import { ShortenUrlDto } from './dto/createUrl.dto';
// import { nanoid } from 'nanoid';
import { User } from '../../user/v1/user.entity';
import { RedisService } from 'src/redis/v1/redis.service';
import { toBase62 } from './utils/utils';
import { ShortenUrlValidator } from './validator/validator';

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
    ShortenUrlValidator.validate(shortenUrlDto);
    const originalUrlInRedis = await this.redisService.get(
      `originalUrl:${shortenUrlDto?.originalUrl}`,
    );
    if (originalUrlInRedis) {
      return originalUrlInRedis;
    }
    const originalUrlInDatabase = await this.urlRepo.findOne({
      where: { originalUrl: shortenUrlDto?.originalUrl },
    });

    if (originalUrlInDatabase) {
      await this.redisService.set(
        `originalUrl:${shortenUrlDto?.originalUrl}`,
        originalUrlInDatabase.shortUrlPath,
      );
      return originalUrlInDatabase?.shortUrlPath;
    }

    if (shortenUrlDto?.shortUrlPath) {
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
    } else {
      let counter = await this.redisService.incr('shortUrlCounter');
      let shortUrlPath = toBase62(counter);

      while (await this.urlRepo.findOne({ where: { shortUrlPath } })) {
        counter = await this.redisService.incr('shortUrlCounter');
        shortUrlPath = toBase62(counter);
      }
      shortenUrlDto.shortUrlPath = shortUrlPath;
    }
    shortenUrlDto.userId = userId;
    const response = await this.urlRepo.save(shortenUrlDto);
    await this.redisService.set(
      `originalUrl:${shortenUrlDto?.originalUrl}`,
      shortenUrlDto.shortUrlPath,
    );
    return response?.shortUrlPath;
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

  async isAliasAvailable(alias: string): Promise<boolean | undefined> {
    const fetchUrlFromRedis = await this.getCachedValue(alias);
    if (fetchUrlFromRedis) {
      return false;
    }
    const existing = await this.urlRepo.findOne({
      select: ['originalUrl'],
      where: { shortUrlPath: alias },
    });
    return !existing;
  }

  async getCachedValue(key: string) {
    return this.redisService.get(key);
  }

  async setCachedValue(key: string, value: string) {
    return this.redisService.set(key, value);
  }
}
