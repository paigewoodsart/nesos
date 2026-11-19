import Foundation

/// A task row from /api/db/tasks. Decodes the database's snake_case row and
/// encodes the camelCase shape the POST route expects.
struct TaskItem: Codable, Identifiable, Hashable {
    var id: String
    var weekId: String
    var dayIndex: Int
    var text: String
    var completed: Bool
    var sortOrder: Double
    var startMinute: Int?
    var endMinute: Int?
    var recurring: Bool
    var recurringPattern: String?
    var createdAt: Double

    init(text: String, weekId: String, dayIndex: Int) {
        let now = Date().timeIntervalSince1970 * 1000
        self.id = UUID().uuidString.lowercased()
        self.weekId = weekId
        self.dayIndex = dayIndex
        self.text = text
        self.completed = false
        self.sortOrder = now
        self.startMinute = nil
        self.endMinute = nil
        self.recurring = false
        self.recurringPattern = nil
        self.createdAt = now
    }

    private enum RowKeys: String, CodingKey {
        case id, text, completed, recurring
        case weekId = "week_id", dayIndex = "day_index", sortOrder = "sort_order"
        case startMinute = "start_minute", endMinute = "end_minute"
        case recurringPattern = "recurring_pattern", createdAt = "created_at"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: RowKeys.self)
        id = try c.decode(String.self, forKey: .id)
        weekId = try c.decodeIfPresent(String.self, forKey: .weekId) ?? ""
        dayIndex = try c.decodeIfPresent(Int.self, forKey: .dayIndex) ?? -1
        text = try c.decodeIfPresent(String.self, forKey: .text) ?? ""
        completed = try c.decodeIfPresent(Bool.self, forKey: .completed) ?? false
        sortOrder = (try? c.decodeIfPresent(Double.self, forKey: .sortOrder)) ?? 0
        startMinute = try? c.decodeIfPresent(Int.self, forKey: .startMinute)
        endMinute = try? c.decodeIfPresent(Int.self, forKey: .endMinute)
        recurring = (try? c.decodeIfPresent(Bool.self, forKey: .recurring)) ?? false
        recurringPattern = try? c.decodeIfPresent(String.self, forKey: .recurringPattern)
        createdAt = (try? c.decodeIfPresent(Double.self, forKey: .createdAt)) ?? 0
    }
    // Encoding uses the default camelCase keys, which is what POST /api/db/tasks reads.
}

struct NewNote: Encodable {
    let id = UUID().uuidString.lowercased()
    let weekId: String
    let dayIndex: Int
    let text: String
    let photoIds: [String] = []
    let createdAt = Date().timeIntervalSince1970 * 1000
    let updatedAt = Date().timeIntervalSince1970 * 1000
}

/// A project is a "client" in the web app's data model.
struct NewProject: Encodable {
    let id = UUID().uuidString.lowercased()
    let name: String
    let color: String
    let createdAt = Date().timeIntervalSince1970 * 1000
}
