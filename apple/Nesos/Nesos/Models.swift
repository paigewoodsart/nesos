import Foundation

// Decoding helpers: rows from the website's API use snake_case and numbers
// that may arrive as numbers or strings. Guest data on the phone uses camelCase.
extension KeyedDecodingContainer {
    func flexString(_ keys: [Key]) -> String? {
        for key in keys {
            if let value = try? decodeIfPresent(String.self, forKey: key) { return value }
        }
        return nil
    }

    func flexBool(_ keys: [Key]) -> Bool? {
        for key in keys {
            if let value = try? decodeIfPresent(Bool.self, forKey: key) { return value }
        }
        return nil
    }

    func flexDouble(_ keys: [Key]) -> Double? {
        for key in keys {
            if let value = try? decodeIfPresent(Double.self, forKey: key) { return value }
            if let text = try? decodeIfPresent(String.self, forKey: key) {
                if let number = Double(text) { return number }
                if let date = ISO8601DateFormatter().date(from: text) { return date.timeIntervalSince1970 * 1000 }
            }
        }
        return nil
    }
}

private var nowMs: Double { Date().timeIntervalSince1970 * 1000 }

/// A project ("client" in the website's data).
struct Project: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var color: String
    var notes: String?
    var archived: Bool
    var createdAt: Double

    init(name: String, color: String) {
        self.id = UUID().uuidString.lowercased()
        self.name = name
        self.color = color
        self.notes = nil
        self.archived = false
        self.createdAt = nowMs
    }

    enum CodingKeys: String, CodingKey { case id, name, color, notes, archived, createdAt }
    private enum ReadKeys: String, CodingKey { case id, name, color, notes, archived, createdAt, created_at }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: ReadKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = c.flexString([.name]) ?? ""
        color = c.flexString([.color]) ?? "#6cb46f"
        notes = c.flexString([.notes])
        archived = c.flexBool([.archived]) ?? false
        createdAt = c.flexDouble([.createdAt, .created_at]) ?? 0
    }

    // Matches what POST /api/db/clients reads. Nil is sent as null.
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(name, forKey: .name)
        try c.encode(color, forKey: .color)
        try c.encode(notes, forKey: .notes)
        try c.encode(archived, forKey: .archived)
        try c.encode(createdAt, forKey: .createdAt)
    }
}

/// A project task ("client task" in the website's data).
struct ProjectTask: Codable, Identifiable, Hashable {
    var id: String
    var clientId: String
    var text: String
    var done: Bool
    var doneAt: Double?
    var dueDate: String?
    var archived: Bool
    var archivedAt: Double?
    var createdAt: Double

    init(projectId: String, text: String, dueDate: String?) {
        self.id = UUID().uuidString.lowercased()
        self.clientId = projectId
        self.text = text
        self.done = false
        self.doneAt = nil
        self.dueDate = dueDate
        self.archived = false
        self.archivedAt = nil
        self.createdAt = nowMs
    }

    enum CodingKeys: String, CodingKey { case id, clientId, text, done, doneAt, dueDate, archived, archivedAt, createdAt }
    private enum ReadKeys: String, CodingKey {
        case id, text, done, archived
        case clientId, client_id, doneAt, done_at, dueDate, due_date, archivedAt, archived_at, createdAt, created_at
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: ReadKeys.self)
        id = try c.decode(String.self, forKey: .id)
        clientId = c.flexString([.clientId, .client_id]) ?? ""
        text = c.flexString([.text]) ?? ""
        done = c.flexBool([.done]) ?? false
        doneAt = c.flexDouble([.doneAt, .done_at])
        dueDate = c.flexString([.dueDate, .due_date])
        archived = c.flexBool([.archived]) ?? false
        archivedAt = c.flexDouble([.archivedAt, .archived_at])
        createdAt = c.flexDouble([.createdAt, .created_at]) ?? 0
    }

    // Matches what POST /api/db/client-tasks reads. Nil is sent as null so
    // clearing a due date or un-checking a task really clears it.
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(clientId, forKey: .clientId)
        try c.encode(text, forKey: .text)
        try c.encode(done, forKey: .done)
        try c.encode(doneAt, forKey: .doneAt)
        try c.encode(dueDate, forKey: .dueDate)
        try c.encode(archived, forKey: .archived)
        try c.encode(archivedAt, forKey: .archivedAt)
        try c.encode(createdAt, forKey: .createdAt)
    }
}

/// A logged timer session, the same shape the website's timer saves.
struct SessionLog: Codable, Identifiable, Hashable {
    var id: String = UUID().uuidString.lowercased()
    var clientId: String
    var weekId: String
    var dayIndex: Int
    var startMinute: Int
    var endMinute: Int
    var actualMinutes: Int
    var notes: String
    var date: String
    var createdAt: Double = Date().timeIntervalSince1970 * 1000

    enum CodingKeys: String, CodingKey {
        case id, clientId, weekId, dayIndex, startMinute, endMinute, actualMinutes, notes, date, createdAt
    }

    /// Minutes worked: the timer's count, or the block's length.
    var minutes: Int { actualMinutes > 0 ? actualMinutes : max(0, endMinute - startMinute) }
}

extension SessionLog {
    private enum ReadKeys: String, CodingKey {
        case id, clientId, weekId, dayIndex, startMinute, endMinute, actualMinutes, notes, date, createdAt
        case client_id, week_id, day_index, start_minute, end_minute, actual_minutes, created_at
    }

    // Reads rows from the website (snake_case) and guest data (camelCase).
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: ReadKeys.self)
        self.init(
            id: try c.decode(String.self, forKey: .id),
            clientId: c.flexString([.clientId, .client_id]) ?? "",
            weekId: c.flexString([.weekId, .week_id]) ?? "",
            dayIndex: Int(c.flexDouble([.dayIndex, .day_index]) ?? 0),
            startMinute: Int(c.flexDouble([.startMinute, .start_minute]) ?? 0),
            endMinute: Int(c.flexDouble([.endMinute, .end_minute]) ?? 0),
            actualMinutes: Int(c.flexDouble([.actualMinutes, .actual_minutes]) ?? 0),
            notes: c.flexString([.notes]) ?? "",
            date: c.flexString([.date]) ?? "",
            createdAt: c.flexDouble([.createdAt, .created_at]) ?? 0
        )
    }
}

struct AppearanceSettings: Codable {
    var theme: String?
    var customColor: String?
    var staticBackground: Bool?
    var personalColor: String?
}

struct ProjectFile: Decodable, Identifiable {
    var id: String
    var fileName: String?
}
