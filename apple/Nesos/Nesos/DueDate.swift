import Foundation

/// Overdue, Today and This Week, in the person's own time zone.
enum DueSection: String, CaseIterable, Identifiable, Hashable {
    case overdue, today, week

    var id: String { rawValue }

    var title: String {
        switch self {
        case .overdue: "Overdue"
        case .today: "Today"
        case .week: "This Week"
        }
    }

    var colorHex: String {
        switch self {
        case .overdue: "#7f9fd6"
        case .today: "#6fb0c8"
        case .week: "#6a95a8"
        }
    }
}

/// Due dates are stored as "YYYY-MM-DD" (the website also accepts "M/D").
enum DueDate {
    private static var calendar: Calendar { Calendar.current }

    static func parse(_ text: String?) -> Date? {
        guard let text = text?.trimmingCharacters(in: .whitespaces), !text.isEmpty else { return nil }
        let dashed = text.split(separator: "-").compactMap { Int($0) }
        if dashed.count == 3 {
            return calendar.date(from: DateComponents(year: dashed[0], month: dashed[1], day: dashed[2]))
        }
        let slashed = text.split(separator: "/").compactMap { Int($0) }
        if slashed.count == 2 {
            let year = calendar.component(.year, from: .now)
            return calendar.date(from: DateComponents(year: year, month: slashed[0], day: slashed[1]))
        }
        return nil
    }

    static func string(_ date: Date) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    static var today: String { string(.now) }
    static var tomorrow: String {
        string(calendar.date(byAdding: .day, value: 1, to: .now) ?? .now)
    }

    /// "Nov 4"
    static func label(_ text: String?) -> String? {
        guard let date = parse(text) else { return nil }
        let f = DateFormatter()
        f.setLocalizedDateFormatFromTemplate("MMMd")
        return f.string(from: date)
    }

    static func section(_ text: String?, now: Date = .now) -> DueSection? {
        guard let date = parse(text) else { return nil }
        let today = calendar.startOfDay(for: now)
        let day = calendar.startOfDay(for: date)
        if day < today { return .overdue }
        if day == today { return .today }
        if let limit = calendar.date(byAdding: .day, value: 8, to: today), day < limit { return .week }
        return nil
    }
}
