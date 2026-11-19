import Foundation
import Observation

/// Projects, tasks and appearance for the phone app (and the Mac/iPad quick
/// add sheets). Works against the account, or this device in guest mode.
@Observable
final class AppStore {
    private(set) var projects: [Project] = []
    private(set) var tasks: [ProjectTask] = []
    private(set) var archivedCounts: [String: Int] = [:]
    var loaded = false
    var errorMessage: String?

    // Appearance, cached on the device so the right background shows instantly.
    private(set) var theme: String
    private(set) var customColor: String
    /// The person's own color (profile tile, due tiles, date tile).
    private(set) var personalColor: String

    private let auth: AuthStore
    private static let themeKey = "nesos-theme"
    private static let colorKey = "nesos-custom-bg-color"
    private static let personalKey = "nesos-personal-color"

    init(auth: AuthStore) {
        self.auth = auth
        theme = UserDefaults.standard.string(forKey: Self.themeKey) ?? "original"
        customColor = UserDefaults.standard.string(forKey: Self.colorKey) ?? "#EBE5DE"
        personalColor = UserDefaults.standard.string(forKey: Self.personalKey) ?? Palette.defaultHex
    }

    private var backend: (any Backend)? {
        if auth.isGuest { return LocalBackend.shared }
        if let token = auth.token { return RemoteBackend(api: API(token: token)) }
        return nil
    }

    // MARK: Loading

    func load() async {
        guard let backend else { return }
        await run {
            async let projectList = backend.projects()
            async let taskList = backend.openTasks()
            let (p, t) = try await (projectList, taskList)
            self.projects = self.inSavedOrder(p.filter { !$0.archived }.sorted { $0.createdAt < $1.createdAt })
            self.tasks = t.filter { !$0.archived }
            self.loaded = true
            await self.sweepFinishedTasks()
        }
        if let settings = try? await backend.settings() { applyRemote(settings) }
    }

    func reset() {
        projects = []
        tasks = []
        archivedCounts = [:]
        loaded = false
    }

    // MARK: Reading

    func project(_ id: String) -> Project? { projects.first { $0.id == id } }

    /// Open tasks first (by due date, undated last), then finished ones.
    func tasks(for projectId: String) -> [ProjectTask] {
        tasks.filter { $0.clientId == projectId }.sorted(by: Self.order)
    }

    func openCount(_ projectId: String) -> Int {
        tasks.filter { $0.clientId == projectId && !$0.done }.count
    }

    func overdueCount(_ projectId: String) -> Int {
        tasks.filter { $0.clientId == projectId && !$0.done && DueDate.section($0.dueDate) == .overdue }.count
    }

    func items(_ section: DueSection) -> [ProjectTask] {
        tasks.filter { task in
            guard DueDate.section(task.dueDate) == section, project(task.clientId) != nil else { return false }
            return section == .overdue ? !task.done : true
        }
        .sorted(by: Self.order)
    }

    func count(_ section: DueSection) -> Int { items(section).filter { !$0.done }.count }

    private static func order(_ a: ProjectTask, _ b: ProjectTask) -> Bool {
        if a.done != b.done { return !a.done }
        let da = DueDate.parse(a.dueDate), db = DueDate.parse(b.dueDate)
        switch (da, db) {
        case let (x?, y?) where x != y: return x < y
        case (_?, nil): return true
        case (nil, _?): return false
        default: return a.createdAt < b.createdAt
        }
    }

    // MARK: Tasks

    func addTask(projectId: String, text: String, due: String?) async -> Bool {
        let task = ProjectTask(projectId: projectId, text: text, dueDate: due)
        return await save(task, insert: true)
    }

    func update(_ task: ProjectTask) async -> Bool { await save(task, insert: false) }

    func toggle(_ task: ProjectTask) async {
        var updated = task
        updated.done.toggle()
        updated.doneAt = updated.done ? Ms.now : nil
        _ = await save(updated, insert: false)
    }

    func delete(_ task: ProjectTask) async -> Bool {
        guard let backend else { return false }
        let before = tasks
        tasks.removeAll { $0.id == task.id }
        let ok = await run { try await backend.deleteTask(id: task.id) }
        if !ok { tasks = before }
        return ok
    }

    private func save(_ task: ProjectTask, insert: Bool) async -> Bool {
        guard let backend else { return false }
        let before = tasks
        if let i = tasks.firstIndex(where: { $0.id == task.id }) { tasks[i] = task } else if insert { tasks.append(task) }
        let ok = await run { try await backend.save(task) }
        if !ok { tasks = before }
        return ok
    }

    /// Finished tasks move to the archive after a day, like on the website.
    private func sweepFinishedTasks() async {
        guard let backend else { return }
        let cutoff = Ms.now - 86_400_000
        for task in tasks where task.done && !task.archived && (task.doneAt ?? .infinity) <= cutoff {
            var archived = task
            archived.archived = true
            archived.archivedAt = Ms.now
            if (try? await backend.save(archived)) != nil {
                tasks.removeAll { $0.id == task.id }
            }
        }
    }

    // MARK: Archive

    func archivedTasks(_ projectId: String) async -> [ProjectTask] {
        guard let backend else { return [] }
        let all = (try? await backend.tasks(projectId: projectId)) ?? []
        let archived = all.filter { $0.archived }
            .sorted { ($0.archivedAt ?? $0.doneAt ?? 0) > ($1.archivedAt ?? $1.doneAt ?? 0) }
        archivedCounts[projectId] = archived.count
        return archived
    }

    func refreshArchivedCount(_ projectId: String) async { _ = await archivedTasks(projectId) }

