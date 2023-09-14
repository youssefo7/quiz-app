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
exports.CourseController = void 0;
const course_1 = require("../../model/database/course");
const create_course_dto_1 = require("../../model/dto/course/create-course.dto");
const update_course_dto_1 = require("../../model/dto/course/update-course.dto");
const course_service_1 = require("../../services/course/course.service");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let CourseController = exports.CourseController = class CourseController {
    constructor(coursesService) {
        this.coursesService = coursesService;
    }
    async allCourses(response) {
        try {
            const allCourses = await this.coursesService.getAllCourses();
            response.status(common_1.HttpStatus.OK).json(allCourses);
        }
        catch (error) {
            response.status(common_1.HttpStatus.NOT_FOUND).send(error.message);
        }
    }
    async subjectCode(subjectCode, response) {
        try {
            const course = await this.coursesService.getCourse(subjectCode);
            response.status(common_1.HttpStatus.OK).json(course);
        }
        catch (error) {
            response.status(common_1.HttpStatus.NOT_FOUND).send(error.message);
        }
    }
    async addCourse(courseDto, response) {
        try {
            await this.coursesService.addCourse(courseDto);
            response.status(common_1.HttpStatus.CREATED).send();
        }
        catch (error) {
            response.status(common_1.HttpStatus.NOT_FOUND).send(error.message);
        }
    }
    async modifyCourse(courseDto, response) {
        try {
            await this.coursesService.modifyCourse(courseDto);
            response.status(common_1.HttpStatus.OK).send();
        }
        catch (error) {
            response.status(common_1.HttpStatus.NOT_FOUND).send(error.message);
        }
    }
    async deleteCourse(subjectCode, response) {
        try {
            await this.coursesService.deleteCourse(subjectCode);
            response.status(common_1.HttpStatus.OK).send();
        }
        catch (error) {
            response.status(common_1.HttpStatus.NOT_FOUND).send(error.message);
        }
    }
    async getCourseTeacher(subjectCode, response) {
        try {
            const teacher = await this.coursesService.getCourseTeacher(subjectCode);
            response.status(common_1.HttpStatus.OK).json(teacher);
        }
        catch (error) {
            response.status(common_1.HttpStatus.NOT_FOUND).send(error.message);
        }
    }
    async getCoursesByTeacher(name, response) {
        try {
            const courses = await this.coursesService.getCoursesByTeacher(name);
            response.status(common_1.HttpStatus.OK).json(courses);
        }
        catch (error) {
            response.status(common_1.HttpStatus.NOT_FOUND).send(error.message);
        }
    }
};
__decorate([
    (0, swagger_1.ApiOkResponse)({
        description: 'Returns all courses',
        type: course_1.Course,
        isArray: true,
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Return NOT_FOUND http status when request fails',
    }),
    (0, common_1.Get)('/'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "allCourses", null);
__decorate([
    (0, swagger_1.ApiOkResponse)({
        description: 'Get course by subject code',
        type: course_1.Course,
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Return NOT_FOUND http status when request fails',
    }),
    (0, common_1.Get)('/:subjectCode'),
    __param(0, (0, common_1.Param)('subjectCode')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "subjectCode", null);
__decorate([
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Add new course',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Return NOT_FOUND http status when request fails',
    }),
    (0, common_1.Post)('/'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_course_dto_1.CreateCourseDto, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "addCourse", null);
__decorate([
    (0, swagger_1.ApiOkResponse)({
        description: 'Modify a course',
        type: course_1.Course,
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Return NOT_FOUND http status when request fails',
    }),
    (0, common_1.Patch)('/'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_course_dto_1.UpdateCourseDto, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "modifyCourse", null);
__decorate([
    (0, swagger_1.ApiOkResponse)({
        description: 'Delete a course',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Return NOT_FOUND http status when request fails',
    }),
    (0, common_1.Delete)('/:subjectCode'),
    __param(0, (0, common_1.Param)('subjectCode')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "deleteCourse", null);
__decorate([
    (0, swagger_1.ApiOkResponse)({
        description: 'Get a specific course teacher',
        type: String,
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Return NOT_FOUND http status when request fails',
    }),
    (0, common_1.Get)('/teachers/code/:subjectCode'),
    __param(0, (0, common_1.Param)('subjectCode')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "getCourseTeacher", null);
__decorate([
    (0, swagger_1.ApiOkResponse)({
        description: 'Get specific teacher courses',
        type: course_1.Course,
        isArray: true,
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Return NOT_FOUND http status when request fails',
    }),
    (0, common_1.Get)('/teachers/name/:name'),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "getCoursesByTeacher", null);
exports.CourseController = CourseController = __decorate([
    (0, swagger_1.ApiTags)('Courses'),
    (0, common_1.Controller)('course'),
    __metadata("design:paramtypes", [course_service_1.CourseService])
], CourseController);
//# sourceMappingURL=course.controller.js.map