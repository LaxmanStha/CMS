#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <iomanip>
#include <algorithm>
#include <map>
#include <climits>
#include <ctime>
#include <sqlite3.h>
#include <cstdint>
#include <set>
#include <utility>
#include <numeric>
#include <filesystem>

using namespace std;

namespace fs = std::filesystem;

string FindDatabasePath() {
    vector<string> candidates = {
        "../../build/bin/college.db",   // from backend/src/output
        "../build/bin/college.db",      // from backend/src
        "backend/build/bin/college.db", // from project root
        "build/bin/college.db",         // from project root
        "college.db"
    };
    
    for (const string& path : candidates) {
        if (fs::exists(path)) {
            return fs::absolute(path).string();
        }
    }
    
    // Fallback: create in current directory
    return "college.db";
}

bool InitializeSchema(sqlite3* db) {
    const char* checkSQL = "SELECT 1 FROM sqlite_master WHERE type='table' AND name='Teacher' LIMIT 1;";
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, checkSQL, -1, &stmt, nullptr) == SQLITE_OK) {
        bool hasTable = (sqlite3_step(stmt) == SQLITE_ROW);
        sqlite3_finalize(stmt);
        if (hasTable) return true;
    }
    
    string schemaPath = fs::exists("schema.sql") ? "schema.sql" : 
                        fs::exists("../schema.sql") ? "../schema.sql" :
                        fs::exists("../../src/schema.sql") ? "../../src/schema.sql" :
                        fs::exists("backend/src/schema.sql") ? "backend/src/schema.sql" : "";
    
    if (!schemaPath.empty()) {
        ifstream f(schemaPath);
        if (f) {
            stringstream ss;
            ss << f.rdbuf();
            char* errMsg = nullptr;
            int rc = sqlite3_exec(db, ss.str().c_str(), nullptr, nullptr, &errMsg);
            if (rc != SQLITE_OK) {
                cerr << "Schema initialization failed: " << (errMsg ? errMsg : "unknown error") << endl;
                if (errMsg) sqlite3_free(errMsg);
                return false;
            }
            cout << "Schema initialized from " << schemaPath << "\n";
        }
    } else {
        cerr << "Schema file not found\n";
        return false;
    }
    
    // Load seed data if available
    string seedPath = fs::exists("seed_data.sql") ? "seed_data.sql" : 
                      fs::exists("../seed_data.sql") ? "../seed_data.sql" :
                      fs::exists("../../src/seed_data.sql") ? "../../src/seed_data.sql" :
                      fs::exists("backend/src/seed_data.sql") ? "backend/src/seed_data.sql" : "";
    
    if (!seedPath.empty()) {
        ifstream f(seedPath);
        if (f) {
            stringstream ss;
            ss << f.rdbuf();
            char* errMsg = nullptr;
            int rc = sqlite3_exec(db, ss.str().c_str(), nullptr, nullptr, &errMsg);
            if (rc != SQLITE_OK) {
                cerr << "Seed data load failed: " << (errMsg ? errMsg : "unknown error") << endl;
                if (errMsg) sqlite3_free(errMsg);
            } else {
                cout << "Seed data loaded from " << seedPath << "\n";
            }
        }
    }
    
    return true;
}

struct Teacher {
    int64_t id;
    string name;
    int totalLoad = 0;
    map<pair<int, int>, int64_t> allocation;
};

struct Course {
    int64_t id;
    string name;
    string code;
    int credits;
};

struct Classroom {
    int64_t id;
    string roomNumber;
    string name;
};

struct Section {
    int64_t id;
    int64_t courseId;
    string courseLabel;
    string sectionLabel;
    int64_t teacherId;
    string teacherName;
    int studentCount;
};

struct TimeSlotConfig {
    int64_t id;
    string day;
    int periodNumber;
    string startTime;
    string endTime;
};

struct TimeTableData {
    int64_t sectionId;
    string sectionName;
    int64_t courseId;
    string courseCode;
    int64_t teacherId;
    string teacherName;
    int64_t roomId;
    string roomName;
    int64_t slotId;
    string day;
    int periodNumber;
    string startTime;
    string endTime;
};

struct AllocationSetup {
    vector<Teacher> teachers;
    vector<Classroom> classrooms;
    vector<Course> courses;
    vector<Section> sections;
    vector<TimeSlotConfig> timeSlots;
    int days = 0;
    int periodsPerDay = 0;
};

