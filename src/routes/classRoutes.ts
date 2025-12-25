import { Router } from 'express'
import { authMiddleware, CustomRequest } from '../middleware/authMiddleware';
import { AttendanceModel, ClassModel, UserModel } from '../database/db';
import { success } from 'zod';

const router = Router();

router.get('/health', (req, res) => {
    res.send("Class route is healthy!!")
})

router.post('/', authMiddleware, async (req: CustomRequest, res) => {
    try{
        // authorization required (teacher only)
        const role = req.role;

        if(role !== 'teacher'){
            return res.status(404).json({
                success: false,
                error: "Unauthorized route"
            })
        }
        // extract classname from body
        const {className} = req.body;

        const currentClass = await ClassModel.findOne({className})
        
        if(!currentClass){
            return res.status(400).json({
                success: false,
                error: "Class name not found"
            })
        }

        return res.status(200).json({
            success: true,
            data: {
                _id: currentClass._id,
                className: currentClass.className,
                teacherId: currentClass.teacherId,
                studentsIds: currentClass.studentIds
            }
        })
    } catch(err){
        console.log(err);
    }
})

router.post('/:id/add-student', authMiddleware, async(req: CustomRequest, res) => {
    try {
        // auth route for teacher only who owns the class 
        const userId = req.userId;
        const role = req.role;

        if(role !== 'teacher'){
            return res.status(404).json({
                success: false,
                error: "Unauthorized route"
            })
        }

        // extract class id from req params
        const classId = req.params.id;

        const currentClass = await ClassModel.findOne({_id: classId});

        if(!currentClass){
            return res.status(400).json({
                success: false,
                error: `Class with id ${classId} not found`
            })
        }

        const teacherId = currentClass.teacherId.toString();

        if(teacherId !== userId){
            // this teacher does not own the class
            return res.status(404).json({
                success: false,
                error: "User not owner of class"
            })
        }

        // add student to class

        // get current students array
        let students = currentClass.studentIds;
        // add the new studentId from req.body
        students.push(req.body.studentId)
        const updatedClass = await ClassModel.findByIdAndUpdate(classId, {
            studentIds: students
        })

        if(!updatedClass){
            return res.status(400).json({
                success: false,
                error: "Could not add student into class"
            })
        }

        return res.status(200).json({
            success: true,
            data: updatedClass
        })
    } catch (error) {
        console.log(error);
    }
})

router.get("/:id", authMiddleware, async(req: CustomRequest, res) => {
    try{
        // auth route 
        // allow teacher who owns the class or student enrolled in the class

        const userId = req.userId;
        const role = req.role;
        const classId = req.params.id;
        if(role === 'teacher'){
            // role is teacher
            // check if owns the class
            const currentClass = await ClassModel.findOne({classId}).populate('StudentIds');

            if(!currentClass){
                return res.status(400).json({
                    success: false,
                    error: `Class not found with id ${classId}`
                })
            }

            const teacherId = currentClass.teacherId.toString();
            if(teacherId !== userId){
                // not owner of class , return
                return res.status(400).json({
                    success: false,
                    error: "Unauthorized route"
                })
            }
            // route authenticated 
            // return class details with populated student ids
            return res.status(200).json({
                success: true,
                data: currentClass
            })
        }
        else {
            // user is student 
            // check if enrolled in this class then authenticate
            const currentClass = await ClassModel.findOne({classId}).populate('StudentIds');

            if(!currentClass){
                return res.status(400).json({
                    success: false,
                    error: `Class not found with id ${classId}`
                })
            }

            const isEnrolled = currentClass.studentIds.find((studentId) => studentId.toString() === userId);
            if(!isEnrolled){
                // student is not enrolled in this class
                return res.status(400).json({
                    success: false,
                    error: "Student not enrolled in this class"
                })
            }

            // route authenticated
            // return class details with populated student ids
            return res.status(200).json({
                success: true,
                data: currentClass
            })
        }
    } catch(err){
        console.log(err);
    }
})

router.get('/students', authMiddleware, async(req: CustomRequest, res) => {
    try{
        // auth route only for teachers
        // returns all users with role student

        const role = req.role;

        if(role !== 'teacher'){
            return res.status(400).json({
                success: false,
                error: "Unauthorized route"
            })
        }

        // route authorized 
        const students = await UserModel.find({role: 'student'})

        if(!students){
            return res.status(400).json({
                success: false,
                error: "Students not found"
            })
        }
        
        return res.status(200).json({
            success: true,
            data: students
        })

    } catch(err){
        console.log(err);
    }
})


router.get('/:id/my-attendance', authMiddleware, async(req: CustomRequest, res) => {
    try{
        // auth route only for student enrolled in class

        const role = req.role;
        if(role !== 'student'){
            return res.status(400).json({
                success: false,
                error: "User is not a student"
            })
        }

        const userId = req.userId;
        const classId = req.params.id;

        const currentClass = await ClassModel.findOne({classId});

        if(!currentClass){
            return res.status(400).json({
                success: false,
                error: "Class not found"
            })
        }

        const isEnrolled = currentClass.studentIds.find((studentId) => studentId.toString() === userId);

        if(!isEnrolled){
            // student not enrolled in this class return here
            return res.status(400).json({
                success: false,
                error: "This student is not enrolled in this class"
            })
        }

        // route authenticated; 

        // get attendance status from DB
        const attendance = await AttendanceModel.findOne({classId, studentId: userId});

        if(!attendance){
            return res.status(400).json({
                success: false,
                error: "Cannot fetch attendance from DB"
            })
        }

        // return attendance status - persisted or not
        return res.status(200).json({
            success: true,
            data: {
                classId: classId,
                status: attendance.status
            }
        })
    } catch(err){
        console.log(err);
    }
})

export default router;

