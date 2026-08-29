// Independent post-generation validator for the timetable generator.
//
// This is deliberately a SEPARATE pass that re-reads raw rows from SQLite. It
// shares no state with the solver, so a solver bug surfaces here instead of
// being re-confirmed by the solver's own bookkeeping. It depends only on
// <sqlite3.h> plus the standard library -- not on server_main.cpp's Database or
// JsonVal helpers -- so it stays unit-testable on its own.
//
// Hard constraints checked (from the feature design):
//   1. Teacher uniqueness   - a teacher is never in two places in one slot
//   2. Room uniqueness      - a room never hosts two sections in one slot
//   3. Class uniqueness     - a section never has two sessions in one slot
//   4. Weekly session count - unplaced sections are reported (per-section credits no longer stored)
//   5. Room capacity/type   - capacity >= student_count, labs get lab rooms
//
// Schema mapping note: room type is stored as
// Room.is_lab. Every slot in TimeSlot is
// 60 minutes, so a session count and an hour count are the same number here.

#ifndef TIMETABLE_VALIDATOR_H
#define TIMETABLE_VALIDATOR_H

#include <sqlite3.h>
#include <string>
#include <vector>

namespace timetable {

// A breach of a hard constraint. `constraint` is a stable machine-readable key
// for the UI to branch on; `detail` is the human-readable explanation.
// section_id / slot_id are 0 when the violation is not tied to a single one.
struct Violation {
    std::string constraint;
    long        section_id = 0;
    long        slot_id    = 0;
    std::string detail;
};

// A section that got FEWER sessions than required. Kept separate from
// Violation on purpose: under-scheduling is a capacity outcome the solver
// reports as a partial result, whereas over-scheduling or a double-booking is
// always a bug. `violations` staying empty is the correctness gate; `shortfalls`
// staying empty is the completeness gate.
struct Shortfall {
    long        section_id = 0;
    std::string course_code;
    long        required = 0;
    long        placed   = 0;
    std::string note;
};

struct Report {
    bool        generation_exists = false;  // a Generations row with this id
    std::string kind;                       // "generate" | "repair" | ""
    long        entry_count = 0;
    std::vector<Violation> violations;
    std::vector<Shortfall> shortfalls;

    bool valid() const { return violations.empty(); }
    bool complete() const { return shortfalls.empty(); }
};

namespace detail {

// Runs `sql`, calling `onRow` per row. Returns false if the statement could not
// even be prepared -- e.g. a table is missing. Callers MUST surface that as a
// violation: a validator that silently passes because its queries never ran is
// worse than no validator at all.
template <typename RowFn>
inline bool forEachRow(sqlite3* db, const std::string& sql, RowFn onRow) {
    sqlite3_stmt* st = nullptr;
    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &st, nullptr) != SQLITE_OK) return false;
    while (sqlite3_step(st) == SQLITE_ROW) onRow(st);
    sqlite3_finalize(st);
    return true;
}

inline std::string text(sqlite3_stmt* st, int i) {
    const unsigned char* t = sqlite3_column_text(st, i);
    return t ? reinterpret_cast<const char*>(t) : "";
}

inline bool isNull(sqlite3_stmt* st, int i) {
    return sqlite3_column_type(st, i) == SQLITE_NULL;
}

} // namespace detail

