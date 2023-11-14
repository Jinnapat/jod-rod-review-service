import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
          userId: review.userId,
          username: userInfo.username,
          message: review.message,
          createAt: review.createAt(),
        };
      }),
    );
  }

  async createReview(
    parkingLotId: string,
    bearerToken: string,
    message: string,
  ) {
    await this.checkReviewable(parkingLotId, bearerToken);
    const user = await this.tokenToUserInfo(bearerToken);
    const insertResult = await this.reviewCollection.insertOne({
      parkingLotId,
      userId: user.id,
      message,
      createAt: Date.now(),
    });
    return insertResult.insertedId;
  }

  private async checkReviewable(parkingLotId: string, bearerToken: string) {
    const checkReviewableResult = await fetch(
      this.configService.get('MATCHING_SERVICE_URL') +
        '/checkIsParkingLotReviewable/' +
        parkingLotId,
      { headers: { Authorization: bearerToken } },
    );

    if (checkReviewableResult.status != 200)
      throw new InternalServerErrorException();
    const responseBody = await new Response(checkReviewableResult.body).json();
    if (!responseBody) {
      throw new UnauthorizedException('You cannot review this parking lot');
    }
  }

  private async checkParkingLotExist(parkingLotId: string) {
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

  private async getUserInfo(userId: number) {
    const findUserResult = await fetch(
      this.configService.get('USER_SERVICE_URL') + '/getUser/' + userId,
    );

    if (findUserResult.status != 200)
      throw new NotFoundException('Cant find user with that id');

    return await new Response(findUserResult.body).json();
  }

  private async tokenToUserInfo(bearerToken: string) {
    const getUserResult = await fetch(
      this.configService.get('USER_SERVICE_URL') + '/getProfile',
      {
        headers: { Authorization: bearerToken },
      },
    );

    if (getUserResult.status != 200)
      throw new NotFoundException('Cant get user profile');

    return await new Response(getUserResult.body).json();
  }
}
