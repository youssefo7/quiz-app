import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { Course, CourseDocument } from '@app/model/database/course';
import { CreateCourseDto } from '@app/model/dto/course/create-course.dto';
import { UpdateCourseDto } from '@app/model/dto/course/update-course.dto';
export declare class CourseService {
    courseModel: Model<CourseDocument>;
    private readonly logger;
    constructor(courseModel: Model<CourseDocument>, logger: Logger);
    start(): Promise<void>;
    populateDB(): Promise<void>;
    getAllCourses(): Promise<Course[]>;
    getCourse(sbjCode: string): Promise<Course>;
    addCourse(course: CreateCourseDto): Promise<void>;
    deleteCourse(sbjCode: string): Promise<void>;
    modifyCourse(course: UpdateCourseDto): Promise<void>;
    getCourseTeacher(sbjCode: string): Promise<string>;
    getCoursesByTeacher(name: string): Promise<Course[]>;
    private validateCourse;
    private validateCode;
    private validateCredits;
}
