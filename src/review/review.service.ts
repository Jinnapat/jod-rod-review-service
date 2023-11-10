import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoClient, Collection } from 'mongodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReviewService {
  private reviewCollection: Collection;

  constructor(private readonly configService: ConfigService) {}

  async initialize() {
    const client = new MongoClient(this.configService.get('MONGO_URL'));
    await client.connect();
    const db = client.db('review-service');
    this.reviewCollection = db.collection('review');
    console.log('connected to review db');
  }

  async getReviewsByParkingId(parkingLotId: string) {
    await this.checkParkingLotExist(parkingLotId);

    const findResult = await this.reviewCollection
      .find({ parkingLotId: parkingLotId })
      .toArray();

    return await Promise.all(
      findResult.map(async (review) => {
        const userInfo = await this.getUserInfo(review.userId);
        return {
          id: review._id,
          reservationId: review.reservationId,
          userId: review.userId,
          username: userInfo.username,
          message: review.message,
          createAt: review.createAt,
        };
      }),
    );
  }

  async createReview(reservationId: string, message: string) {
    const reservation = await this.checkReservationExist(reservationId);

    const insertResult = await this.reviewCollection.insertOne({
      reservationId,
      parkingLotId: reservation.parkingLotId,
      userId: reservation.userId,
      message,
      createAt: Date.now(),
    });
    return insertResult.insertedId;
  }

  async checkReservationExist(reservationId: string) {
    const findReservationResult = await fetch(
      this.configService.get('MATCHING_SERVICE_URL') +
        '/getReservation/' +
        reservationId,
    );

    if (findReservationResult.status != 200)
      throw new NotFoundException('No reservation with that id');
    const responseBody = await new Response(findReservationResult.body).json();
    return responseBody;
  }

  async checkParkingLotExist(parkingLotId: string) {
    const findParkingLotResult = await fetch(
      this.configService.get('PARKING_LOT_SERVICE_URL') +
        '/getParkingSpace/' +
        parkingLotId,
    );

    if (findParkingLotResult.status != 200)
      throw new NotFoundException(
        'Cant get information about that parking lot',
      );
  }

  async getUserInfo(userId: number) {
    const findUserResult = await fetch(
      this.configService.get('USER_SERVICE_URL') + '/getUser/' + userId,
    );

    if (findUserResult.status != 200)
      throw new NotFoundException('Cant find user with that id');

    return await new Response(findUserResult.body).json();
  }
}
