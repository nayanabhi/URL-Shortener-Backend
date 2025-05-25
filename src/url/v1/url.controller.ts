import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Res,
  NotFoundException,
  Query,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { ShortenUrlDto } from './dto/createUrl.dto';
import { Response } from 'express';
import { RateLimitInterceptor } from 'src/common/rate-limit.interceptor';
import { JwtAuthGuard } from 'src/auth/v1/jwt-auth.guard';
import { Request } from 'express';
import { RequestWithUser } from './interface/request.interface';

@Controller('v1/url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(RateLimitInterceptor)
  async shortenUrl(
    @Body() shortenUrlDto: ShortenUrlDto,
    @Req() req: RequestWithUser,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const shortUrlPath = await this.urlService.createShortUrl(
      shortenUrlDto,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      Number(req?.user?.userId),
    );
    return { shortUrlPath };
  }

  @Get('checkAlias')
  async checkAlias(@Query('alias') alias: string) {
    const available = await this.urlService.isAliasAvailable(alias);
    return { available };
  }
  @Get('redirect')
  async redirect(@Query('endPoint') endPoint: string, @Res() res: Response) {
    const originalUrl = await this.urlService.getOriginalUrl(endPoint);
    // Check if the URL is defined
    if (!originalUrl) {
      // Handle the case when the URL is not found, e.g., throw a 404 error
      throw new NotFoundException('URL not found');
    }

    // Redirect to the original URL if found
    return res.redirect(originalUrl);
  }
}
