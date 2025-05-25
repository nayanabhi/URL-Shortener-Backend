import { HttpException, HttpStatus } from '@nestjs/common';
import { ShortenUrlDto } from '../dto/createUrl.dto';

export class ShortenUrlValidator {
  // Main validation method for ShortenUrlDto
  static validate(shortenUrlDto: ShortenUrlDto) {
    this.validateOriginalUrl(shortenUrlDto.originalUrl);

    // If a shortUrlPath is provided, validate it
    if (shortenUrlDto.shortUrlPath) {
      this.validateShortUrlPath(shortenUrlDto.shortUrlPath);
    }
  }

  // Validate the original URL (it must exist and be a valid URL)
  private static validateOriginalUrl(originalUrl: string) {
    if (!originalUrl) {
      throw new HttpException(
        'Original URL is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Simple URL pattern check (you can make it more complex if needed)
    const urlPattern =
      /^(http(s)?:\/\/)?([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(\/[^\s]*)?$/;
    if (!urlPattern.test(originalUrl)) {
      throw new HttpException(
        'Invalid Original URL format',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Validate the custom short URL path
  private static validateShortUrlPath(shortUrlPath: string) {
    const maxLength = 7;

    // Check if the length exceeds the limit
    if (shortUrlPath.length > maxLength) {
      throw new HttpException(
        `Short URL path cannot be more than ${maxLength} characters`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if it's alphanumeric (only letters and numbers)
    if (!/^[a-zA-Z0-9]+$/.test(shortUrlPath)) {
      throw new HttpException(
        'Short URL path must be alphanumeric (no special characters)',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
