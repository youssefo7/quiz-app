import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type QuizDocument = Quiz & Document;

export type QuestionType = {
    type: string;
    text: string;
    points: number;
    choices?: ChoiceType[];
};

export type ChoiceType = {
    text: string;
    isCorrect: boolean;
};

@Schema()
export class Quiz {
    static allowedFields: string[] = ['id', 'title', 'duration', 'lastModification', 'description', 'visibility', 'questions'];

    static allowedQuestionFields: string[] = ['type', 'text', 'points', 'choices'];

    static allowedChoiceFields: string[] = ['text', 'isCorrect'];

    @ApiProperty()
    @Prop()
    id: string;

    @ApiProperty()
    @Prop({ required: true })
    title: string;

    @ApiProperty()
    @Prop({ required: true })
    duration: number;

    @ApiProperty()
    @Prop({ required: true })
    lastModification: string;

    @ApiProperty()
    @Prop({ required: true })
    description: string;

    @ApiProperty()
    @Prop({ required: true })
    visibility: boolean;

    @ApiProperty()
    @Prop({ required: true })
    questions: QuestionType[];
}
export const quizSchema = SchemaFactory.createForClass(Quiz);
