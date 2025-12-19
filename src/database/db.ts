import mongoose, { Types } from "mongoose";


export const RoleType = ["teacher", "student"] 
export const StatusType = ["present", "absent"]


const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    role: {type: String, enum: RoleType, required: true}
})

const classSchema = new mongoose.Schema({
    className: {type: String, required: true},
    teacherId: {type: Types.ObjectId, ref: 'User', required: true}, // reference to user
    studentIds: [{type: Types.ObjectId, ref: 'User', required: true}] // array of user references
})

const attendanceSchema = new mongoose.Schema({
    classId: {type: Types.ObjectId, required: true},
    studentId: {type: Types.ObjectId, required: true},
    status: {type: String, enum: StatusType, required: true}
})

export const UserModel = mongoose.model("User", userSchema);
export const ClassModel = mongoose.model("Class", classSchema);
export const AttendanceModel = mongoose.model("Attendance", attendanceSchema);
