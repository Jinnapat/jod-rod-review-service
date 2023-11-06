import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {
    this.reviewService.initialize();
  }

  @Get('getReviewsByParkingLot/:id')
  async getReviewsHandler(@Param('id') parkingLotId) {
    return await this.reviewService.getReviewsByParkingId(parkingLotId);
  }

  @Post('createReview/:id')
  async createReviewIdHandler(
    @Param('id') reservationId,
    @Body('message') message,
  ) {
    await this.reviewService.createReview(reservationId, message);
  }
}
