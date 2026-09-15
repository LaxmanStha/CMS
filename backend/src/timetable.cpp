#include<iostream>
#include<fstream>
#include <vector>
#include <string>
#include <iomanip>
#include <algorithm>
#include <map>
#include <set>
#include <sstream>
#include <stdexcept>
#include <climits>
#include <unordered_map>
#include <sqlite3.h>

using namespace std;

class Student{
    public:
        string name;
        int roll;
        string email;
        string course;
        int semester;


        void SetDetails(){
            cout << "Enter the name of Student:\t";
            getline(cin, name);
            cout << "\nEnter the roll number:\t";
            cin >> roll;
            cin.ignore(); 
            cout << "\nEnter the email:\t";
            getline(cin, email);
            cout << "\nEnter the course:\t";
            getline(cin, course);
            cout << "\nEnter the semester:\t";
            cin >> semester;
            cin.ignore(); 
        }
};

class Employee{
    public:
        string name;
        int id;
        int salary;
        string position;
        
        void SetDetails(){
            cout << "Enter the name of Employee:\t";
            getline(cin, name);
            cout << "\nEnter the ID:\t";
            cin >> id;
            cin.ignore(); 
            cout << "\nEnter the salary:\t";
            cin >> salary;
            cin.ignore(); //
            cout << "\nEnter the position:\t";
            getline(cin, position);
        }
       
};

class Teacher : public Employee{
    public:
        string subject;

        void SetDetails(){
            Employee::SetDetails();
            cout << "\nEnter the subject:\t";
            getline(cin, subject);
        }

};


void AddStudent(){
    Student s1;
    s1.SetDetails();
    fstream Studentfile("Student.txt",ios::app);
    Studentfile << "Name: " << s1.name
         << "\tRoll: " << s1.roll
         << "\t Email: " << s1.email
         << "\tCourse: " << s1.course
         << "\tSemester: " << s1.semester << endl;
}

void AddEmployee(){
    Employee e1;
    e1.SetDetails();
    fstream Employeefile("Employee.txt",ios::app);
    Employeefile << "Name: " << e1.name
         << "\tID: " << e1.id
         << "\tSalary: " << e1.salary
         << "\tPosition: " << e1.position<< endl;
}

void AddTeacher(){
    Teacher t1;
    t1.SetDetails();
    fstream Teacherfile("Teacher.txt",ios::app);
    Teacherfile << "Name: " << t1.name
         << "\tID: " << t1.id
         << "\tSalary: " << t1.salary
         << "\tPosition: " << t1.position
         << "\tSubject: " << t1.subject << endl;
}

/* Database helper structures and functions */
struct TeacherInfo {
    int id = 0;
    string name;
    vector<string> subjects;
    string assignedClassroom;
    string assignedCourse;
    int load = 0;
};

struct SectionInfo {
    int id = 0;
    string name;
    int teacherId = 0;
    int courseId = 0;
    string courseName;
    int studentCount = 0;
};

struct SlotInfo {
    int id = 0;
    string day;
    int period = 0;
    string startTime;
    string endTime;
};

struct CourseInfo {
    int id = 0;
    string code;
    string name;
    int instructorId = 0;
    int credits = 0;
    int maxCapacity = 0;
    bool requiresLab = false;
};

static string columnText(sqlite3_stmt* stmt, int col) {
    const unsigned char* txt = sqlite3_column_text(stmt, col);
    return txt ? reinterpret_cast<const char*>(txt) : "";
}

static int columnInt(sqlite3_stmt* stmt, int col) {
    return sqlite3_column_int(stmt, col);
}

static bool tableExists(sqlite3* db, const string& table) {
    sqlite3_stmt* st = nullptr;
    string sql = "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?";
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &st, nullptr);
    if (rc != SQLITE_OK) return false;
    sqlite3_bind_text(st, 1, table.c_str(), -1, SQLITE_TRANSIENT);
    bool exists = (sqlite3_step(st) == SQLITE_ROW);
    if (st) sqlite3_finalize(st);
    return exists;
}

