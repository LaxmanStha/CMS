#include<iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <algorithm>
#include <map>
#include <climits>
#include <ctime>
#include <sqlite3.h>
#include <cstdint>

using namespace std;

// ===== GLOBAL TEACHER STRUCTURE =====
// Stores information about each teacher (name + subjects they teach)
struct GlobalTeacher {
    string name;
    map<string, string> subjects;  // section -> subject mapping (e.g., "A" -> "Math")
    int totalLoad = 0;             // total periods across all sections
    
    // Global assignment: which section is this teacher teaching at each time slot
    // allocationMatrix[day][period] = section name (or "Free")
    map<pair<int, int>, string> allocation;  // (day, period) -> section
};

// ===== TIMETABLE DATA STRUCTURE =====
// Stores the final timetable for one section
struct TimeTableData {
    string sectionName;
    vector<vector<string>> tName;      // Teacher names for each day/period
    vector<vector<string>> tSub;       // Subject names for each day/period
    int periodsPerDay;
};

// ===== GET ALL SECTIONS AND TEACHERS (READ ONCE) =====
// WHY: Teachers are shared across sections, so we read them ONCE
// and create a mapping of which subjects each teacher teaches in each section
struct AllocationSetup {
    vector<string> sections;
    vector<GlobalTeacher> teachers;
    int periodsPerDay;
    int days = 5;
};

AllocationSetup SetupGlobalAllocation() {
    AllocationSetup setup;
    
    cout << "\n========== SETUP: SECTIONS & TEACHERS ==========\n";
    
    // Step 1: Get section names
    int numSections;
    cout << "How many sections do you have? ";
    cin >> numSections;
    cin.ignore();
    
    for (int i = 0; i < numSections; i++) {
        cout << "Section name " << (i + 1) << ": ";
        string section;
        getline(cin, section);
        setup.sections.push_back(section);
    }
    
    // Step 2: Get periods per day (same for all sections)
    cout << "\nEnter number of periods per day: ";
    cin >> setup.periodsPerDay;
    cin.ignore();
    
    // Step 3: Get teachers ONCE and their subjects for EACH section
    int numTeachers;
    cout << "\nHow many teachers do you have? ";
    cin >> numTeachers;
    cin.ignore();
    
    setup.teachers.resize(numTeachers);
    
    for (int t = 0; t < numTeachers; t++) {
        cout << "\n========== TEACHER " << (t + 1) << " ==========\n";
        cout << "Teacher name: ";
        getline(cin, setup.teachers[t].name);
        
        // For each section, get what subject this teacher teaches
        cout << "Which sections does " << setup.teachers[t].name << " teach? (Enter for all, or specific sections)\n";
        
        for (int s = 0; s < numSections; s++) {
            cout << "Subject for Section " << setup.sections[s] << " (press Enter to skip): ";
            string subject;
            getline(cin, subject);
            
            if (!subject.empty()) {
                setup.teachers[t].subjects[setup.sections[s]] = subject;
            }
        }
    }
    
    return setup;
}

// ===== CONSTRAINT: CHECK IF TEACHER IS FREE AT THIS TIME SLOT =====
// WHY: Before assigning teacher to a section at (day, period),
// check if teacher is already allocated to another section
bool IsTeacherFreeAt(const GlobalTeacher& teacher, int day, int period) {
    auto key = make_pair(day, period);
    return teacher.allocation.find(key) == teacher.allocation.end();
}

// ===== ALLOCATE TEACHER TO SLOT WITH CONSTRAINT CHECK =====
// Returns true if allocation was successful
bool AllocateTeacherToSlot(GlobalTeacher& teacher, int day, int period, 
                          const string& section, [[maybe_unused]] const AllocationSetup& setup) {
    auto key = make_pair(day, period);
    
    // Check if teacher is already assigned to different section at this time
    if (!IsTeacherFreeAt(teacher, day, period)) {
        return false;  // Teacher busy at this slot
    }
    
    // Check if teacher teaches this section
    if (teacher.subjects.find(section) == teacher.subjects.end()) {
        return false;  // Teacher doesn't teach this section
    }
    
    // Allocate the teacher
    teacher.allocation[key] = section;
    teacher.totalLoad++;
    return true;
}

