import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type HistoryDocument = History & Document;

@Schema()
export class History {
    @ApiProperty()
    @Prop({ required: true })
    name: string;

    @ApiProperty()
    @Prop({ required: true })
    date: string;

    @ApiProperty()
    @Prop({ required: true })
    numberOfPlayers: number;

    @ApiProperty()
    @Prop({ required: true })
    maxScore: number;
}
export const historySchema = SchemaFactory.createForClass(History);
