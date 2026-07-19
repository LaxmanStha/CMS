// College Management System - self-contained C++ REST API (no external framework).
// Uses Winsock2 + sqlite3. Build (from backend/build/bin):
//   g++ -std=c++17 -I"../../src" "..\..\src\server_main.cpp" -lws2_32 -lsqlite3 -o server.exe
// Run from backend/build/bin so college.db and schema.sql are found in the CWD.

#include <winsock2.h>
#include <ws2tcpip.h>
#include <sqlite3.h>
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <fstream>
#include <map>
#include <algorithm>
#include <functional>

#pragma comment(lib, "ws2_32.lib")

using std::string;

// ---------------------------------------------------------------------------
// Minimal JSON helpers (no external dependency)
// ---------------------------------------------------------------------------
static string jsonEscape(const string& s) {
    string o;
    o.reserve(s.size() + 2);
    for (char c : s) {
        switch (c) {
            case '"': o += "\\\""; break;
            case '\\': o += "\\\\"; break;
            case '\n': o += "\\n"; break;
            case '\r': o += "\\r"; break;
            case '\t': o += "\\t"; break;
            default:
                if ((unsigned char)c < 0x20) {
                    char buf[8];
                    snprintf(buf, sizeof(buf), "\\u%04x", (unsigned char)c);
                    o += buf;
                } else {
                    o += c;
                }
        }
    }
    return o;
}

struct JsonVal {
    enum Type { Null, Bool, Num, Str, Arr, Obj } type = Null;
    bool b = false;
    double num = 0;
    string str;
    std::vector<JsonVal> arr;
    std::vector<std::pair<string, JsonVal>> obj;

    JsonVal() {}
    JsonVal(const string& s) : type(Str), str(s) {}
    JsonVal(const char* s) : type(Str), str(s) {}
    JsonVal(double d) : type(Num), num(d) {}
    JsonVal(int d) : type(Num), num((double)d) {}
    JsonVal(long d) : type(Num), num((double)d) {}
    JsonVal(bool v) : type(Bool), b(v) {}

    string dump() const {
        switch (type) {
            case Null: return "null";
            case Bool: return b ? "true" : "false";
            case Num: {
                char buf[64];
                if (num == (long long)num) snprintf(buf, sizeof(buf), "%.0f", num);
                else snprintf(buf, sizeof(buf), "%.6g", num);
                return string(buf);
            }
            case Str: return "\"" + jsonEscape(str) + "\"";
            case Arr: {
                string s = "[";
                for (size_t i = 0; i < arr.size(); i++) {
                    s += arr[i].dump();
                    if (i + 1 < arr.size()) s += ",";
                }
                return s + "]";
            }
            case Obj: {
                string s = "{";
                for (size_t i = 0; i < obj.size(); i++) {
                    s += "\"" + jsonEscape(obj[i].first) + "\":" + obj[i].second.dump();
                    if (i + 1 < obj.size()) s += ",";
                }
                return s + "}";
            }
        }
        return "null";
    }

    bool contains(const string& k) const {
        if (type != Obj) return false;
        for (auto& p : obj) if (p.first == k) return true;
        return false;
    }
    JsonVal get(const string& k) const {
        if (type != Obj) return JsonVal();
        for (auto& p : obj) if (p.first == k) return p.second;
        return JsonVal();
    }
    string strVal(const string& k, const string& d = "") const {
        JsonVal v = get(k);
        return v.type == Str ? v.str : d;
    }
    double numVal(const string& k, double d = 0) const {
        JsonVal v = get(k);
        return v.type == Num ? v.num : d;
    }
};

// Very small JSON parser (handles the shapes produced/consumed by this API).
struct JsonParser {
    const char* p;
    JsonVal parse(const string& s) {
        p = s.c_str();
        skipWs();
        JsonVal v = parseValue();
        return v;
    }
    void skipWs() {
        while (*p && (*p == ' ' || *p == '\t' || *p == '\n' || *p == '\r')) p++;
    }
    JsonVal parseValue() {
        skipWs();
        if (*p == '{') return parseObject();
        if (*p == '[') return parseArray();
        if (*p == '"') return JsonVal(parseString());
        if (*p == 't' || *p == 'f') return parseBool();
        if (*p == 'n') { p += 4; return JsonVal(); }
        return parseNumber();
    }
    JsonVal parseObject() {
        JsonVal v; v.type = JsonVal::Obj;
        p++; skipWs();
        if (*p == '}') { p++; return v; }
        while (true) {
            skipWs();
            string key = parseString();
            skipWs(); p++; skipWs();
            JsonVal val = parseValue();
            v.obj.push_back({key, val});
            skipWs();
            if (*p == ',') { p++; continue; }
            if (*p == '}') { p++; break; }
            break;
        }
        return v;
    }
    JsonVal parseArray() {
        JsonVal v; v.type = JsonVal::Arr;
        p++; skipWs();
        if (*p == ']') { p++; return v; }
        while (true) {
            JsonVal val = parseValue();
            v.arr.push_back(val);
            skipWs();
            if (*p == ',') { p++; continue; }
            if (*p == ']') { p++; break; }
            break;
        }
        return v;
    }
    string parseString() {
        string s;
        if (*p == '"') p++;
        while (*p && *p != '"') {
            if (*p == '\\') {
                p++;
                switch (*p) {
                    case '"': s += '"'; p++; break;
                    case '\\': s += '\\'; p++; break;
                    case '/': s += '/'; p++; break;
                    case 'n': s += '\n'; p++; break;
                    case 't': s += '\t'; p++; break;
                    case 'r': s += '\r'; p++; break;
                    case 'b': s += '\b'; p++; break;
                    case 'f': s += '\f'; p++; break;
                    case 'u': {
                        p++;
                        int cp = 0;
                        for (int i = 0; i < 4 && *p; i++, p++) {
                            cp <<= 4;
                            char c = *p;
                            if (c >= '0' && c <= '9') cp |= c - '0';
                            else if (c >= 'a' && c <= 'f') cp |= c - 'a' + 10;
                            else if (c >= 'A' && c <= 'F') cp |= c - 'A' + 10;
                        }
                        if (cp < 0x80) s += (char)cp;
                        else if (cp < 0x800) {
                            s += (char)(0xC0 | (cp >> 6));
                            s += (char)(0x80 | (cp & 0x3F));
                        } else {
                            s += (char)(0xE0 | (cp >> 12));
                            s += (char)(0x80 | ((cp >> 6) & 0x3F));
                            s += (char)(0x80 | (cp & 0x3F));
                        }
                        break;
                    }
                    default: s += *p; p++; break;
                }
            } else {
                s += *p; p++;
            }
        }
        if (*p == '"') p++;
        return s;
    }
    JsonVal parseNumber() {
        const char* start = p;
        while (*p && (isdigit((unsigned char)*p) || *p == '-' || *p == '+' || *p == '.' || *p == 'e' || *p == 'E')) p++;
        string s(start, p - start);
        JsonVal v; v.type = JsonVal::Num; v.num = atof(s.c_str());
        return v;
    }
    JsonVal parseBool() {
        if (*p == 't') { p += 4; return JsonVal(true); }
        p += 5; return JsonVal(false);
    }
};

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
class Database {
    sqlite3* db_ = nullptr;
public:
    Database(const string& path) {
        int rc = sqlite3_open(path.c_str(), &db_);
        if (rc != SQLITE_OK) throw std::runtime_error("Cannot open database");
        initSchema();
    }
    ~Database() { if (db_) sqlite3_close(db_); }
    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;

