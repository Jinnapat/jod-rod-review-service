import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {
    this.reviewService.initialize();
  }

  @Get(':id')
  async getReviewsHandler(@Param('id') parkingLotId) {
    return await this.reviewService.getReviewsByParkingId(parkingLotId);
  }

  @Post(':id')
  async createReviewIdHandler(
    @Param('id') parkingLotId,
    @Body('userId') userId,
    @Body('message') message,
  ) {
    await this.reviewService.createReview(parkingLotId, userId, message);
  }
}
