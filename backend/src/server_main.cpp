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

#include "timetable_validator.h"

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
        sqlite3_busy_timeout(db_, 5000);
        initSchema();
    }
    ~Database() { if (db_) sqlite3_close(db_); }
    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;

    void initSchema() {
        sqlite3_stmt* check = nullptr;
        bool hasSchema = false;
        if (sqlite3_prepare_v2(db_, "SELECT 1 FROM sqlite_master WHERE type='table' AND name IN ('Person','Users','Attendance') LIMIT 1", -1, &check, nullptr) == SQLITE_OK) {
            hasSchema = sqlite3_step(check) == SQLITE_ROW;
            sqlite3_finalize(check);
        }
        if (hasSchema) return;

        std::ifstream f("schema.sql");
        if (f) {
            std::stringstream ss; ss << f.rdbuf();
            exec(ss.str());
        } else {
            execInline();
        }
        migrate();
        seedDefaultUsers();
        std::ifstream seed("seed_data.sql");
        if (!seed) seed.open("../../src/seed_data.sql");
        if (seed) {
            std::stringstream ss; ss << seed.rdbuf();
            exec(ss.str());
        }
    }
    void execInline() {
        const char* sql = R"SQL(
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS Person (id INTEGER PRIMARY KEY, name TEXT NOT NULL, contactInfo TEXT NOT NULL DEFAULT '', discriminator TEXT NOT NULL CHECK (discriminator IN ('Student','Teacher','Accountant')), tempId TEXT);
 CREATE TABLE IF NOT EXISTS Student (id INTEGER PRIMARY KEY, program TEXT, year INTEGER DEFAULT 1, status TEXT DEFAULT 'active', phone TEXT DEFAULT '', classroom TEXT DEFAULT '', FOREIGN KEY(id) REFERENCES Person(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS Teacher (id INTEGER PRIMARY KEY, department TEXT, title TEXT, email TEXT, hireDate TEXT, status TEXT DEFAULT 'active', assignedClassroom TEXT DEFAULT '', assignedCourse TEXT DEFAULT '', FOREIGN KEY(id) REFERENCES Person(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS Course (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL CHECK (credits > 0),
  department TEXT,
  maxCapacity INTEGER NOT NULL CHECK (maxCapacity >= 0),
  instructorId INTEGER,
  semester TEXT,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (instructorId) REFERENCES Teacher(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS Accountant (id INTEGER PRIMARY KEY, FOREIGN KEY(id) REFERENCES Person(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS Exam (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, course TEXT NOT NULL, date TEXT, startTime TEXT, endTime TEXT, type TEXT DEFAULT 'midterm', location TEXT, totalMarks REAL DEFAULT 100, status TEXT DEFAULT 'scheduled', students INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS Attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, studentId TEXT, student TEXT, course TEXT, date TEXT, status TEXT DEFAULT 'present', time TEXT, notes TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS Fee (id INTEGER PRIMARY KEY AUTOINCREMENT, studentId TEXT, student TEXT, course TEXT, amount REAL DEFAULT 0, paid REAL DEFAULT 0, dueDate TEXT, paidDate TEXT, semester TEXT, status TEXT DEFAULT 'pending');
CREATE TABLE IF NOT EXISTS Timetable (id INTEGER PRIMARY KEY AUTOINCREMENT, course TEXT NOT NULL, day TEXT NOT NULL, time TEXT NOT NULL, room TEXT, instructor TEXT, type TEXT DEFAULT 'lecture');
CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS Department (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
)SQL";
        exec(sql);
    }
    void migrate() {
        auto alter = [this](const string& sql) {
            try { exec(sql); } catch (...) {}
        };
        auto drop = [this](const string& sql) {
            try { exec(sql); } catch (...) {}
        };
        drop("ALTER TABLE Faculty RENAME TO Teacher");
        alter("ALTER TABLE Teacher ADD COLUMN assignedClassroom TEXT DEFAULT ''");
        alter("ALTER TABLE Teacher ADD COLUMN assignedCourse TEXT DEFAULT ''");
        alter("ALTER TABLE Student ADD COLUMN phone TEXT DEFAULT ''");
        alter("ALTER TABLE Student ADD COLUMN classroom TEXT DEFAULT ''");
        // Keep older databases compatible with the current seed data.
        alter("CREATE TABLE IF NOT EXISTS Classroom ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, "
            "room_number TEXT NOT NULL, "
            "name TEXT NOT NULL, "
            "section_name TEXT NOT NULL DEFAULT '', "
            "capacity INTEGER NOT NULL DEFAULT 0, "
            "teacher_id INTEGER, "
            "status TEXT NOT NULL DEFAULT 'active')");
        alter("ALTER TABLE Classroom ADD COLUMN section_name TEXT NOT NULL DEFAULT ''");
        alter("ALTER TABLE Classroom ADD COLUMN capacity INTEGER NOT NULL DEFAULT 0");
        alter("ALTER TABLE Classroom ADD COLUMN teacher_id INTEGER");
        alter("ALTER TABLE Classroom ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
        alter("CREATE TABLE IF NOT EXISTS ClassroomStudent ("
            "classroom_id INTEGER NOT NULL, "
            "student_id INTEGER NOT NULL, "
            "PRIMARY KEY (classroom_id, student_id))");
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
    // Raw handle for modules that run their own SQL (e.g. the timetable
    // validator, which deliberately avoids this class's helpers so it cannot
    // inherit their assumptions).
    sqlite3* raw() { return db_; }
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
            "SELECT p.id, p.name, p.contactInfo AS email, s.phone AS phone, s.program, s.classroom AS section, s.year, s.status, u.password "
            "FROM Person p JOIN Student s ON s.id=p.id LEFT JOIN Users u ON u.email=p.contactInfo "
            "WHERE p.id NOT IN (SELECT id FROM Teacher) "
            "ORDER BY p.id",
            [](sqlite3_stmt* st) {
                JsonVal o; o.type = JsonVal::Obj;
                o.obj.push_back({"id", JsonVal(readInt(st,0))});
                o.obj.push_back({"name", JsonVal(readText(st,1))});
                o.obj.push_back({"email", JsonVal(readText(st,2))});
                o.obj.push_back({"phone", JsonVal(readText(st,3))});
                o.obj.push_back({"program", JsonVal(readText(st,4))});
                o.obj.push_back({"section", JsonVal(readText(st,5))});
                o.obj.push_back({"year", JsonVal(readInt(st,6))});
                o.obj.push_back({"status", JsonVal(readText(st,7))});
                o.obj.push_back({"password", JsonVal(readText(st,8))});
                return o;
            });
        return send(200, rows);
    }
    if (p == "/api/students" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        if (b.strVal("name").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: name")});return v;}());
        if (b.strVal("email").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: email")});return v;}());
        long id = db.nextFreeId();
        db.execParam("INSERT INTO Person (id,name,contactInfo,discriminator) VALUES (?,?,?,'Student')",
            {{1,std::to_string(id)},{2,b.strVal("name")},{3,b.strVal("email")}});
         db.execParam("INSERT INTO Student (id,program,year,status,phone,classroom) VALUES (?,?,?,?,?,?)",
             {{1,std::to_string(id)},
              {2,b.strVal("program")},{3,std::to_string((long)b.numVal("year",1))},{4,b.strVal("status","active")},
              {5,b.strVal("phone")},{6,b.strVal("classroom")}});
          db.execParam("INSERT OR REPLACE INTO Users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)",
              {{1,std::to_string(id)},{2,b.strVal("email")},{3,b.strVal("password")},{4,"student"},{5,b.strVal("name")}});
         JsonVal o; o.type=JsonVal::Obj;
        o.obj.push_back({"id",JsonVal(id)});
        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
        o.obj.push_back({"email",JsonVal(b.strVal("email"))});
        o.obj.push_back({"phone",JsonVal(b.strVal("phone"))});
        o.obj.push_back({"classroom",JsonVal(b.strVal("classroom"))});
        return send(201, o);
    }

    // student by id
    {
        size_t pos = p.rfind("/api/students/");
        if (pos == 0 && p.length() > 14) {
            string rest = p.substr(14);
            size_t slash = rest.find('/');
            string idStr = slash == string::npos ? rest : rest.substr(0, slash);
            try {
                long id = std::stol(idStr);
                if (slash == string::npos) {
                     if (req.method == "PUT") {
                         JsonVal b = JsonParser().parse(req.body);
                         db.execParam("UPDATE Person SET name=?, contactInfo=? WHERE id=?",
                             {{1,b.strVal("name")},{2,b.strVal("email")},{3,std::to_string(id)}});
                         db.execParam("UPDATE Student SET program=?, year=?, status=?, phone=?, classroom=? WHERE id=?",
                             {{1,b.strVal("program")},{2,std::to_string((long)b.numVal("year",1))},
                              {3,b.strVal("status","active")},{4,b.strVal("phone")},{5,b.strVal("classroom")},{6,std::to_string(id)}});
                         db.execParam("UPDATE Users SET email=?, name=? WHERE id=?",
                             {{1,b.strVal("email")},{2,b.strVal("name")},{3,std::to_string(id)}});
                         string pw = b.strVal("password");
                         if (!pw.empty()) {
                             db.execParam("UPDATE Users SET password=? WHERE id=?",
                                 {{1,pw},{2,std::to_string(id)}});
                         }
                         JsonVal o; o.type=JsonVal::Obj;
                         o.obj.push_back({"id",JsonVal(id)});
                         o.obj.push_back({"name",JsonVal(b.strVal("name"))});
                         o.obj.push_back({"email",JsonVal(b.strVal("email"))});
                         return send(200, o);
                     }
                     if (req.method == "DELETE") {
                         db.execParam("DELETE FROM Users WHERE id=?", {{1,std::to_string(id)}});
                         db.execParam("DELETE FROM Person WHERE id=?", {{1,std::to_string(id)}});
                         JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Student deleted")});
                         return send(200,o);
                     }
                } else if (rest.substr(slash) == "/attendance" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, course, date, status, time FROM Attendance WHERE studentId=" + std::to_string(id),
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"course",JsonVal(readText(st,1))});o.obj.push_back({"date",JsonVal(readText(st,2))});o.obj.push_back({"status",JsonVal(readText(st,3))});o.obj.push_back({"time",JsonVal(readText(st,4))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/fees" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, course, amount, paid, dueDate, status FROM Fee WHERE studentId=" + std::to_string(id),
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"course",JsonVal(readText(st,1))});o.obj.push_back({"amount",JsonVal(readDbl(st,2))});o.obj.push_back({"paid",JsonVal(readDbl(st,3))});o.obj.push_back({"dueDate",JsonVal(readText(st,4))});o.obj.push_back({"status",JsonVal(readText(st,5))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/grades" && req.method == "GET") {
                    JsonVal rows; rows.type = JsonVal::Arr;
                    return send(200, rows);
                } else if (rest.substr(slash) == "/timetable" && req.method == "GET") {
                    JsonVal rows; rows.type = JsonVal::Arr;
                    return send(200, rows);
                } else if (rest.substr(slash) == "/exams/upcoming" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, name, course, date, startTime FROM Exam WHERE status='scheduled' ORDER BY date LIMIT 5",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"date",JsonVal(readText(st,3))});o.obj.push_back({"startTime",JsonVal(readText(st,4))});return o;});
                    return send(200, rows);
                }
            } catch (...) {}
        }
    }

    // ---- teachers (list + create) ----
    if (p == "/api/teachers" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT p.id, p.name, p.contactInfo AS email, t.phone, t.department, t.hireDate, t.status, t.assignedClassroom, t.assignedCourse, u.password "
            "FROM Person p JOIN Teacher t ON t.id=p.id LEFT JOIN Users u ON u.email=p.contactInfo "
            "WHERE p.id NOT IN (SELECT id FROM Student) "
            "ORDER BY p.id",
            [](sqlite3_stmt* st){
                JsonVal o;o.type=JsonVal::Obj;
                o.obj.push_back({"id",JsonVal(readInt(st,0))});
                o.obj.push_back({"name",JsonVal(readText(st,1))});
                o.obj.push_back({"email",JsonVal(readText(st,2))});
                o.obj.push_back({"phone",JsonVal(readText(st,3))});
                o.obj.push_back({"department",JsonVal(readText(st,4))});
                o.obj.push_back({"hireDate",JsonVal(readText(st,5))});
                o.obj.push_back({"status",JsonVal(readText(st,6))});
                o.obj.push_back({"assignedClassroom",JsonVal(readText(st,7))});
                o.obj.push_back({"assignedCourse",JsonVal(readText(st,8))});
                o.obj.push_back({"password",JsonVal(readText(st,9))});
                return o;
            });
        return send(200, rows);
    }
    if (p == "/api/teachers" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        if (b.strVal("name").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: name")});return v;}());
        if (b.strVal("email").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: email")});return v;}());
        long id = db.nextFreeId();
        db.execParam("INSERT INTO Person (id,name,contactInfo,discriminator) VALUES (?,?,?,'Teacher')",
            {{1,std::to_string(id)},{2,b.strVal("name")},{3,b.strVal("email")}});
        db.execParam("INSERT INTO Teacher (id,department,phone,email,hireDate,status,assignedClassroom,assignedCourse) VALUES (?,?,?,?,?,?,?,?)",
            {{1,std::to_string(id)},{2,b.strVal("department")},{3,b.strVal("phone")},{4,b.strVal("email")},
             {5,b.strVal("hireDate")},{6,b.strVal("status","active")},
             {7,b.strVal("assignedClassroom")},{8,b.strVal("assignedCourse")}});
        if (!b.strVal("password").empty()) {
            db.execParam("INSERT OR REPLACE INTO Users (id, email, password, role, name) VALUES (?, ?, ?, 'teacher', ?)",
                {{1,std::to_string(id)},{2,b.strVal("email")},{3,b.strVal("password")},{4,b.strVal("name")}});
        }
        JsonVal o;o.type=JsonVal::Obj;
        o.obj.push_back({"id",JsonVal(id)});
        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
        return send(201, o);
    }

    // ---- departments (list + create) ----
    if (p == "/api/departments" && req.method == "GET") {
        JsonVal rows = db.queryArray("SELECT id, name FROM Department ORDER BY name", [](sqlite3_stmt* st){ JsonVal o; o.type=JsonVal::Obj; o.obj.push_back({"id",JsonVal(readInt(st,0))}); o.obj.push_back({"name",JsonVal(readText(st,1))}); return o; });
        return send(200, rows);
    }
    if (p == "/api/departments" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        if (b.strVal("name").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: name")});return v;}());
        long id = db.nextFreeId();
        try {
            db.execParam("INSERT INTO Department (id,name) VALUES (?,?)", {{1,std::to_string(id)},{2,b.strVal("name")}});
        } catch (...) {
            return send(409, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("A department with this name already exists")});return v;}());
        }
        JsonVal o;o.type=JsonVal::Obj;
        o.obj.push_back({"id",JsonVal(id)});
        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
        return send(201, o);
    }


    // teacher by id
    {
        size_t pos = p.rfind("/api/teachers/");
        if (pos == 0 && p.length() > 14) {
            string rest = p.substr(14);
            size_t slash = rest.find('/');
            string idStr = slash == string::npos ? rest : rest.substr(0, slash);
            try {
                long id = std::stol(idStr);
                if (slash == string::npos) {
                    if (req.method == "GET") {
                        JsonVal rows = db.queryArray(
                            "SELECT p.id, p.name, p.contactInfo AS email, t.phone, t.department, t.title, t.hireDate, t.status, t.assignedClassroom, t.assignedCourse, u.password "
                            "FROM Person p JOIN Teacher t ON t.id=p.id LEFT JOIN Users u ON u.email=p.contactInfo WHERE p.id=" + std::to_string(id),
                            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});o.obj.push_back({"email",JsonVal(readText(st,2))});o.obj.push_back({"phone",JsonVal(readText(st,3))});o.obj.push_back({"department",JsonVal(readText(st,4))});o.obj.push_back({"hireDate",JsonVal(readText(st,6))});o.obj.push_back({"status",JsonVal(readText(st,7))});o.obj.push_back({"assignedClassroom",JsonVal(readText(st,8))});o.obj.push_back({"assignedCourse",JsonVal(readText(st,9))});o.obj.push_back({"password",JsonVal(readText(st,10))});return o;});
                        if (rows.arr.empty()) return send(404, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Teacher not found")});return v;}());
                        return send(200, rows.arr[0]);
                    }
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Person SET name=?, contactInfo=? WHERE id=?",
                            {{1,b.strVal("name")},{2,b.strVal("email")},{3,std::to_string(id)}});
                        db.execParam("UPDATE Teacher SET department=?, phone=?, email=?, hireDate=?, status=?, assignedClassroom=?, assignedCourse=? WHERE id=?",
                            {{1,b.strVal("department")},{2,b.strVal("phone")},{3,b.strVal("email")},{4,b.strVal("hireDate")},{5,b.strVal("status","active")},
                             {6,b.strVal("assignedClassroom")},{7,b.strVal("assignedCourse")},{8,std::to_string(id)}});
                        db.execParam("UPDATE Users SET email=?, name=? WHERE id=?",
                            {{1,b.strVal("email")},{2,b.strVal("name")},{3,std::to_string(id)}});
                        string pw = b.strVal("password");
                        if (!pw.empty()) {
                            db.execParam("UPDATE Users SET password=? WHERE id=?",
                                {{1,pw},{2,std::to_string(id)}});
                        }
                        JsonVal o;o.type=JsonVal::Obj;
                        o.obj.push_back({"id",JsonVal(id)});
                        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
                        return send(200,o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Person WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Teacher deleted")});
                        return send(200,o);
                    }
                } else if (rest.substr(slash) == "/attendance/today" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, student, course, status FROM Attendance WHERE date=date('now')",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"student",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"status",JsonVal(readText(st,3))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/attendance" && req.method == "GET") {
                    JsonVal rows = db.queryArray(
                        "SELECT a.id, a.student, a.course, a.date, a.status, a.time, a.notes "
                        "FROM Attendance a "
                        "WHERE a.course IN (SELECT DISTINCT course FROM Timetable WHERE instructor=(SELECT name FROM Person WHERE id=" + std::to_string(id) + ")) "
                        "ORDER BY a.date DESC, a.id DESC",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"student",JsonVal(readText(st,1))});o.obj.push_back({"course",JsonVal(readText(st,2))});o.obj.push_back({"date",JsonVal(readText(st,3))});o.obj.push_back({"status",JsonVal(readText(st,4))});o.obj.push_back({"time",JsonVal(readText(st,5))});o.obj.push_back({"notes",JsonVal(readText(st,6))});return o;});
                    return send(200, rows);
                } else if (rest.substr(slash) == "/grades/pending" && req.method == "GET") {
                    JsonVal rows; rows.type = JsonVal::Arr;
                    return send(200, rows);
                } else if (rest.substr(slash) == "/classes/upcoming" && req.method == "GET") {
                    JsonVal rows = db.queryArray("SELECT id, course, day, time, room FROM Timetable WHERE instructor=(SELECT name FROM Person WHERE id=" + std::to_string(id) + ") ORDER BY day, time",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"course",JsonVal(readText(st,1))});o.obj.push_back({"day",JsonVal(readText(st,2))});o.obj.push_back({"time",JsonVal(readText(st,3))});o.obj.push_back({"room",JsonVal(readText(st,4))});return o;});
                    return send(200, rows);
} else if (rest.substr(slash) == "/announcements" && req.method == "GET") {
                      JsonVal o;o.type=JsonVal::Arr; return send(200,o);
                  } else if (rest.substr(slash) == "/classrooms" && req.method == "GET") {
                     JsonVal rows = db.queryArray(
                         "SELECT c.id, c.room_number, c.name "
                         "FROM Classroom c JOIN Teacher t ON (',' || replace(t.assignedClassroom, ' ', '') || ',') LIKE '%,' || replace(c.room_number, ' ', '') || ',%' "
                         "OR (',' || replace(t.assignedClassroom, ' ', '') || ',') LIKE '%,' || replace(c.name, ' ', '') || ',%' "
                         "OR (',' || replace(t.assignedClassroom, ' ', '') || ',') LIKE '%,' || replace(c.section_name, ' ', '') || ',%' "
                         "WHERE t.id=" + std::to_string(id) + " ORDER BY c.room_number",
                         [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"room_number",JsonVal(readText(st,1))});o.obj.push_back({"name",JsonVal(readText(st,2))});return o;});
                     return send(200, rows);
                 }
            } catch (...) {}
        }
    }

    // departments by id
    {
        size_t pos = p.rfind("/api/departments/");
        if (pos == 0 && p.length() > 17) {
            string rest = p.substr(17);
            size_t slash = rest.find('/');
            string idStr = slash == string::npos ? rest : rest.substr(0, slash);
            try {
                long id = std::stol(idStr);
                if (slash == string::npos) {
                    if (req.method == "DELETE") {
                        JsonVal r = db.queryArray("SELECT id FROM Department WHERE id=" + std::to_string(id), [](sqlite3_stmt*){ return JsonVal(); });
                        if (r.arr.empty()) return send(404, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Department not found")});return v;}());
                        db.execParam("DELETE FROM Department WHERE id=?", {{1,std::to_string(id)}});
                        return send(200, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Department deleted")});return v;}());
                    }
                }
            } catch (...) {}
        }
    }





    // ---- classrooms ----
    if (p == "/api/classrooms" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT c.id, c.room_number, c.name "
            "FROM Classroom c "
            "ORDER BY c.room_number",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"room_number",JsonVal(readText(st,1))});o.obj.push_back({"name",JsonVal(readText(st,2))});return o;});
        return send(200, rows);
    }
    if (p == "/api/classrooms" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        if (b.strVal("room_number").empty() || b.strVal("name").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing required fields: room_number, name")});return v;}());
        long id = db.nextFreeId();
        db.execParam("INSERT INTO Classroom (room_number, name) VALUES (?,?)",
            {{1,b.strVal("room_number")},{2,b.strVal("name")}});
        id = db.lastInsertId();
        JsonVal o; o.type=JsonVal::Obj;
        o.obj.push_back({"id",JsonVal(id)});
        o.obj.push_back({"room_number",JsonVal(b.strVal("room_number"))});
        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
        return send(201, o);
    }
    {
        size_t pos = p.rfind("/api/classrooms/");
        if (pos == 0 && p.length() > 14) {
            string rest = p.substr(16);
            size_t slash = rest.find('/');
            try {
                long id = std::stol(slash == string::npos ? rest : rest.substr(0, slash));
                if (slash == string::npos) {
                    if (req.method == "GET") {
                        JsonVal rows = db.queryArray(
                            "SELECT c.id, c.room_number, c.name "
                            "FROM Classroom c "
                            "WHERE c.id=" + std::to_string(id),
                            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"room_number",JsonVal(readText(st,1))});o.obj.push_back({"name",JsonVal(readText(st,2))});return o;});
                        if (rows.arr.empty()) return send(404, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Classroom not found")});return v;}());
                        return send(200, rows.arr[0]);
                    }
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Classroom SET room_number=?, name=? WHERE id=?",
                            {{1,b.strVal("room_number")},{2,b.strVal("name")},{3,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(id)});
                        return send(200,o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Classroom WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"message",JsonVal("Classroom deleted")});
                        return send(200,o);
                    }
                } else if (rest.substr(slash) == "/students" && req.method == "GET") {
                    JsonVal classroomRows = db.queryArray(
                        "SELECT room_number FROM Classroom WHERE id=" + std::to_string(id),
                        [](sqlite3_stmt* st){ JsonVal o; o.type=JsonVal::Obj; o.obj.push_back({"room_number",JsonVal(readText(st,0))}); return o; });
                    if (classroomRows.arr.empty()) return send(404, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Classroom not found")});return v;}());
                    string roomNumber = classroomRows.arr[0].strVal("room_number");
                    JsonVal rows = db.queryArray(
                        "SELECT p.id, p.name, p.contactInfo, s.classroom FROM Person p JOIN Student s ON s.id=p.id WHERE s.classroom='" + roomNumber + "' ORDER BY p.id",
                        [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});o.obj.push_back({"email",JsonVal(readText(st,2))});o.obj.push_back({"classroom",JsonVal(readText(st,3))});return o;});
                    return send(200, rows);
                }
            } catch (...) {}
        }
    }
    // ---- single classroom attendance (bulk roster) ----
    {
        size_t pos = p.rfind("/api/classroom/");
        if (pos == 0 && p.length() > 15) {
            string rest = p.substr(15);
            size_t slash = rest.find('/');
            try {
                long id = std::stol(slash == string::npos ? rest : rest.substr(0, slash));
                if (slash != string::npos && rest.substr(slash) == "/attendance") {
                    if (req.method == "GET") {
                        string date;
                        size_t dpos = req.query.find("date=");
                        if (dpos != string::npos) {
                            date = req.query.substr(dpos + 5);
                            size_t amp = date.find('&');
                            if (amp != string::npos) date = date.substr(0, amp);
                        }
                        string sql = "SELECT a.id, a.studentId, a.student, a.course, a.date, a.status, a.time, a.notes "
                                     "FROM Attendance a WHERE a.studentId IN (SELECT s.id FROM Student s JOIN Classroom c ON s.classroom=c.room_number WHERE c.id=" + std::to_string(id) + ")";
                        if (!date.empty()) sql += " AND a.date='" + date + "'";
                        sql += " ORDER BY a.id";
                        JsonVal rows = db.queryArray(sql,
                            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"studentId",JsonVal(readText(st,1))});o.obj.push_back({"student",JsonVal(readText(st,2))});o.obj.push_back({"course",JsonVal(readText(st,3))});o.obj.push_back({"date",JsonVal(readText(st,4))});o.obj.push_back({"status",JsonVal(readText(st,5))});o.obj.push_back({"time",JsonVal(readText(st,6))});o.obj.push_back({"notes",JsonVal(readText(st,7))});return o;});
                        return send(200, rows);
                    }
                    if (req.method == "POST") {
                        JsonVal b = JsonParser().parse(req.body);
                        JsonVal teacherValue = b.get("teacherId");
                        long teacherId = teacherValue.type == JsonVal::Num ? (long)teacherValue.num : 0;
                        if (teacherValue.type == JsonVal::Str) {
                            try { teacherId = std::stol(teacherValue.str); } catch (...) { teacherId = 0; }
                        }
                        string date = b.strVal("date");
                        string time = b.strVal("time");
                        JsonVal records = b.get("records");
                        if (teacherId == 0) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing teacher identity")});return v;}());
                        if (records.type != JsonVal::Arr) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing records array")});return v;}());
                        JsonVal teacherRows = db.queryArray(
                            "SELECT assignedCourse, assignedClassroom FROM Teacher WHERE id=" + std::to_string(teacherId),
                            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"course",JsonVal(readText(st,0))});o.obj.push_back({"room",JsonVal(readText(st,1))});return o;});
                        if (teacherRows.arr.empty()) return send(403, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Teacher is not authorized")});return v;}());
                        string course = teacherRows.arr[0].strVal("course");
                        string assignedRoom = teacherRows.arr[0].strVal("room");
                        JsonVal classroomRows = db.queryArray(
                            "SELECT room_number FROM Classroom WHERE id=" + std::to_string(id),
                            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"room",JsonVal(readText(st,0))});return o;});
                        if (classroomRows.arr.empty() || classroomRows.arr[0].strVal("room") != assignedRoom) return send(403, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Classroom is not assigned to this teacher")});return v;}());
                        if (course.empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Teacher has no assigned course")});return v;}());
                        JsonVal roster = db.queryArray(
                            "SELECT p.id, p.name FROM Person p JOIN Student s ON s.id=p.id WHERE s.classroom='" + assignedRoom + "'",
                            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});return o;});
                        long count = 0;
                        for (auto& r : records.arr) {
                            JsonVal sv = r.get("studentId");
                            string sid = sv.type == JsonVal::Num ? std::to_string((long)sv.num) : (sv.type == JsonVal::Str ? sv.str : "");
                            if (sid.empty() || sid == "0") continue;
                            string student;
                            for (auto& enrolled : roster.arr) if ((long)enrolled.get("id").num == std::stol(sid)) { student = enrolled.strVal("name"); break; }
                            if (student.empty()) continue;
                            string status = r.strVal("status", "present");
                            string notes = r.strVal("notes");
                            db.execParam("DELETE FROM Attendance WHERE studentId=? AND course=? AND date=?",
                                {{1, sid}, {2, course}, {3, date}});
                            db.execParam("INSERT INTO Attendance (studentId, student, course, date, status, time, notes) VALUES (?,?,?,?,?,?,?)",
                                {{1, sid}, {2, student}, {3, course}, {4, date}, {5, status}, {6, time}, {7, notes}});
                            count++;
                        }
                        JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"inserted",JsonVal(count)});
                        return send(200, o);
                    }
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
        if (pos == 0 && p.length() > 16) {
            string rest = p.substr(16);
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
        if (pos == 0 && p.length() > 11) {
            string rest = p.substr(11);
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
        if (pos == 0 && p.length() > 10) {
            string rest = p.substr(10);
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
        if (pos == 0 && p.length() > 15) {
            string rest = p.substr(15);
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

    // ---- current user (me) ----
    if (p == "/api/me" && req.method == "GET") {
        size_t up = req.query.find("userId=");
        if (up == string::npos) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing or invalid userId")});return v;}());
        string uidRaw = req.query.substr(up + 7);
        size_t amp = uidRaw.find('&');
        if (amp != string::npos) uidRaw = uidRaw.substr(0, amp);
        long uid;
        try { uid = std::stol(uidRaw); } catch (...) { return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing or invalid userId")});return v;}()); }
        JsonVal usr = db.queryArray("SELECT id, name, role, email FROM Users WHERE id=" + std::to_string(uid),
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"name",JsonVal(readText(st,1))});o.obj.push_back({"role",JsonVal(readText(st,2))});o.obj.push_back({"email",JsonVal(readText(st,3))});return o;});
        if (usr.arr.empty()) return send(404, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("User not found")});return v;}());
        JsonVal u = usr.arr[0];
        long personId = 0;
        {
            string email = u.get("email").str;
            JsonVal pRow = db.queryArray("SELECT id FROM Person WHERE contactInfo='" + email + "'",
                [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});return o;});
            if (!pRow.arr.empty()) personId = (long)pRow.arr[0].get("id").num;
        }
        JsonVal out; out.type = JsonVal::Obj;
        out.obj.push_back({"id", JsonVal((long)u.get("id").num)});
        out.obj.push_back({"personId", JsonVal(personId)});
        out.obj.push_back({"name", JsonVal(u.get("name").str)});
        out.obj.push_back({"email", JsonVal(u.get("email").str)});
        out.obj.push_back({"role", JsonVal(u.get("role").str)});
        return send(200, out);
    }

    // ---- student dashboard ----
    if (p == "/api/student/dashboard" && req.method == "GET") {
        size_t idp = req.query.find("id=");
        if (idp == string::npos) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing or invalid student id")});return v;}());
        string idRaw = req.query.substr(idp + 3);
        size_t amp = idRaw.find('&');
        if (amp != string::npos) idRaw = idRaw.substr(0, amp);
        long sid;
        try { sid = std::stol(idRaw); } catch (...) { return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing or invalid student id")});return v;}()); }
        JsonVal sRow = db.queryArray("SELECT p.name, p.contactInfo AS email FROM Person p JOIN Student s ON s.id=p.id WHERE p.id=" + std::to_string(sid),
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"name",JsonVal(readText(st,0))});o.obj.push_back({"email",JsonVal(readText(st,1))});return o;});
        if (sRow.arr.empty()) return send(404, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Student not found")});return v;}());
        JsonVal s = sRow.arr[0];
        JsonVal courses; courses.type = JsonVal::Arr;
        JsonVal attendance = db.queryArray("SELECT COUNT(*) as cnt FROM Attendance WHERE studentId='" + std::to_string(sid) + "' AND status='present'",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"present",JsonVal(readInt(st,0))});return o;});
        JsonVal totalAtt = db.queryArray("SELECT COUNT(*) as cnt FROM Attendance WHERE studentId='" + std::to_string(sid) + "'",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"total",JsonVal(readInt(st,0))});return o;});
        double attPct = 0;
        if (!totalAtt.arr.empty() && totalAtt.arr[0].get("total").num > 0) attPct = (attendance.arr[0].get("present").num / totalAtt.arr[0].get("total").num) * 100.0;
        JsonVal exams; exams.type = JsonVal::Arr;
        JsonVal grades; grades.type = JsonVal::Arr;
        JsonVal out; out.type = JsonVal::Obj;
        out.obj.push_back({"id", JsonVal(sid)});
        out.obj.push_back({"name", JsonVal(s.get("name").str)});
        out.obj.push_back({"email", JsonVal(s.get("email").str)});
        out.obj.push_back({"enrolledCourses", courses});
        out.obj.push_back({"attendancePercentage", JsonVal(attPct)});
        out.obj.push_back({"upcomingExams", exams});
        out.obj.push_back({"recentGrades", grades});
        return send(200, out);
    }

    // ---- teacher dashboard ----
    if (p == "/api/teachers/dashboard" && req.method == "GET") {
        size_t idp = req.query.find("id=");
        if (idp == string::npos) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing or invalid teacher id")});return v;}());
        string idRaw = req.query.substr(idp + 3);
        size_t amp = idRaw.find('&');
        if (amp != string::npos) idRaw = idRaw.substr(0, amp);
        long fid;
        try { fid = std::stol(idRaw); } catch (...) { return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing or invalid teacher id")});return v;}()); }
        JsonVal fRow = db.queryArray("SELECT p.name, p.contactInfo AS email FROM Person p JOIN Teacher t ON t.id=p.id WHERE p.id=" + std::to_string(fid),
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"name",JsonVal(readText(st,0))});o.obj.push_back({"email",JsonVal(readText(st,1))});return o;});
        if (fRow.arr.empty()) return send(404, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Teacher not found")});return v;}());
        JsonVal f = fRow.arr[0];
        JsonVal courses; courses.type = JsonVal::Arr;
        JsonVal todayAttObj; todayAttObj.type = JsonVal::Obj;
        todayAttObj.obj.push_back({"present", JsonVal(0L)});
        todayAttObj.obj.push_back({"total", JsonVal(0L)});
        JsonVal pending; pending.type = JsonVal::Arr;
        JsonVal upcoming = db.queryArray("SELECT id, course, day, time, room FROM Timetable WHERE instructor=(SELECT name FROM Person WHERE id=" + std::to_string(fid) + ") ORDER BY day, time LIMIT 5",
            [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"id",JsonVal(readInt(st,0))});o.obj.push_back({"course",JsonVal(readText(st,1))});o.obj.push_back({"day",JsonVal(readText(st,2))});o.obj.push_back({"time",JsonVal(readText(st,3))});o.obj.push_back({"room",JsonVal(readText(st,4))});return o;});
        JsonVal out; out.type = JsonVal::Obj;
        out.obj.push_back({"id", JsonVal(fid)});
        out.obj.push_back({"name", JsonVal(f.get("name").str)});
        out.obj.push_back({"email", JsonVal(f.get("email").str)});
        out.obj.push_back({"studentsTaught", JsonVal(0L)});
        out.obj.push_back({"coursesTaught", courses});
        out.obj.push_back({"todayAttendance", todayAttObj});
        out.obj.push_back({"pendingGrading", pending});
        out.obj.push_back({"upcomingClasses", upcoming});
        JsonVal ann; ann.type = JsonVal::Arr; out.obj.push_back({"announcements", ann});
        return send(200, out);
    }

    // ---- account dashboard ----
    if (p == "/api/account/dashboard" && req.method == "GET") {
        JsonVal total = db.queryArray("SELECT SUM(amount) FROM Fee", [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"total",JsonVal(readDbl(st,0))});return o;});
        JsonVal pending = db.queryArray("SELECT SUM(amount) FROM Fee WHERE status IN ('pending','partial','overdue')", [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"pending",JsonVal(readDbl(st,0))});return o;});
        JsonVal totalInvoices = db.queryArray("SELECT COUNT(*) FROM Fee", [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"count",JsonVal(readInt(st,0))});return o;});
        JsonVal paidInvoices = db.queryArray("SELECT COUNT(*) FROM Fee WHERE status='paid'", [](sqlite3_stmt* st){JsonVal o;o.type=JsonVal::Obj;o.obj.push_back({"count",JsonVal(readInt(st,0))});return o;});
        JsonVal out; out.type = JsonVal::Obj;
        out.obj.push_back({"balance", JsonVal(total.arr.empty() ? 0 : total.arr[0].get("total").num)});
        out.obj.push_back({"pendingInvoices", JsonVal(pending.arr.empty() ? 0 : pending.arr[0].get("pending").num)});
        out.obj.push_back({"totalInvoices", JsonVal(totalInvoices.arr.empty() ? 0 : (long)totalInvoices.arr[0].get("count").num)});
        out.obj.push_back({"paidInvoices", JsonVal(paidInvoices.arr.empty() ? 0 : (long)paidInvoices.arr[0].get("count").num)});
        return send(200, out);
    }

    // ---- notifications ----
    if (p == "/api/notifications" && req.method == "GET") {
        JsonVal o; o.type = JsonVal::Arr;
        return send(200, o);
    }

    // ---- courses ----
    if (p == "/api/courses" && req.method == "GET") {
        JsonVal rows = db.queryArray(
            "SELECT id, code, name, credits, department, maxCapacity, instructorId, semester, status FROM Course ORDER BY id",
            [](sqlite3_stmt* st){
                JsonVal o; o.type=JsonVal::Obj;
                o.obj.push_back({"id",JsonVal(readInt(st,0))});
                o.obj.push_back({"code",JsonVal(readText(st,1))});
                o.obj.push_back({"name",JsonVal(readText(st,2))});
                o.obj.push_back({"credits",JsonVal(readInt(st,3))});
                o.obj.push_back({"department",JsonVal(readText(st,4))});
                o.obj.push_back({"maxCapacity",JsonVal(readInt(st,5))});
                o.obj.push_back({"instructorId",JsonVal(readInt(st,6))});
                o.obj.push_back({"semester",JsonVal(readText(st,7))});
                o.obj.push_back({"status",JsonVal(readText(st,8))});
                return o;
            });
        return send(200, rows);
    }
    if (p == "/api/courses" && req.method == "POST") {
        JsonVal b = JsonParser().parse(req.body);
        if (b.strVal("name").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: name")});return v;}());
        if (b.strVal("code").empty()) return send(400, [](){JsonVal v;v.type=JsonVal::Obj;v.obj.push_back({"message",JsonVal("Missing field: code")});return v;}());
        long id = db.nextFreeId();
        db.execParam("INSERT INTO Course (code,name,credits,department,maxCapacity,instructorId,semester,status) VALUES (?,?,?,?,?,?,?,?)",
            {{1,b.strVal("code")},{2,b.strVal("name")},{3,std::to_string((long)b.numVal("credits",0))},{4,b.strVal("department")},{5,std::to_string((long)b.numVal("maxCapacity",0))},{6,std::to_string((long)b.numVal("instructorId",0))},{7,b.strVal("semester")},{8,b.strVal("status","active")}});
        JsonVal o; o.type=JsonVal::Obj;
        o.obj.push_back({"id",JsonVal(id)});
        o.obj.push_back({"code",JsonVal(b.strVal("code"))});
        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
        o.obj.push_back({"credits",JsonVal((long)b.numVal("credits",0))});
        o.obj.push_back({"department",JsonVal(b.strVal("department"))});
        o.obj.push_back({"maxCapacity",JsonVal((long)b.numVal("maxCapacity",0))});
        o.obj.push_back({"semester",JsonVal(b.strVal("semester"))});
        o.obj.push_back({"status",JsonVal(b.strVal("status","active"))});
        return send(201, o);
    }
    {
        size_t pos = p.rfind("/api/courses/");
        if (pos == 0 && p.length() > 13) {
            string rest = p.substr(13);
            size_t slash = rest.find('/');
            string idStr = slash == string::npos ? rest : rest.substr(0, slash);
            try {
                long id = std::stol(idStr);
                if (slash == string::npos) {
                    if (req.method == "PUT") {
                        JsonVal b = JsonParser().parse(req.body);
                        db.execParam("UPDATE Course SET code=?, name=?, credits=?, department=?, maxCapacity=?, instructorId=?, semester=?, status=? WHERE id=?",
                            {{1,b.strVal("code")},{2,b.strVal("name")},{3,std::to_string((long)b.numVal("credits",0))},{4,b.strVal("department")},{5,std::to_string((long)b.numVal("maxCapacity",0))},{6,std::to_string((long)b.numVal("instructorId",0))},{7,b.strVal("semester")},{8,b.strVal("status","active")},{9,std::to_string(id)}});
                        JsonVal o; o.type=JsonVal::Obj;
                        o.obj.push_back({"id",JsonVal(id)});
                        o.obj.push_back({"code",JsonVal(b.strVal("code"))});
                        o.obj.push_back({"name",JsonVal(b.strVal("name"))});
                        return send(200, o);
                    }
                    if (req.method == "DELETE") {
                        db.execParam("DELETE FROM Course WHERE id=?", {{1,std::to_string(id)}});
                        JsonVal o; o.type=JsonVal::Obj; o.obj.push_back({"message",JsonVal("Course deleted")});
                        return send(200, o);
                    }
                }
            } catch (...) {}
        }
    }

    // ---- timetable extras ----
    if (req.method == "GET" && p.rfind("/api/timetable/validate/", 0) == 0) {
        long gid = 0;
        try {
            gid = std::stol(p.substr(24));
        } catch (...) {
            JsonVal e; e.type = JsonVal::Obj;
            e.obj.push_back({"message", JsonVal("Invalid generation id")});
            return send(400, e);
        }
        timetable::Report rep = timetable::validateGeneration(db.raw(), gid);

        JsonVal violations; violations.type = JsonVal::Arr;
        for (const auto& v : rep.violations) {
            JsonVal o; o.type = JsonVal::Obj;
            o.obj.push_back({"constraint", JsonVal(v.constraint)});
            o.obj.push_back({"section_id", JsonVal(v.section_id)});
            o.obj.push_back({"slot_id", JsonVal(v.slot_id)});
            o.obj.push_back({"detail", JsonVal(v.detail)});
            violations.arr.push_back(o);
        }
        JsonVal shortfalls; shortfalls.type = JsonVal::Arr;
        for (const auto& s : rep.shortfalls) {
            JsonVal o; o.type = JsonVal::Obj;
            o.obj.push_back({"section_id", JsonVal(s.section_id)});
            o.obj.push_back({"course", JsonVal(s.course_code)});
            o.obj.push_back({"required", JsonVal(s.required)});
            o.obj.push_back({"placed", JsonVal(s.placed)});
            o.obj.push_back({"reason", JsonVal(s.note)});
            shortfalls.arr.push_back(o);
        }

        JsonVal o; o.type = JsonVal::Obj;
        o.obj.push_back({"generation_id", JsonVal(gid)});
        o.obj.push_back({"generation_exists", JsonVal(rep.generation_exists)});
        o.obj.push_back({"kind", JsonVal(rep.kind)});
        o.obj.push_back({"entry_count", JsonVal(rep.entry_count)});
        o.obj.push_back({"valid", JsonVal(rep.valid())});
        o.obj.push_back({"complete", JsonVal(rep.complete())});
        o.obj.push_back({"violations", violations});
        o.obj.push_back({"shortfalls", shortfalls});
        return send(200, o);
    }
    if (p == "/api/timetable/conflicts" && req.method == "GET") {
        JsonVal o; o.type = JsonVal::Arr;
        return send(200, o);
    }
    if (p == "/api/timetable/generate" && req.method == "POST") {
        JsonVal o; o.type = JsonVal::Obj;
        o.obj.push_back({"message", JsonVal("Timetable generated")});
        return send(200, o);
    }
    if (p == "/api/timetable/adjust" && req.method == "POST") {
        JsonVal o; o.type = JsonVal::Obj;
        o.obj.push_back({"message", JsonVal("Timetable adjusted")});
        return send(200, o);
    }
    if (p == "/api/timetable/lock" && req.method == "POST") {
        JsonVal o; o.type = JsonVal::Obj;
        o.obj.push_back({"message", JsonVal("Timetable lock updated")});
        return send(200, o);
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
            std::cerr << "WSAStartup failed\n"; system("pause"); return 1;
        }
        SOCKET server = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (server == INVALID_SOCKET) { std::cerr << "socket failed\n"; system("pause"); return 1; }
        int opt = 1;
        setsockopt(server, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY;
        addr.sin_port = htons(8080);
        if (bind(server, (sockaddr*)&addr, sizeof(addr)) == SOCKET_ERROR) {
            std::cerr << "bind failed\n"; system("pause"); return 1;
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
        system("pause");
        return 1;
    }
    return 0;
}