// ===== GENERATE TIMETABLES WITH GLOBAL CONSTRAINTS =====
// WHY: All sections are generated together with constraint checking
// A teacher cannot teach two sections in the same period
vector<TimeTableData> GenerateAllTimetables(AllocationSetup& setup) {
    const int days = 5;
    vector<string> dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri"};
    
    int periodsPerDay = setup.periodsPerDay;
    int numSections = setup.sections.size();
    int numTeachers = setup.teachers.size();
    
    // Initialize timetables for each section
    vector<TimeTableData> allTimetables(numSections);
    for (int s = 0; s < numSections; s++) {
        allTimetables[s].sectionName = setup.sections[s];
        allTimetables[s].periodsPerDay = periodsPerDay;
        allTimetables[s].tName.assign(days, vector<string>(periodsPerDay, "Unassigned"));
        allTimetables[s].tSub.assign(days, vector<string>(periodsPerDay, ""));
    }
    
    // ALGORITHM: For each day and period, assign teachers to sections
    cout << "\n========== GENERATING TIMETABLES WITH CONSTRAINT CHECKING ==========\n";
    
    for (int d = 0; d < days; d++) {
        cout << "Processing day: " << dayNames[d] << "\n";
        
        for (int p = 0; p < periodsPerDay; p++) {
            // For each section, find an available teacher
            for (int s = 0; s < numSections; s++) {
                string sectionName = setup.sections[s];
                
                // Try to find best available teacher (least loaded)
                int bestTeacher = -1;
                int lowestLoad = INT_MAX;
                
                for (int t = 0; t < numTeachers; t++) {
                    // Check if teacher teaches this section
                    if (setup.teachers[t].subjects.find(sectionName) == 
                        setup.teachers[t].subjects.end()) {
                        continue;  // Skip - teacher doesn't teach this section
                    }
                    
                    // Check if teacher is free at this time
                    if (!IsTeacherFreeAt(setup.teachers[t], d, p)) {
                        continue;  // Skip - teacher busy at this time
                    }
                    
                    // Among available teachers, pick the one with least load
                    if (setup.teachers[t].totalLoad < lowestLoad) {
                        lowestLoad = setup.teachers[t].totalLoad;
                        bestTeacher = t;
                    }
                }
                
                // If found a suitable teacher, allocate
                if (bestTeacher != -1) {
                    GlobalTeacher& teacher = setup.teachers[bestTeacher];
                    string subject = teacher.subjects[sectionName];
                    
                    AllocateTeacherToSlot(teacher, d, p, sectionName, setup);
                    
                    // Record in timetable
                    allTimetables[s].tName[d][p] = teacher.name;
                    allTimetables[s].tSub[d][p] = subject;
                } else {
                    // No suitable teacher found - mark as issue
                    allTimetables[s].tName[d][p] = "NO TEACHER";
                    allTimetables[s].tSub[d][p] = "CONFLICT";
                }
            }
        }
    }
    
    cout << "\nTimetable generation complete!\n";
    return allTimetables;
}

// ===== DISPLAY A TIMETABLE =====
void DisplayTimeTable(const TimeTableData& data, [[maybe_unused]] const AllocationSetup& setup) {
    const int days = 5;
    vector<string> dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri"};

    cout << "\n" << string(80, '=') << "\n";
    cout << "TIMETABLE - SECTION: " << data.sectionName << "\n";
    cout << string(80, '=') << "\n\n";

    int colWidth = 22;

    cout << left << setw(10) << "Day";
    for (int p = 0; p < data.periodsPerDay; p++) {
        cout << left << setw(colWidth) << ("Period " + to_string(p + 1));
    }
    cout << "\n";
    cout << string(10 + data.periodsPerDay * colWidth, '-') << "\n";

    for (int d = 0; d < days; d++) {
        cout << left << setw(10) << dayNames[d];
        for (int p = 0; p < data.periodsPerDay; p++) {
            string teacher = data.tName[d][p];
            string subject = data.tSub[d][p];
            
            string cell;
            if (teacher == "NO TEACHER") {
                cell = "NO TEACHER";
            } else if (teacher != "Unassigned" && !teacher.empty()) {
                cell = teacher;
                if (!subject.empty()) {
                    cell += " / " + subject;
                }
            } else {
                cell = "Free";
            }
            
            if (static_cast<int>(cell.length()) > colWidth - 1) {
                cell = cell.substr(0, colWidth - 4) + "...";
            }
            cout << left << setw(colWidth) << cell;
        }
        cout << "\n";
    }
    cout << "\n";
}

