import { Quiz } from '@app/model/database/quiz';
import { INDEX_NOT_FOUND, QUIZZES_PATH, RANDOM_STRING_LENGTH } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as randomstring from 'randomstring';

const quizzesPath = join(__dirname, QUIZZES_PATH);

@Injectable()
export class QuizzesService {
    // if implement DB service (MongoDB) use constructor to populate DB
    // constructor(
    //   @InjectModel(Quiz.id) public QuizModel: Model<Quiz>,
    //   private readonly logger: Logger,
    // ) {
    //   this.start(); //implement start code below if needed, start should populate db
    // }

    get quizzesPath() {
        return quizzesPath;
    }

    async getQuizzes(): Promise<Quiz[]> {
        try {
            const quizzes = await fs.readFile(this.quizzesPath, 'utf8');
            return JSON.parse(quizzes);
        } catch (error) {
            return Promise.reject(new Error(`Failed to get Quizzes: ${error.message}`));
        }
    }

    async getQuiz(id: string): Promise<Quiz> {
        try {
            const quizzes = await this.getQuizzes();
            const quizIndex = quizzes.findIndex((quiz) => quiz.id === id);
            if (quizIndex === INDEX_NOT_FOUND) {
                throw new Error(`Quiz ${id} not found`);
            }
            return quizzes[quizIndex];
        } catch (error) {
            return Promise.reject(new Error(`${error.message}`));
        }
    }

    // TODO addQuiz() should check if id already exists
    async addQuiz(quiz: Quiz): Promise<Quiz> {
        try {
            const quizzes = await this.getQuizzes();
            quiz.id = randomstring.generate(RANDOM_STRING_LENGTH);
            quizzes.push(quiz);
            await fs.writeFile(this.quizzesPath, JSON.stringify(quizzes, null, 2));
            return quiz;
        } catch (error) {
            return Promise.reject(new Error(`Failed to add Quiz: ${error.message}`));
        }
    }

    async updateQuiz(id: string, updatedQuiz: Quiz): Promise<Quiz> {
        try {
            const quizzes = await this.getQuizzes();
            const quizIndex = quizzes.findIndex((quiz) => quiz.id === id);
            if (quizIndex === INDEX_NOT_FOUND) {
                throw new Error(`Quiz ${id} not found`);
            }
            quizzes[quizIndex] = updatedQuiz;
            await fs.writeFile(this.quizzesPath, JSON.stringify(quizzes, null, 2));
            return updatedQuiz;
        } catch (error) {
            return Promise.reject(new Error(`${error.message}`));
        }
    }

    async deleteQuiz(id: string): Promise<Quiz[]> {
        try {
            const quizzes = await this.getQuizzes();
            const quizIndex = quizzes.findIndex((quiz) => quiz.id === id);
            if (quizIndex === INDEX_NOT_FOUND) {
                throw new Error(`Quiz ${id} not found`);
            }
            // if only one Quiz in Quizzes, empty Quizzes filter method not removing last obj in json array
            if (quizzes.length === 1) {
                const updatedEmptyQuizzes = [];
                await fs.writeFile(this.quizzesPath, JSON.stringify(updatedEmptyQuizzes, null, 2));
                return updatedEmptyQuizzes;
            }
            const updatedQuizzes = quizzes.filter((quiz) => quiz.id !== id);
            await fs.writeFile(this.quizzesPath, JSON.stringify(updatedQuizzes, null, 2));
            return updatedQuizzes;
        } catch (error) {
            return Promise.reject(new Error(`${error.message}`));
        }
    }
}
