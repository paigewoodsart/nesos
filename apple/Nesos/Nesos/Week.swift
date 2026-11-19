import Foundation

/// Mirrors lib/dates.ts on the web: ISO weeks, always in Asia/Bangkok time,
/// so tasks added on the phone land in the same week and day as on the web.
enum Week {
    static let timeZone = TimeZone(identifier: "Asia/Bangkok")!

    static var calendar: Calendar {
        var cal = Calendar(identifier: .iso8601)
        cal.timeZone = timeZone
        return cal
    }

    /// e.g. "2026-W47"
    static func weekId(for date: Date = .now) -> String {
        let comps = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return String(format: "%04d-W%02d", comps.yearForWeekOfYear ?? 0, comps.weekOfYear ?? 0)
    }

    /// 0 = Monday ... 6 = Sunday, matching the web's dayIndex.
    static func dayIndex(for date: Date = .now) -> Int {
        let weekday = calendar.component(.weekday, from: date) // 1 = Sunday
        return (weekday + 5) % 7
    }

    /// Monday through Sunday of the week containing `date`.
    static func days(of date: Date = .now) -> [Date] {
        guard let start = calendar.dateInterval(of: .weekOfYear, for: date)?.start else { return [] }
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: start) }
    }

    static func format(_ date: Date, _ template: String) -> String {
        let f = DateFormatter()
        f.timeZone = timeZone
        f.setLocalizedDateFormatFromTemplate(template)
        return f.string(from: date)
    }
}

extension Week {
    /// Minutes since midnight, Bangkok time (how the website logs sessions).
    static func minutes(_ date: Date) -> Int {
        let c = calendar.dateComponents([.hour, .minute], from: date)
        return (c.hour ?? 0) * 60 + (c.minute ?? 0)
    }

    /// "yyyy-MM-dd", Bangkok time (how the website logs sessions).
    static func dateString(_ date: Date) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = timeZone
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}