static vector<string> tableColumns(sqlite3* db, const string& table) {
    vector<string> cols;
    sqlite3_stmt* st = nullptr;
    string sql = "PRAGMA table_info(" + table + ")";
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &st, nullptr);
    if (rc != SQLITE_OK) return cols;
    while (sqlite3_step(st) == SQLITE_ROW) {
        cols.push_back(columnText(st, 1));
    }
    if (st) sqlite3_finalize(st);
    return cols;
}

static sqlite3* openDatabase() {
    vector<string> paths = {
        "college.db",
        "../build/bin/college.db",
        "../../build/bin/college.db",
        "backend/build/bin/college.db",
        "build/bin/college.db"
    };
    string lastError;
    for (const auto& path : paths) {
        sqlite3* db = nullptr;
        int rc = sqlite3_open_v2(path.c_str(), &db, SQLITE_OPEN_READONLY, nullptr);
        if (rc == SQLITE_OK) {
            sqlite3_busy_timeout(db, 5000);
            return db;
        }
        if (db) {
            lastError = sqlite3_errmsg(db);
            sqlite3_close(db);
        }
    }
    throw runtime_error("Could not open college.db. Ensure the file exists in one of the expected locations.");
}

static string toLower(const string& s) {
    string r = s;
    transform(r.begin(), r.end(), r.begin(), ::tolower);
    return r;
}

static bool containsIgnoreCase(const string& haystack, const string& needle) {
    return toLower(haystack).find(toLower(needle)) != string::npos;
}

static vector<CourseInfo> loadCourses(sqlite3* db) {
    vector<CourseInfo> courses;
    if (!tableExists(db, "Course")) return courses;
    vector<string> cols = tableColumns(db, "Course");
    string sql = "SELECT id";
    sql += (find(cols.begin(), cols.end(), "code") != cols.end()) ? ", code" : ", ''";
    sql += (find(cols.begin(), cols.end(), "name") != cols.end()) ? ", name" : ", ''";
    sql += (find(cols.begin(), cols.end(), "instructorId") != cols.end()) ? ", instructorId" : ", 0";
    sql += (find(cols.begin(), cols.end(), "credits") != cols.end()) ? ", credits" : ", 0";
    sql += (find(cols.begin(), cols.end(), "maxCapacity") != cols.end()) ? ", maxCapacity" : ", 0";
    sql += (find(cols.begin(), cols.end(), "requires_lab") != cols.end()) ? ", requires_lab" : ", 0";
    string where = "";
    if (find(cols.begin(), cols.end(), "status") != cols.end()) {
        where = " WHERE status='active'";
    }
    sql += " FROM Course" + where + " ORDER BY id";
    sqlite3_stmt* st = nullptr;
    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &st, nullptr) != SQLITE_OK) return courses;
    while (sqlite3_step(st) == SQLITE_ROW) {
        CourseInfo c;
        c.id = columnInt(st, 0);
        c.code = columnText(st, 1);
        c.name = columnText(st, 2);
        c.instructorId = columnInt(st, 3);
        c.credits = columnInt(st, 4);
        c.maxCapacity = columnInt(st, 5);
        c.requiresLab = (columnInt(st, 6) != 0);
        courses.push_back(c);
    }
    if (st) sqlite3_finalize(st);
    return courses;
}