int dayIndex(const string& d) {
    const char* days[] = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
    for (int i = 0; i < 6; ++i) if (d == days[i]) return i;
    return -1;
}

bool LoadTeachersFromDatabase(sqlite3* db, AllocationSetup& setup) {
    const char* sql = "SELECT t.id, p.name FROM Teacher t "
                      "JOIN Person p ON t.id = p.id "
                      "WHERE p.discriminator = 'Teacher' AND t.status = 'active';";
    
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        cerr << "Query failed: " << sqlite3_errmsg(db) << endl;
        return false;
    }
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        Teacher t;
        t.id = sqlite3_column_int64(stmt, 0);
        const unsigned char* nameText = sqlite3_column_text(stmt, 1);
        t.name = nameText ? (const char*)nameText : "";
        setup.teachers.push_back(t);
    }
    
    sqlite3_finalize(stmt);
    cout << "Loaded " << setup.teachers.size() << " teachers\n";
    return !setup.teachers.empty();
}

bool LoadCoursesFromDatabase(sqlite3* db, AllocationSetup& setup) {
    const char* sql = "SELECT id, name, code, credits, department, instructorId, semester, status "
                      "FROM Course WHERE status = 'active';";
    
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        cerr << "Query failed: " << sqlite3_errmsg(db) << endl;
        return false;
    }
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        Course c;
        c.id = sqlite3_column_int64(stmt, 0);
        const unsigned char* nameText = sqlite3_column_text(stmt, 1);
        c.name = nameText ? (const char*)nameText : "";
        const unsigned char* codeText = sqlite3_column_text(stmt, 2);
        c.code = codeText ? (const char*)codeText : "";
        c.credits = sqlite3_column_int(stmt, 3);
        setup.courses.push_back(c);
    }
    
    sqlite3_finalize(stmt);
    cout << "Loaded " << setup.courses.size() << " courses\n";
    return !setup.courses.empty();
}

bool LoadClassroomsFromDatabase(sqlite3* db, AllocationSetup& setup) {
    const char* sql = "SELECT id, room_number, name FROM Classroom;";
    
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        cerr << "Query failed: " << sqlite3_errmsg(db) << endl;
        return false;
    }
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        Classroom cr;
        cr.id = sqlite3_column_int64(stmt, 0);
        const unsigned char* roomNumText = sqlite3_column_text(stmt, 1);
        cr.roomNumber = roomNumText ? (const char*)roomNumText : "";
        const unsigned char* nameText = sqlite3_column_text(stmt, 2);
        cr.name = nameText ? (const char*)nameText : "";
        setup.classrooms.push_back(cr);
    }
    
    sqlite3_finalize(stmt);
    cout << "Loaded " << setup.classrooms.size() << " classrooms\n";
    return true; // Classrooms are optional
}

bool LoadSectionsFromDatabase(sqlite3* db, AllocationSetup& setup) {
    const char* sql = "SELECT s.id, s.course_id, s.section_label, s.teacher_id, s.student_count, "
                      "c.name, c.code, p.name "
                      "FROM Sections s "
                      "JOIN Course c ON s.course_id = c.id "
                      "LEFT JOIN Teacher t ON s.teacher_id = t.id "
                      "LEFT JOIN Person p ON t.id = p.id "
                      "WHERE c.status = 'active';";
    
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        cerr << "Query failed: " << sqlite3_errmsg(db) << endl;
        return false;
    }
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        Section s;
        s.id = sqlite3_column_int64(stmt, 0);
        s.courseId = sqlite3_column_int64(stmt, 1);
        const unsigned char* labelText = sqlite3_column_text(stmt, 2);
        s.sectionLabel = labelText ? (const char*)labelText : "";
        s.teacherId = sqlite3_column_int64(stmt, 3);
        s.studentCount = sqlite3_column_int(stmt, 4);
        const unsigned char* courseName = sqlite3_column_text(stmt, 5);
        const unsigned char* courseCode = sqlite3_column_text(stmt, 6);
        const unsigned char* teacherName = sqlite3_column_text(stmt, 7);
        
        string cn = courseName ? (const char*)courseName : "";
        string cc = courseCode ? (const char*)courseCode : "";
        s.courseLabel = cn + " " + s.sectionLabel;
        s.teacherName = teacherName ? (const char*)teacherName : "";
        setup.sections.push_back(s);
    }
    
    sqlite3_finalize(stmt);
    cout << "Loaded " << setup.sections.size() << " sections\n";
    return !setup.sections.empty();
}