    void initSchema() {
        std::ifstream f("schema.sql");
        if (f) {
            std::stringstream ss; ss << f.rdbuf();
            exec(ss.str());
        } else {
            execInline();
        }
        seedDefaultUsers();
    }
    void execInline() {
        const char* sql = R"SQL(
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS Person (id INTEGER PRIMARY KEY, name TEXT NOT NULL, contactInfo TEXT NOT NULL DEFAULT '', discriminator TEXT NOT NULL CHECK (discriminator IN ('Student','Faculty','Accountant')), tempId TEXT);
CREATE TABLE IF NOT EXISTS Student (id INTEGER PRIMARY KEY, gpa REAL NOT NULL CHECK (gpa>=0.0 AND gpa<=4.0), cgpa REAL NOT NULL CHECK (cgpa>=0.0 AND cgpa<=4.0), program TEXT, year INTEGER DEFAULT 1, status TEXT DEFAULT 'active', FOREIGN KEY(id) REFERENCES Person(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS Faculty (id INTEGER PRIMARY KEY, teachingLoad INTEGER NOT NULL CHECK (teachingLoad>=0), department TEXT, title TEXT, email TEXT, hireDate TEXT, status TEXT DEFAULT 'active', FOREIGN KEY(id) REFERENCES Person(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS Accountant (id INTEGER PRIMARY KEY, FOREIGN KEY(id) REFERENCES Person(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS Course (id INTEGER PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, credits INTEGER NOT NULL CHECK (credits>0), department TEXT, maxCapacity INTEGER NOT NULL CHECK (maxCapacity>=0), instructorId INTEGER, currentEnrollment INTEGER NOT NULL DEFAULT 0 CHECK (currentEnrollment>=0), semester TEXT, status TEXT DEFAULT 'active', FOREIGN KEY(instructorId) REFERENCES Faculty(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS Prerequisite (courseId INTEGER NOT NULL, prerequisiteId INTEGER NOT NULL, PRIMARY KEY(courseId, prerequisiteId), FOREIGN KEY(courseId) REFERENCES Course(id) ON DELETE CASCADE, FOREIGN KEY(prerequisiteId) REFERENCES Course(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS Enrollment (studentId INTEGER NOT NULL, courseId INTEGER NOT NULL, enrollmentDate DATE DEFAULT (date('now')), grade REAL, status TEXT DEFAULT 'enrolled', PRIMARY KEY(studentId, courseId), FOREIGN KEY(studentId) REFERENCES Student(id) ON DELETE CASCADE, FOREIGN KEY(courseId) REFERENCES Course(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS Exam (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, course TEXT NOT NULL, date TEXT, startTime TEXT, endTime TEXT, type TEXT DEFAULT 'midterm', location TEXT, totalMarks REAL DEFAULT 100, status TEXT DEFAULT 'scheduled', students INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS Attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, studentId TEXT, student TEXT, course TEXT, date TEXT, status TEXT DEFAULT 'present', time TEXT, notes TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS Fee (id INTEGER PRIMARY KEY AUTOINCREMENT, studentId TEXT, student TEXT, course TEXT, amount REAL DEFAULT 0, paid REAL DEFAULT 0, dueDate TEXT, paidDate TEXT, semester TEXT, status TEXT DEFAULT 'pending');
CREATE TABLE IF NOT EXISTS Timetable (id INTEGER PRIMARY KEY AUTOINCREMENT, course TEXT NOT NULL, day TEXT NOT NULL, time TEXT NOT NULL, room TEXT, instructor TEXT, type TEXT DEFAULT 'lecture');
CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL, name TEXT NOT NULL);
)SQL";
        exec(sql);
    }
    void seedDefaultUsers() {
        struct U { string email, pw, role, name; };
        U list[] = {
            {"admin@college.edu", "password123", "admin", "Dr. Sarah Mitchell"},
            {"faculty@college.edu", "password123", "faculty", "Prof. James Anderson"},
            {"student@college.edu", "password123", "student", "Alex Johnson"},
            {"accountant@college.edu", "password123", "accountant", "Maria Rodriguez"},
        };
        for (auto& u : list) {
            execParam("INSERT OR IGNORE INTO Users (email, password, role, name) VALUES (?, ?, ?, ?)",
                {{1, u.email}, {2, u.pw}, {3, u.role}, {4, u.name}});
        }
    }
    void exec(const string& sql) {
        char* err = nullptr;
        if (sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, &err) != SQLITE_OK) {
            string e(err ? err : "");
            sqlite3_free(err);
            throw std::runtime_error("Schema init failed: " + e);
        }
    }
    JsonVal queryArray(const string& sql, std::function<JsonVal(sqlite3_stmt*)> rowFn) {
        sqlite3_stmt* stmt;
        JsonVal out; out.type = JsonVal::Arr;
        if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) return out;
        while (sqlite3_step(stmt) == SQLITE_ROW) out.arr.push_back(rowFn(stmt));
        sqlite3_finalize(stmt);
        return out;
    }
    JsonVal queryParam(const string& sql, const std::vector<std::pair<int, string>>& params, std::function<JsonVal(sqlite3_stmt*)> rowFn) {
        sqlite3_stmt* stmt;
        JsonVal out; out.type = JsonVal::Arr;
        if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) return out;
        for (auto& kv : params) sqlite3_bind_text(stmt, kv.first, kv.second.c_str(), -1, SQLITE_TRANSIENT);
        while (sqlite3_step(stmt) == SQLITE_ROW) out.arr.push_back(rowFn(stmt));
        sqlite3_finalize(stmt);
        return out;
    }
    bool execParam(const string& sql, const std::vector<std::pair<int, string>>& params) {
        sqlite3_stmt* stmt;
        if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) return false;
        for (auto& kv : params) sqlite3_bind_text(stmt, kv.first, kv.second.c_str(), -1, SQLITE_TRANSIENT);
        bool ok = sqlite3_step(stmt) == SQLITE_DONE;
        sqlite3_finalize(stmt);
        return ok;
    }
    long lastInsertId() { return (long)sqlite3_last_insert_rowid(db_); }
    bool existsId(long id) {
        JsonVal r = queryArray("SELECT id FROM Person WHERE id=" + std::to_string(id), [](sqlite3_stmt*){ return JsonVal(); });
        return !r.arr.empty();
    }
    long nextFreeId() {
        long id = lastInsertId() + 1;
        while (existsId(id)) id++;
        return id;
    }
};

// ---------------------------------------------------------------------------
// Request/Response plumbing
// ---------------------------------------------------------------------------
struct HttpRequest {
    string method, path, body, query;
};

struct HttpResponse {
    int code = 200;
    string body;
    string contentType = "application/json";
    void json(const JsonVal& v) { body = v.dump(); contentType = "application/json"; }
    void error(int c, const string& msg) { code = c; JsonVal v; v.type = JsonVal::Obj; v.obj.push_back({"message", JsonVal(msg)}); body = v.dump(); }
    void error(int c, const JsonVal& v) { code = c; body = v.dump(); }
};

static string readText(sqlite3_stmt* st, int i) {
    const unsigned char* t = sqlite3_column_text(st, i);
    return t ? (const char*)t : "";
}
static int readInt(sqlite3_stmt* st, int i) { return sqlite3_column_int(st, i); }
static double readDbl(sqlite3_stmt* st, int i) { return sqlite3_column_double(st, i); }

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
static HttpResponse handle(Database& db, HttpRequest& req) {
    HttpResponse res;
    string p = req.path;
    size_t q = p.find('?');
    if (q != string::npos) { req.query = p.substr(q + 1); p = p.substr(0, q); }

    auto send = [&](int c, JsonVal v) { res.code = c; res.json(v); return res; };

    // Preflight (OPTIONS) must return 200 so the browser's CORS
    // check passes. CORS headers are added by the main loop.
    if (req.method == "OPTIONS") {
        return send(200, JsonVal());
    }

    // ---- login (validates credentials against Users table) ----
    if (p == "/api/login" && req.method == "POST") {
        JsonVal body = JsonParser().parse(req.body);
        string email = body.strVal("username", "");
        if (email.empty()) email = body.strVal("email", "");
        string password = body.strVal("password", "");

        string safeEmail = email;
        for (char& c : safeEmail) { if (c == '\'' || c == '\\') c = '?'; }
        string sql = "SELECT id, email, password, role, name FROM Users WHERE email='" + safeEmail + "'";
        JsonVal rows = db.queryArray(sql,
            [](sqlite3_stmt* st) {
                JsonVal o; o.type = JsonVal::Obj;
                o.obj.push_back({"id", JsonVal(readInt(st,0))});
                o.obj.push_back({"email", JsonVal(readText(st,1))});
                o.obj.push_back({"password", JsonVal(readText(st,2))});
                o.obj.push_back({"role", JsonVal(readText(st,3))});
                o.obj.push_back({"name", JsonVal(readText(st,4))});
                return o;
            });
        if (rows.arr.empty() || rows.arr[0].get("password").str != password) {
            JsonVal out; out.type = JsonVal::Obj;
            out.obj.push_back({"success", JsonVal(false)});
            out.obj.push_back({"message", JsonVal("Invalid email or password")});
            out.obj.push_back({"dbg_count", JsonVal((long)rows.arr.size())});
            out.obj.push_back({"dbg_pw", JsonVal(rows.arr.empty() ? string("") : rows.arr[0].get("password").str)});
            out.obj.push_back({"dbg_email", JsonVal(email)});
            return send(401, out);
        }
        JsonVal u = rows.arr[0];
        string role = u.get("role").str;
        string name = u.get("name").str;
        long id = (long)u.get("id").num;

        JsonVal user; user.type = JsonVal::Obj;
        user.obj.push_back({"id", JsonVal(id)});
        user.obj.push_back({"name", JsonVal(name)});
        user.obj.push_back({"email", JsonVal(email)});
        user.obj.push_back({"role", JsonVal(role)});
        JsonVal out; out.type = JsonVal::Obj;
        out.obj.push_back({"success", JsonVal(true)});
        out.obj.push_back({"token", JsonVal("mock-jwt-token-" + role)});
        out.obj.push_back({"user", user});
        return send(200, out);
    }

    // ---- students ----
    if (p == "/api/students" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT p.id, p.name, p.contactInfo AS email, s.gpa, s.cgpa, s.program, s.year, s.status "
            "FROM Person p JOIN Student s ON s.id=p.id ORDER BY p.id",
            [](sqlite3_stmt* st) {
                JsonVal o; o.type = JsonVal::Obj;
                o.obj.push_back({"id", JsonVal(readInt(st,0))});
                o.obj.push_back({"name", JsonVal(readText(st,1))});
                o.obj.push_back({"email", JsonVal(readText(st,2))});
                o.obj.push_back({"gpa", JsonVal(readDbl(st,3))});
                o.obj.push_back({"cgpa", JsonVal(readDbl(st,4))});
                o.obj.push_back({"program", JsonVal(readText(st,5))});
                o.obj.push_back({"year", JsonVal(readInt(st,6))});
                o.obj.push_back({"status", JsonVal(readText(st,7))});
                return o;
            });
        return send(200, rows);
    }
    if (p == "/api/students" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        if (b.strVal("name").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: name")});return v;}());
        if (b.strVal("email").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: email")});return v;}());
        if (!b.contains("gpa")) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: gpa")});return v;}());
        if (!b.contains("cgpa")) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: cgpa")});return v;}());
        long id = db.nextFreeId();
        db.execParam("INSERT INTO Person (id,name,contactInfo,discriminator) VALUES (?,?,?,'Student')",
            {{1,std::to_string(id)},{2,b.strVal("name")},{3,b.strVal("email")}});
        db.execParam("INSERT INTO Student (id,gpa,cgpa,program,year,status,advisor) VALUES (?,?,?,?,?,?,?)",
            {{1,std::to_string(id)},{2,std::to_string(b.numVal("gpa",0))},{3,std::to_string(b.numVal("cgpa",0))},
             {4,b.strVal("program")},{5,std::to_string((long)b.numVal("year",1))},{6,b.strVal("status","active")},{7,b.strVal("advisor")}});
        JsonVal o; o.type=JsonVal::Obj;
        o.obj.push_back({"id",JsonVal(id)});
        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
        o.obj.push_back({"email",JsonVal(b.strVal("email"))});
        o.obj.push_back({"gpa",JsonVal(b.numVal("gpa",0))});
        o.obj.push_back({"cgpa",JsonVal(b.numVal("cgpa",0))});
        return send(201, o);
    }

    // student by id
    {
        size_t pos = p.rfind("/api/students/");
        if (pos == 0 && p.length() > 13) {
            string rest = p.substr(13);
            size_t slash = rest.find('/');
            string idStr = slash == string::npos ? rest : rest.substr(0, slash);
            try {
                long id = std::stol(idStr);
                if (slash == string::npos) {
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Person SET name=?, contactInfo=? WHERE id=?",
                            {{1,b.strVal("name")},{2,b.strVal("email")},{3,std::to_string(id)}});
                        db.execParam("UPDATE Student SET gpa=?, cgpa=?, program=?, year=?, status=?, advisor=? WHERE id=?",
                            {{1,std::to_string(b.numVal("gpa",0))},{2,std::to_string(b.numVal("cgpa",0))},
                             {3,b.strVal("program")},{4,std::to_string((long)b.numVal("year",1))},
                             {5,b.strVal("status","active")},{6,b.strVal("advisor")},{7,std::to_string(id)}});
                        JsonVal o; o.type=JsonVal::Obj;
                        o.obj.push_back({"id",JsonVal(id)});
                        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
                        o.obj.push_back({"email",JsonVal(b.strVal("email"))});
                        o.obj.push_back({"advisor",JsonVal(b.strVal("advisor"))});
                        return send(200, o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Person WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Student deleted")});
                        return send(200,o);
                    }
                } else if (rest.substr(slash) == "/courses" && req.method == "GET") {
                    JsonVal rows = db.queryArray(
                        "SELECT c.code, c.name FROM Enrollment e JOIN Course c ON c.id=e.courseId WHERE e.studentId=" + std::to_string(id),
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"code",JsonVal(readText(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/attendance" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, course, date, status, time FROM Attendance WHERE studentId=" + std::to_string(id),
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"course",JsonVal(readText(st,1))});o.obj.push_back({"date",JsonVal(readText(st,2))});o.obj.push_back({"status",JsonVal(readText(st,3))});o.obj.push_back({"time",JsonVal(readText(st,4))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/fees" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, course, amount, paid, dueDate, status FROM Fee WHERE studentId=" + std::to_string(id),
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"course",JsonVal(readText(st,1))});o.obj.push_back({"amount",JsonVal(readDbl(st,2))});o.obj.push_back({"paid",JsonVal(readDbl(st,3))});o.obj.push_back({"dueDate",JsonVal(readText(st,4))});o.obj.push_back({"status",JsonVal(readText(st,5))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/grades" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT c.code, e.grade FROM Enrollment e JOIN Course c ON c.id=e.courseId WHERE e.studentId=" + std::to_string(id),
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"code",JsonVal(readText(st,0))});o.obj.push_back({"grade",JsonVal(readDbl(st,1))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/timetable" && req.method == "GET") {
                    JsonVal rows = db.queryArray(
                        "SELECT t.course, t.day, t.time, t.room, t.instructor FROM Timetable t "
                        "JOIN Enrollment e ON e.courseId=(SELECT id FROM Course WHERE code=t.course) WHERE e.studentId=" + std::to_string(id),
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"course",JsonVal(readText(st,0))});o.obj.push_back({"day",JsonVal(readText(st,1))});o.obj.push_back({"time",JsonVal(readText(st,2))});o.obj.push_back({"room",JsonVal(readText(st,3))});o.obj.push_back({"instructor",JsonVal(readText(st,4))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/exams/upcoming" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, name, course, date, startTime FROM Exam WHERE status='scheduled' ORDER BY date LIMIT 5",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"date",JsonVal(readText(st,3))});o.obj.push_back({"startTime",JsonVal(readText(st,4))});return o;});
                    return send(200, rows);
                }
            } catch (...) {}
        }
    }

    // ---- faculty (list + create) ----
    if (p == "/api/faculty" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT p.id, p.name, p.contactInfo AS email, f.department, f.title, f.hireDate, f.status, f.teachingLoad "
            "FROM Person p JOIN Faculty f ON f.id=p.id ORDER BY p.id",
            [](sqlite3_stmt* st){
                JsonVal o;o.type=JsonVal::Obj;
                o.obj.push_back({"id",JsonVal(readInt(st,0))});
                o.obj.push_back({"name",JsonVal(readText(st,1))});
                o.obj.push_back({"email",JsonVal(readText(st,2))});
                o.obj.push_back({"department",JsonVal(readText(st,3))});
                o.obj.push_back({"title",JsonVal(readText(st,4))});
                o.obj.push_back({"hireDate",JsonVal(readText(st,5))});
                o.obj.push_back({"status",JsonVal(readText(st,6))});
                o.obj.push_back({"courses",JsonVal(readInt(st,7))});
                return o;
            });
        return send(200, rows);
    }
    if (p == "/api/faculty" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        if (b.strVal("name").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: name")});return v;}());
        long id = db.nextFreeId();
        db.execParam("INSERT INTO Person (id,name,contactInfo,discriminator) VALUES (?,?,?,'Faculty')",
            {{1,std::to_string(id)},{2,b.strVal("name")},{3,b.strVal("email")}});
        db.execParam("INSERT INTO Faculty (id,teachingLoad,department,title,email,hireDate,status) VALUES (?,?,?,?,?,?,?)",
            {{1,std::to_string(id)},{2,std::to_string(b.numVal("teachingLoad",0))},{3,b.strVal("department")},
             {4,b.strVal("title")},{5,b.strVal("email")},{6,b.strVal("hireDate")},{7,b.strVal("status","active")}});
        JsonVal o;o.type=JsonVal::Obj;
        o.obj.push_back({"id",JsonVal(id)});
        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
        return send(201, o);
    }

    // faculty by id
    {
        size_t pos = p.rfind("/api/faculty/");
        if (pos == 0 && p.length() > 13) {
            string rest = p.substr(13);
            size_t slash = rest.find('/');
            string idStr = slash == string::npos ? rest : rest.substr(0, slash);
            try {
                long id = std::stol(idStr);
                if (slash == string::npos) {
                    if (req.method == "GET") {
                        JsonVal rows = db.queryArray(
                            "SELECT p.id, p.name, p.contactInfo AS email, f.department, f.title, f.hireDate, f.status "
                            "FROM Person p JOIN Faculty f ON f.id=p.id WHERE p.id=" + std::to_string(id),
                            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});o.obj.push_back({"email",JsonVal(readText(st,2))});o.obj.push_back({"department",JsonVal(readText(st,3))});o.obj.push_back({"title",JsonVal(readText(st,4))});o.obj.push_back({"hireDate",JsonVal(readText(st,5))});o.obj.push_back({"status",JsonVal(readText(st,6))});return o;});
                        if (rows.arr.empty()) return send(404, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Faculty not found")});return v;}());
                        return send(200, rows.arr[0]);
                    }
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Person SET name=?, contactInfo=? WHERE id=?",
                            {{1,b.strVal("name")},{2,b.strVal("email")},{3,std::to_string(id)}});
                        db.execParam("UPDATE Faculty SET department=?, title=?, email=?, hireDate=?, status=? WHERE id=?",
                            {{1,b.strVal("department")},{2,b.strVal("title")},{3,b.strVal("email")},{4,b.strVal("hireDate")},{5,b.strVal("status","active")},{6,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;
                        o.obj.push_back({"id",JsonVal(id)});
                        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
                        return send(200,o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Person WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Faculty deleted")});
                        return send(200,o);
                    }
                } else if (rest.substr(slash) == "/courses" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, code, name FROM Course WHERE instructorId=" + std::to_string(id),
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"code",JsonVal(readText(st,1))});o.obj.push_back({"name",JsonVal(readText(st,2))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/attendance/today" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, student, course, status FROM Attendance WHERE date=date('now')",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"student",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"status",JsonVal(readText(st,3))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/grades/pending" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT e.studentId, c.code FROM Enrollment e JOIN Course c ON c.id=e.courseId WHERE e.grade IS NULL",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"studentId",JsonVal(readInt(st,0))});o.obj.push_back({"code",JsonVal(readText(st,1))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/classes/upcoming" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, course, day, time, room FROM Timetable WHERE instructor=(SELECT name FROM Person WHERE id=" + std::to_string(id) + ") ORDER BY day, time",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"course",JsonVal(readText(st,1))});o.obj.push_back({"day",JsonVal(readText(st,2))});o.obj.push_back({"time",JsonVal(readText(st,3))});o.obj.push_back({"room",JsonVal(readText(st,4))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/announcements" && req.method == "GET") {
                    JsonVal o;o.type=JsonVal::Arr; return send(200,o);
                }
            } catch (...) {}
        }
    }

    // ---- courses ----
    if (p == "/api/courses" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT id, code, name, department, credits, instructorId, maxCapacity, currentEnrollment, semester, status FROM Course ORDER BY id",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"code",JsonVal(readText(st,1))});o.obj.push_back({"name",JsonVal(readText(st,2))});o.obj.push_back({"department",JsonVal(readText(st,3))});o.obj.push_back({"credits",JsonVal(readInt(st,4))});o.obj.push_back({"instructorId",JsonVal(readInt(st,5))});o.obj.push_back({"capacity",JsonVal(readInt(st,6))});o.obj.push_back({"enrolled",JsonVal(readInt(st,7))});o.obj.push_back({"semester",JsonVal(readText(st,8))});o.obj.push_back({"status",JsonVal(readText(st,9))});return o;});
        return send(200, rows);
    }
    if (p == "/api/courses" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        if (b.strVal("code").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: code")});return v;}());
        db.execParam("INSERT INTO Course (code,name,credits,department,maxCapacity,instructorId,currentEnrollment,semester,status) VALUES (?,?,?,?,?,?,0,?,?)",
            {{1,b.strVal("code")},{2,b.strVal("name")},{3,std::to_string(b.numVal("credits",3))},{4,b.strVal("department")},
             {5,std::to_string((long)b.numVal("capacity",30))},{6,std::to_string((long)b.numVal("instructorId",0))},
             {7,b.strVal("semester")},{8,b.strVal("status","active")}});
        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(db.lastInsertId())});o.obj.push_back({"code",JsonVal(b.strVal("code"))});
        return send(201,o);
    }
    {
        size_t pos = p.rfind("/api/courses/");
        if (pos == 0 && p.length() > 12) {
            string rest = p.substr(12);
            size_t slash = rest.find('/');
            string idStr = slash == string::npos ? rest : rest.substr(0, slash);
            try {
                long id = std::stol(idStr);
                if (slash == string::npos) {
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Course SET code=?, name=?, credits=?, department=?, maxCapacity=?, instructorId=?, semester=?, status=? WHERE id=?",
                            {{1,b.strVal("code")},{2,b.strVal("name")},{3,std::to_string(b.numVal("credits",3))},{4,b.strVal("department")},
                             {5,std::to_string((long)b.numVal("capacity",30))},{6,std::to_string((long)b.numVal("instructorId",0))},
                             {7,b.strVal("semester")},{8,b.strVal("status","active")},{9,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(id)});
                        return send(200,o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Course WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Course deleted")});
                        return send(200,o);
                    }
                } else if (rest.substr(slash) == "/prerequisites" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT prerequisiteId FROM Prerequisite WHERE courseId=" + std::to_string(id),
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"prerequisiteId",JsonVal(readInt(st,0))});return o;});
                    return send(200, rows);
                }
            } catch (...) {}
        }
    }

    // ---- enrollments ----
    if (p == "/api/enrollments" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT e.studentId, p.name AS student, c.code AS course, e.enrollmentDate, e.grade, e.status "
            "FROM Enrollment e JOIN Person p ON p.id=e.studentId JOIN Course c ON c.id=e.courseId ORDER BY e.studentId",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"studentId",JsonVal(readInt(st,0))});o.obj.push_back({"student",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"enrollmentDate",JsonVal(readText(st,3))});o.obj.push_back({"grade",JsonVal(readDbl(st,4))});o.obj.push_back({"status",JsonVal(readText(st,5))});return o;});
        return send(200, rows);
    }
    if (p == "/api/enrollments" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        db.execParam("INSERT INTO Enrollment (studentId, courseId, grade, status) VALUES (?, (SELECT id FROM Course WHERE code=?), ?, ?)",
            {{1,std::to_string((long)b.numVal("studentId",0))},{2,b.strVal("course")},{3,std::to_string(b.numVal("grade",0))},{4,b.strVal("status","enrolled")}});
        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Enrolled")});
        return send(201,o);
    }
    {
        size_t pos = p.rfind("/api/enrollments/");
        if (pos == 0 && p.length() > 16) {
            string rest = p.substr(16);
            try {
                long id = std::stol(rest);
                if (req.method == "DELETE") {
                    db.execParam("DELETE FROM Enrollment WHERE studentId=?", {{1,std::to_string(id)}});
                    JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Dropped")});
                    return send(200,o);
                }
            } catch (...) {}
        }
    }

    // ---- attendance ----
    if (p == "/api/attendance" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT id, studentId, student, course, date, status, time, notes FROM Attendance ORDER BY date DESC, id",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"studentId",JsonVal(readText(st,1))});o.obj.push_back({"student",JsonVal(readText(st,2))});o.obj.push_back({"course",JsonVal(readText(st,3))});o.obj.push_back({"date",JsonVal(readText(st,4))});o.obj.push_back({"status",JsonVal(readText(st,5))});o.obj.push_back({"time",JsonVal(readText(st,6))});o.obj.push_back({"notes",JsonVal(readText(st,7))});return o;});
        return send(200, rows);
    }
    if (p == "/api/attendance" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        db.execParam("INSERT INTO Attendance (studentId, student, course, date, status, time, notes) VALUES (?,?,?,?,?,?,?)",
            {{1,std::to_string((long)b.numVal("studentId",0))},{2,b.strVal("student")},{3,b.strVal("course")},{4,b.strVal("date")},
             {5,b.strVal("status","present")},{6,b.strVal("time")},{7,b.strVal("notes")}});
        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(db.lastInsertId())});
        return send(201,o);
    }
    {
        size_t pos = p.rfind("/api/attendance/");
        if (pos == 0 && p.length() > 15) {
            string rest = p.substr(15);
            size_t slash = rest.find('/');
            try {
                long id = std::stol(slash == string::npos ? rest : rest.substr(0, slash));
                if (slash == string::npos) {
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Attendance SET studentId=?, student=?, course=?, date=?, status=?, time=?, notes=? WHERE id=?",
                            {{1,std::to_string((long)b.numVal("studentId",0))},{2,b.strVal("student")},{3,b.strVal("course")},{4,b.strVal("date")},
                             {5,b.strVal("status","present")},{6,b.strVal("time")},{7,b.strVal("notes")},{8,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(id)});
                        return send(200,o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Attendance WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Deleted")});
                        return send(200,o);
                    }
                }
            } catch (...) {}
        }
    }

    // ---- exams ----
    if (p == "/api/exams" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT id, name, course, date, startTime, endTime, type, location, totalMarks, status, students FROM Exam ORDER BY id",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"date",JsonVal(readText(st,3))});o.obj.push_back({"startTime",JsonVal(readText(st,4))});o.obj.push_back({"endTime",JsonVal(readText(st,5))});o.obj.push_back({"type",JsonVal(readText(st,6))});o.obj.push_back({"location",JsonVal(readText(st,7))});o.obj.push_back({"totalMarks",JsonVal(readDbl(st,8))});o.obj.push_back({"status",JsonVal(readText(st,9))});o.obj.push_back({"students",JsonVal(readInt(st,10))});return o;});
        return send(200, rows);
    }
    if (p == "/api/exams" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        db.execParam("INSERT INTO Exam (name,course,date,startTime,endTime,type,location,totalMarks,status,students) VALUES (?,?,?,?,?,?,?,?,?,?)",
            {{1,b.strVal("name")},{2,b.strVal("course")},{3,b.strVal("date")},{4,b.strVal("startTime")},{5,b.strVal("endTime")},
             {6,b.strVal("type","midterm")},{7,b.strVal("location")},{8,std::to_string(b.numVal("totalMarks",100))},
             {9,b.strVal("status","scheduled")},{10,std::to_string((long)b.numVal("students",0))}});
        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(db.lastInsertId())});
        return send(201,o);
    }
    {
        size_t pos = p.rfind("/api/exams/");
        if (pos == 0 && p.length() > 10) {
            string rest = p.substr(10);
            size_t slash = rest.find('/');
            try {
                long id = std::stol(slash == string::npos ? rest : rest.substr(0, slash));
                if (slash == string::npos) {
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Exam SET name=?, course=?, date=?, startTime=?, endTime=?, type=?, location=?, totalMarks=?, status=?, students=? WHERE id=?",
                            {{1,b.strVal("name")},{2,b.strVal("course")},{3,b.strVal("date")},{4,b.strVal("startTime")},{5,b.strVal("endTime")},
                             {6,b.strVal("type","midterm")},{7,b.strVal("location")},{8,std::to_string(b.numVal("totalMarks",100))},
                             {9,b.strVal("status","scheduled")},{10,std::to_string((long)b.numVal("students",0))},{11,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(id)});
                        return send(200,o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Exam WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Deleted")});
                        return send(200,o);
                    }
                } else if (rest.substr(slash) == "/upcoming" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, name, course, date FROM Exam WHERE status='scheduled' ORDER BY date LIMIT 5",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"date",JsonVal(readText(st,3))});return o;});
                    return send(200, rows);
                }
            } catch (...) {}
        }
    }

    // ---- fees ----
    if (p == "/api/fees" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT id, studentId, student, course, amount, paid, dueDate, paidDate, semester, status FROM Fee ORDER BY id",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"studentId",JsonVal(readText(st,1))});o.obj.push_back({"student",JsonVal(readText(st,2))});o.obj.push_back({"course",JsonVal(readText(st,3))});o.obj.push_back({"amount",JsonVal(readDbl(st,4))});o.obj.push_back({"paid",JsonVal(readDbl(st,5))});o.obj.push_back({"dueDate",JsonVal(readText(st,6))});o.obj.push_back({"paidDate",JsonVal(readText(st,7))});o.obj.push_back({"semester",JsonVal(readText(st,8))});o.obj.push_back({"status",JsonVal(readText(st,9))});return o;});
        return send(200, rows);
    }
    if (p == "/api/fees" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        db.execParam("INSERT INTO Fee (studentId, student, course, amount, paid, dueDate, semester, status) VALUES (?,?,?,?,0,?,?,?)",
            {{1,std::to_string((long)b.numVal("studentId",0))},{2,b.strVal("student")},{3,b.strVal("course")},{4,std::to_string(b.numVal("amount",0))},
             {5,b.strVal("dueDate")},{6,b.strVal("semester")},{7,b.strVal("status","pending")}});
        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(db.lastInsertId())});
        return send(201,o);
    }
    {
        size_t pos = p.rfind("/api/fees/");
        if (pos == 0 && p.length() > 9) {
            string rest = p.substr(9);
            size_t slash = rest.find('/');
            try {
                long id = std::stol(slash == string::npos ? rest : rest.substr(0, slash));
                if (slash == string::npos) {
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Fee SET studentId=?, student=?, course=?, amount=?, paid=?, dueDate=?, paidDate=?, semester=?, status=? WHERE id=?",
                            {{1,std::to_string((long)b.numVal("studentId",0))},{2,b.strVal("student")},{3,b.strVal("course")},{4,std::to_string(b.numVal("amount",0))},
                             {5,std::to_string(b.numVal("paid",0))},{6,b.strVal("dueDate")},{7,b.strVal("paidDate")},{8,b.strVal("semester")},
                             {9,b.strVal("status","pending")},{10,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(id)});
                        return send(200,o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Fee WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Deleted")});
                        return send(200,o);
                    }
                } else if (rest.substr(slash) == "/payments" && req.method == "POST") {
                    JsonVal b = JsonParser().parse(req.body);
                    double amt = b.numVal("amount", 0.0);
                    db.execParam("UPDATE Fee SET paid=paid+?, paidDate=date('now'), status=CASE WHEN paid+?>=amount THEN 'paid' ELSE 'partial' END WHERE id=?",
                        {{1,std::to_string(amt)},{2,std::to_string(amt)},{3,std::to_string(id)}});
                    JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Payment recorded")});
                    return send(200,o);
                }
            } catch (...) {}
        }
    }

    // ---- timetable ----
    if (p == "/api/timetable" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT id, course, day, time, room, instructor, type FROM Timetable ORDER BY day, time",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"course",JsonVal(readText(st,1))});o.obj.push_back({"day",JsonVal(readText(st,2))});o.obj.push_back({"time",JsonVal(readText(st,3))});o.obj.push_back({"room",JsonVal(readText(st,4))});o.obj.push_back({"instructor",JsonVal(readText(st,5))});o.obj.push_back({"type",JsonVal(readText(st,6))});return o;});
        return send(200, rows);
    }
    if (p == "/api/timetable" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        db.execParam("INSERT INTO Timetable (course, day, time, room, instructor, type) VALUES (?,?,?,?,?,?)",
            {{1,b.strVal("course")},{2,b.strVal("day")},{3,b.strVal("time")},{4,b.strVal("room")},{5,b.strVal("instructor")},{6,b.strVal("type","lecture")}});
        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(db.lastInsertId())});
        return send(201,o);
    }
    {
        size_t pos = p.rfind("/api/timetable/");
        if (pos == 0 && p.length() > 13) {
            string rest = p.substr(13);
            size_t slash = rest.find('/');
            try {
                long id = std::stol(slash == string::npos ? rest : rest.substr(0, slash));
                if (slash == string::npos) {
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Timetable SET course=?, day=?, time=?, room=?, instructor=?, type=? WHERE id=?",
                            {{1,b.strVal("course")},{2,b.strVal("day")},{3,b.strVal("time")},{4,b.strVal("room")},{5,b.strVal("instructor")},{6,b.strVal("type","lecture")},{7,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(id)});
                        return send(200,o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Timetable WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Deleted")});
                        return send(200,o);
                    }
                }
            } catch (...) {}
        }
    }

    // ---- accountant ----
    if (p == "/api/accountant/dues" && req.method == "GET") {
        JsonVal rows = db.queryArray("SELECT id, student, course, amount, paid, dueDate, status FROM Fee WHERE status IN ('pending','partial','overdue') ORDER BY dueDate",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"student",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"amount",JsonVal(readDbl(st,3))});o.obj.push_back({"paid",JsonVal(readDbl(st,4))});o.obj.push_back({"dueDate",JsonVal(readText(st,5))});o.obj.push_back({"status",JsonVal(readText(st,6))});return o;});
        return send(200, rows);
    }
    if (p == "/api/accountant/invoices" && req.method == "GET") {
        JsonVal rows = db.queryArray("SELECT id, student, course, amount, paid, status FROM Fee ORDER BY id",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"student",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"amount",JsonVal(readDbl(st,3))});o.obj.push_back({"paid",JsonVal(readDbl(st,4))});o.obj.push_back({"status",JsonVal(readText(st,5))});return o;});
        return send(200, rows);
    }
    if (p == "/api/accountant/payments" && req.method == "GET") {
        JsonVal rows = db.queryArray("SELECT id, student, course, paid, paidDate FROM Fee WHERE paid>0 ORDER BY paidDate DESC",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"student",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"paid",JsonVal(readDbl(st,3))});o.obj.push_back({"paidDate",JsonVal(readText(st,4))});return o;});
        return send(200, rows);
    }

    // ---- health ----
    if (p == "/api/health" && req.method == "GET") {
        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"status",JsonVal("ok")});
        return send(200,o);
    }

    JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Not found")});
    return send(404, o);
}

