#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <algorithm>
#include <map>
#include <set>
#include <cstdint>
#include <filesystem>
#include <sqlite3.h>

using namespace std;

namespace fs = std::filesystem;

string FindDatabasePath() {
    vector<string> candidates = {
        "C:/Users/Chintu/Documents/Code/langs/C++ project/backend/build/bin/college.db"
    };
    
    for (const string& path : candidates) {
        if (fs::exists(path)) {
            return fs::absolute(path).string();
        }
    }
    return "college.db";
}

struct Teacher {
    int64_t id;
    string name;
    string department;
    int totalClasses = 0;
    map<pair<int, int>, bool> occupied;
};

struct Classroom {
    int64_t id;
    string roomNumber;
    string name;
    int capacity = 0;
};

struct TimeSlot {
    int dayIndex;
    int periodNumber;
    string day;
    string startTime;
    string endTime;
};

struct Assignment {
    int64_t teacherId;
    string teacherName;
    string department;
    int64_t classroomId;
    string classroomName;
    int dayIndex;
    int periodNumber;
    string startTime;
    string endTime;
};

struct TimeTableData {
    vector<Teacher> teachers;
    vector<Classroom> classrooms;
    vector<TimeSlot> timeSlots;
    vector<Assignment> assignments;
};

const vector<string> DAYS = {"Mon", "Tue", "Wed", "Thu", "Fri"};
const int PERIODS_PER_DAY = 3;
const vector<pair<string, string>> PERIOD_TIMES = {
    {"08:00", "09:00"},
    {"09:00", "10:00"},
    {"10:00", "11:00"}
};

int dayIndex(const string& d) {
    for (int i = 0; i < 5; ++i) if (DAYS[i] == d) return i;
    return -1;
}

bool initializeDatabase(sqlite3* db) {
    sqlite3_exec(db, "PRAGMA foreign_keys = ON;", nullptr, nullptr, nullptr);
    return true;
}

bool loadTeachers(sqlite3* db, TimeTableData& data) {
    const char* sql = "SELECT t.id, p.name, t.department "
                      "FROM Teacher t "
                      "JOIN Person p ON t.id = p.id "
                      "WHERE t.status = 'active' AND p.discriminator = 'Teacher';";
    
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        cerr << "Load teachers failed: " << sqlite3_errmsg(db) << endl;
        return false;
    }
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        Teacher t;
        t.id = sqlite3_column_int64(stmt, 0);
        t.name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        t.department = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        data.teachers.push_back(t);
    }
    sqlite3_finalize(stmt);
    cout << "Loaded " << data.teachers.size() << " teachers\n";
    return !data.teachers.empty();
}

bool loadClassrooms(sqlite3* db, TimeTableData& data) {
    const char* sql = "SELECT id, room_number, name, capacity FROM Classroom;";
    
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        cerr << "Load classrooms failed: " << sqlite3_errmsg(db) << endl;
        return false;
    }
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        Classroom cr;
        cr.id = sqlite3_column_int64(stmt, 0);
        cr.roomNumber = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        cr.name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        cr.capacity = sqlite3_column_int(stmt, 3);
        data.classrooms.push_back(cr);
    }
    sqlite3_finalize(stmt);
    cout << "Loaded " << data.classrooms.size() << " classrooms\n";
    return true;
}

bool loadTeacherClassrooms(sqlite3* db, TimeTableData& data) {
    const char* sql = "SELECT tc.teacher_id, tc.classroom_id "
                      "FROM TeacherClassroom tc;";
    
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        cerr << "Load teacher-classrooms failed: " << sqlite3_errmsg(db) << endl;
        return false;
    }
    
    map<int64_t, vector<int64_t>> teacherRooms;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        int64_t teacherId = sqlite3_column_int64(stmt, 0);
        int64_t classroomId = sqlite3_column_int64(stmt, 1);
        teacherRooms[teacherId].push_back(classroomId);
    }
    sqlite3_finalize(stmt);
    
    for (auto& teacher : data.teachers) {
        auto it = teacherRooms.find(teacher.id);
        if (it != teacherRooms.end()) {
            teacher.totalClasses = it->second.size();
        }
    }
    
    cout << "Loaded teacher-classroom mappings\n";
    return true;
}