bool LoadTimeSlotsFromDatabase(sqlite3* db, AllocationSetup& setup) {
    const char* sql = "SELECT id, day, period_number, start_time, end_time FROM TimeSlot ORDER BY day, period_number;";
    
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        cerr << "Query failed: " << sqlite3_errmsg(db) << endl;
        return false;
    }
    
    set<string> uniqueDays;
    int maxPeriod = 0;
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        TimeSlotConfig ts;
        ts.id = sqlite3_column_int64(stmt, 0);
        const unsigned char* dayText = sqlite3_column_text(stmt, 1);
        ts.day = dayText ? (const char*)dayText : "";
        ts.periodNumber = sqlite3_column_int(stmt, 2);
        const unsigned char* startText = sqlite3_column_text(stmt, 3);
        ts.startTime = startText ? (const char*)startText : "";
        const unsigned char* endText = sqlite3_column_text(stmt, 4);
        ts.endTime = endText ? (const char*)endText : "";
        setup.timeSlots.push_back(ts);
        
        uniqueDays.insert(ts.day);
        maxPeriod = max(maxPeriod, ts.periodNumber);
    }
    
    sqlite3_finalize(stmt);
    setup.days = uniqueDays.size();
    setup.periodsPerDay = maxPeriod;
    
    cout << "Loaded " << setup.timeSlots.size() << " time slots (" << setup.days 
         << " days, " << setup.periodsPerDay << " periods/day)\n";
    return !setup.timeSlots.empty();
}

bool ValidateDatabaseData(const AllocationSetup& setup) {
    cout << "\n========== VALIDATING DATABASE DATA ==========\n";
    
    bool valid = true;
    
    if (setup.teachers.empty()) {
        cerr << "No active teachers found\n";
        valid = false;
    }
    
    if (setup.courses.empty()) {
        cerr << "No active courses found\n";
        valid = false;
    }
    
    if (setup.sections.empty()) {
        cerr << "No sections found\n";
        valid = false;
    }
    
    if (setup.timeSlots.empty()) {
        cerr << "No time slots configured\n";
        valid = false;
    }
    
    for (const auto& sec : setup.sections) {
        auto it = find_if(setup.teachers.begin(), setup.teachers.end(),
                         [&](const Teacher& t) { return t.id == sec.teacherId; });
        if (it == setup.teachers.end() && sec.teacherId != 0) {
            cerr << "Section " << sec.courseLabel << " references invalid teacher ID " << sec.teacherId << "\n";
            valid = false;
        }
    }
    
    if (valid) {
        cout << "All validation passed\n";
        cout << "  Teachers: " << setup.teachers.size() << "\n";
        cout << "  Classrooms: " << setup.classrooms.size() << "\n";
        cout << "  Courses: " << setup.courses.size() << "\n";
        cout << "  Sections: " << setup.sections.size() << "\n";
        cout << "  Time Slots: " << setup.timeSlots.size() << " (" << setup.days 
             << " days x " << setup.periodsPerDay << " periods)\n";
    }
    
    return valid;
}

bool TeacherCanTeachSection(const Teacher& teacher, const Section& section) {
    return teacher.id == section.teacherId;
}

