import Foundation
import Observation

/// Project timers, like the website's: one runs at a time, and stopping logs
/// a session (with an optional note) to the project.
@Observable
final class TimerStore {
    struct Entry: Codable {
        var accumulated: TimeInterval
        var startedAt: Date?
        var firstStartedAt: Date
    }

    private(set) var entries: [String: Entry]
    private static let key = "nesos-project-timers"

    init() {
        if let data = UserDefaults.standard.data(forKey: Self.key),
           let saved = try? JSONDecoder().decode([String: Entry].self, from: data) {
            entries = saved
        } else {
            entries = [:]
        }
    }

    func isRunning(_ projectId: String) -> Bool { entries[projectId]?.startedAt != nil }

    func runningSince(_ projectId: String) -> Date? { entries[projectId]?.firstStartedAt }

    func elapsed(_ projectId: String, now: Date = .now) -> TimeInterval {
        guard let entry = entries[projectId] else { return 0 }
        return entry.accumulated + (entry.startedAt.map { now.timeIntervalSince($0) } ?? 0)
    }

    func start(_ projectId: String) {
        let now = Date()
        for (id, entry) in entries where id != projectId {
            if let started = entry.startedAt {
                entries[id] = Entry(accumulated: entry.accumulated + now.timeIntervalSince(started), startedAt: nil, firstStartedAt: entry.firstStartedAt)
            }
        }
        if var existing = entries[projectId] {
            existing.startedAt = now
            entries[projectId] = existing
        } else {
            entries[projectId] = Entry(accumulated: 0, startedAt: now, firstStartedAt: now)
        }
        persist()
    }

    /// Stops the timer and logs the session to the project.
    func stop(_ projectId: String, note: String, store: AppStore) async {
        guard let entry = entries[projectId] else { return }
        let now = Date()
        let total = elapsed(projectId, now: now)
        entries[projectId] = nil
        persist()
        guard total >= 1 else { return }
        let session = SessionLog(
            clientId: projectId,
            weekId: Week.weekId(for: now),
            dayIndex: Week.dayIndex(for: now),
            startMinute: Week.minutes(entry.firstStartedAt),
            endMinute: Week.minutes(now),
            actualMinutes: max(1, Int((total / 60).rounded())),
            notes: note,
            date: Week.dateString(now)
        )
        await store.log(session)
    }

    private func persist() {
        if let data = try? JSONEncoder().encode(entries) { UserDefaults.standard.set(data, forKey: Self.key) }
    }

    static func format(_ seconds: TimeInterval) -> String {
        let total = max(0, Int(seconds))
        let h = total / 3600, m = (total % 3600) / 60, s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
    }
}