// ===== DISPLAY TEACHER WORKLOAD ACROSS ALL SECTIONS =====
void DisplayGlobalTeacherLoad(const AllocationSetup& setup) {
    cout << "\n" << string(80, '=') << "\n";
    cout << "GLOBAL TEACHER WORKLOAD ANALYSIS\n";
    cout << string(80, '=') << "\n\n";

    // Create header
    cout << left << setw(20) << "Teacher";
    for (const auto& section : setup.sections) {
        cout << left << setw(15) << ("Sec " + section);
    }
    cout << left << setw(15) << "TOTAL\n";
    cout << string(20 + setup.sections.size() * 15 + 15, '-') << "\n";

    // For each teacher, count load per section
    for (const auto& teacher : setup.teachers) {
        cout << left << setw(20) << teacher.name;
        
        int totalLoad = 0;
        for (const auto& section : setup.sections) {
            int sectionLoad = 0;
            
            // Count periods this teacher teaches in this section
            for (const auto& alloc : teacher.allocation) {
                if (alloc.second == section) {
                    sectionLoad++;
                }
            }
            
            cout << left << setw(15) << to_string(sectionLoad);
            totalLoad += sectionLoad;
        }
        
        cout << left << setw(15) << to_string(totalLoad) << "\n";
    }
    cout << "\n";
}