static vector<TeacherInfo> loadTeachers(sqlite3* db) {
    vector<TeacherInfo> teachers;
    if (!tableExists(db, "Person") || !tableExists(db, "Teacher")) return teachers;
    string sql = "SELECT p.id, p.name, t.assignedClassroom, t.assignedCourse "
                 "FROM Person p JOIN Teacher t ON t.id = p.id "
                 "WHERE p.discriminator IN ('Teacher','Faculty') ";
    vector<string> teacherCols = tableColumns(db, "Teacher");
    if (find(teacherCols.begin(), teacherCols.end(), "status") != teacherCols.end()) {
        sql += " AND COALESCE(t.status,'active')='active'";
    }
    sql += " ORDER BY p.name";
    sqlite3_stmt* st = nullptr;
    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &st, nullptr) != SQLITE_OK) return teachers;
    while (sqlite3_step(st) == SQLITE_ROW) {
        TeacherInfo t;
        t.id = columnInt(st, 0);
        t.name = columnText(st, 1);
        t.assignedClassroom = columnText(st, 2);
        t.assignedCourse = columnText(st, 3);
        teachers.push_back(t);
    }
    if (st) sqlite3_finalize(st);
    map<int, vector<string>> subjectsByTeacher;
    if (!tableExists(db, "Course")) {
        for (auto& t : teachers) {
            if (!t.assignedCourse.empty()) t.subjects.push_back(t.assignedCourse);
            else t.subjects.push_back("Unassigned");
        }
    } else {
        sqlite3_stmt* cst = nullptr;
        string csql = "SELECT instructorId, code FROM Course WHERE instructorId IS NOT NULL ORDER BY code";
        if (sqlite3_prepare_v2(db, csql.c_str(), -1, &cst, nullptr) == SQLITE_OK) {
            while (sqlite3_step(cst) == SQLITE_ROW) {
                int inst = columnInt(cst, 0);
                string code = columnText(cst, 1);
                subjectsByTeacher[inst].push_back(code);
            }
            sqlite3_finalize(cst);
        }
        for (auto& t : teachers) {
            if (subjectsByTeacher.find(t.id) != subjectsByTeacher.end()) {
                t.subjects = subjectsByTeacher[t.id];
            } else if (!t.assignedCourse.empty()) {
                t.subjects.push_back(t.assignedCourse);
            } else {
                t.subjects.push_back("Unassigned");
            }
        }
    }
    return teachers;
}