vector<TimeTableData> GenerateAllTimetables(AllocationSetup& setup) {
    vector<TimeTableData> allEntries;
    map<pair<int, int>, int64_t> classroomAllocation;
    
    for (auto& teacher : setup.teachers) {
        teacher.allocation.clear();
        teacher.totalLoad = 0;
    }
    
    vector<int> sectionOrder(setup.sections.size());
    iota(sectionOrder.begin(), sectionOrder.end(), 0);
    
    sort(sectionOrder.begin(), sectionOrder.end(), [&](int a, int b) {
        int countA = 0, countB = 0;
        for (const auto& t : setup.teachers) {
            if (TeacherCanTeachSection(t, setup.sections[a])) countA++;
            if (TeacherCanTeachSection(t, setup.sections[b])) countB++;
        }
        return countA < countB;
    });
    
    for (const TimeSlotConfig& slot : setup.timeSlots) {
        int dayIdx = dayIndex(slot.day);
        if (dayIdx < 0) continue;
        
        for (int secIdx : sectionOrder) {
            const Section& section = setup.sections[secIdx];
            
            int bestTeacherIdx = -1;
            int lowestLoad = INT_MAX;
            
            for (size_t t = 0; t < setup.teachers.size(); ++t) {
                if (!TeacherCanTeachSection(setup.teachers[t], section)) continue;
                
                auto key = make_pair(dayIdx, slot.periodNumber);
                if (setup.teachers[t].allocation.find(key) != setup.teachers[t].allocation.end()) continue;
                
                if (setup.teachers[t].totalLoad < lowestLoad) {
                    lowestLoad = setup.teachers[t].totalLoad;
                    bestTeacherIdx = static_cast<int>(t);
                }
            }
            
            // Find available classroom
            int bestClassroomIdx = -1;
            for (size_t i = 0; i < setup.classrooms.size(); ++i) {
                auto key = make_pair(dayIdx, slot.periodNumber);
                if (classroomAllocation.find(key) != classroomAllocation.end() && classroomAllocation.at(key) == setup.classrooms[i].id) {
                    continue;
                }
                bestClassroomIdx = static_cast<int>(i);
                break;
            }
            
            TimeTableData entry;
            entry.sectionId = section.id;
            entry.sectionName = section.courseLabel;
            entry.courseId = section.courseId;
            entry.courseCode = section.courseLabel;
            entry.day = slot.day;
            entry.periodNumber = slot.periodNumber;
            entry.startTime = slot.startTime;
            entry.endTime = slot.endTime;
            entry.slotId = slot.id;
            
            if (bestTeacherIdx != -1 && bestClassroomIdx != -1) {
                Teacher& teacher = setup.teachers[bestTeacherIdx];
                entry.teacherId = teacher.id;
                entry.teacherName = teacher.name;
                entry.roomId = setup.classrooms[bestClassroomIdx].id;
                entry.roomName = setup.classrooms[bestClassroomIdx].name;
                
                auto key = make_pair(dayIdx, slot.periodNumber);
                teacher.allocation[key] = section.id;
                teacher.totalLoad++;
                classroomAllocation[key] = setup.classrooms[bestClassroomIdx].id;
            } else {
                entry.teacherId = 0;
                entry.teacherName = "";
                entry.roomId = 0;
                entry.roomName = "";
            }
            
            allEntries.push_back(entry);
        }
    }
    
    cout << "Timetable generation complete\n";
    return allEntries;
}

void DisplayTimetables(const vector<TimeTableData>& entries, const AllocationSetup& setup) {
    // Group by course (courseCode)
    map<string, map<int, vector<TimeTableData>>> byCourse;
    for (const auto& e : entries) {
        byCourse[e.courseCode][e.periodNumber].push_back(e);
    }
    
    vector<string> dayOrder = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
    
    for (const auto& coursePair : byCourse) {
        const string& courseName = coursePair.first;
        const auto& periodsMap = coursePair.second;
        
        cout << "\n================================================================================\n";
        cout << "TIMETABLE - COURSE: " << courseName << "\n";
        cout << "================================================================================\n\n";
        
        cout << left << setw(10) << "Day";
        for (int p = 1; p <= setup.periodsPerDay; ++p) {
            cout << left << setw(25) << ("P" + to_string(p));
        }
        cout << "\n";
        cout << string(10 + setup.periodsPerDay * 25, '-') << "\n";
        
        for (const string& day : dayOrder) {
            int dayIdx = dayIndex(day);
            if (dayIdx < 0) continue;
            
            cout << left << setw(10) << day;
            
            for (int p = 1; p <= setup.periodsPerDay; ++p) {
                string cell = "Free";
                if (periodsMap.find(p) != periodsMap.end()) {
                    for (const auto& entry : periodsMap.at(p)) {
                        if (entry.day == day) {
                            if (entry.teacherId > 0 && entry.roomId > 0) {
                                cell = entry.teacherName.substr(0, 12) + "/" + entry.roomName.substr(0, 10);
                            } else if (entry.teacherId == 0 && entry.roomId == 0) {
                                cell = "NO TEACHER/ROOM";
                            } else if (entry.teacherId == 0) {
                                cell = "NO TEACHER";
                            } else if (entry.roomId == 0) {
                                cell = "NO ROOM";
                            }
                            break;
                        }
                    }
                }
                if (cell.length() > 24) cell = cell.substr(0, 21) + "...";
                cout << left << setw(25) << cell;
            }
            cout << "\n";
        }
        cout << "\n";
    }
    
    cout << "\n========== TEACHER WORKLOAD SUMMARY ==========\n";
    cout << left << setw(25) << "Teacher" << setw(10) << "Periods" << "\n";
    cout << string(35, '-') << "\n";
    for (const auto& t : setup.teachers) {
        cout << left << setw(25) << t.name << setw(10) << t.totalLoad << "\n";
    }
    cout << "\n";
}

