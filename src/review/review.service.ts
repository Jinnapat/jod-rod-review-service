import { Injectable } from '@nestjs/common';
import { MongoClient, Collection } from 'mongodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReviewService {
  private reviewCollection: Collection;

  constructor(private readonly configService: ConfigService) {}

  async initialize() {
    const client = new MongoClient(this.configService.get('MONGO_URL'));
    await client.connect();
    const db = client.db('match-service');
    this.reviewCollection = db.collection('reservations');
    console.log('connected to reservation db');
  }

  async getReviewsByParkingId(parkingLotId: string) {
    return await this.reviewCollection
      .find({ parkingLotId: parkingLotId })
      .toArray();
  }

  async createReview(parkingLotId: string, userId: number, message: string) {
    await this.reviewCollection.insertOne({
      parkingLotId,
      userId,
      message,
      createAt: Date.now(),
    });
  }
}