static vector<SectionInfo> loadSections(sqlite3* db, const vector<TeacherInfo>& teachers, const vector<CourseInfo>& courses) {
    vector<SectionInfo> sections;
    set<string> seen;
    auto addSection = [&](SectionInfo s) {
        if (s.name.empty()) return;
        string key = toLower(s.name);
        if (seen.insert(key).second) sections.push_back(s);
    };
    if (tableExists(db, "Sections")) {
        vector<string> cols = tableColumns(db, "Sections");
        string idExpr = "s.id";
        string secExpr = "";
        if (find(cols.begin(), cols.end(), "section_label") != cols.end()) {
            secExpr = "COALESCE(NULLIF(s.section_label,''),'A')";
        } else {
            secExpr = "'Section' || s.id";
        }
        string courseExpr = "";
        if (find(cols.begin(), cols.end(), "course_id") != cols.end()) {
            courseExpr = ", c.code, c.name";
        } else {
            courseExpr = ", '', ''";
        }
        string teacherExpr = "";
        if (find(cols.begin(), cols.end(), "teacher_id") != cols.end()) {
            teacherExpr = ", s.teacher_id";
        } else {
            teacherExpr = ", 0";
        }
        string studentExpr = "";
        if (find(cols.begin(), cols.end(), "student_count") != cols.end()) {
            studentExpr = ", s.student_count";
        } else {
            studentExpr = ", 0";
        }
        string sql = "SELECT " + idExpr + ", " + secExpr + courseExpr + teacherExpr + studentExpr + 
                     " FROM Sections s JOIN Course c ON c.id = s.course_id ORDER BY c.code, s.section_label";
        sqlite3_stmt* st = nullptr;
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &st, nullptr) == SQLITE_OK) {
            while (sqlite3_step(st) == SQLITE_ROW) {
                SectionInfo s;
                s.id = columnInt(st, 0);
                s.name = columnText(st, 1);
                s.courseId = columnInt(st, 2);
                s.courseName = columnText(st, 3);
                s.teacherId = columnInt(st, 4);
                s.studentCount = columnInt(st, 5);
                addSection(s);
            }
            sqlite3_finalize(st);
        }
    }
    if (!sections.empty()) return sections;
    if (tableExists(db, "Classroom")) {
        vector<string> cols = tableColumns(db, "Classroom");
        string idExpr = "id";
        string secExpr = "";
        if (find(cols.begin(), cols.end(), "section_name") != cols.end()) {
            secExpr = "COALESCE(NULLIF(section_name,''),name,room_number)";
        } else {
            secExpr = "COALESCE(NULLIF(name,''),room_number)";
        }
        string teacherExpr = "";
        if (find(cols.begin(), cols.end(), "teacher_id") != cols.end()) {
            teacherExpr = ", teacher_id";
        } else {
            teacherExpr = ", 0";
        }
        string capExpr = "";
        if (find(cols.begin(), cols.end(), "capacity") != cols.end()) {
            capExpr = ", capacity";
        } else {
            capExpr = ", 0";
        }
        string sql = "SELECT " + idExpr + ", " + secExpr + teacherExpr + capExpr + " FROM Classroom ORDER BY id";
        sqlite3_stmt* st = nullptr;
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &st, nullptr) == SQLITE_OK) {
            while (sqlite3_step(st) == SQLITE_ROW) {
                SectionInfo s;
                s.id = columnInt(st, 0);
                s.name = columnText(st, 1);
                s.teacherId = columnInt(st, 2);
                s.studentCount = columnInt(st, 3);
                // Try to find teacher by assignedClassroom containing section name
                bool found = false;
                string secNameLower = toLower(s.name);
                for (const auto& teacher : teachers) {
                    if (containsIgnoreCase(teacher.assignedClassroom, secNameLower) ||
                        containsIgnoreCase(secNameLower, teacher.assignedClassroom)) {
                        s.teacherId = teacher.id;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    if (!teachers.empty()) s.teacherId = teachers[0].id;
                }
                // course: if teacher has subjects, use first; else from courses via instructorId
                if (s.teacherId > 0) {
                    auto it = find_if(teachers.begin(), teachers.end(), [&](const TeacherInfo& t){ return t.id == s.teacherId; });
                    if (it != teachers.end() && !it->subjects.empty()) {
                        string firstSub = it->subjects[0];
                        auto cit = find_if(courses.begin(), courses.end(), [&](const CourseInfo& c){ return c.code == firstSub; });
                        if (cit != courses.end()) s.courseId = cit->id;
                    } else if (!courses.empty()) {
                        // fallback to first course of that instructor
                        auto cit = find_if(courses.begin(), courses.end(), [&](const CourseInfo& c){ return c.instructorId == s.teacherId; });
                        if (cit != courses.end()) s.courseId = cit->id;
                    }
                } else if (!courses.empty()) {
                    s.courseId = courses[0].id;
                }
                addSection(s);
            }
            sqlite3_finalize(st);
        }
    }
    if (!sections.empty()) return sections;
    if (tableExists(db, "Student")) {
        vector<string> cols = tableColumns(db, "Student");
        string classExpr = "";
        if (find(cols.begin(), cols.end(), "classroom") != cols.end()) {
            classExpr = "classroom";
        } else {
            classExpr = "";
        }
        if (!classExpr.empty()) {
            string sql = "SELECT " + classExpr + ", COUNT(*) FROM Student WHERE " + classExpr + " IS NOT NULL AND " + classExpr + " <> '' GROUP BY " + classExpr;
            sqlite3_stmt* st = nullptr;
            if (sqlite3_prepare_v2(db, sql.c_str(), -1, &st, nullptr) == SQLITE_OK) {
                while (sqlite3_step(st) == SQLITE_ROW) {
                    SectionInfo s;
                    s.name = columnText(st, 0);
                    s.studentCount = columnInt(st, 1);
                    // find teacher by assignedClassroom containing classroom name
                    bool found = false;
                    string classNameLower = toLower(s.name);
                    for (const auto& teacher : teachers) {
                        if (containsIgnoreCase(teacher.assignedClassroom, classNameLower) ||
                            containsIgnoreCase(classNameLower, teacher.assignedClassroom)) {
                            s.teacherId = teacher.id;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        if (!teachers.empty()) s.teacherId = teachers[0].id;
                    }
                    // course: use teacher's first subject or first course
                    if (s.teacherId > 0) {
                        auto it = find_if(teachers.begin(), teachers.end(), [&](const TeacherInfo& t){ return t.id == s.teacherId; });
                        if (it != teachers.end() && !it->subjects.empty()) {
                            string firstSub = it->subjects[0];
                            auto cit = find_if(courses.begin(), courses.end(), [&](const CourseInfo& c){ return c.code == firstSub; });
                            if (cit != courses.end()) s.courseId = cit->id;
                        } else if (!courses.empty()) {
                            auto cit = find_if(courses.begin(), courses.end(), [&](const CourseInfo& c){ return c.instructorId == s.teacherId; });
                            if (cit != courses.end()) s.courseId = cit->id;
                        }
                    } else if (!courses.empty()) {
                        s.courseId = courses[0].id;
                    }
                    addSection(s);
                }
                sqlite3_finalize(st);
            }
        }
    }
    // Final fallback: one section per course
    if (sections.empty() && !courses.empty()) {
        for (size_t i = 0; i < courses.size(); ++i) {
            SectionInfo s;
            s.id = -(int)i - 1; // negative to avoid collision
            s.name = courses[i].code;
            s.teacherId = courses[i].instructorId;
            s.courseId = courses[i].id;
            s.studentCount = courses[i].maxCapacity;
            string key = toLower(s.name);
            if (seen.insert(key).second) sections.push_back(s);
        }
    }
    return sections;
}

