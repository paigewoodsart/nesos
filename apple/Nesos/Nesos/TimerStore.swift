import Foundation
import Observation

/// Project timers, like the website's: one runs at a time. Stopping holds
/// the time until the person logs it to the project or deletes it.
@Observable
final class TimerStore {
    struct Entry: Codable {
        var accumulated: TimeInterval
        var startedAt: Date?
        var firstStartedAt: Date
        var stoppedAt: Date?
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

    /// Counting right now.
    func isRunning(_ projectId: String) -> Bool { entries[projectId]?.startedAt != nil }

    /// Running, or stopped and waiting to be logged or deleted.
    func isActive(_ projectId: String) -> Bool { entries[projectId] != nil }

    func runningSince(_ projectId: String) -> Date? { entries[projectId]?.firstStartedAt }

    func elapsed(_ projectId: String, now: Date = .now) -> TimeInterval {
        guard let entry = entries[projectId] else { return 0 }
        return entry.accumulated + (entry.startedAt.map { now.timeIntervalSince($0) } ?? 0)
    }

    /// Starts (or resumes) this project's timer and stops any other.
    func start(_ projectId: String) {
        let now = Date()
        for id in entries.keys where id != projectId { halt(id, at: now) }
        if var existing = entries[projectId] {
            existing.startedAt = now
            existing.stoppedAt = nil
            entries[projectId] = existing
        } else {
            entries[projectId] = Entry(accumulated: 0, startedAt: now, firstStartedAt: now, stoppedAt: nil)
        }
        persist()
    }

    /// Stops counting and keeps the time, ready to log or delete.
    func stop(_ projectId: String) {
        halt(projectId, at: Date())
        persist()
    }

    /// Throws the session away without logging it.
    func discard(_ projectId: String) {
        entries[projectId] = nil
        persist()
    }

    /// Logs the session to the project, with an optional note.
    func log(_ projectId: String, note: String, store: AppStore) async {
        guard let entry = entries[projectId] else { return }
        let now = Date()
        let end = entry.startedAt == nil ? (entry.stoppedAt ?? now) : now
        let total = elapsed(projectId, now: now)
        entries[projectId] = nil
        persist()
        guard total >= 1 else { return }
        let session = SessionLog(
            clientId: projectId,
            weekId: Week.weekId(for: end),
            dayIndex: Week.dayIndex(for: end),
            startMinute: Week.minutes(entry.firstStartedAt),
            endMinute: Week.minutes(end),
            actualMinutes: max(1, Int((total / 60).rounded())),
            notes: note,
            date: Week.dateString(end)
        )
        await store.log(session)
    }

    private func halt(_ projectId: String, at now: Date) {
        guard var entry = entries[projectId], let started = entry.startedAt else { return }
        entry.accumulated += now.timeIntervalSince(started)
        entry.startedAt = nil
        entry.stoppedAt = now
        entries[projectId] = entry
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