void generateTimeSlots(TimeTableData& data) {
    for (int dayIdx = 0; dayIdx < 5; ++dayIdx) {
        for (int period = 1; period <= PERIODS_PER_DAY; ++period) {
            TimeSlot ts;
            ts.dayIndex = dayIdx;
            ts.periodNumber = period;
            ts.day = DAYS[dayIdx];
            ts.startTime = PERIOD_TIMES[period - 1].first;
            ts.endTime = PERIOD_TIMES[period - 1].second;
            data.timeSlots.push_back(ts);
        }
    }
    cout << "Generated " << data.timeSlots.size() << " time slots (5 days x 3 periods)\n";
}

bool generateTimeTable(TimeTableData& data) {
    map<pair<int, int>, int64_t> classroomSchedule;
    
    for (auto& teacher : data.teachers) {
        teacher.occupied.clear();
    }
    
    for (auto& teacher : data.teachers) {
        if (teacher.totalClasses == 0) continue;
        
        int assigned = 0;
        
        for (const auto& slot : data.timeSlots) {
            if (assigned >= teacher.totalClasses) break;
            
            auto teacherKey = make_pair(slot.dayIndex, slot.periodNumber);
            if (teacher.occupied.find(teacherKey) != teacher.occupied.end()) continue;
            
            bool hasClassOnDay = false;
            for (const auto& occ : teacher.occupied) {
                if (occ.first.first == slot.dayIndex) {
                    hasClassOnDay = true;
                    break;
                }
            }
            if (hasClassOnDay) continue;
            
            int64_t classroomId = 0;
            string classroomName = "";
            
            for (const auto& classroom : data.classrooms) {
                auto classKey = make_pair(slot.dayIndex, slot.periodNumber);
                if (classroomSchedule.find(classKey) != classroomSchedule.end() &&
                    classroomSchedule[classKey] == classroom.id) {
                    continue;
                }
                classroomId = classroom.id;
                classroomName = classroom.name;
                break;
            }
            
            if (classroomId == 0) continue;
            
            Assignment a;
            a.teacherId = teacher.id;
            a.teacherName = teacher.name;
            a.department = teacher.department;
            a.classroomId = classroomId;
            a.classroomName = classroomName;
            a.dayIndex = slot.dayIndex;
            a.periodNumber = slot.periodNumber;
            a.startTime = slot.startTime;
            a.endTime = slot.endTime;
            
            teacher.occupied[teacherKey] = true;
            classroomSchedule[teacherKey] = classroomId;
            assigned++;
            
            data.assignments.push_back(a);
        }
    }
    
    cout << "Timetable generated: " << data.assignments.size() << " assignments\n";
    return true;
}

void displayTimetable(const TimeTableData& data) {
    cout << "\n================================================================================\n";
    cout << "TEACHER-CLASSROOM TIMETABLE (5 Days x 3 Periods)\n";
    cout << "================================================================================\n\n";
    
    map<string, map<int, vector<Assignment>>> byTeacher;
    for (const auto& a : data.assignments) {
        byTeacher[a.teacherName][a.periodNumber].push_back(a);
    }
    
    cout << left << setw(22) << "Teacher";
    for (int p = 1; p <= PERIODS_PER_DAY; ++p) {
        cout << left << setw(28) << ("P" + to_string(p) + " (" + PERIOD_TIMES[p-1].first + "-" + PERIOD_TIMES[p-1].second + ")");
    }
    cout << "\n";
    cout << string(22 + PERIODS_PER_DAY * 28, '-') << "\n";
    
    for (const string& day : DAYS) {
        cout << left << setw(22) << day;
        
        for (int p = 1; p <= PERIODS_PER_DAY; ++p) {
            string cell = "Free";
            for (const auto& teacherPair : byTeacher) {
                if (teacherPair.second.find(p) != teacherPair.second.end()) {
                    for (const auto& a : teacherPair.second.at(p)) {
                        if (a.dayIndex == dayIndex(day)) {
                            cell = a.teacherName + " / " + a.classroomName;
                            break;
                        }
                    }
                }
            }
            if (cell.length() > 27) cell = cell.substr(0, 24) + "...";
            cout << left << setw(28) << cell;
        }
        cout << "\n";
    }
    
    cout << "\n========== TEACHER SUMMARY ==========\n";
    cout << left << setw(22) << "Teacher" << setw(15) << "Department" << setw(10) << "Classes" << setw(10) << "Assigned" << "\n";
    cout << string(57, '-') << "\n";
    for (const auto& t : data.teachers) {
        int assigned = t.occupied.size();
        cout << left << setw(22) << t.name.substr(0, 21) 
             << setw(15) << t.department.substr(0, 14)
             << setw(10) << t.totalClasses 
             << setw(10) << assigned << "\n";
    }
    cout << "\n";
}