static vector<SlotInfo> loadSlots(sqlite3* db) {
    vector<SlotInfo> slots;
    if (!tableExists(db, "TimeSlot")) return slots;
    sqlite3_stmt* st = nullptr;
    string sql = "SELECT id, day, period_number, start_time, end_time FROM TimeSlot ORDER BY CASE day "
                 "WHEN 'Mon' THEN 1 WHEN 'Tue' THEN 2 WHEN 'Wed' THEN 3 WHEN 'Thu' THEN 4 WHEN 'Fri' THEN 5 WHEN 'Sat' THEN 6 ELSE 7 END, period_number";
    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &st, nullptr) != SQLITE_OK) return slots;
    while (sqlite3_step(st) == SQLITE_ROW) {
        SlotInfo sl;
        sl.id = columnInt(st, 0);
        sl.day = columnText(st, 1);
        sl.period = columnInt(st, 2);
        sl.startTime = columnText(st, 3);
        sl.endTime = columnText(st, 4);
        slots.push_back(sl);
    }
    if (st) sqlite3_finalize(st);
    return slots;
}

/* Timetable generation - now loads all data from database */
void TimeTable() {
    sqlite3* db = nullptr;
    try {
        db = openDatabase();
        vector<TeacherInfo> teachers = loadTeachers(db);
        vector<CourseInfo> courses = loadCourses(db);
        vector<SectionInfo> sections = loadSections(db, teachers, courses);
        vector<SlotInfo> slots = loadSlots(db);

        if (teachers.empty() || sections.empty() || slots.empty()) {
            cerr << "Error: Insufficient data from database to generate timetable.\n";
            if (db) sqlite3_close(db);
            return;
        }

        // Build day order and period set
        map<string, int> dayIndexMap;
        vector<string> dayNames;
        set<int> periodSet;
        for (const auto& sl : slots) {
            if (dayIndexMap.find(sl.day) == dayIndexMap.end()) {
                int idx = (int)dayNames.size();
                dayIndexMap[sl.day] = idx;
                dayNames.push_back(sl.day);
            }
            periodSet.insert(sl.period);
        }
        vector<int> periodNumbers(periodSet.begin(), periodSet.end());
        sort(periodNumbers.begin(), periodNumbers.end());
        int periodsPerDay = (int)periodNumbers.size();

        // Prepare teacher-slot occupancy matrix
        vector<vector<bool>> teacherSlot(teachers.size(), vector<bool>(slots.size(), false));
        vector<int> teacherLoad(teachers.size(), 0);
        // Map database teacher ID to vector index
        unordered_map<int, int> teacherIdToIndex;
        for (size_t i = 0; i < teachers.size(); ++i) {
            teacherIdToIndex[teachers[i].id] = (int)i;
        }

        // For each section, generate timetable
        for (const auto& sec : sections) {
            cout << "\n================== TIMETABLE FOR SECTION: " << sec.name << " ==================\n";
            if (sec.courseId > 0 && sec.courseId < (int)courses.size()) {
                const CourseInfo& crs = courses[sec.courseId];
                cout << "Course: " << crs.code << " - " << crs.name << "\n";
            }
            cout << left << setw(10) << "Day";
            for (int p : periodNumbers) {
                cout << left << setw(10) << ("P" + to_string(p));
            }
            cout << "\n";
            cout << string(10 + periodsPerDay * 10, '-') << "\n";

            string lastTeacher = "";
            for (const string& day : dayNames) {
                cout << left << setw(10) << day;
                for (int period : periodNumbers) {
                    // Find slot index for this day/period
                    int slotIdx = -1;
                    for (size_t i = 0; i < slots.size(); ++i) {
                        if (slots[i].day == day && slots[i].period == period) {
                            slotIdx = (int)i;
                            break;
                        }
                    }
                    if (slotIdx == -1) {
                        cout << left << setw(10) << "Free";
                        continue;
                    }
                    // Determine eligible teachers for this section
                    vector<int> eligible;
                    auto it = teacherIdToIndex.find(sec.teacherId);
                    if (sec.teacherId > 0 && it != teacherIdToIndex.end()) {
                        eligible.push_back(it->second);
                    } else {
                        for (size_t i = 0; i < teachers.size(); ++i) eligible.push_back((int)i);
                    }
                    // If section has a course, prefer teachers that teach it
                    if (sec.courseId > 0 && sec.courseId < (int)courses.size()) {
                        string courseCode = courses[sec.courseId].code;
                        vector<int> pref;
                        for (int ti : eligible) {
                            bool teaches = false;
                            for (const string& sub : teachers[ti].subjects) {
                                if (sub == courseCode) { teaches = true; break; }
                            }
                            if (teaches) pref.push_back(ti);
                        }
                        if (!pref.empty()) eligible = pref;
                    }
                    // Choose teacher: not same as last, not already booked in this slot, least load
                    int chosen = -1;
                    int bestLoad = INT_MAX;
                    for (int ti : eligible) {
                        if (teachers[ti].name == lastTeacher) continue;
                        if (teacherSlot[ti][slotIdx]) continue;
                        if (teacherLoad[ti] < bestLoad) {
                            bestLoad = teacherLoad[ti];
                            chosen = ti;
                        }
                    }
                    if (chosen == -1) {
                        // Fallback: allow same teacher as last, but still avoid slot conflict
                        for (int ti : eligible) {
                            if (teacherSlot[ti][slotIdx]) continue;
                            if (teacherLoad[ti] < bestLoad) {
                                bestLoad = teacherLoad[ti];
                                chosen = ti;
                            }
                        }
                    }
                    if (chosen == -1) {
                        // Fallback: ignore slot conflict, just avoid same last teacher
                        for (int ti : eligible) {
                            if (teachers[ti].name == lastTeacher) continue;
                            if (teacherLoad[ti] < bestLoad) {
                                bestLoad = teacherLoad[ti];
                                chosen = ti;
                            }
                        }
                    }
                    if (chosen == -1) {
                        // Last resort: any eligible teacher
                        for (int ti : eligible) {
                            if (teacherLoad[ti] < bestLoad) {
                                bestLoad = teacherLoad[ti];
                                chosen = ti;
                            }
                        }
                    }
                    if (chosen == -1 && !eligible.empty()) chosen = eligible[0];
                    string teacherName = (chosen >= 0 && chosen < (int)teachers.size()) ? teachers[chosen].name : "Free";
                    string subject = "Free";
                    if (chosen >= 0 && chosen < (int)teachers.size() && !teachers[chosen].subjects.empty()) {
                        subject = teachers[chosen].subjects[0]; // simple: first subject
                    }
                    // Update occupancy and load
                    if (chosen >= 0 && chosen < (int)teachers.size()) {
                        teacherSlot[chosen][slotIdx] = true;
                        teacherLoad[chosen]++;
                    }
                    lastTeacher = (chosen >= 0 && chosen < (int)teachers.size()) ? teachers[chosen].name : "";
                    cout << left << setw(10) << (teacherName + "(" + subject + ")");
                }
                cout << "\n";
            }
            cout << string(10 + periodsPerDay * 10, '-') << "\n";
            cout << "Teacher Load (Whole Week):\n";
            cout << "-----------------------------\n";
            for (size_t i = 0; i < teachers.size(); ++i) {
                cout << left << setw(15) << teachers[i].name << " : " << teacherLoad[i] << " periods\n";
            }
            cout << "-----------------------------\n";
        }

        if (db) sqlite3_close(db);
    } catch (const exception& e) {
        cerr << "Error in TimeTable: " << e.what() << endl;
        if (db) sqlite3_close(db);
    }
}

