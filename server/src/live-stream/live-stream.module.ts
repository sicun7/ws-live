import { Module } from '@nestjs/common';
import { LiveStreamGateway } from './live-stream.gateway';
import { LiveStreamService } from './live-stream.service';

@Module({
  providers: [LiveStreamGateway, LiveStreamService],
})
export class LiveStreamModule {} 