void displayByClassroom(const TimeTableData& data) {
    map<string, map<int, vector<Assignment>>> byClassroom;
    for (const auto& a : data.assignments) {
        byClassroom[a.classroomName][a.periodNumber].push_back(a);
    }
    
    cout << "\n========== CLASSROOM TIMETABLES ==========\n";
    
    for (const auto& crPair : byClassroom) {
        const string& classroomName = crPair.first;
        const auto& periodsMap = crPair.second;
        
        cout << "\n--- " << classroomName << " ---\n";
        cout << left << setw(10) << "Day";
        for (int p = 1; p <= PERIODS_PER_DAY; ++p) {
            cout << left << setw(30) << ("P" + to_string(p));
        }
        cout << "\n";
        cout << string(10 + PERIODS_PER_DAY * 30, '-') << "\n";
        
        for (const string& day : DAYS) {
            cout << left << setw(10) << day;
            
            for (int p = 1; p <= PERIODS_PER_DAY; ++p) {
                string cell = "Free";
                if (periodsMap.find(p) != periodsMap.end()) {
                    for (const auto& a : periodsMap.at(p)) {
                        if (a.dayIndex == dayIndex(day)) {
                            cell = a.teacherName + " (" + a.department + ")";
                            break;
                        }
                    }
                }
                if (cell.length() > 29) cell = cell.substr(0, 26) + "...";
                cout << left << setw(30) << cell;
            }
            cout << "\n";
        }
    }
    
    cout << "\n========== CLASSROOM UTILIZATION ==========\n";
    cout << left << setw(20) << "Classroom" << setw(10) << "Used" << setw(10) << "Total" << setw(10) << "Util %" << "\n";
    cout << string(50, '-') << "\n";
    
    int totalSlots = 5 * PERIODS_PER_DAY;
    for (const auto& cr : data.classrooms) {
        int used = 0;
        if (byClassroom.find(cr.name) != byClassroom.end()) {
            for (const auto& periodPair : byClassroom.at(cr.name)) {
                    used += periodPair.second.size();
                }
        }
        double util = totalSlots > 0 ? (100.0 * used / totalSlots) : 0;
        cout << left << setw(20) << cr.name.substr(0, 19) 
             << setw(10) << used 
             << setw(10) << totalSlots 
             << setw(10) << fixed << setprecision(1) << util << "\n";
    }
    cout << "\n";
}

