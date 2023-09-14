"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const course_1 = require("../../model/database/course");
const MAXIMUM_NUMBER_OF_CREDITS = 6;
let CourseService = exports.CourseService = class CourseService {
    constructor(courseModel, logger) {
        this.courseModel = courseModel;
        this.logger = logger;
        this.start();
    }
    async start() {
        if ((await this.courseModel.countDocuments()) === 0) {
            await this.populateDB();
        }
    }
    async populateDB() {
        const courses = [
            {
                name: 'Object Oriented Programming',
                credits: 3,
                subjectCode: 'INF1010',
                teacher: 'Samuel Kadoury',
            },
            {
                name: 'Intro to Software Engineering',
                credits: 3,
                subjectCode: 'LOG1000',
                teacher: 'Bram Adams',
            },
            {
                name: 'Project I',
                credits: 4,
                subjectCode: 'INF1900',
                teacher: 'Jerome Collin',
            },
            {
                name: 'Project II',
                credits: 3,
                subjectCode: 'LOG2990',
                teacher: 'Levis Theriault',
            },
            {
                name: 'Web Semantics and Ontology',
                credits: 2,
                subjectCode: 'INF8410',
                teacher: 'Michel Gagnon',
            },
        ];
        this.logger.log('THIS ADDS DATA TO THE DATABASE, DO NOT USE OTHERWISE');
        await this.courseModel.insertMany(courses);
    }
    async getAllCourses() {
        return await this.courseModel.find({});
    }
    async getCourse(sbjCode) {
        return await this.courseModel.findOne({ subjectCode: sbjCode });
    }
    async addCourse(course) {
        if (!this.validateCourse(course)) {
            return Promise.reject('Invalid course');
        }
        try {
            await this.courseModel.create(course);
        }
        catch (error) {
            return Promise.reject(`Failed to insert course: ${error}`);
        }
    }
    async deleteCourse(sbjCode) {
        try {
            const res = await this.courseModel.deleteOne({
                subjectCode: sbjCode,
            });
            if (res.deletedCount === 0) {
                return Promise.reject('Could not find course');
            }
        }
        catch (error) {
            return Promise.reject(`Failed to delete course: ${error}`);
        }
    }
    async modifyCourse(course) {
        const filterQuery = { subjectCode: course.subjectCode };
        try {
            const res = await this.courseModel.updateOne(filterQuery, course);
            if (res.matchedCount === 0) {
                return Promise.reject('Could not find course');
            }
        }
        catch (error) {
            return Promise.reject(`Failed to update document: ${error}`);
        }
    }
    async getCourseTeacher(sbjCode) {
        const filterQuery = { subjectCode: sbjCode };
        try {
            const res = await this.courseModel.findOne(filterQuery, {
                teacher: 1,
            });
            return res.teacher;
        }
        catch (error) {
            return Promise.reject(`Failed to get data: ${error}`);
        }
    }
    async getCoursesByTeacher(name) {
        const filterQuery = { teacher: name };
        return await this.courseModel.find(filterQuery);
    }
    validateCourse(course) {
        return this.validateCode(course.subjectCode) && this.validateCredits(course.credits);
    }
    validateCode(subjectCode) {
        return subjectCode.startsWith('LOG') || subjectCode.startsWith('INF');
    }
    validateCredits(credits) {
        return credits > 0 && credits <= MAXIMUM_NUMBER_OF_CREDITS;
    }
};
exports.CourseService = CourseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(course_1.Course.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        common_1.Logger])
], CourseService);
//# sourceMappingURL=course.service.js.map