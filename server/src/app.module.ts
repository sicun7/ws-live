import { Module } from '@nestjs/common';
import { LiveStreamModule } from './live-stream/live-stream.module';

@Module({
  imports: [LiveStreamModule],
})
export class AppModule {} 