void saveToDatabase(const TimeTableData& data, sqlite3* db) {
    sqlite3_exec(db, "BEGIN TRANSACTION;", nullptr, nullptr, nullptr);
    
    const char* createTableSQL = 
        "CREATE TABLE IF NOT EXISTS TeacherClassroomTimetable ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "teacher_id INTEGER NOT NULL,"
        "teacher_name TEXT NOT NULL,"
        "department TEXT NOT NULL,"
        "classroom_id INTEGER NOT NULL,"
        "classroom_name TEXT NOT NULL,"
        "day TEXT NOT NULL,"
        "period_number INTEGER NOT NULL,"
        "start_time TEXT NOT NULL,"
        "end_time TEXT NOT NULL,"
        "created_at TEXT DEFAULT (datetime('now'))"
        ");";
    
    char* errMsg = nullptr;
    if (sqlite3_exec(db, createTableSQL, nullptr, nullptr, &errMsg) != SQLITE_OK) {
        cerr << "Create result table failed: " << (errMsg ? errMsg : "") << endl;
        if (errMsg) sqlite3_free(errMsg);
        sqlite3_exec(db, "ROLLBACK;", nullptr, nullptr, nullptr);
        return;
    }
    
    sqlite3_exec(db, "DELETE FROM TeacherClassroomTimetable;", nullptr, nullptr, nullptr);
    
    const char* insertSQL = "INSERT INTO TeacherClassroomTimetable (teacher_id, teacher_name, department, classroom_id, classroom_name, day, period_number, start_time, end_time) "
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
    
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, insertSQL, -1, &stmt, nullptr) != SQLITE_OK) {
        cerr << "Prepare insert failed: " << sqlite3_errmsg(db) << endl;
        sqlite3_exec(db, "ROLLBACK;", nullptr, nullptr, nullptr);
        return;
    }
    
    int saved = 0;
    for (const auto& a : data.assignments) {
        sqlite3_bind_int64(stmt, 1, a.teacherId);
        sqlite3_bind_text(stmt, 2, a.teacherName.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, a.department.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int64(stmt, 4, a.classroomId);
        sqlite3_bind_text(stmt, 5, a.classroomName.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 6, DAYS[a.dayIndex].c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int(stmt, 7, a.periodNumber);
        sqlite3_bind_text(stmt, 8, a.startTime.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 9, a.endTime.c_str(), -1, SQLITE_TRANSIENT);
        
        if (sqlite3_step(stmt) == SQLITE_DONE) {
            saved++;
        }
        sqlite3_reset(stmt);
    }
    
    sqlite3_finalize(stmt);
    sqlite3_exec(db, "COMMIT;", nullptr, nullptr, nullptr);
    cout << "Saved " << saved << " assignments to database (TeacherClassroomTimetable table)\n";
}

void runTimetableGenerator() {
    cout << "\n" << string(80, '=') << "\n";
    cout << "TEACHER-CLASSROOM TIMETABLE GENERATOR\n";
    cout << "5 Days (Mon-Fri) x 3 Periods (08:00-11:00)\n";
    cout << string(80, '=') << "\n";
    
    string dbPath = FindDatabasePath();
    cout << "Using database: " << dbPath << "\n";
    
    sqlite3* db;
    int rc = sqlite3_open(dbPath.c_str(), &db);
    if (rc != SQLITE_OK) {
        cerr << "Cannot open database: " << sqlite3_errmsg(db) << endl;
        sqlite3_close(db);
        return;
    }
    
    if (!initializeDatabase(db)) {
        sqlite3_close(db);
        return;
    }
    
    TimeTableData data;
    
    if (!loadTeachers(db, data)) {
        cerr << "Failed to load teachers\n";
        sqlite3_close(db);
        return;
    }
    
    if (!loadClassrooms(db, data)) {
        cerr << "Failed to load classrooms\n";
        sqlite3_close(db);
        return;
    }
    
    if (!loadTeacherClassrooms(db, data)) {
        cerr << "Failed to load teacher-classroom mappings\n";
    }
    
    generateTimeSlots(data);
    
    cout << "\n========== GENERATING TIMETABLE ==========\n";
    if (!generateTimeTable(data)) {
        cerr << "Timetable generation failed\n";
        sqlite3_close(db);
        return;
    }
    
    displayTimetable(data);
    displayByClassroom(data);
    
    cout << "========== SAVING TO DATABASE ==========\n";
    saveToDatabase(data, db);
    
    sqlite3_close(db);
}

int main() {
    cout << "------ Timetable Generator ------\n";
    int choice = 0;
    
    while (choice != 2) {
        cout << "\n1. Generate Timetable\n";
        cout << "2. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;
        
        switch (choice) {
            case 1:
                runTimetableGenerator();
                break;
            case 2:
                cout << "Exiting...\n";
                break;
            default:
                cout << "Invalid choice. Please try again.\n";
        }
    }
    
    return 0;
}