void DisplayTimetablesByClassroom(const vector<TimeTableData>& entries, const AllocationSetup& setup) {
    map<string, map<int, vector<TimeTableData>>> byClassroom;
    for (const auto& e : entries) {
        if (e.roomId > 0) {
            byClassroom[e.roomName][e.periodNumber].push_back(e);
        }
    }
    
    vector<string> dayOrder = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
    
    cout << "\n================================================================================\n";
    cout << "TIMETABLE BY CLASSROOM\n";
    cout << "================================================================================\n";
    
    for (const auto& classroomPair : byClassroom) {
        const string& classroomName = classroomPair.first;
        const auto& periodsMap = classroomPair.second;
        
        cout << "\n================================================================================\n";
        cout << "CLASSROOM: " << classroomName << "\n";
        cout << "================================================================================\n\n";
        
        cout << left << setw(10) << "Day";
        for (int p = 1; p <= setup.periodsPerDay; ++p) {
            cout << left << setw(30) << ("P" + to_string(p));
        }
        cout << "\n";
        cout << string(10 + setup.periodsPerDay * 30, '-') << "\n";
        
        for (const string& day : dayOrder) {
            cout << left << setw(10) << day;
            
            for (int p = 1; p <= setup.periodsPerDay; ++p) {
                string cell = "Free";
                if (periodsMap.find(p) != periodsMap.end()) {
                    for (const auto& entry : periodsMap.at(p)) {
                        if (entry.day == day) {
                            if (entry.teacherId > 0) {
                                cell = entry.teacherName.substr(0, 15) + " - " + entry.sectionName.substr(0, 15);
                            } else {
                                cell = "Unassigned";
                            }
                            break;
                        }
                    }
                }
                if (cell.length() > 29) cell = cell.substr(0, 26) + "...";
                cout << left << setw(30) << cell;
            }
            cout << "\n";
        }
        cout << "\n";
    }
    
    cout << "\n========== CLASSROOM UTILIZATION SUMMARY ==========\n";
    cout << left << setw(20) << "Classroom" << setw(10) << "Slots Used" << setw(10) << "Total Slots" << setw(10) << "Util %" << "\n";
    cout << string(50, '-') << "\n";
    
    int totalSlots = setup.days * setup.periodsPerDay;
    for (const auto& classroom : setup.classrooms) {
        int used = 0;
        if (byClassroom.find(classroom.name) != byClassroom.end()) {
            for (const auto& periodPair : byClassroom.at(classroom.name)) {
                for (const auto& entry : periodPair.second) {
                    if (entry.teacherId > 0) used++;
                }
            }
        }
        double util = totalSlots > 0 ? (100.0 * used / totalSlots) : 0;
        cout << left << setw(20) << classroom.name << setw(10) << used << setw(10) << totalSlots << setw(10) << fixed << setprecision(1) << util << "\n";
    }
    cout << "\n";
}

