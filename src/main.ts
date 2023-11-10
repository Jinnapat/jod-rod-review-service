import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerWithEureka } from './helper/eureka-helper'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  registerWithEureka("REVIEW-SERVICE", 6000)
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
