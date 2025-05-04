import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Res,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { ShortenUrlDto } from './dto/createUrl.dto';
import { Response } from 'express';

@Controller('v1/url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  async shortenUrl(@Body() shortenUrlDto: ShortenUrlDto) {
    const url = await this.urlService.createShortUrl(shortenUrlDto);
    return { url };
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
