// import { Quiz } from '@app/model/database/quiz';
// import { INDEX_NOT_FOUND, QUIZZES_PATH, RANDOM_STRING_LENGTH } from '@common/constants';
// import { Injectable } from '@nestjs/common';
// import { promises as fs } from 'fs';
// import { join } from 'path';
// import * as randomstring from 'randomstring';

// const quizzesPath = join(__dirname, QUIZZES_PATH);

// @Injectable()
// export class QuizzesService {
//     // if implement DB service (MongoDB) use constructor to populate DB
//     // constructor(
//     //   @InjectModel(Quiz.id) public QuizModel: Model<Quiz>,
//     //   private readonly logger: Logger,
//     // ) {
//     //   this.start(); //implement start code below if needed, start should populate db
//     // }

//     get quizzesPath() {
//         return quizzesPath;
//     }

//     async getQuizIndex(id: string) {
//         const quizzes = await this.getQuizzes();
//         const quizIndex = quizzes.findIndex((quiz) => quiz.id === id);
//         if (quizIndex === INDEX_NOT_FOUND) {
//             throw new Error(`Quiz ${id} not found`);
//         }
//         return quizIndex;
//     }

//     async getQuizzes(): Promise<Quiz[]> {
//         try {
//             const quizzes = await fs.readFile(this.quizzesPath, 'utf8');
//             return JSON.parse(quizzes);
//         } catch (error) {
//             return Promise.reject(new Error(`Failed to get Quizzes: ${error.message}`));
//         }
//     }

//     async getQuiz(id: string): Promise<Quiz> {
//         try {
//             const quizzes = await this.getQuizzes();
//             const quizIndex = await this.getQuizIndex(id);
//             return quizzes[quizIndex];
//         } catch (error) {
//             return Promise.reject(new Error(`${error.message}`));
//         }
//     }

//     // TODO addQuiz() should check if id already exists and validate input
//     async addQuiz(quiz: Quiz): Promise<Quiz> {
//         try {
//             const quizzes = await this.getQuizzes();
//             quiz.id = randomstring.generate(RANDOM_STRING_LENGTH);
//             quizzes.push(quiz);
//             await fs.writeFile(this.quizzesPath, JSON.stringify(quizzes, null, 2));
//             return quiz;
//         } catch (error) {
//             return Promise.reject(new Error(`Failed to add Quiz: ${error.message}`));
//         }
//     }

//     // TODO updateQuiz() should validate input
//     async updateQuiz(id: string, updatedQuiz: Quiz): Promise<Quiz> {
//         try {
//             const quizzes = await this.getQuizzes();
//             const quizIndex = await this.getQuizIndex(id);
//             quizzes[quizIndex] = updatedQuiz;
//             await fs.writeFile(this.quizzesPath, JSON.stringify(quizzes, null, 2));
//             return updatedQuiz;
//         } catch (error) {
//             return Promise.reject(new Error(`${error.message}`));
//         }
//     }

//     async deleteQuiz(id: string): Promise<Quiz[]> {
//         try {
//             const quizzes = await this.getQuizzes();
//             await this.getQuizIndex(id);
//             // if only one Quiz in Quizzes, empty Quizzes filter method not removing last obj in json array
//             if (quizzes.length === 1) {
//                 const updatedEmptyQuizzes = [];
//                 await fs.writeFile(this.quizzesPath, JSON.stringify(updatedEmptyQuizzes, null, 2));
//                 return updatedEmptyQuizzes;
//             }
//             const updatedQuizzes = quizzes.filter((quiz) => quiz.id !== id);
//             await fs.writeFile(this.quizzesPath, JSON.stringify(updatedQuizzes, null, 2));
//             return updatedQuizzes;
//         } catch (error) {
//             return Promise.reject(new Error(`${error.message}`));
//         }
//     }
// }

import { ChoiceType, QuestionType, Quiz } from '@app/model/database/quiz';
import { Constants } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as randomstring from 'randomstring';