    func restore(_ task: ProjectTask) async -> Bool {
        var restored = task
        restored.archived = false
        restored.archivedAt = nil
        restored.done = false
        restored.doneAt = nil
        let ok = await save(restored, insert: true)
        if ok, let n = archivedCounts[task.clientId] { archivedCounts[task.clientId] = max(0, n - 1) }
        return ok
    }

    // MARK: Project order (kept on this phone only)

    private var orderKey: String {
        "nesos-project-order-" + (auth.isGuest ? "guest" : (auth.email ?? "account"))
    }

    /// Projects the person has arranged come first, in their order. Any
    /// others (new ones, made elsewhere) follow, oldest first.
    private func inSavedOrder(_ list: [Project]) -> [Project] {
        let saved = UserDefaults.standard.stringArray(forKey: orderKey) ?? []
        guard !saved.isEmpty else { return list }
        var place: [String: Int] = [:]
        for (index, id) in saved.enumerated() { place[id] = index }
        let arranged = list.filter { place[$0.id] != nil }.sorted { (place[$0.id] ?? 0) < (place[$1.id] ?? 0) }
        let rest = list.filter { place[$0.id] == nil }
        return arranged + rest
    }

    /// Moves a project to where another one sits (dragging tiles on home).
    func moveProject(_ id: String, to targetId: String) {
        guard id != targetId,
              let from = projects.firstIndex(where: { $0.id == id }),
              let to = projects.firstIndex(where: { $0.id == targetId }) else { return }
        let moved = projects.remove(at: from)
        projects.insert(moved, at: to)
        UserDefaults.standard.set(projects.map(\.id), forKey: orderKey)
    }

    // MARK: Projects

    func addProject(name: String, color: String) async -> Project? {
        guard let backend else { return nil }
        let project = Project(name: name, color: color)
        projects.append(project)
        let ok = await run { try await backend.save(project) }
        if !ok { projects.removeAll { $0.id == project.id } }
        return ok ? project : nil
    }

    func update(_ project: Project) async -> Bool {
        guard let backend, let i = projects.firstIndex(where: { $0.id == project.id }) else { return false }
        let before = projects[i]
        projects[i] = project
        let ok = await run { try await backend.save(project) }
        if !ok { projects[i] = before }
        return ok
    }

    func saveNotes(_ projectId: String, _ notes: String) async {
        guard var current = project(projectId), (current.notes ?? "") != notes else { return }
        current.notes = notes
        _ = await update(current)
    }

    // MARK: Timer sessions and files

    func log(_ session: SessionLog) async {
        guard let backend else { return }
        await run { try await backend.save(session) }
    }

    /// The project's logged timer sessions, newest first.
    func sessions(_ projectId: String) async -> [SessionLog] {
        guard let backend else { return [] }
        let all = (try? await backend.sessions(projectId: projectId)) ?? []
        return all.sorted { $0.createdAt > $1.createdAt }
    }

    /// Saves a change to a logged session (its name).
    func updateSession(_ session: SessionLog) async -> Bool {
        guard let backend else { return false }
        return await run { try await backend.save(session) }
    }

    func deleteSession(_ id: String) async -> Bool {
        guard let backend else { return false }
        return await run { try await backend.deleteSession(id: id) }
    }

    func fileCount(_ projectId: String) async -> Int {
        guard let backend else { return 0 }
        return (try? await backend.fileCount(projectId: projectId)) ?? 0
    }

    func upload(_ data: Data, fileName: String, mimeType: String, projectId: String) async -> Bool {
        guard let backend else { return false }
        return await run { try await backend.upload(data, fileName: fileName, mimeType: mimeType, projectId: projectId) }
    }

    // MARK: Appearance

    /// A custom background darker than this switches the phone app to light
    /// text (0 is black, 1 is white).
    static let darkBoardBelow = 0.5

    var boardIsDark: Bool {
        theme == "custom" && RGB(hex: customColor).luminance < Self.darkBoardBelow
    }

    func setTheme(_ value: String) {
        theme = value
        UserDefaults.standard.set(value, forKey: Self.themeKey)
        pushSettings(AppearanceSettings(theme: value))
    }

    func setCustomColor(_ hex: String) {
        customColor = hex
        theme = "custom"
        UserDefaults.standard.set(hex, forKey: Self.colorKey)
        UserDefaults.standard.set("custom", forKey: Self.themeKey)
        pushSettings(AppearanceSettings(theme: "custom", customColor: hex))
    }

    var palette: Palette { Palette(personalColor) }

    func setPersonalColor(_ hex: String) {
        personalColor = hex
        UserDefaults.standard.set(hex, forKey: Self.personalKey)
        pushSettings(AppearanceSettings(personalColor: hex))
    }

    private func applyRemote(_ settings: AppearanceSettings) {
        if let p = settings.personalColor {
            personalColor = p
            UserDefaults.standard.set(p, forKey: Self.personalKey)
        }
        if let t = settings.theme, ["original", "neutral", "custom"].contains(t) {
            theme = t
            UserDefaults.standard.set(t, forKey: Self.themeKey)
        }
        if let c = settings.customColor {
            customColor = c
            UserDefaults.standard.set(c, forKey: Self.colorKey)
        }
    }

    private func pushSettings(_ settings: AppearanceSettings) {
        guard let backend else { return }
        Task { try? await backend.save(settings) }
    }

    // MARK: Account

    func deleteAccount() async -> Bool {
        guard let backend else { return false }
        let ok = await run { try await backend.deleteAccount() }
        if ok { reset(); auth.signOut() }
        return ok
    }

    /// Runs work, turning errors into a message (and signing out on 401).
    @discardableResult
    private func run(_ work: () async throws -> Void) async -> Bool {
        do {
            try await work()
            errorMessage = nil
            return true
        } catch APIError.unauthorized {
            reset()
            auth.signOut()
            return false
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}
