import { Injectable } from '@nestjs/common';
import * as cron from 'node-cron';
import { EventProvider } from 'src/providers/events/event.provider';

@Injectable()
export class CronService {
  constructor(private eventProvider: EventProvider) {
    cron.schedule('0 8 * * *', () => {
      this.eventProvider.closePastEvents();
    });
  }
}