void ShowStudentDetails(){
    ifstream Studentfile("Student.txt");
    string line;
    cout << "\n--- Student Details ---\n";
    while (getline(Studentfile, line)) {
        cout << line << endl;
    }
    Studentfile.close();
}

void showEmployeeDetails(){
    ifstream Employeefile("Employee.txt");
    string line;
    cout << "\n--- Employee Details ---\n";
    while (getline(Employeefile, line)) {
        cout << line << endl;
    }
    Employeefile.close();
}

void showTeacherDetails(){
    ifstream Teacherfile("Teacher.txt");
    string line;
    cout << "\n--- Teacher Details ---\n";
    while (getline(Teacherfile, line)) {
        cout << line << endl;
    }
    Teacherfile.close();
}

void AddStudentMarks(){
    cout << "Functionality to add student marks is not yet implemented.\n";
}

int main(){
    cout<<"------Welcome to College Management System------\n";
    int choice =0;

    while (choice !=7){
        cout<<"1. Add Student\n";
        cout<<"2. Add Employee\n";
        cout<<"3. Add Teacher\n";
        cout<<"4. Display Student/Employee/Teacher\n\n";
        cout<<"5. Add Student Marks\n";
        cout<<"6. Timetable Generator\n";
        cout<<"7. Exit\n";
        cout<<"Enter your choice:\t";
        cin >> choice;


        switch (choice){
            case 1:
                AddStudent();
                break;
            case 2:
                AddEmployee();
                break;
            case 3:
                AddTeacher();
                break;
            case 4:
                cout<<"Enter The Catagory which you want to Display:\n1. Student\n2. Employee\n3. Teacher\n";
                int x;
                cin>>x;
                switch(x){
                    case 1:
                        ShowStudentDetails();
                        break;
                    case 2:
                        showEmployeeDetails();
                        break;
                    case 3:
                        showTeacherDetails();
                        break;
                    default:
                        cout<<"Invalid choice."<<endl;
                }
                break;
            case 5:
                AddStudentMarks();
                break;
            case 6:
                TimeTable();
                break;
            case 7:
                cout << "Exiting the program." << endl;
                break;
            default:
                cout << "Invalid choice. Please try again." << endl;
        }
    }

    return 0;
}