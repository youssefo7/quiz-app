import { DateService } from '@app/services/date/date.service';
import { Message } from '@common/message';
import { Logger } from '@nestjs/common';
export declare class ExampleService {
    private readonly dateService;
    private readonly logger;
    private clientMessages;
    constructor(dateService: DateService, logger: Logger);
    about(): Message;
    helloWorld(): Message;
    storeMessage(message: Message): void;
    getAllMessages(): Message[];
}