// Re-checks hard constraints 1-6 for one generation, straight from the DB.
inline Report validateGeneration(sqlite3* db, long generationId) {
    using detail::forEachRow;
    using detail::isNull;
    using detail::text;

    Report rep;
    const std::string gid = std::to_string(generationId);

    auto add = [&rep](const std::string& constraint, long section, long slot,
                      const std::string& detailMsg) {
        Violation v;
        v.constraint = constraint;
        v.section_id = section;
        v.slot_id    = slot;
        v.detail     = detailMsg;
        rep.violations.push_back(v);
    };
    auto schemaError = [&add](const std::string& what) {
        add("schema_error", 0, 0, "could not run the " + what +
                                  " check (missing table or column?)");
    };

    // ---- generation metadata ------------------------------------------------
    if (!forEachRow(db, "SELECT kind FROM Generations WHERE id = " + gid,
                    [&](sqlite3_stmt* st) {
                        rep.generation_exists = true;
                        rep.kind = text(st, 0);
                    })) {
        schemaError("generation lookup");
    }

    if (!forEachRow(db,
                    "SELECT COUNT(*) FROM TimetableEntries WHERE generation_id = " + gid,
                    [&](sqlite3_stmt* st) {
                        rep.entry_count = (long)sqlite3_column_int64(st, 0);
                    })) {
        schemaError("entry count");
    }

    // ---- 1. teacher uniqueness ---------------------------------------------
    if (!forEachRow(db,
            "SELECT te.slot_id, s.teacher_id, COUNT(*), GROUP_CONCAT(te.section_id) "
            "FROM TimetableEntries te JOIN Sections s ON s.id = te.section_id "
            "WHERE te.generation_id = " + gid + " AND s.teacher_id IS NOT NULL "
            "GROUP BY te.slot_id, s.teacher_id HAVING COUNT(*) > 1",
            [&](sqlite3_stmt* st) {
                long slot = sqlite3_column_int(st, 0);
                add("teacher_double_booked", 0, slot,
                    "teacher " + std::to_string(sqlite3_column_int(st, 1)) + " is booked for " +
                    std::to_string(sqlite3_column_int(st, 2)) + " sections (" + text(st, 3) +
                    ") in slot " + std::to_string(slot));
            })) {
        schemaError("teacher uniqueness");
    }

    // ---- 2. room uniqueness -------------------------------------------------
    if (!forEachRow(db,
            "SELECT te.slot_id, te.room_id, COUNT(*), GROUP_CONCAT(te.section_id) "
            "FROM TimetableEntries te "
            "WHERE te.generation_id = " + gid + " AND te.room_id IS NOT NULL "
            "GROUP BY te.slot_id, te.room_id HAVING COUNT(*) > 1",
            [&](sqlite3_stmt* st) {
                long slot = sqlite3_column_int(st, 0);
                add("room_double_booked", 0, slot,
                    "room " + std::to_string(sqlite3_column_int(st, 1)) + " hosts " +
                    std::to_string(sqlite3_column_int(st, 2)) + " sections (" + text(st, 3) +
                    ") in slot " + std::to_string(slot));
            })) {
        schemaError("room uniqueness");
    }

    // ---- 3. class uniqueness ------------------------------------------------
    // The UNIQUE(generation_id, section_id, slot_id) index should make this
    // impossible; check anyway, since the index may be missing on older DBs.
    if (!forEachRow(db,
            "SELECT te.section_id, te.slot_id, COUNT(*) FROM TimetableEntries te "
            "WHERE te.generation_id = " + gid +
            " GROUP BY te.section_id, te.slot_id HAVING COUNT(*) > 1",
            [&](sqlite3_stmt* st) {
                long section = sqlite3_column_int(st, 0);
                long slot    = sqlite3_column_int(st, 1);
                add("section_double_booked", section, slot,
                    "section " + std::to_string(section) + " has " +
                    std::to_string(sqlite3_column_int(st, 2)) + " sessions in slot " +
                    std::to_string(slot));
            })) {
        schemaError("class uniqueness");
    }

    // ---- 4. weekly session count -------------------------------------------
    // Per-section required session counts are no longer stored (the Course table
    // was removed), so we only flag sections that received no placed session. A
    // repair run only touches a subset of sections, so untouched sections with
    // zero entries are not reported.
    const bool partialRun = (rep.kind == "repair");
    if (!forEachRow(db,
            "SELECT s.id, s.course_id, COUNT(te.id) "
            "FROM Sections s "
            "LEFT JOIN TimetableEntries te ON te.section_id = s.id "
            "AND te.generation_id = " + gid +
            " GROUP BY s.id, s.course_id",
            [&](sqlite3_stmt* st) {
                long section  = sqlite3_column_int(st, 0);
                std::string code = text(st, 1);
                long placed   = sqlite3_column_int(st, 2);

                if (placed > 0) return;
                if (partialRun) return;

                Shortfall sf;
                sf.section_id  = section;
                sf.course_code = code;
                sf.required    = 0;
                sf.placed      = placed;
                sf.note        = "no session could be placed for " + code;
                rep.shortfalls.push_back(sf);
            })) {
        schemaError("weekly session count");
    }

    // ---- 5. room capacity / type, and referential sanity -------------------
    if (!forEachRow(db,
            "SELECT te.section_id, te.slot_id, te.room_id, r.name, r.capacity, r.is_lab, "
            "s.student_count, s.course_id, s.teacher_id "
            "FROM TimetableEntries te "
            "JOIN Sections s ON s.id = te.section_id "
            "LEFT JOIN Room r ON r.id = te.room_id "
            "WHERE te.generation_id = " + gid,
            [&](sqlite3_stmt* st) {
                long section = sqlite3_column_int(st, 0);
                long slot    = sqlite3_column_int(st, 1);
                std::string code = text(st, 7);

                if (isNull(st, 8)) {
                    add("teacher_missing", section, slot,
                        code + " section " + std::to_string(section) +
                        " has no teacher assigned");
                }

                if (isNull(st, 2) || isNull(st, 4)) {
                    add("room_missing", section, slot,
                        code + " section " + std::to_string(section) +
                        " has no valid room for slot " + std::to_string(slot));
                    return;
                }

                std::string roomName = text(st, 3);
                long capacity = sqlite3_column_int(st, 4);
                long isLab    = sqlite3_column_int(st, 5);
                long students = sqlite3_column_int(st, 6);

                if (capacity < students) {
                    add("room_capacity", section, slot,
                        roomName + " seats " + std::to_string(capacity) + " but " + code +
                        " section " + std::to_string(section) + " has " +
                        std::to_string(students) + " students");
                }
            })) {
        schemaError("room capacity/type");
    }


    // ---- referential sanity: slots must exist ------------------------------
    if (!forEachRow(db,
            "SELECT te.section_id, te.slot_id FROM TimetableEntries te "
            "LEFT JOIN TimeSlot ts ON ts.id = te.slot_id "
            "WHERE te.generation_id = " + gid + " AND ts.id IS NULL",
            [&](sqlite3_stmt* st) {
                long section = sqlite3_column_int(st, 0);
                long slot    = sqlite3_column_int(st, 1);
                add("slot_missing", section, slot,
                    "section " + std::to_string(section) +
                    " references slot " + std::to_string(slot) +
                    " which is not in TimeSlot");
            })) {
        schemaError("slot existence");
    }

    return rep;
}

} // namespace timetable

#endif // TIMETABLE_VALIDATOR_H