// ---------------------------------------------------------------------------
// HTTP server loop (Winsock, one thread, keep it simple & robust)
// ---------------------------------------------------------------------------
static string httpDate() {
    SYSTEMTIME st; GetSystemTime(&st);
    char buf[64];
    sprintf(buf, "%04d-%02d-%02d %02d:%02d:%02d", st.wYear, st.wMonth, st.wDay, st.wHour, st.wMinute, st.wSecond);
    return string(buf);
}

int main() {
    try {
        Database db("college.db");
        std::cerr << "Database initialized successfully\n";

        WSADATA wsa;
        if (WSAStartup(MAKEWORD(2,2), &wsa) != 0) {
            std::cerr << "WSAStartup failed\n"; return 1;
        }
        SOCKET server = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (server == INVALID_SOCKET) { std::cerr << "socket failed\n"; return 1; }
        int opt = 1;
        setsockopt(server, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY;
        addr.sin_port = htons(8080);
        if (bind(server, (sockaddr*)&addr, sizeof(addr)) == SOCKET_ERROR) {
            std::cerr << "bind failed\n"; return 1;
        }
        listen(server, SOMAXCONN);
        std::cerr << "Starting server on port 8080...\n";

        while (true) {
            SOCKET client = accept(server, nullptr, nullptr);
            if (client == INVALID_SOCKET) continue;

            char buf[65536];
            int total = 0;
            int headerEnd = -1;
            int contentLen = 0;
            string raw;
            while (total < (int)sizeof(buf) - 1) {
                int n = recv(client, buf + total, sizeof(buf) - 1 - total, 0);
                if (n <= 0) break;
                total += n;
                buf[total] = 0;
                string sofar(buf);
                size_t he = sofar.find("\r\n\r\n");
                if (he != string::npos) {
                    headerEnd = (int)he;
                    size_t cl = sofar.find("Content-Length:");
                    if (cl != string::npos) {
                        contentLen = atoi(sofar.substr(cl + 15).c_str());
                    }
                    if (total >= headerEnd + 4 + contentLen) break;
                }
            }
            buf[total] = 0;
            string reqStr(buf);

            HttpRequest req;
            size_t lineEnd = reqStr.find("\r\n");
            string first = lineEnd == string::npos ? reqStr : reqStr.substr(0, lineEnd);
            std::istringstream ls(first);
            ls >> req.method >> req.path;
            if (headerEnd != -1) {
                string head = reqStr.substr(0, headerEnd);
                size_t cl = head.find("Content-Length:");
                if (cl != string::npos) {
                    int len = atoi(head.substr(cl + 15).c_str());
                    req.body = reqStr.substr(headerEnd + 4, len);
                }
            }

            HttpResponse res = handle(db, req);

            string bodyStr = res.body;
            string resp = "HTTP/1.1 " + std::to_string(res.code) + " ";
            resp += (res.code == 200 ? "OK" : res.code == 201 ? "Created" : res.code == 400 ? "Bad Request" : res.code == 404 ? "Not Found" : res.code == 405 ? "Method Not Allowed" : "Status");
            resp += "\r\nContent-Type: " + res.contentType + "; charset=utf-8\r\n";
            resp += "Access-Control-Allow-Origin: *\r\n";
            resp += "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n";
            resp += "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
            resp += "Content-Length: " + std::to_string(bodyStr.size()) + "\r\n\r\n";
            resp += bodyStr;

            send(client, resp.c_str(), (int)resp.size(), 0);
            closesocket(client);
        }
        closesocket(server);
        WSACleanup();
    } catch (const std::exception& e) {
        std::cerr << "Fatal error: " << e.what() << "\n";
        return 1;
    }
    return 0;
}
