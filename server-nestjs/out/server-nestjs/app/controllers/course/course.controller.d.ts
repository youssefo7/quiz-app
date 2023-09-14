import { CreateCourseDto } from '@app/model/dto/course/create-course.dto';
import { UpdateCourseDto } from '@app/model/dto/course/update-course.dto';
import { CourseService } from '@app/services/course/course.service';
import { Response } from 'express';
export declare class CourseController {
    private readonly coursesService;
    constructor(coursesService: CourseService);
    allCourses(response: Response): Promise<void>;
    subjectCode(subjectCode: string, response: Response): Promise<void>;
    addCourse(courseDto: CreateCourseDto, response: Response): Promise<void>;
    modifyCourse(courseDto: UpdateCourseDto, response: Response): Promise<void>;
    deleteCourse(subjectCode: string, response: Response): Promise<void>;
    getCourseTeacher(subjectCode: string, response: Response): Promise<void>;
    getCoursesByTeacher(name: string, response: Response): Promise<void>;
}