// ===== SAVE TIMETABLE TO DATABASE (COMPREHENSIVE) =====
void SaveTimetableToDatabase(const vector<TimeTableData>& allTimetables, const AllocationSetup& setup) {
    sqlite3* db;
    int rc = sqlite3_open("college.db", &db);
    if (rc != SQLITE_OK) {
        cerr << "Cannot open database: " << sqlite3_errmsg(db) << endl;
        sqlite3_close(db);
        return;
    }

    // Enable foreign keys
    sqlite3_exec(db, "PRAGMA foreign_keys = ON;", nullptr, nullptr, nullptr);

    // Create comprehensive schema with transactions
    const char* schemaSQL = 
        "CREATE TABLE IF NOT EXISTS TimetableGeneration ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,"
        "  periods_per_day INTEGER NOT NULL,"
        "  total_sections INTEGER NOT NULL,"
        "  total_teachers INTEGER NOT NULL,"
        "  status TEXT DEFAULT 'completed'"
        ");"
        "CREATE TABLE IF NOT EXISTS TimetableSection ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  generation_id INTEGER NOT NULL REFERENCES TimetableGeneration(id) ON DELETE CASCADE,"
        "  section_name TEXT NOT NULL,"
        "  periods_per_day INTEGER NOT NULL"
        ");"
        "CREATE TABLE IF NOT EXISTS TimetableTeacher ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  generation_id INTEGER NOT NULL REFERENCES TimetableGeneration(id) ON DELETE CASCADE,"
        "  teacher_name TEXT NOT NULL,"
        "  total_load INTEGER DEFAULT 0"
        ");"
        "CREATE TABLE IF NOT EXISTS TimetableEntry ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  generation_id INTEGER NOT NULL REFERENCES TimetableGeneration(id) ON DELETE CASCADE,"
        "  section_id INTEGER NOT NULL REFERENCES TimetableSection(id) ON DELETE CASCADE,"
        "  teacher_id INTEGER REFERENCES TimetableTeacher(id) ON DELETE SET NULL,"
        "  day TEXT NOT NULL,"
        "  period TEXT NOT NULL,"
        "  subject TEXT,"
        "  status TEXT DEFAULT 'assigned'"
        ");"
        "CREATE TABLE IF NOT EXISTS TimetableTeacherLoad ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  generation_id INTEGER NOT NULL REFERENCES TimetableGeneration(id) ON DELETE CASCADE,"
        "  teacher_id INTEGER NOT NULL REFERENCES TimetableTeacher(id) ON DELETE CASCADE,"
        "  section_id INTEGER NOT NULL REFERENCES TimetableSection(id) ON DELETE CASCADE,"
        "  periods_count INTEGER DEFAULT 0"
        ");"
        "CREATE TABLE IF NOT EXISTS TimetableConflict ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  generation_id INTEGER NOT NULL REFERENCES TimetableGeneration(id) ON DELETE CASCADE,"
        "  section_id INTEGER REFERENCES TimetableSection(id) ON DELETE SET NULL,"
        "  day TEXT,"
        "  period TEXT,"
        "  conflict_type TEXT NOT NULL,"
        "  description TEXT"
        ");"
        "CREATE INDEX IF NOT EXISTS idx_entry_gen ON TimetableEntry(generation_id);"
        "CREATE INDEX IF NOT EXISTS idx_entry_section ON TimetableEntry(section_id);"
        "CREATE INDEX IF NOT EXISTS idx_entry_teacher ON TimetableEntry(teacher_id);"
        "CREATE INDEX IF NOT EXISTS idx_load_gen ON TimetableTeacherLoad(generation_id);"
        "CREATE INDEX IF NOT EXISTS idx_conflict_gen ON TimetableConflict(generation_id);";

    char* errMsg = nullptr;
    rc = sqlite3_exec(db, schemaSQL, nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        cerr << "Schema creation failed: " << errMsg << endl;
        sqlite3_free(errMsg);
        sqlite3_close(db);
        return;
    }

    // Begin transaction
    sqlite3_exec(db, "BEGIN TRANSACTION;", nullptr, nullptr, nullptr);

    // 1. Insert generation record
    const char* genSQL = "INSERT INTO TimetableGeneration (periods_per_day, total_sections, total_teachers, status) VALUES (?, ?, ?, 'completed');";
    sqlite3_stmt* genStmt;
    sqlite3_prepare_v2(db, genSQL, -1, &genStmt, nullptr);
    sqlite3_bind_int(genStmt, 1, setup.periodsPerDay);
    sqlite3_bind_int(genStmt, 2, static_cast<int>(setup.sections.size()));
    sqlite3_bind_int(genStmt, 3, static_cast<int>(setup.teachers.size()));
    sqlite3_step(genStmt);
    int64_t generationId = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(genStmt);

    // 2. Insert sections and track IDs
    vector<int64_t> sectionIds(setup.sections.size());
    const char* secSQL = "INSERT INTO TimetableSection (generation_id, section_name, periods_per_day) VALUES (?, ?, ?);";
    sqlite3_stmt* secStmt;
    sqlite3_prepare_v2(db, secSQL, -1, &secStmt, nullptr);
    for (size_t i = 0; i < setup.sections.size(); ++i) {
        sqlite3_bind_int64(secStmt, 1, generationId);
        sqlite3_bind_text(secStmt, 2, setup.sections[i].c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int(secStmt, 3, setup.periodsPerDay);
        sqlite3_step(secStmt);
        sectionIds[i] = sqlite3_last_insert_rowid(db);
        sqlite3_reset(secStmt);
    }
    sqlite3_finalize(secStmt);

    // 3. Insert teachers and track IDs
    vector<int64_t> teacherIds(setup.teachers.size());
    vector<int> teacherTotalLoads(setup.teachers.size(), 0);
    const char* teachSQL = "INSERT INTO TimetableTeacher (generation_id, teacher_name, total_load) VALUES (?, ?, ?);";
    sqlite3_stmt* teachStmt;
    sqlite3_prepare_v2(db, teachSQL, -1, &teachStmt, nullptr);
    for (size_t t = 0; t < setup.teachers.size(); ++t) {
        // Calculate total load
        int totalLoad = 0;
        for (const auto& alloc [[maybe_unused]] : setup.teachers[t].allocation) {
            totalLoad++;
        }
        teacherTotalLoads[t] = totalLoad;
        
        sqlite3_bind_int64(teachStmt, 1, generationId);
        sqlite3_bind_text(teachStmt, 2, setup.teachers[t].name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int(teachStmt, 3, totalLoad);
        sqlite3_step(teachStmt);
        teacherIds[t] = sqlite3_last_insert_rowid(db);
        sqlite3_reset(teachStmt);
    }
    sqlite3_finalize(teachStmt);

    // 4. Insert teacher loads per section
    const char* loadSQL = "INSERT INTO TimetableTeacherLoad (generation_id, teacher_id, section_id, periods_count) VALUES (?, ?, ?, ?);";
    sqlite3_stmt* loadStmt;
    sqlite3_prepare_v2(db, loadSQL, -1, &loadStmt, nullptr);
    for (size_t t = 0; t < setup.teachers.size(); ++t) {
        for (size_t s = 0; s < setup.sections.size(); ++s) {
            int count = 0;
            for (const auto& alloc : setup.teachers[t].allocation) {
                if (alloc.second == setup.sections[s]) count++;
            }
            if (count > 0) {
                sqlite3_bind_int64(loadStmt, 1, generationId);
                sqlite3_bind_int64(loadStmt, 2, teacherIds[t]);
                sqlite3_bind_int64(loadStmt, 3, sectionIds[s]);
                sqlite3_bind_int(loadStmt, 4, count);
                sqlite3_step(loadStmt);
                sqlite3_reset(loadStmt);
            }
        }
    }
    sqlite3_finalize(loadStmt);

    // 5. Insert timetable entries
    const char* entrySQL = "INSERT INTO TimetableEntry (generation_id, section_id, teacher_id, day, period, subject, status) VALUES (?, ?, ?, ?, ?, ?, ?);";
    sqlite3_stmt* entryStmt;
    sqlite3_prepare_v2(db, entrySQL, -1, &entryStmt, nullptr);

    vector<string> dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri"};
    for (size_t s = 0; s < allTimetables.size(); ++s) {
        for (int d = 0; d < 5; ++d) {
            for (int p = 0; p < allTimetables[s].periodsPerDay; ++p) {
                string teacher = allTimetables[s].tName[d][p];
                string subject = allTimetables[s].tSub[d][p];
                
                // Determine status
                string status = "assigned";
                if (teacher == "Unassigned" || teacher.empty()) status = "free";
                else if (teacher == "NO TEACHER") status = "conflict";
                
                // Find teacher ID
                int64_t teacherId = 0;
                int teacherIdx [[maybe_unused]] = -1;
                for (size_t t = 0; t < setup.teachers.size(); ++t) {
                    if (setup.teachers[t].name == teacher) {
                        teacherId = teacherIds[t];
                        teacherIdx = static_cast<int>(t);
                        break;
                    }
                }

                sqlite3_bind_int64(entryStmt, 1, generationId);
                sqlite3_bind_int64(entryStmt, 2, sectionIds[s]);
                if (teacherId > 0) sqlite3_bind_int64(entryStmt, 3, teacherId);
                else sqlite3_bind_null(entryStmt, 3);
                sqlite3_bind_text(entryStmt, 4, dayNames[d].c_str(), -1, SQLITE_TRANSIENT);
                string periodStr = "Period " + to_string(p + 1);
                sqlite3_bind_text(entryStmt, 5, periodStr.c_str(), -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(entryStmt, 6, subject.c_str(), -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(entryStmt, 7, status.c_str(), -1, SQLITE_TRANSIENT);
                sqlite3_step(entryStmt);
                sqlite3_reset(entryStmt);

                // Track conflicts
                if (status == "conflict" || status == "free") {
                    const char* conflictSQL = "INSERT INTO TimetableConflict (generation_id, section_id, day, period, conflict_type, description) VALUES (?, ?, ?, ?, ?, ?);";
                    sqlite3_stmt* confStmt;
                    sqlite3_prepare_v2(db, conflictSQL, -1, &confStmt, nullptr);
                    sqlite3_bind_int64(confStmt, 1, generationId);
                    sqlite3_bind_int64(confStmt, 2, sectionIds[s]);
                    sqlite3_bind_text(confStmt, 3, dayNames[d].c_str(), -1, SQLITE_TRANSIENT);
                    sqlite3_bind_text(confStmt, 4, ("Period " + to_string(p + 1)).c_str(), -1, SQLITE_TRANSIENT);
                    sqlite3_bind_text(confStmt, 5, status.c_str(), -1, SQLITE_TRANSIENT);
                    string desc = status == "conflict" ? "No teacher available" : "Period unassigned";
                    sqlite3_bind_text(confStmt, 6, desc.c_str(), -1, SQLITE_TRANSIENT);
                    sqlite3_step(confStmt);
                    sqlite3_finalize(confStmt);
                }
            }
        }
    }
    sqlite3_finalize(entryStmt);

    // Commit transaction
    sqlite3_exec(db, "COMMIT;", nullptr, nullptr, nullptr);
    sqlite3_close(db);
    cout << "✓ Complete timetable saved to database (generation #" << generationId << ")\n";
}

// ===== MAIN TIMETABLE FUNCTION - WITH GLOBAL CONSTRAINTS =====
// HOW IT WORKS:
// 1. Get all sections and teachers (READ ONCE)
// 2. Map which teachers teach which subjects in which sections
// 3. Generate timetables with constraint checking:
//    - Teacher cannot teach multiple sections in same period
//    - Teacher can only teach sections they're assigned to
// 4. Display all timetables with workload analysis
// 5. Save results
void TimeTable(){
    cout << "\n" << string(80, '=') << "\n";
    cout << "INTELLIGENT TIMETABLE GENERATOR (With Conflict Detection)\n";
    cout << string(80, '=') << "\n";
    
    // Step 1: Setup - get all sections and teachers ONCE
    AllocationSetup setup = SetupGlobalAllocation();
    
    // Step 2: Generate all timetables with constraint checking
    vector<TimeTableData> allTimetables = GenerateAllTimetables(setup);
    
    // Step 3: Display all timetables
    cout << "\n" << string(80, '=') << "\n";
    cout << "GENERATED TIMETABLES\n";
    cout << string(80, '=') << "\n";
    
    for (const auto& timetable : allTimetables) {
        DisplayTimeTable(timetable, setup);
    }
    
    // Step 4: Display global teacher workload analysis
    DisplayGlobalTeacherLoad(setup);
    
    // Step 5: Save to database
    SaveTimetableToDatabase(allTimetables, setup);
    
    // Step 6: Validate for conflicts
    cout << string(80, '=') << "\n";
    cout << "CONFLICT ANALYSIS\n";
    cout << string(80, '=') << "\n";
    
    bool hasConflicts = false;
    
    // Check for unassigned slots
    for (const auto& timetable : allTimetables) {
        for (int d = 0; d < 5; d++) {
            for (int p = 0; p < timetable.periodsPerDay; p++) {
                if (timetable.tName[d][p] == "NO TEACHER") {
                    cout << "⚠️  WARNING: No teacher assigned for Section " 
                         << timetable.sectionName << ", Day " << d << ", Period " << p << "\n";
                    hasConflicts = true;
                }
            }
        }
    }
    
    if (!hasConflicts) {
        cout << "✓ No conflicts detected! All slots filled properly.\n";
    }
    cout << "\n";
    
    // Step 6: Option to save to file
    cout << "Do you want to save timetables to a file? (y/n): ";
    char choice;
    cin >> choice;
    cin.ignore();
    
    if (choice == 'y' || choice == 'Y') {
        ofstream outFile("Timetables_Global.txt", ios::app);
        outFile << "\n" << string(80, '=') << "\n";
        outFile << "TIMETABLE GENERATION - " << time(0) << "\n";
        outFile << string(80, '=') << "\n\n";
        
        // Save each timetable
        for (const auto& timetable : allTimetables) {
            outFile << "SECTION: " << timetable.sectionName << "\n";
            outFile << "Days: Mon, Tue, Wed, Thu, Fri\n";
            outFile << "Periods: " << timetable.periodsPerDay << "\n\n";
            
            // Save detailed schedule
            vector<string> dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri"};
            for (int d = 0; d < 5; d++) {
                outFile << dayNames[d] << ": ";
                for (int p = 0; p < timetable.periodsPerDay; p++) {
                    outFile << "[" << timetable.tName[d][p] << "-" 
                           << timetable.tSub[d][p] << "] ";
                }
                outFile << "\n";
            }
            outFile << "\n";
        }
        
        // Save global teacher load analysis
        outFile << "\n" << string(80, '=') << "\n";
        outFile << "GLOBAL TEACHER WORKLOAD\n";
        outFile << string(80, '=') << "\n\n";
        
        for (const auto& teacher : setup.teachers) {
            outFile << teacher.name << ":\n";
            for (const auto& section : setup.sections) {
                int count = 0;
                for (const auto& alloc : teacher.allocation) {
                    if (alloc.second == section) count++;
                }
                outFile << "  Section " << section << ": " << count << " periods\n";
            }
            outFile << "  TOTAL: " << teacher.totalLoad << " periods\n\n";
        }
        
        outFile.close();
        cout << "✓ Timetables saved to 'Timetables_Global.txt'\n";
    }
}

int main(){
    cout << "------Timetable Generator------\n";
    int choice = 0;

    while (choice != 2){
        cout << "\n1. Timetable Generator\n";
        cout << "2. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;

        switch (choice){
            case 1:
                TimeTable();
                break;
            case 2:
                cout << "Exiting the program." << endl;
                break;
            default:
                cout << "Invalid choice. Please try again." << endl;
        }
    }

    return 0;
}