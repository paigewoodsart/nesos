import Foundation
import Observation

/// Today's tasks plus the quick-add actions.
@Observable
final class PlannerStore {
    var todayTasks: [TaskItem] = []
    var isLoading = false
    var errorMessage: String?

    private let auth: AuthStore

    init(auth: AuthStore) {
        self.auth = auth
    }

    private var api: API? {
        auth.token.map { API(token: $0) }
    }

    func load() async {
        guard let api else { return }
        isLoading = true
        defer { isLoading = false }
        await run {
            let all = try await self.weekTasks(api, weekId: Week.weekId())
            let today = Week.dayIndex()
            self.todayTasks = all
                .filter { $0.dayIndex == today }
                .sorted { $0.sortOrder < $1.sortOrder }
        }
    }

    func toggle(_ task: TaskItem) async {
        guard let api, let index = todayTasks.firstIndex(of: task) else { return }
        var updated = task
        updated.completed.toggle()
        todayTasks[index] = updated
        await run {
            do {
                try await api.save(updated)
            } catch {
                if let i = self.todayTasks.firstIndex(where: { $0.id == task.id }) {
                    self.todayTasks[i] = task
                }
                throw error
            }
        }
    }

    /// dayIndex: 0 = Monday ... 6 = Sunday, -1 = anytime this week.
    func addTask(_ text: String, dayIndex: Int) async -> Bool {
        guard let api else { return false }
        return await run {
            let weekId = Week.weekId()
            _ = try await self.weekTasks(api, weekId: weekId)
            let task = TaskItem(text: text, weekId: weekId, dayIndex: dayIndex)
            try await api.save(task)
            if dayIndex == Week.dayIndex() { self.todayTasks.append(task) }
        }
    }

    func addNote(_ text: String) async -> Bool {
        guard let api else { return false }
        return await run {
            try await api.save(NewNote(weekId: Week.weekId(), dayIndex: Week.dayIndex(), text: text))
        }
    }

    func addProject(name: String, color: String) async -> Bool {
        guard let api else { return false }
        return await run {
            try await api.save(NewProject(name: name, color: color))
        }
    }

    func deleteAccount() async -> Bool {
        guard let api else { return false }
        let ok = await run { try await api.deleteAccount() }
        if ok { auth.signOut() }
        return ok
    }

    /// Loads a week's tasks. If the week is empty, first copies in the
    /// recurring tasks, the same way the website does when it opens a new week.
    /// Without this, adding a task from the phone first would stop the
    /// website from ever filling in that week's recurring tasks.
    private func weekTasks(_ api: API, weekId: String) async throws -> [TaskItem] {
        var tasks = try await api.tasks(weekId: weekId)
        guard tasks.isEmpty else { return tasks }

        var seen = Set<String>()
        let templates = try await api.recurringTasks().filter {
            seen.insert("\($0.dayIndex)|\($0.text)").inserted
        }
        for template in templates {
            var copy = TaskItem(text: template.text, weekId: weekId, dayIndex: template.dayIndex)
            copy.recurring = true
            copy.recurringPattern = template.recurringPattern
            copy.startMinute = template.startMinute
            copy.endMinute = template.endMinute
            copy.sortOrder = template.sortOrder
            try await api.save(copy)
            tasks.append(copy)
        }
        return tasks
    }

    /// Runs work, turning errors into a message (and signing out on 401).
    @discardableResult
    private func run(_ work: () async throws -> Void) async -> Bool {
        do {
            try await work()
            errorMessage = nil
            return true
        } catch APIError.unauthorized {
            auth.signOut()
            return false
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}
