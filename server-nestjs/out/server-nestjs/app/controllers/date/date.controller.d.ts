import { DateService } from '@app/services/date/date.service';
import { Message } from '@app/model/schema/message.schema';
export declare class DateController {
    private readonly dateService;
    constructor(dateService: DateService);
    dateInfo(): Message;
}
