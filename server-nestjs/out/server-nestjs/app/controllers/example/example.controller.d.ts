import { Message } from '@app/model/schema/message.schema';
import { ExampleService } from '@app/services/example/example.service';
export declare class ExampleController {
    private readonly exampleService;
    constructor(exampleService: ExampleService);
    exampleInfo(): import("@common/message").Message;
    about(): import("@common/message").Message;
    send(requestBody: Message): void;
    all(): import("@common/message").Message[];
}