const quizzesPath = join(__dirname, Constants.QUIZZES_PATH);

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

    // TODO : fix time zone
    // Time not in EST for some reason
    getDate(): string {
        return new Date().toISOString();
    }

    async verifyQuiz(quiz: Quiz): Promise<void> {
        const errors = [];

        if (await this.checkTitleExists(quiz.title)) errors.push('Titre du quiz déjà utilisé');
        if (!quiz.title || typeof quiz.title !== 'string') errors.push('Titre du quiz invalide ou manquant');
        if (!quiz.description || typeof quiz.description !== 'string') errors.push('Description du quiz invalide ou manquante');
        if (!quiz.duration || typeof quiz.duration !== 'number') errors.push('La durée du quiz est manquante ou doit être un nombre');
        if (quiz.duration < Constants.MIN_DURATION || quiz.duration > Constants.MAX_DURATION)
            errors.push('La durée du quiz doit être entre 10 et 60 secondes');

        if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
            errors.push('Les questions sont manquantes ou vides');
        } else {
            quiz.questions.forEach((question, index) => this.verifyQuestion(question, index, errors));
        }

        if (errors.length) throw new Error(errors.join('\n'));
    }

    verifyQuestion(question: QuestionType, index: number, errors: string[]): void {
        if (!question.type || typeof question.type !== 'string' || (question.type !== 'QCM' && question.type !== 'QRL'))
            errors.push(`Type de la question ${index + 1} invalide ou manquant ('QCM' ou 'QRL'))`);

        if (!question.text || typeof question.text !== 'string') errors.push(`Texte de la question ${index + 1} est invalide ou manquant`);

        if (
            typeof question.points !== 'number' ||
            question.points < Constants.MIN_POINTS ||
            question.points > Constants.MAX_DURATION ||
            question.points % Constants.MIN_POINTS !== 0
        )
            errors.push(
                `Les points de la question ${index + 1} sont manquants ou invalides (doivent être des multiples de 10 entre 10 et 100 inclusivement)`,
            );

        if (!Array.isArray(question.choices) || question.choices.length < Constants.MIN_CHOICES || question.choices.length > Constants.MAX_CHOICES)
            errors.push(`Les choix de la question ${index + 1} sont manquants ou invalides (minimum 2 et maximum 4)`);
        else {
            this.verifyChoices(question.choices, index, errors);
        }
    }

    verifyChoices(choices: ChoiceType[], questionIndex: number, errors: string[]): void {
        let correctChoiceCount = 0;
        let incorrectChoiceCount = 0;

        choices.forEach((choice, indexChoice) => {
            if (!choice.text || typeof choice.text !== 'string')
                errors.push(`Texte du choix ${indexChoice + 1} de la question ${questionIndex + 1} invalide ou manquant`);

            if (typeof choice.isCorrect !== 'boolean')
                errors.push(`La propriété "isCorrect" du choix ${indexChoice + 1} de la question ${questionIndex + 1} est invalide ou manquante`);
            else {
                if (choice.isCorrect) correctChoiceCount++;
                else incorrectChoiceCount++;
            }
        });

        if (correctChoiceCount < 1 || incorrectChoiceCount < 1)
            errors.push(`La question ${questionIndex + 1} doit avoir au moins un bon choix et un mauvais choix.`);
    }

    // if true id is available
    async checkIdAvailability(id: string): Promise<boolean> {
        const quizzes = await this.getQuizzes();
        return quizzes.findIndex((quiz) => quiz.id === id) === Constants.INDEX_NOT_FOUND;
    }

    async checkTitleExists(title: string): Promise<boolean> {
        const quizzes = await this.getQuizzes();
        return !!quizzes.find((quiz) => quiz.title === title);
    }

    async createID(): Promise<string> {
        let id;
        do {
            id = randomstring.generate(Constants.RANDOM_STRING_LENGTH);
        } while (!(await this.checkIdAvailability(id)));
        return id;
    }

    async checkQuizAvailability(id: string): Promise<boolean> {
        try {
            return !(await this.checkIdAvailability(id));
        } catch (error) {
            return Promise.reject(new Error(`${error.message}`));
        }
    }

    async checkQuizVisibility(id: string): Promise<boolean> {
        try {
            const quiz = await this.getQuiz(id);
            return quiz.visibility;
        } catch (error) {
            return Promise.reject(new Error(`${error.message}`));
        }
    }

    async getQuizIndex(id: string): Promise<number> {
        const quizzes = await this.getQuizzes();
        const quizIndex = quizzes.findIndex((quiz) => quiz.id === id);
        if (quizIndex === Constants.INDEX_NOT_FOUND) {
            throw new Error(`Quiz ${id} not found`);
        }
        return quizIndex;
    }

    async getQuizzes(): Promise<Quiz[]> {
        try {
            const quizzes = await fs.readFile(this.quizzesPath, 'utf8');
            return JSON.parse(quizzes);
        } catch (error) {
            return Promise.reject(new Error(`${error.message}`));
        }
    }

    async getQuiz(id: string): Promise<Quiz> {
        try {
            const quizzes = await this.getQuizzes();
            const quizIndex = await this.getQuizIndex(id);
            return quizzes[quizIndex];
        } catch (error) {
            return Promise.reject(new Error(`${error.message}`));
        }
    }

    // TODO addQuiz() should check if id already exists and validate input
    async addQuiz(quiz: Quiz): Promise<Quiz> {
        try {
            const quizzes = await this.getQuizzes();
            quiz.id = await this.createID();
            quiz.lastModification = this.getDate();
            quizzes.push(quiz);
            await fs.writeFile(this.quizzesPath, JSON.stringify(quizzes, null, 2));
            return quiz;
        } catch (error) {
            return Promise.reject(new Error(`${error.message}`));
        }
    }

    async updateQuiz(id: string, updatedQuiz: Quiz): Promise<Quiz> {
        try {
            const quizzes = await this.getQuizzes();
            const quizIndex = await this.getQuizIndex(id);
            updatedQuiz.lastModification = this.getDate();
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
            await this.getQuizIndex(id);
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

    async importQuiz(quiz: Quiz): Promise<Quiz> {
        try {
            await this.verifyQuiz(quiz);
            return await this.addQuiz(quiz);
        } catch (error) {
            throw new Error(`${error.message}`);
        }
    }
}


