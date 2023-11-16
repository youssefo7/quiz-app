import { ChoiceType, QuestionType, Quiz, QuizDocument } from '@app/model/database/quiz';
import { Constants } from '@common/constants';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class QuizzesService {
    constructor(
        @InjectModel(Quiz.name) public quizModel: Model<QuizDocument>,
        private readonly logger: Logger,
    ) {
        this.start();
    }

    async start() {
        if ((await this.quizModel.countDocuments()) === 0) {
            await this.populateDB();
        }
    }

    async populateDB(): Promise<void> {
        // remplir la liste avec les quizzes lorsque la BD est vide
        const quizzes: Quiz[] = [];
        await this.quizModel.insertMany(quizzes);
        this.logger.log('DB populated');
    }

    async verifyQuiz(quiz: Quiz): Promise<void> {
        const errors = [];

        if (await this.checkTitleExists(quiz.title)) {
            errors.push('Titre du quiz déjà utilisé');
        }
        if (!quiz.title || typeof quiz.title !== 'string') {
            errors.push('Titre du quiz invalide ou manquant');
        }
        if (!quiz.description || typeof quiz.description !== 'string') {
            errors.push('Description du quiz invalide ou manquante');
        }
        if (!quiz.duration || typeof quiz.duration !== 'number') {
            errors.push('La durée du quiz est manquante ou doit être un nombre');
        }
        if (quiz.duration < Constants.MIN_DURATION || quiz.duration > Constants.MAX_DURATION) {
            errors.push('La durée du quiz doit être entre 10 et 60 secondes');
        }
        if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
            errors.push('Les questions sont manquantes ou vides');
        } else {
            quiz.questions.forEach((question, index) => this.verifyQuestion(question, index, errors));
        }
        if (errors.length) {
            throw new Error(errors.join('\n'));
        }
    }

    verifyQuestion(question: QuestionType, index: number, errors: string[]) {
        const isDefinedQuestionType = question.type && typeof question.type === 'string';
        const isValidQuestionType = question.type === 'QCM' || question.type === 'QRL';
        if (!isDefinedQuestionType || !isValidQuestionType) {
            errors.push(`Type de la question ${index + 1} invalide ou manquant ('QCM' ou 'QRL'))`);
        }
        const isDefinedQuestionText = question.text && typeof question.text === 'string';
        if (!isDefinedQuestionText) {
            errors.push(`Texte de la question ${index + 1} est invalide ou manquant`);
        }
        const isPointsValid = question.points < Constants.MIN_POINTS || question.points % Constants.MIN_POINTS !== 0;
        const isPointsDurationValid = isPointsValid || question.points > Constants.MAX_DURATION;
        if (typeof question.points !== 'number' || isPointsDurationValid) {
            errors.push(
                `Les points de la question ${index + 1} sont manquants ou invalides (doivent être des multiples de 10 entre 10 et 100 inclusivement)`,
            );
        }
        const isChoiceArray = Array.isArray(question.choices);
        const hasMinChoices = isChoiceArray && question.choices.length >= Constants.MIN_CHOICES;
        const hasMaxChoices = isChoiceArray && question.choices.length <= Constants.MAX_CHOICES;
        if (!hasMinChoices || !hasMaxChoices) {
            errors.push(`Les choix de la question ${index + 1} sont manquants ou invalides (minimum 2 et maximum 4)`);
        } else {
            this.verifyChoices(question.choices, index, errors);
        }
    }

    verifyChoices(choices: ChoiceType[], questionIndex: number, errors: string[]) {
        let correctChoiceCount = 0;
        let incorrectChoiceCount = 0;

        choices.forEach((choice, indexChoice) => {
            const isDefinedChoiceText = choice.text && typeof choice.text === 'string';
            if (!isDefinedChoiceText) {
                errors.push(`Texte du choix ${indexChoice + 1} de la question ${questionIndex + 1} invalide ou manquant`);
            }
            if (typeof choice.isCorrect !== 'boolean') {
                choice.isCorrect = false;
            }

            if (choice.isCorrect) {
                correctChoiceCount++;
            } else {
                incorrectChoiceCount++;
            }
        });

        if (!correctChoiceCount || !incorrectChoiceCount) {
            errors.push(`La question ${questionIndex + 1} doit avoir au moins un bon choix et un mauvais choix.`);
        }
    }

    async getQuizzes(): Promise<Quiz[]> {
        return await this.quizModel.find();
    }

    async getQuiz(id: string): Promise<Quiz> {
        const quiz = await this.quizModel.findOne({ id });
        if (!quiz) {
            throw new Error(`Quiz ${id} not found`);
        }
        return quiz;
    }

    async addQuiz(quiz: Quiz): Promise<Quiz> {
        quiz.id = '';
        quiz.lastModification = new Date().toISOString();
        const addedQuiz = await this.quizModel.create(quiz);
        // Mongo a la propriété _id
        // eslint-disable-next-line no-underscore-dangle
        addedQuiz.id = addedQuiz._id.toString();
        await addedQuiz.save();
        return addedQuiz;
    }

    async updateQuiz(id: string, updatedQuiz: Quiz): Promise<Quiz> {
        updatedQuiz.lastModification = new Date().toISOString();
        const quiz = await this.quizModel.findOneAndUpdate({ id }, updatedQuiz, { new: true });
        if (!quiz) {
            throw new Error(`Quiz ${id} not found`);
        }
        return quiz;
    }

    async deleteQuiz(id: string): Promise<void> {
        const result = await this.quizModel.findOneAndDelete({ id });
        if (!result) {
            throw new Error(`Quiz ${id} not found`);
        }
    }

    async checkTitleExists(title: string): Promise<boolean> {
        const quiz = await this.quizModel.findOne({ title });
        return !!quiz;
    }

    async checkQuizAvailability(id: string): Promise<boolean> {
        try {
            return !!(await this.quizModel.findOne({ id }));
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

    async importQuiz(quiz: Quiz): Promise<Quiz> {
        try {
            await this.verifyQuiz(quiz);
            return await this.addQuiz(quiz);
        } catch (error) {
            return Promise.reject(new Error(`${error.message}`));
        }
    }
}