void SaveTimetableToDatabase(const vector<TimeTableData>& timetables, 
                             [[maybe_unused]] const AllocationSetup& setup, sqlite3* db) {
    sqlite3_exec(db, "BEGIN TRANSACTION;", nullptr, nullptr, nullptr);
    
    int placed = 0;
    int total = static_cast<int>(timetables.size());
    
    const char* genSQL = "INSERT INTO Generations (kind, placed, total) VALUES ('auto', ?, ?);";
    sqlite3_stmt* genStmt;
    if (sqlite3_prepare_v2(db, genSQL, -1, &genStmt, nullptr) != SQLITE_OK) {
        cerr << "Prepare generation failed: " << sqlite3_errmsg(db) << endl;
        sqlite3_exec(db, "ROLLBACK;", nullptr, nullptr, nullptr);
        return;
    }
    sqlite3_bind_int(genStmt, 1, 0);
    sqlite3_bind_int(genStmt, 2, total);
    sqlite3_step(genStmt);
    int64_t generationId = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(genStmt);
    
    const char* entrySQL = "INSERT INTO TimetableEntries (section_id, classroom_id, slot_id, generation_id, locked) "
                           "VALUES (?, ?, ?, ?, 0);";
    sqlite3_stmt* entryStmt;
    if (sqlite3_prepare_v2(db, entrySQL, -1, &entryStmt, nullptr) != SQLITE_OK) {
        cerr << "Prepare entry failed: " << sqlite3_errmsg(db) << endl;
        sqlite3_exec(db, "ROLLBACK;", nullptr, nullptr, nullptr);
        return;
    }
    
    for (const auto& entry : timetables) {
        if (entry.teacherId > 0 && entry.roomId > 0) {
            placed++;
            sqlite3_bind_int64(entryStmt, 1, entry.sectionId);
            sqlite3_bind_int64(entryStmt, 2, entry.roomId);
            sqlite3_bind_int64(entryStmt, 3, entry.slotId);
            sqlite3_bind_int64(entryStmt, 4, generationId);
            
            if (sqlite3_step(entryStmt) != SQLITE_DONE) {
                cerr << "Insert entry failed: " << sqlite3_errmsg(db) << endl;
            }
            sqlite3_reset(entryStmt);
        }
    }
    
    sqlite3_finalize(entryStmt);
    
    const char* updateSQL = "UPDATE Generations SET placed = ? WHERE id = ?;";
    sqlite3_stmt* updateStmt;
    if (sqlite3_prepare_v2(db, updateSQL, -1, &updateStmt, nullptr) == SQLITE_OK) {
        sqlite3_bind_int(updateStmt, 1, placed);
        sqlite3_bind_int64(updateStmt, 2, generationId);
        sqlite3_step(updateStmt);
        sqlite3_finalize(updateStmt);
    }
    
    sqlite3_exec(db, "COMMIT;", nullptr, nullptr, nullptr);
    cout << "Timetable saved to database (generation #" << generationId 
         << ", " << placed << "/" << total << " slots placed)\n";
}

void TimeTable() {
    cout << "\n" << string(80, '=') << "\n";
    cout << "INTELLIGENT TIMETABLE GENERATOR (Database-Driven)\n";
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
    
    sqlite3_exec(db, "PRAGMA foreign_keys = ON;", nullptr, nullptr, nullptr);
    
    if (!InitializeSchema(db)) {
        cerr << "Database schema initialization failed\n";
        sqlite3_close(db);
        return;
    }
    
    AllocationSetup setup;
    
    if (!LoadTeachersFromDatabase(db, setup) ||
        !LoadCoursesFromDatabase(db, setup) ||
        !LoadClassroomsFromDatabase(db, setup) ||
        !LoadSectionsFromDatabase(db, setup) ||
        !LoadTimeSlotsFromDatabase(db, setup)) {
        cerr << "Failed to load database data\n";
        sqlite3_close(db);
        return;
    }
    
    if (!ValidateDatabaseData(setup)) {
        cerr << "Data validation failed\n";
        sqlite3_close(db);
        return;
    }
    
    cout << "\n========== GENERATING TIMETABLE ==========\n";
    vector<TimeTableData> generatedTimetable = GenerateAllTimetables(setup);
    
    cout << "\n========== GENERATED TIMETABLE ==========\n";
    DisplayTimetables(generatedTimetable, setup);
    
    cout << "\n========== TIMETABLE BY CLASSROOM ==========\n";
    DisplayTimetablesByClassroom(generatedTimetable, setup);
    
    cout << "\n========== SAVING TO DATABASE ==========\n";
    SaveTimetableToDatabase(generatedTimetable, setup, db);
    
    sqlite3_close(db);
}

int main() {
    cout << "------Timetable Generator------\n";
    int choice = 0;
    
    while (choice != 2) {
        cout << "\n1. Timetable Generator\n";
        cout << "2. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;
        
        switch (choice) {
            case 1:
                TimeTable();
                break;
            case 2:
                cout << "Exiting the program.\n";
                break;
            default:
                cout << "Invalid choice. Please try again.\n";
        }
    }
    
    return 0;
}